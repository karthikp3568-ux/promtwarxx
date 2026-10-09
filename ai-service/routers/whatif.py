"""What-If Simulation router."""
import json
import logging
import uuid
from typing import Any, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from google.cloud import firestore

from errors import TrustGuardError, ErrorCode
from schemas import (
    Simulation,
    SimulationStage,
    AttackStage,
    AnalysisResult,
    FeatureType,
    AnalysisStatus,
    RiskLevel,
    Confidence,
    AnalysisMeta,
)
from services.auth import get_current_user
from services.firebase_app import get_firestore_db
from services.history_store import should_save_history, save_analysis_result
from services.gemini_client import generate_structured
from services.prompts import load_prompt
from services.redaction import redact_text, redact_data_structure

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/whatif", tags=["whatif"])


class WhatIfRequest(BaseModel):
    analysis_id: Optional[str] = None
    analysis: Optional[dict[str, Any]] = None
    description: Optional[str] = None


@router.post("", response_model=Simulation)
async def generate_simulation(
    req: WhatIfRequest,
    uid: str = Depends(get_current_user),
):
    """Generate a 4-7 stage What-If attack simulation and persist under user's analysis."""
    claimed_identity = "Unknown Requester"
    sender_intent = "Coerce target into financial or credential transfer"
    current_stage = "PRESSURE"
    findings = []
    parent_analysis_id = req.analysis_id

    db = get_firestore_db()

    # 1. Gather analysis context
    if req.analysis_id and db is not None:
        try:
            doc_snap = db.collection("users").document(uid).collection("analyses").document(req.analysis_id).get()
            if doc_snap.exists:
                doc_data = doc_snap.to_dict() or {}
                claimed_identity = doc_data.get("claimedIdentity") or claimed_identity
                sender_intent = doc_data.get("senderIntent") or sender_intent
                current_stage = doc_data.get("attackStage") or current_stage
                findings = doc_data.get("topIndicators") or []
        except Exception as e:
            logger.warning(f"Could not load analysis doc {req.analysis_id}: {e}")
    elif req.analysis:
        claimed_identity = req.analysis.get("claimed_identity") or claimed_identity
        sender_intent = req.analysis.get("sender_intent") or sender_intent
        current_stage = req.analysis.get("attack_stage") or current_stage
        findings = [f.get("title") for f in req.analysis.get("factors", [])[:3]]
    elif req.description:
        # Dashboard freeform flow: create a parent analysis id
        parent_analysis_id = str(uuid.uuid4())[:12]
        sender_intent = "Simulated interaction from user scenario description"

    # 2. Call Gemini with structured output
    whatif_prompt = load_prompt("whatif_v1")
    whatif_prompt = whatif_prompt.replace("{claimed_identity}", claimed_identity)
    whatif_prompt = whatif_prompt.replace("{sender_intent}", sender_intent)
    whatif_prompt = whatif_prompt.replace("{current_stage}", str(current_stage))
    whatif_prompt = whatif_prompt.replace("{signals_json}", json.dumps(findings, indent=2))
    whatif_prompt = whatif_prompt.replace("{description}", req.description or "None provided")

    system_prompt = load_prompt("system_v1")
    full_prompt = system_prompt + "\n\n" + whatif_prompt

    try:
        simulation = await generate_structured(
            prompt=full_prompt,
            response_model=Simulation,
        )
    except TrustGuardError as te:
        if te.code in (ErrorCode.AI_RATE_LIMITED, ErrorCode.AI_UNAVAILABLE):
            simulation = Simulation(
                stages=[
                    SimulationStage(
                        stage=AttackStage.BAIT,
                        title="Initial Contact and Urgency Bait",
                        attacker_objective="Grab attention and create immediate anxiety about account security",
                        likely_request="Click on an urgent verification link or reply immediately",
                        why_it_matters="Anxiety impairs critical judgment and rushes the target past routine verification checks",
                        potential_consequence="Target engages with fraudulent communication channel",
                        safe_exit="Close the message. Do not tap any provided links.",
                    ),
                    SimulationStage(
                        stage=AttackStage.PRESSURE,
                        title="Escalating Artificial Time Pressure",
                        attacker_objective="Prevent target from consulting family, bank branches, or official apps",
                        likely_request="Act within 24 hours or face permanent account termination",
                        why_it_matters="High urgency artificially narrows decision windows to force impulsive compliance",
                        potential_consequence="Target panics and follows malicious instructions",
                        safe_exit="Verify account status independently through official banking app or branch.",
                    ),
                    SimulationStage(
                        stage=AttackStage.INFORMATION_REQUEST,
                        title="Credential & Identity Harvesting",
                        attacker_objective="Extract sensitive account identifiers or login details",
                        likely_request="Fill out KYC update form with debit card number, expiry, and phone number",
                        why_it_matters="Collected data enables the attacker to stage unauthorized transactions",
                        potential_consequence="Compromise of basic financial identity",
                        safe_exit="Never enter card details or banking credentials on unverified third-party web forms.",
                    ),
                    SimulationStage(
                        stage=AttackStage.FINANCIAL_REQUEST,
                        title="OTP or Direct Transfer Demand",
                        attacker_objective="Bypass two-factor authentication or induce a direct payment",
                        likely_request="Share the one-time passcode sent to your device to verify your identity",
                        why_it_matters="OTPs authorize money movement or account takeovers directly",
                        potential_consequence="Immediate monetary loss or complete account takeover",
                        safe_exit="Banks NEVER ask for OTPs over calls or messages. Terminate contact immediately.",
                    ),
                    SimulationStage(
                        stage=AttackStage.EXPLOITATION,
                        title="Secondary Exploitation / Follow-up Demands",
                        attacker_objective="Extract additional funds under the guise of refunding or penalty clearing",
                        likely_request="Pay a clearance fee or transfer remaining funds to a secure backup account",
                        why_it_matters="Sunk-cost fallacy is exploited to extract further payments",
                        potential_consequence="Severe secondary financial loss",
                        safe_exit="Contact your bank's official fraud helpline to freeze accounts and file a cybercrime report.",
                    ),
                ],
                current_stage_index=1,
                safest_stopping_point=0,
                banner="Hypothetical attack simulation - not a prediction of what will happen.",
            )
        else:
            raise

    # 3. Persistence handling
    save_enabled = await should_save_history(uid)
    if save_enabled and db is not None:
        try:
            # If from dashboard description, ensure parent analysis doc exists
            if req.description and parent_analysis_id:
                parent_res = AnalysisResult(
                    id=parent_analysis_id,
                    feature=FeatureType.CONVERSATION,
                    status=AnalysisStatus.ASSESSED,
                    score=65,
                    level=RiskLevel.HIGH,
                    confidence=Confidence.MEDIUM,
                    summary=redact_text(req.description[:120]),
                    reasoning="Simulated attack scenario initiated from dashboard.",
                    meta=AnalysisMeta(model="gemini-3.8-flash", prompt_version="whatif_v1"),
                )
                await save_analysis_result(uid, parent_res)

            if parent_analysis_id:
                sim_id = str(uuid.uuid4())[:12]
                sim_data = redact_data_structure(simulation.model_dump())
                sim_data["createdAt"] = firestore.SERVER_TIMESTAMP
                db.collection("users").document(uid).collection("analyses").document(parent_analysis_id).collection("simulation").document(sim_id).set(sim_data)
                logger.info(f"Persisted simulation {sim_id} under analysis {parent_analysis_id}")
        except Exception as e:
            logger.warning(f"Failed to persist simulation: {e}")

    return simulation
