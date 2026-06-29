from app.core.providers.base import TranscriptionProvider, TranscriptionResult
from app.core.providers.faster_whisper import FasterWhisperProvider

__all__ = ["TranscriptionProvider", "TranscriptionResult", "FasterWhisperProvider"]


def create_provider(provider_name: str | None = None) -> TranscriptionProvider:
    name = provider_name or "faster_whisper"
    if name == "faster_whisper":
        return FasterWhisperProvider()
    raise ValueError(f"Unknown transcription provider: {name}")