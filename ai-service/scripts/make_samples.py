"""Generate all demo samples for TrustGuard AI.

Uses only dev dependencies: qrcode[pil], reportlab, pyttsx3.
All organizations, domains, and UPI handles are fictional.
"""
import os
import sys
import json
import wave
import struct

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "..", "samples")
CACHE_DIR = os.path.join(SAMPLES_DIR, "cache")


def ensure_dirs():
    os.makedirs(SAMPLES_DIR, exist_ok=True)
    os.makedirs(CACHE_DIR, exist_ok=True)


# ──────────────────────────────────────────────
# Text samples
# ──────────────────────────────────────────────

KYC_BLOCK_SMS = """URGENT: Your Bharat National Bank account has been temporarily blocked due to incomplete KYC verification. Update your KYC immediately to avoid permanent account closure.

Click here to verify: https://bharat-national-bank-kyc.example.com/verify?ref=KYC2024-8834

You will receive an OTP on your registered mobile number. Please share the OTP with our verification team to complete the process.

This is an automated message from Bharat National Bank Security Division.
Contact: support@bharatbank.example.com
Ref: BNB/KYC/2024/8834

Act within 24 hours or your account will be permanently closed."""

BANK_OTP_SAFE = """Your OTP for Bharat National Bank net banking login is 847291. Valid for 5 minutes. Do NOT share this OTP with anyone. Bharat National Bank will never ask for your OTP over call or message. If you did not request this, call 1800-XXX-XXXX immediately.

- Bharat National Bank"""

BANK_CALL_SCRIPT = """Hello, this is the fraud prevention department of Bharat National Bank. We have detected suspicious activity on your savings account ending in 4523.

Someone has attempted an unauthorized transaction of Rs. 49,999. To block this transaction, I need to verify your identity.

You will receive an OTP on your mobile now. Please read that OTP to me so I can block the fraudulent transaction.

Please hurry, we only have a few minutes. Do not call the regular helpline, this is handled by our special fraud unit."""


def make_text_samples():
    print("Creating text samples...")
    path1 = os.path.join(SAMPLES_DIR, "kyc_block_sms.txt")
    with open(path1, "w", encoding="utf-8") as f:
        f.write(KYC_BLOCK_SMS.strip())
    print(f"  Created: {path1}")

    path2 = os.path.join(SAMPLES_DIR, "bank_otp_safe.txt")
    with open(path2, "w", encoding="utf-8") as f:
        f.write(BANK_OTP_SAFE.strip())
    print(f"  Created: {path2}")

    path3 = os.path.join(SAMPLES_DIR, "bank_call_script.txt")
    with open(path3, "w", encoding="utf-8") as f:
        f.write(BANK_CALL_SCRIPT.strip())
    print(f"  Created: {path3}")


# ──────────────────────────────────────────────
# Context files (JSON sidecar for QR samples)
# ──────────────────────────────────────────────

def make_context_files():
    print("Creating context files...")

    ctx1 = {"context": "Pay within 1 hour to confirm your registration for the data entry job position."}
    path1 = os.path.join(SAMPLES_DIR, "job_fee_qr_context.json")
    with open(path1, "w") as f:
        json.dump(ctx1, f, indent=2)
    print(f"  Created: {path1}")

    ctx2 = {"context": "Scan this QR code to receive your Rs. 5,000 cashback refund from MegaMart Online."}
    path2 = os.path.join(SAMPLES_DIR, "refund_qr_context.json")
    with open(path2, "w") as f:
        json.dump(ctx2, f, indent=2)
    print(f"  Created: {path2}")


# ──────────────────────────────────────────────
# QR code samples
# ──────────────────────────────────────────────

def make_qr_samples():
    import qrcode
    from qrcode.image.pil import PilImage

    print("Creating QR code samples...")

    # Job fee QR: UPI, no merchant code, prefilled amount
    job_fee_payload = "upi://pay?pa=rameshk1985@ybl&pn=RAMESH%20K&am=1499.00&cu=INR&tn=Registration%20fee"
    img1 = qrcode.make(job_fee_payload, image_factory=PilImage)
    path1 = os.path.join(SAMPLES_DIR, "job_fee_qr.png")
    img1.save(path1)
    print(f"  Created: {path1}")
    print(f"    Payload: {job_fee_payload}")

    # Refund QR: UPI "scan to receive" scam
    refund_payload = "upi://pay?pa=megamart.refunds@ybl&pn=MegaMart%20Refunds&am=5000.00&cu=INR&tn=Cashback%20refund%20-%20scan%20to%20receive"
    img2 = qrcode.make(refund_payload, image_factory=PilImage)
    path2 = os.path.join(SAMPLES_DIR, "refund_qr.png")
    img2.save(path2)
    print(f"  Created: {path2}")
    print(f"    Payload: {refund_payload}")

    # Merchant QR: safe, has merchant code, no prefilled amount
    merchant_payload = "upi://pay?pa=greentea.cafe@upi&pn=Green%20Tea%20Cafe&mc=5812&cu=INR"
    img3 = qrcode.make(merchant_payload, image_factory=PilImage)
    path3 = os.path.join(SAMPLES_DIR, "merchant_qr_safe.png")
    img3.save(path3)
    print(f"  Created: {path3}")
    print(f"    Payload: {merchant_payload}")

    # URL QR: for redirect hop testing
    url_payload = "https://bit.ly.example.com/3xF8kLp"
    img4 = qrcode.make(url_payload, image_factory=PilImage)
    path4 = os.path.join(SAMPLES_DIR, "url_redirect_qr.png")
    img4.save(path4)
    print(f"  Created: {path4}")
    print(f"    Payload: {url_payload}")


# ──────────────────────────────────────────────
# PDF sample
# ──────────────────────────────────────────────

def make_pdf_sample():
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import inch, cm
    from reportlab.lib.colors import HexColor
    from reportlab.pdfgen import canvas
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

    print("Creating PDF sample...")
    path = os.path.join(SAMPLES_DIR, "scholarship_notice.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4,
                            leftMargin=1.2*inch, rightMargin=1.2*inch,
                            topMargin=1*inch, bottomMargin=1*inch)

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="Header", parent=styles["Heading1"],
                              fontSize=16, alignment=TA_CENTER,
                              textColor=HexColor("#1a3c6e")))
    styles.add(ParagraphStyle(name="SubHeader", parent=styles["Heading2"],
                              fontSize=12, alignment=TA_CENTER,
                              textColor=HexColor("#2d5a9e")))
    styles.add(ParagraphStyle(name="Body14", parent=styles["Normal"],
                              fontSize=11, leading=16))
    styles.add(ParagraphStyle(name="Small", parent=styles["Normal"],
                              fontSize=9, textColor=HexColor("#666666")))

    story = []

    # Header
    story.append(Paragraph("STATE MERIT SCHOLARSHIP CELL", styles["Header"]))
    story.append(Paragraph("Government of Exemplar Pradesh", styles["SubHeader"]))
    story.append(Spacer(1, 0.3*inch))

    story.append(Paragraph("<b>OFFICIAL NOTICE: MERIT SCHOLARSHIP AWARD 2024-25</b>", styles["Body14"]))
    story.append(Spacer(1, 0.15*inch))
    story.append(Paragraph(f"Ref: SMSC/MERIT/2024/47832", styles["Body14"]))
    story.append(Paragraph(f"Date: 15 October 2024", styles["Body14"]))
    story.append(Spacer(1, 0.15*inch))

    story.append(Paragraph(
        "Dear Candidate,", styles["Body14"]))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph(
        "Congratulations! Based on your outstanding academic performance, you have been selected "
        "for the State Merit Scholarship 2024-25. The scholarship amount of <b>Rs. 75,000</b> will be "
        "credited directly to your bank account upon successful registration.",
        styles["Body14"]))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph(
        "To complete your registration and receive the scholarship, please follow these steps:",
        styles["Body14"]))
    story.append(Spacer(1, 0.1*inch))

    story.append(Paragraph(
        "<b>Step 1:</b> Pay the one-time registration and processing fee of <b>Rs. 1,499</b> "
        "to the following UPI ID:", styles["Body14"]))
    story.append(Spacer(1, 0.05*inch))

    # Payment details table
    data = [
        ["UPI ID:", "scholarship.cell2024@ybl"],
        ["Recipient:", "SMSC REGISTRATION"],
        ["Amount:", "Rs. 1,499.00"],
        ["Reference:", "SMSC/REG/2024"],
    ]
    t = Table(data, colWidths=[1.5*inch, 3*inch])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Courier"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.1*inch))

    story.append(Paragraph(
        '<b>Step 2:</b> Upload your payment receipt at '
        '<a href="https://scholarship-verify.example.com/upload" color="blue">'
        'https://scholarship-verify.example.com/upload</a>',
        styles["Body14"]))
    story.append(Spacer(1, 0.1*inch))

    story.append(Paragraph(
        "<b>IMPORTANT:</b> Registration must be completed within <b>24 hours</b> of receiving "
        "this notice. Failure to register within the deadline will result in automatic "
        "cancellation of your scholarship and the seat will be allocated to the next candidate "
        "on the waiting list.", styles["Body14"]))
    story.append(Spacer(1, 0.15*inch))

    story.append(Paragraph(
        "For any queries, contact the scholarship helpdesk:", styles["Body14"]))
    story.append(Paragraph(
        "Email: smsc.helpdesk2024@gmail.com<br/>"
        "Phone: +91-98765-XXXXX<br/>"
        "Website: https://state-scholarship.example.com",
        styles["Body14"]))
    story.append(Spacer(1, 0.3*inch))

    story.append(Paragraph(
        "Dr. R. K. Sharma<br/>"
        "Director, State Merit Scholarship Cell<br/>"
        "Government of Exemplar Pradesh",
        styles["Body14"]))
    story.append(Spacer(1, 0.2*inch))

    story.append(Paragraph(
        "This is a computer-generated document and does not require a physical signature.<br/>"
        "Ref: SMSC/MERIT/2024/47832 | Generated: 15-Oct-2024 09:23:41 IST",
        styles["Small"]))

    doc.build(story)

    # Now add a link annotation using reportlab's low-level canvas
    # Actually reportlab's <a href> in Paragraph already adds annotations
    # Let's verify by reading back with pypdf
    print(f"  Created: {path}")


# ──────────────────────────────────────────────
# WAV sample (TTS)
# ──────────────────────────────────────────────

def make_wav_sample():
    """Generate bank_call.wav using pyttsx3 offline TTS."""
    print("Creating WAV sample...")
    path = os.path.join(SAMPLES_DIR, "bank_call.wav")

    try:
        import pyttsx3
        engine = pyttsx3.init()
        # Slow down for realism
        engine.setProperty("rate", 180)
        voices = engine.getProperty("voices")
        # Try to pick a male voice
        for v in voices:
            if "male" in v.name.lower() or "david" in v.name.lower():
                engine.setProperty("voice", v.id)
                break
        engine.save_to_file(BANK_CALL_SCRIPT.strip(), path)
        engine.runAndWait()
        print(f"  Created: {path}")

        # Check file properties
        with wave.open(path, "r") as wf:
            channels = wf.getnchannels()
            sample_width = wf.getsampwidth()
            framerate = wf.getframerate()
            nframes = wf.getnframes()
            duration = nframes / framerate
            print(f"    Channels: {channels}")
            print(f"    Sample width: {sample_width * 8} bit")
            print(f"    Sample rate: {framerate} Hz")
            print(f"    Duration: {duration:.1f}s")
    except Exception as e:
        print(f"  WARNING: pyttsx3 failed ({e}), creating synthetic WAV fallback")
        _make_fallback_wav(path)


def _make_fallback_wav(path: str):
    """Create a simple synthetic WAV with tone patterns as a fallback."""
    import math
    sample_rate = 16000
    duration = 20  # 20 seconds
    samples = []
    for i in range(sample_rate * duration):
        t = i / sample_rate
        # Mix some frequencies to create speech-like noise
        val = 0.3 * math.sin(2 * math.pi * 200 * t)
        val += 0.2 * math.sin(2 * math.pi * 400 * t)
        val += 0.1 * math.sin(2 * math.pi * 150 * t * (1 + 0.5 * math.sin(2 * math.pi * 3 * t)))
        # Add envelope (speech-like pauses)
        envelope = 0.5 + 0.5 * math.sin(2 * math.pi * 0.8 * t)
        val *= envelope * 0.5
        samples.append(int(val * 32767))

    with wave.open(path, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(sample_rate)
        for s in samples:
            wf.writeframes(struct.pack("<h", max(-32768, min(32767, s))))
    print(f"  Created fallback WAV: {path}")
    with wave.open(path, "r") as wf:
        duration = wf.getnframes() / wf.getframerate()
        print(f"    Duration: {duration:.1f}s, 16-bit, {wf.getframerate()} Hz")


# ──────────────────────────────────────────────
# Verification
# ──────────────────────────────────────────────

def verify_qr_samples():
    """Decode each QR with zxing-cpp and print the payloads."""
    print("\n--- QR Verification ---")
    try:
        import zxingcpp
        from PIL import Image

        qr_files = ["job_fee_qr.png", "refund_qr.png", "merchant_qr_safe.png", "url_redirect_qr.png"]
        for name in qr_files:
            path = os.path.join(SAMPLES_DIR, name)
            if not os.path.exists(path):
                print(f"  SKIP: {name} (not found)")
                continue
            img = Image.open(path)
            results = zxingcpp.read_barcodes(img)
            if results:
                for r in results:
                    print(f"  {name}: {r.text}")
            else:
                print(f"  {name}: NO QR FOUND")
    except ImportError:
        print("  SKIP: zxing-cpp not installed")


def verify_pdf_sample():
    """Check the PDF has a text layer and link annotations."""
    print("\n--- PDF Verification ---")
    try:
        from pypdf import PdfReader
        path = os.path.join(SAMPLES_DIR, "scholarship_notice.pdf")
        reader = PdfReader(path)
        print(f"  Pages: {len(reader.pages)}")

        # Text layer
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        has_text = len(text.strip()) > 0
        print(f"  Has text layer: {has_text}")
        if has_text:
            print(f"  Text length: {len(text)} chars")
            # Check for key content
            for keyword in ["State Merit Scholarship", "Rs. 1,499", "scholarship.cell2024@ybl",
                           "scholarship-verify.example.com", "24 hours"]:
                found = keyword in text
                print(f"    Contains '{keyword}': {found}")

        # Link annotations
        link_count = 0
        for page in reader.pages:
            if "/Annots" in page:
                annots = page["/Annots"]
                for annot in annots:
                    annot_obj = annot.get_object()
                    if annot_obj.get("/Subtype") == "/Link":
                        link_count += 1
                        action = annot_obj.get("/A")
                        if action:
                            uri = action.get("/URI")
                            if uri:
                                print(f"    Link annotation: {uri}")
        print(f"  Link annotations found: {link_count}")
    except ImportError:
        print("  SKIP: pypdf not installed")


def verify_wav_sample():
    """Check WAV is 16-bit and 10-40s long."""
    print("\n--- WAV Verification ---")
    path = os.path.join(SAMPLES_DIR, "bank_call.wav")
    if not os.path.exists(path):
        print("  SKIP: bank_call.wav not found")
        return
    with wave.open(path, "r") as wf:
        channels = wf.getnchannels()
        sample_width = wf.getsampwidth()
        framerate = wf.getframerate()
        nframes = wf.getnframes()
        duration = nframes / framerate
        is_16bit = sample_width == 2
        is_good_length = 10 <= duration <= 40
        print(f"  16-bit: {is_16bit} (sample_width={sample_width*8})")
        print(f"  Duration: {duration:.1f}s (10-40s range: {is_good_length})")
        print(f"  Sample rate: {framerate} Hz")
        print(f"  Channels: {channels}")


def list_fictional_entities():
    """List all organizations, domains, and UPI handles to confirm they're fictional."""
    print("\n--- Fictional Entities Used ---")
    entities = {
        "Organizations": [
            "Bharat National Bank (fictional)",
            "State Merit Scholarship Cell (fictional)",
            "Government of Exemplar Pradesh (fictional state)",
            "MegaMart Online (fictional)",
            "Green Tea Cafe (fictional)",
        ],
        "Domains (.example)": [
            "bharat-national-bank-kyc.example.com",
            "bharatbank.example.com",
            "scholarship-verify.example.com",
            "state-scholarship.example.com",
            "bit.ly.example.com",
        ],
        "UPI IDs (fictional)": [
            "rameshk1985@ybl",
            "megamart.refunds@ybl",
            "greentea.cafe@upi",
            "scholarship.cell2024@ybl",
        ],
        "Emails (fictional/@example/@gmail)": [
            "support@bharatbank.example.com",
            "smsc.helpdesk2024@gmail.com (fictional)",
        ],
    }
    for category, items in entities.items():
        print(f"\n  {category}:")
        for item in items:
            print(f"    - {item}")


def main():
    print("=" * 60)
    print("TrustGuard AI - Demo Sample Generator")
    print("=" * 60)

    ensure_dirs()
    make_text_samples()
    make_context_files()
    make_qr_samples()
    make_pdf_sample()
    make_wav_sample()

    print("\n" + "=" * 60)
    print("Verification")
    print("=" * 60)

    verify_qr_samples()
    verify_pdf_sample()
    verify_wav_sample()
    list_fictional_entities()

    print("\n" + "=" * 60)
    print("Sample generation complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
