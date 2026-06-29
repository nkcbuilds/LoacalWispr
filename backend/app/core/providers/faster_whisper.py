import logging
from pathlib import Path

from app.config import settings
from app.core.model_manager import ModelManager
from app.core.providers.base import TranscriptionProvider, TranscriptionResult

logger = logging.getLogger(__name__)


class FasterWhisperProvider(TranscriptionProvider):
    """Local transcription via faster-whisper (CTranslate2)."""

    def __init__(self) -> None:
        self._model = None
        self._model_id: str | None = None
        self._model_manager = ModelManager()

    @property
    def name(self) -> str:
        return "faster_whisper"

    def _resolve_device(self) -> str:
        if settings.device != "auto":
            return settings.device
        try:
            import ctranslate2

            if ctranslate2.get_cuda_device_count() > 0:
                return "cuda"
        except Exception:
            logger.debug("CUDA unavailable, falling back to CPU")
        return "cpu"

    def _resolve_compute_type(self, device: str) -> str:
        if device == "cpu":
            return "int8"
        return settings.compute_type

    def load_model(self, model_id: str) -> None:
        if self._model_id == model_id and self._model is not None:
            return

        from faster_whisper import WhisperModel

        self.unload()
        device = self._resolve_device()
        compute_type = self._resolve_compute_type(device)
        model_path = self._model_manager.get_model_path(model_id)

        logger.info(
            "Loading faster-whisper model=%s device=%s compute=%s",
            model_id,
            device,
            compute_type,
        )

        if model_path is not None:
            self._model = WhisperModel(
                str(model_path),
                device=device,
                compute_type=compute_type,
            )
        else:
            self._model = WhisperModel(
                model_id,
                device=device,
                compute_type=compute_type,
                download_root=str(settings.models_dir),
            )

        self._model_id = model_id

    def is_model_ready(self, model_id: str) -> bool:
        return self._model_manager.is_downloaded(model_id)

    def transcribe(self, audio_path: str | Path) -> TranscriptionResult:
        if self._model is None:
            raise RuntimeError("No model loaded — call load_model() first")

        segments, info = self._model.transcribe(
            str(audio_path),
            vad_filter=True,
            language="en",
        )
        text = "".join(segment.text for segment in segments).strip()

        duration_ms = None
        if info.duration is not None:
            duration_ms = info.duration * 1000

        return TranscriptionResult(
            text=text,
            duration_ms=duration_ms,
            language=info.language,
        )

    def unload(self) -> None:
        self._model = None
        self._model_id = None