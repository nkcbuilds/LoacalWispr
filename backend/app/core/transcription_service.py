import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from enum import Enum
from pathlib import Path
from threading import Lock

from app.config import settings
from app.core.audio_recorder import AudioRecorder, RecorderState
from app.core.events import EventBroadcaster
from app.core.model_manager import ModelManager
from app.core.providers import TranscriptionProvider, create_provider

logger = logging.getLogger(__name__)


class ToggleResult:
    def __init__(self, state: str, text: str | None = None, error: str | None = None) -> None:
        self.state = state
        self.text = text
        self.error = error

    def to_dict(self) -> dict:
        result: dict = {"state": self.state}
        if self.text is not None:
            result["text"] = self.text
        if self.error is not None:
            result["error"] = self.error
        return result


class TranscriptionService:
    """Orchestrates recording + provider-based transcription."""

    def __init__(
        self,
        broadcaster: EventBroadcaster,
        provider: TranscriptionProvider | None = None,
    ) -> None:
        self._broadcaster = broadcaster
        self._provider = provider or create_provider(settings.transcription_provider)
        self._recorder = AudioRecorder()
        self._model_manager = ModelManager()
        self._current_model = settings.default_model
        self._lock = Lock()
        self._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="transcribe")
        self._loop: asyncio.AbstractEventLoop | None = None
        self._transcribing = False

    @property
    def provider_name(self) -> str:
        return self._provider.name

    @property
    def current_model(self) -> str:
        return self._current_model

    @property
    def state(self) -> RecorderState:
        if self._transcribing:
            return RecorderState.TRANSCRIBING
        return self._recorder.state

    def set_event_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    async def initialize(self) -> None:
        """Pre-load the default model on startup."""
        await self._run_blocking(self._ensure_model_loaded, self._current_model)
        await self._emit({"type": "status", "state": "idle", "model_id": self._current_model})

    async def shutdown(self) -> None:
        self._recorder.cleanup()
        await self._run_blocking(self._provider.unload)
        self._executor.shutdown(wait=False, cancel_futures=True)

    def _ensure_model_loaded(self, model_id: str) -> None:
        if not self._provider.is_model_ready(model_id):
            logger.info("Model %s not cached — downloading", model_id)
            self._model_manager.download_model(model_id)
        self._provider.load_model(model_id)
        self._current_model = model_id

    async def select_model(self, model_id: str) -> None:
        if self._model_manager.get_definition(model_id) is None:
            raise ValueError(f"Unknown model: {model_id}")

        await self._run_blocking(self._ensure_model_loaded, model_id)
        await self._emit({
            "type": "model_changed",
            "model_id": model_id,
            "state": self.state.value,
        })

    async def download_model(self, model_id: str) -> None:
        if self._model_manager.get_definition(model_id) is None:
            raise ValueError(f"Unknown model: {model_id}")

        await self._emit({"type": "model_download_started", "model_id": model_id})
        try:
            await self._run_blocking(self._model_manager.download_model, model_id)
            await self._emit({"type": "model_download_complete", "model_id": model_id, "progress": 100})
        except Exception as exc:
            await self._emit({
                "type": "transcription_error",
                "message": f"Model download failed: {exc}",
                "model_id": model_id,
            })
            raise

    async def toggle_recording(self) -> ToggleResult:
        with self._lock:
            current = self.state

            if current == RecorderState.TRANSCRIBING:
                return ToggleResult(state="transcribing")

            if current == RecorderState.IDLE:
                try:
                    self._recorder.start()
                    await self._emit({"type": "recording_started", "state": "recording"})
                    return ToggleResult(state="recording")
                except Exception as exc:
                    logger.exception("Failed to start recording")
                    return ToggleResult(state="idle", error=str(exc))

            if current == RecorderState.RECORDING:
                try:
                    wav_path = self._recorder.stop()
                except Exception as exc:
                    logger.exception("Failed to stop recording")
                    self._recorder.cleanup()
                    return ToggleResult(state="idle", error=str(exc))

                self._transcribing = True
                await self._emit({"type": "recording_stopped", "state": "transcribing"})
                await self._emit({"type": "transcription_started", "state": "transcribing"})

                try:
                    result = await self._run_blocking(self._transcribe_file, wav_path)
                    self._transcribing = False
                    self._recorder.cleanup()
                    await self._emit({
                        "type": "transcription_complete",
                        "state": "idle",
                        "text": result.text,
                    })
                    return ToggleResult(state="idle", text=result.text)
                except Exception as exc:
                    logger.exception("Transcription failed")
                    self._transcribing = False
                    self._recorder.cleanup()
                    await self._emit({
                        "type": "transcription_error",
                        "state": "idle",
                        "message": str(exc),
                    })
                    return ToggleResult(state="idle", error=str(exc))

        return ToggleResult(state="idle")

    def _transcribe_file(self, wav_path: Path):
        self._ensure_model_loaded(self._current_model)
        return self._provider.transcribe(wav_path)

    async def _run_blocking(self, func, *args):
        loop = self._loop or asyncio.get_event_loop()
        return await loop.run_in_executor(self._executor, func, *args)

    async def _emit(self, event: dict) -> None:
        await self._broadcaster.broadcast(event)

    def list_models(self) -> list[dict]:
        return self._model_manager.list_models()