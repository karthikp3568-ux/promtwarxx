"""Pre-warm demo cache with full validated analysis results for all samples."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from schemas import (
    AnalysisResult,
    FeatureType,
    AnalysisStatus,
    RiskLevel,
    Confidence,
    Factor,
    FactorSource,
    Severity,
    CategoryStatus,
    DismissedHint,
    PaymentDetails,
    DocumentDetails,
    VoiceDetails,
    ExtractedData,
    AnalysisMeta,
    AttackStage,
)
from services.demo_cache import save_cached_sample_result


def warm():
    print("Pre-warming demo cache with validated sample analyses...")

    # 1. kyc_block_sms
    kyc_result = AnalysisResult(
        id="demo-kyc-01",
        feature=FeatureType.CONVERSATION,
        status=AnalysisStatus.ASSESSED,
        score=91,
        level=RiskLevel.CRITICAL,
        confidence=Confidence.HIGH,
        factors=[
            Factor(
                code="OTP_PIN_REQUEST",
                category="Credentials",
                severity=Severity.HIGH,
                weight=35,
                source=FactorSource.AI,
                title="Request to share OTP code",
                why_it_matters="Legitimate financial institutions never ask customers to disclose OTPs or security codes.",
                evidence="Please share the OTP with our verification team",
            ),
            Factor(
                code="IDENTITY_MISMATCH",
                category="Identity",
                severity=Severity.HIGH,
                weight=20,
                source=FactorSource.AI,
                title="Impersonation of Bharat National Bank",
                why_it_matters="The sender claims to be a national bank but routes verification to an unverified third-party domain.",
                evidence="Bharat National Bank Security Division",
            ),
            Factor(
                code="URGENCY",
                category="Urgency",
                severity=Severity.HIGH,
                weight=10,
                source=FactorSource.AI,
                title="Immediate 24-hour threat deadline",
                why_it_matters="Artificial deadlines create panic to prevent calm verification.",
                evidence="Act within 24 hours or your account will be permanently closed",
            ),
            Factor(
                code="COMBINED_PATTERN",
                category="Pattern",
                severity=Severity.HIGH,
                weight=26,
                source=FactorSource.COMBINED,
                title="Unverified requester demands sensitive credentials under pressure",
                why_it_matters="The combination of urgent threats and credential requests is characteristic of high-severity phishing.",
                evidence=None,
            ),
        ],
        categories=[
            CategoryStatus(category="Credentials", severity=Severity.HIGH, label="High"),
            CategoryStatus(category="Identity", severity=Severity.HIGH, label="High"),
            CategoryStatus(category="Urgency", severity=Severity.HIGH, label="High"),
            CategoryStatus(category="Destination", severity=Severity.HIGH, label="High"),
            CategoryStatus(category="Financial", severity=None, label="Not detected"),
            CategoryStatus(category="Manipulation", severity=Severity.HIGH, label="High"),
        ],
        claimed_identity="Bharat National Bank",
        sender_intent="Harvest OTP credentials and account access",
        attack_stage=AttackStage.PRESSURE,
        reasoning="This message exhibits critical phishing indicators: artificial urgency, threats of account suspension, and an explicit demand for the recipient to share a one-time password.",
        recommendations=[
            "Do not click the verification link or share any one-time passcode (OTP).",
            "Contact Bharat National Bank using the verified phone number on the back of your card.",
            "Block this sender number on your mobile device.",
        ],
        summary="Phishing attempt impersonating Bharat National Bank requesting OTP verification.",
        meta=AnalysisMeta(model="gemini-3.8-flash", prompt_version="v1", duration_ms=420, cached=True),
    )
    save_cached_sample_result("kyc_block_sms", kyc_result)

    # 2. bank_otp_safe
    safe_otp = AnalysisResult(
        id="demo-otp-safe-02",
        feature=FeatureType.CONVERSATION,
        status=AnalysisStatus.ASSESSED,
        score=15,
        level=RiskLevel.LOW,
        confidence=Confidence.HIGH,
        factors=[
            Factor(
                code="IDENTITY_UNVERIFIED",
                category="Identity",
                severity=Severity.LOW,
                weight=2,
                source=FactorSource.AI,
                title="Automated SMS sender identity",
                why_it_matters="Standard transaction advisory message sent via automated broadcast shortcode.",
                evidence=None,
            ),
        ],
        categories=[
            CategoryStatus(category="Identity", severity=Severity.LOW, label="Unverified"),
            CategoryStatus(category="Credentials", severity=None, label="Not detected"),
            CategoryStatus(category="Urgency", severity=None, label="Not detected"),
            CategoryStatus(category="Financial", severity=None, label="Not detected"),
            CategoryStatus(category="Destination", severity=None, label="Not detected"),
            CategoryStatus(category="Manipulation", severity=None, label="Not detected"),
        ],
        dismissed_hints=[
            DismissedHint(
                hint_id="otp_pin_request",
                reason="The message explicitly cautions the user NEVER to share the OTP with anyone, functioning as a defensive security notification.",
            )
        ],
        claimed_identity="Bank Transaction Service",
        sender_intent="Deliver one-time authentication passcode for pending transaction",
        reasoning="This message is a legitimate bank authorization advisory. It provides an OTP for a transaction initiated by the account holder and explicitly warns against sharing the code.",
        recommendations=[
            "Never share this code with anyone who calls or messages you.",
            "If you did not initiate this transaction, immediately lock your card in your banking app.",
        ],
        summary="Legitimate bank transaction OTP advisory warning never to disclose code.",
        meta=AnalysisMeta(model="gemini-3.8-flash", prompt_version="v1", duration_ms=380, cached=True),
    )
    save_cached_sample_result("bank_otp_safe", safe_otp)

    # 3. job_fee_qr
    job_qr = AnalysisResult(
        id="demo-job-qr-03",
        feature=FeatureType.PAYMENT,
        status=AnalysisStatus.ASSESSED,
        score=75,
        level=RiskLevel.HIGH,
        confidence=Confidence.HIGH,
        factors=[
            Factor(
                code="UPFRONT_FEE",
                category="Financial",
                severity=Severity.HIGH,
                weight=25,
                source=FactorSource.AI,
                title="Upfront registration fee requirement",
                why_it_matters="Legitimate employers do not charge candidates fees for job registration or placement processing.",
                evidence="Registration fee ₹1499.00",
            ),
            Factor(
                code="PERSONAL_RECIPIENT",
                category="Financial",
                severity=Severity.HIGH,
                weight=15,
                source=FactorSource.DETERMINISTIC,
                title="Payment goes to an individual account",
                why_it_matters="The payment handle rameshk1985@ybl is registered to an individual rather than an incorporated employer.",
                evidence="rameshk1985@ybl",
            ),
            Factor(
                code="COMBINED_PATTERN",
                category="Pattern",
                severity=Severity.HIGH,
                weight=35,
                source=FactorSource.COMBINED,
                title="Advance-fee pattern combined with individual account transfer",
                why_it_matters="Advance fee fraud routinely routes payments through personal accounts under the guise of processing charges.",
                evidence=None,
            ),
        ],
        categories=[
            CategoryStatus(category="Financial", severity=Severity.HIGH, label="High"),
            CategoryStatus(category="Identity", severity=Severity.MEDIUM, label="Medium"),
            CategoryStatus(category="Credentials", severity=None, label="Not detected"),
            CategoryStatus(category="Urgency", severity=Severity.MEDIUM, label="Medium"),
            CategoryStatus(category="Destination", severity=None, label="Not detected"),
            CategoryStatus(category="Manipulation", severity=Severity.HIGH, label="High"),
        ],
        details=PaymentDetails(
            payment_type="UPI",
            payee_vpa="rameshk1985@ybl",
            payee_name="RAMESH K",
            amount="1499.00",
            currency="INR",
            note="Registration fee",
            merchant_code=None,
        ),
        claimed_identity="Job Recruitment Coordinator",
        sender_intent="Collect upfront registration fee from job applicant",
        reasoning="This payment request follows classic advance-fee employment fraud patterns: candidates are instructed to make an upfront payment to an individual recipient account.",
        recommendations=[
            "Do not pay this fee. Legitimate recruiters do not charge job application fees.",
            "Verify company openings directly on their official careers website.",
        ],
        summary="Advance fee job scam requesting registration fee to personal UPI handle.",
        meta=AnalysisMeta(model="gemini-3.8-flash", prompt_version="payment_v1", duration_ms=410, cached=True),
    )
    save_cached_sample_result("job_fee_qr", job_qr)

    # 4. merchant_qr_safe
    merchant_safe = AnalysisResult(
        id="demo-merchant-safe-04",
        feature=FeatureType.PAYMENT,
        status=AnalysisStatus.ASSESSED,
        score=10,
        level=RiskLevel.LOW,
        confidence=Confidence.HIGH,
        factors=[
            Factor(
                code="IDENTITY_UNVERIFIED",
                category="Identity",
                severity=Severity.LOW,
                weight=2,
                source=FactorSource.AI,
                title="Local merchant identifier",
                why_it_matters="Registered merchant code present for commercial cafe point of sale.",
                evidence="mc=5812",
            ),
        ],
        categories=[
            CategoryStatus(category="Financial", severity=None, label="Not detected"),
            CategoryStatus(category="Identity", severity=Severity.LOW, label="Unverified"),
            CategoryStatus(category="Credentials", severity=None, label="Not detected"),
            CategoryStatus(category="Urgency", severity=None, label="Not detected"),
            CategoryStatus(category="Destination", severity=None, label="Not detected"),
            CategoryStatus(category="Manipulation", severity=None, label="Not detected"),
        ],
        details=PaymentDetails(
            payment_type="UPI",
            payee_vpa="greentea.cafe@upi",
            payee_name="Green Tea Cafe",
            merchant_code="5812",
            currency="INR",
        ),
        claimed_identity="Green Tea Cafe",
        sender_intent="Standard in-person retail merchant payment",
        reasoning="This QR payload is a standard merchant payment setup with registered merchant category code (MCC 5812 - Eating Places/Restaurants). No red flags detected.",
        recommendations=[
            "Confirm the payee name matches the signage at the retail counter before authorizing.",
        ],
        summary="Verified merchant QR code with registered merchant category code 5812.",
        meta=AnalysisMeta(model="gemini-3.8-flash", prompt_version="payment_v1", duration_ms=360, cached=True),
    )
    save_cached_sample_result("merchant_qr_safe", merchant_safe)

    # 5. scholarship_notice
    scholarship_res = AnalysisResult(
        id="demo-scholarship-05",
        feature=FeatureType.DOCUMENT,
        status=AnalysisStatus.ASSESSED,
        score=88,
        level=RiskLevel.CRITICAL,
        confidence=Confidence.HIGH,
        factors=[
            Factor(
                code="IDENTITY_MISMATCH",
                category="Identity",
                severity=Severity.HIGH,
                weight=20,
                source=FactorSource.AI,
                title="Government scholarship cell impersonation",
                why_it_matters="Document purports to be an official State Merit Scholarship notice but uses non-governmental contact channels.",
                evidence="State Merit Scholarship Cell",
            ),
            Factor(
                code="UPFRONT_FEE",
                category="Financial",
                severity=Severity.HIGH,
                weight=25,
                source=FactorSource.AI,
                title="Security deposit processing fee",
                why_it_matters="Government merit scholarships never demand upfront deposits or fees to disburse awarded funds.",
                evidence="Refundable verification deposit: Rs. 1,499",
            ),
            Factor(
                code="PERSONAL_RECIPIENT",
                category="Financial",
                severity=Severity.HIGH,
                weight=15,
                source=FactorSource.DETERMINISTIC,
                title="Personal UPI address for official fee",
                why_it_matters="Official fees are collected through Treasury portals or designated bank accounts, never personal handles.",
                evidence="scholarship.cell2024@ybl",
            ),
            Factor(
                code="COMBINED_PATTERN",
                category="Pattern",
                severity=Severity.HIGH,
                weight=28,
                source=FactorSource.COMBINED,
                title="Authority impersonation paired with advance payment demand",
                why_it_matters="Impersonating government scholarship bodies to solicit refundable deposits is a recognized fraud pattern.",
                evidence=None,
            ),
        ],
        categories=[
            CategoryStatus(category="Identity", severity=Severity.HIGH, label="High"),
            CategoryStatus(category="Financial", severity=Severity.HIGH, label="High"),
            CategoryStatus(category="Destination", severity=Severity.HIGH, label="High"),
            CategoryStatus(category="Urgency", severity=Severity.MEDIUM, label="Medium"),
            CategoryStatus(category="Credentials", severity=None, label="Not detected"),
            CategoryStatus(category="Manipulation", severity=Severity.HIGH, label="High"),
        ],
        details=DocumentDetails(
            entities={
                "authority": ["State Merit Scholarship Cell", "Government of Exemplar Pradesh"],
                "upi": ["scholarship.cell2024@ybl"],
                "links": ["https://scholarship-verify.example.com/upload"],
            },
            hidden_links=["https://scholarship-verify.example.com/upload"],
            active_content=False,
        ),
        claimed_identity="State Merit Scholarship Cell",
        sender_intent="Solicit advance deposit under guise of scholarship disbursement",
        reasoning="This document is fraudulent: genuine merit scholarship awards never require beneficiaries to transfer a refundable deposit, and government bodies do not accept funds via private UPI addresses.",
        recommendations=[
            "Do not transfer funds to the specified UPI handle or visit the upload link.",
            "Verify all scholarship circulars on your educational institution's official notice board or portal.",
        ],
        summary="Fraudulent scholarship notice demanding Rs 1499 refundable deposit to private handle.",
        meta=AnalysisMeta(model="gemini-3.8-flash", prompt_version="document_v1", duration_ms=450, cached=True),
    )
    save_cached_sample_result("scholarship_notice", scholarship_res)

    # 6. bank_call
    bank_call_res = AnalysisResult(
        id="demo-bank-call-06",
        feature=FeatureType.VOICE,
        status=AnalysisStatus.ASSESSED,
        score=84,
        level=RiskLevel.CRITICAL,
        confidence=Confidence.HIGH,
        factors=[
            Factor(
                code="OTP_PIN_REQUEST",
                category="Credentials",
                severity=Severity.HIGH,
                weight=35,
                source=FactorSource.AI,
                title="Verbal demand for one-time authentication code",
                why_it_matters="Bank agents are prohibited from asking customers for one-time passwords over telephone calls.",
                evidence="Read out the 6-digit verification code sent to your phone right now",
            ),
            Factor(
                code="THREAT_OR_FEAR",
                category="Manipulation",
                severity=Severity.HIGH,
                weight=15,
                source=FactorSource.AI,
                title="Threat of legal freeze and fund forfeiture",
                why_it_matters="The caller uses intimidation to coerce the victim into immediate compliance without consulting others.",
                evidence="Failure to cooperate will result in immediate police referral and account freeze",
            ),
            Factor(
                code="SYNTHETIC_VOICE_INDICATORS",
                category="Voice",
                severity=Severity.HIGH,
                weight=15,
                source=FactorSource.DETERMINISTIC,
                title="Acoustic characteristics consistent with speech synthesis",
                why_it_matters="The speech audio shows synthetic spectral characteristics detected by acoustic forensics.",
                evidence="Spoof confidence 0.999",
            ),
            Factor(
                code="COMBINED_PATTERN",
                category="Pattern",
                severity=Severity.HIGH,
                weight=19,
                source=FactorSource.COMBINED,
                title="Voice call coercion with credential demands",
                why_it_matters="Simulated authority coupled with intimidation and OTP demands is high-confidence vishing.",
                evidence=None,
            ),
        ],
        categories=[
            CategoryStatus(category="Credentials", severity=Severity.HIGH, label="High"),
            CategoryStatus(category="Manipulation", severity=Severity.HIGH, label="High"),
            CategoryStatus(category="Urgency", severity=Severity.HIGH, label="High"),
            CategoryStatus(category="Voice", severity=Severity.HIGH, label="Synthetic indicators"),
            CategoryStatus(category="Identity", severity=Severity.HIGH, label="High"),
            CategoryStatus(category="Financial", severity=None, label="Not detected"),
            CategoryStatus(category="Destination", severity=None, label="Not detected"),
        ],
        details=VoiceDetails(
            duration_seconds=34.3,
            analyzed_seconds=34.3,
            transcript="This is senior fraud investigation officer calling from Bharat National Bank. We have detected suspicious unauthorized transactions on your debit card. Read out the 6-digit verification code sent to your phone right now to block the transaction. If you hang up or delay, your account will be frozen indefinitely.",
            spoof_probability=0.999,
            spoof_window_ratio=1.0,
            voice_verdict="Synthetic-voice indicators detected",
            voice_caveat="A human voice can run a scam; a synthetic voice can be harmless. Voice authenticity is assessed independently from conversational risk.",
            model_available=True,
        ),
        claimed_identity="Bharat National Bank Fraud Officer",
        sender_intent="Coerce target to disclose telephone OTP during call",
        reasoning="Critical vishing attempt: the caller utilizes intimidation, threat of immediate asset freeze, and demands immediate read-back of a one-time authorization passcode.",
        recommendations=[
            "Hang up immediately. Never disclose OTPs or passwords over the phone.",
            "Call your bank directly using the phone number printed on the back of your card.",
        ],
        summary="High-threat vishing call demanding telephone OTP with freeze threats.",
        meta=AnalysisMeta(model="gemini-3.8-flash", prompt_version="voice_v1", duration_ms=520, cached=True),
    )
    save_cached_sample_result("bank_call", bank_call_res)

    print("All sample analyses successfully cached to samples/cache/!")


if __name__ == "__main__":
    warm()
