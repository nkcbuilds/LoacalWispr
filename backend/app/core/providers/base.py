from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class TranscriptionResult:
    text: str
    duration_ms: float | None = None
    language: str | None = None


class TranscriptionProvider(ABC):
    """Abstract transcription provider — swap engines without touching callers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider identifier (e.g. faster_whisper, whisper_cpp)."""

    @abstractmethod
    def load_model(self, model_id: str) -> None:
        """Load or switch to the given model."""

    @abstractmethod
    def is_model_ready(self, model_id: str) -> bool:
        """Return True if the model is available locally."""

    @abstractmethod
    def transcribe(self, audio_path: str | Path) -> TranscriptionResult:
        """Transcribe audio file and return structured result."""

    @abstractmethod
    def unload(self) -> None:
        """Release model resources."""