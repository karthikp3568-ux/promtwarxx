"""Prompt loader from versioned markdown files."""
import os
from functools import lru_cache

PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "..", "prompts")


@lru_cache(maxsize=32)
def load_prompt(name: str) -> str:
    """Load a prompt template from prompts/{name}.md."""
    path = os.path.join(PROMPTS_DIR, f"{name}.md")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def get_prompt_version(name: str) -> str:
    """Extract version from prompt filename, e.g. 'system_v1' -> 'v1'."""
    parts = name.rsplit("_", 1)
    return parts[-1] if len(parts) > 1 else "v1"


def format_untrusted(content: str) -> str:
    """Wrap content in untrusted_content tags with escaping."""
    escaped = content.replace("<untrusted_content>", "&lt;untrusted_content&gt;").replace(
        "</untrusted_content>", "&lt;/untrusted_content&gt;"
    )
    return f"<untrusted_content>\n{escaped}\n</untrusted_content>"
