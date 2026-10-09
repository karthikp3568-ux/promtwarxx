"""QR Code decoder using zxing-cpp."""
import io
import logging
from PIL import Image
import zxingcpp


logger = logging.getLogger(__name__)


def decode_qr(image_bytes: bytes) -> list[str]:
    """Decode all QR codes from image bytes.

    Returns:
        List of decoded payload strings.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Convert to RGB if palette or alpha
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")

        barcodes = zxingcpp.read_barcodes(image)
        payloads = [b.text for b in barcodes if b.text]
        return payloads
    except Exception as e:
        logger.warning(f"Error decoding QR: {e}")
        return []
