"""PDF and document structure parser using pypdf."""
import io
import logging
from dataclasses import dataclass, field
import pypdf

from errors import TrustGuardError, ErrorCode
from schemas import DocumentDetails, Factor, Severity, FactorSource
from services.signals import SIGNAL_TABLE, compute_weight

logger = logging.getLogger(__name__)

MAX_PDF_PAGES = 10


@dataclass
class DocumentParseResult:
    text: str = ""
    pages_count: int = 0
    active_content: bool = False
    hidden_links: list[str] = field(default_factory=list)
    deterministic_factors: list[Factor] = field(default_factory=list)


def parse_pdf(file_bytes: bytes) -> DocumentParseResult:
    """Parse a PDF document: validate page limit, detect active content, extract text and links."""
    result = DocumentParseResult()

    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        result.pages_count = len(reader.pages)

        # Page limit check
        if result.pages_count > MAX_PDF_PAGES:
            raise TrustGuardError(ErrorCode.TOO_MANY_PAGES)

        # Active content scanner
        # Check document catalog and pages for JavaScript / OpenAction / Launch
        catalog = getattr(reader, "trailer", {}).get("/Root", {})
        if catalog:
            catalog_obj = catalog.get_object() if hasattr(catalog, "get_object") else catalog
            if "/OpenAction" in catalog_obj or "/JavaScript" in catalog_obj or "/Names" in catalog_obj:
                result.active_content = True

        all_text = []
        links_found = []

        for page in reader.pages:
            # Check text
            t = page.extract_text() or ""
            all_text.append(t)

            # Check links & active annotations
            annots = page.get("/Annots")
            if annots:
                annots_list = annots.get_object() if hasattr(annots, "get_object") else annots
                if isinstance(annots_list, list):
                    for a_ref in annots_list:
                        a = a_ref.get_object() if hasattr(a_ref, "get_object") else a_ref
                        if not isinstance(a, dict):
                            continue
                        # Check active action
                        action = a.get("/A")
                        if action:
                            action_obj = action.get_object() if hasattr(action, "get_object") else action
                            s = action_obj.get("/S")
                            if s in ("/JavaScript", "/Launch"):
                                result.active_content = True
                            if s == "/URI":
                                uri = action_obj.get("/URI")
                                if uri:
                                    links_found.append(str(uri))

        result.text = "\n\n".join(all_text).strip()
        result.hidden_links = list(dict.fromkeys(links_found))

        # Signal: PDF_ACTIVE_CONTENT
        if result.active_content:
            sig_def = SIGNAL_TABLE.get("PDF_ACTIVE_CONTENT")
            if sig_def:
                weight = compute_weight(sig_def.base_weight, "HIGH")
                result.deterministic_factors.append(Factor(
                    code="PDF_ACTIVE_CONTENT",
                    category=sig_def.category.value,
                    severity=Severity.HIGH,
                    weight=weight,
                    source=FactorSource.DETERMINISTIC,
                    title="Active content / executable script in PDF",
                    why_it_matters="The document contains automated launch actions or embedded scripts commonly used in exploit delivery.",
                    evidence="Embedded action detected",
                ))

        return result

    except TrustGuardError:
        raise
    except Exception as e:
        logger.warning(f"Failed to parse PDF: {e}")
        raise TrustGuardError(ErrorCode.UNREADABLE_DOCUMENT)
