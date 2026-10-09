"""Shared analysis pipeline with NDJSON streaming."""
import json
import logging
import time

from schemas import StageEvent, ResultEvent, ErrorEvent, AnalysisResult
from errors import TrustGuardError

logger = logging.getLogger(__name__)

ANALYSIS_TIMEOUT = 90  # seconds


def ndjson_line(obj: dict | StageEvent | ResultEvent | ErrorEvent) -> str:
    """Serialize one NDJSON line."""
    if hasattr(obj, "model_dump"):
        data = obj.model_dump()
    else:
        data = obj
    return json.dumps(data, default=str) + "\n"


async def stream_stage(stage: str, detail: str | None = None) -> str:
    """Create a stage event NDJSON line."""
    event = StageEvent(stage=stage, detail=detail)
    return ndjson_line(event)


async def stream_result(result: AnalysisResult) -> str:
    """Create a result event NDJSON line."""
    event = ResultEvent(data=result)
    return ndjson_line(event)


async def stream_error(code: str, message: str) -> str:
    """Create an error event NDJSON line."""
    event = ErrorEvent(code=code, message=message)
    return ndjson_line(event)


class PipelineContext:
    """Tracks pipeline state for NDJSON streaming."""

    def __init__(self):
        self.start_time = time.monotonic()
        self.stages_emitted: list[str] = []

    def elapsed_ms(self) -> int:
        return int((time.monotonic() - self.start_time) * 1000)

    def check_timeout(self) -> None:
        if self.elapsed_ms() > ANALYSIS_TIMEOUT * 1000:
            raise TrustGuardError("TIMEOUT")

    async def emit_stage(self, stage: str, detail: str | None = None) -> str:
        self.stages_emitted.append(stage)
        return await stream_stage(stage, detail)

    async def emit_result(self, result: AnalysisResult) -> str:
        result.meta.duration_ms = self.elapsed_ms()
        return await stream_result(result)

    async def emit_error(self, error: TrustGuardError) -> str:
        return await stream_error(error.code.value, error.message)
