from abc import ABC, abstractmethod


class TranscriptionProvider(ABC):
    """Abstract transcription provider for local and future cloud backends."""

    @abstractmethod
    def transcribe(self, audio_path: str) -> str:
        """Transcribe audio file and return text."""
        ...