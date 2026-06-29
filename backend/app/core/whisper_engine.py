"""whisper.cpp engine stub — full implementation in next phase."""

from pathlib import Path

from app.config import settings


class WhisperEngine:
    def __init__(self, model_path: Path) -> None:
        self.model_path = model_path
        self.binary_path = settings.bin_dir / "whisper.exe"

    def is_binary_available(self) -> bool:
        return self.binary_path.exists()

    def transcribe(self, audio_path: str) -> str:
        if not self.is_binary_available():
            return "[whisper.cpp binary not yet downloaded]"
        # TODO: subprocess call to whisper.cpp
        return "[whisper.cpp transcription pending]"