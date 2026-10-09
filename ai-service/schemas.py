"""TrustGuard AI - Shared Pydantic schemas."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class FeatureType(str, Enum):
    CONVERSATION = "conversation"
    PAYMENT = "payment"
    DOCUMENT = "document"
    VOICE = "voice"


class AnalysisStatus(str, Enum):
    ASSESSED = "assessed"
    INSUFFICIENT_CONTENT = "insufficient_content"


class Confidence(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class FactorSource(str, Enum):
    DETERMINISTIC = "deterministic"
    AI = "ai"
    COMBINED = "combined"


class AttackStage(str, Enum):
    TRUST_BUILDING = "TRUST_BUILDING"
    BAIT = "BAIT"
    PRESSURE = "PRESSURE"
    INFORMATION_REQUEST = "INFORMATION_REQUEST"
    FINANCIAL_REQUEST = "FINANCIAL_REQUEST"
    EXPLOITATION = "EXPLOITATION"


class HintVerdict(str, Enum):
    CONFIRMED = "confirmed"
    DISMISSED = "dismissed"


# --- Gemini response schemas (call 2) ---

class AISignal(BaseModel):
    code: str
    severity: Severity
    title: str
    why_it_matters: str
    evidence_quote: Optional[str] = None


class HintReview(BaseModel):
    hint_id: str
    verdict: HintVerdict
    reason: str


class AIAssessment(BaseModel):
    status: AnalysisStatus
    content_type: str = ""
    claimed_identity: Optional[str] = None
    sender_intent: Optional[str] = None
    signals: list[AISignal] = Field(default_factory=list)
    hint_reviews: list[HintReview] = Field(default_factory=list)
    contradictions: list[str] = Field(default_factory=list)
    attack_stage: Optional[AttackStage] = None
    reasoning: str = ""
    recommendations: list[str] = Field(default_factory=list)
    history_summary: str = ""
    confidence: Confidence = Confidence.MEDIUM


# --- Result schemas ---

class Factor(BaseModel):
    code: str
    category: str
    severity: Severity
    weight: int
    source: FactorSource
    title: str
    why_it_matters: str
    evidence: Optional[str] = None


class DismissedHint(BaseModel):
    hint_id: str
    reason: str


class CategoryStatus(BaseModel):
    category: str
    severity: Optional[Severity] = None
    label: str


class UrlHop(BaseModel):
    url: str
    status: Optional[int] = None
    registrable_domain: str = ""


class UrlFinding(BaseModel):
    original: str
    hops: list[UrlHop] = Field(default_factory=list)
    final_url: Optional[str] = None
    domain_changed: bool = False
    shortened: bool = False
    page_title: Optional[str] = None
    blocked_reason: Optional[str] = None
    error: Optional[str] = None


class ExtractedData(BaseModel):
    urls: list[UrlFinding] = Field(default_factory=list)
    upi: list[str] = Field(default_factory=list)
    emails: list[str] = Field(default_factory=list)
    phones: list[str] = Field(default_factory=list)
    amounts: list[str] = Field(default_factory=list)
    deadlines: list[str] = Field(default_factory=list)
    orgs: list[str] = Field(default_factory=list)
    refs: list[str] = Field(default_factory=list)


class AnalysisMeta(BaseModel):
    model: str = ""
    prompt_version: str = ""
    duration_ms: int = 0
    cached: bool = False


class PaymentDetails(BaseModel):
    payment_type: str = ""
    payee_vpa: Optional[str] = None
    payee_name: Optional[str] = None
    amount: Optional[str] = None
    currency: Optional[str] = None
    note: Optional[str] = None
    merchant_code: Optional[str] = None
    qr_payloads: list[str] = Field(default_factory=list)


class DocumentDetails(BaseModel):
    entities: dict[str, list[str]] = Field(default_factory=dict)
    hidden_links: list[str] = Field(default_factory=list)
    active_content: bool = False


class VoiceDetails(BaseModel):
    duration_seconds: float = 0
    analyzed_seconds: float = 0
    transcript: Optional[str] = None
    spoof_probability: Optional[float] = None
    spoof_window_ratio: Optional[float] = None
    voice_verdict: str = ""
    voice_caveat: str = ""
    model_available: bool = False


class AnalysisResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:12])
    feature: FeatureType
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status: AnalysisStatus = AnalysisStatus.ASSESSED
    score: Optional[int] = None
    level: Optional[RiskLevel] = None
    confidence: Confidence = Confidence.MEDIUM
    factors: list[Factor] = Field(default_factory=list)
    categories: list[CategoryStatus] = Field(default_factory=list)
    dismissed_hints: list[DismissedHint] = Field(default_factory=list)
    content_type: str = ""
    claimed_identity: Optional[str] = None
    sender_intent: Optional[str] = None
    contradictions: list[str] = Field(default_factory=list)
    attack_stage: Optional[AttackStage] = None
    reasoning: str = ""
    recommendations: list[str] = Field(default_factory=list)
    summary: str = ""
    extracted: ExtractedData = Field(default_factory=ExtractedData)
    details: Optional[PaymentDetails | DocumentDetails | VoiceDetails] = None
    meta: AnalysisMeta = Field(default_factory=AnalysisMeta)


# --- Streaming ---

class StageEvent(BaseModel):
    type: str = "stage"
    stage: str
    detail: Optional[str] = None


class ResultEvent(BaseModel):
    type: str = "result"
    data: AnalysisResult


class ErrorEvent(BaseModel):
    type: str = "error"
    code: str
    message: str


class SaveEvent(BaseModel):
    type: str = "save_status"
    status: str  # "saved" | "save_skipped" | "save_failed"


# --- What-If ---

class SimulationStage(BaseModel):
    stage: AttackStage
    title: str
    attacker_objective: str
    likely_request: str
    why_it_matters: str
    potential_consequence: str
    safe_exit: str


class Simulation(BaseModel):
    stages: list[SimulationStage]
    current_stage_index: int
    safest_stopping_point: int
    banner: str = "Hypothetical attack simulation - not a prediction of what will happen."


# --- Hints ---

class Hint(BaseModel):
    id: str
    mapped_signal: str
    description: str
