from app.core.providers.base import TranscriptionProvider


class LocalWhisperCppProvider(TranscriptionProvider):
    """whisper.cpp subprocess provider (stub for scaffold phase)."""

    def __init__(self, model_id: str) -> None:
        self.model_id = model_id

    def transcribe(self, audio_path: str) -> str:
        # TODO: invoke whisper.cpp binary
        return f"[transcription stub for {audio_path}]"