import logging
import tempfile
import wave
from enum import Enum
from pathlib import Path
from threading import Lock

import numpy as np
import sounddevice as sd

from app.config import settings

logger = logging.getLogger(__name__)


class RecorderState(str, Enum):
    IDLE = "idle"
    RECORDING = "recording"
    TRANSCRIBING = "transcribing"


class AudioRecorder:
    """Captures 16 kHz mono audio from the default microphone."""

    def __init__(self, sample_rate: int | None = None) -> None:
        self.sample_rate = sample_rate or settings.sample_rate
        self._state = RecorderState.IDLE
        self._lock = Lock()
        self._stream: sd.InputStream | None = None
        self._frames: list[np.ndarray] = []
        self._last_wav_path: Path | None = None

    @property
    def state(self) -> RecorderState:
        with self._lock:
            return self._state

    def _set_state(self, state: RecorderState) -> None:
        with self._lock:
            self._state = state

    def start(self) -> None:
        with self._lock:
            if self._state != RecorderState.IDLE:
                raise RuntimeError(f"Cannot start recording in state: {self._state}")

            self._frames = []
            self._cleanup_last_wav()

            def callback(indata: np.ndarray, _frames: int, _time, status) -> None:
                if status:
                    logger.warning("Audio stream status: %s", status)
                self._frames.append(indata.copy())

            self._stream = sd.InputStream(
                samplerate=self.sample_rate,
                channels=1,
                dtype="float32",
                callback=callback,
            )
            self._stream.start()
            self._state = RecorderState.RECORDING
            logger.info("Recording started")

    def stop(self) -> Path:
        """Stop recording and return path to the saved WAV file."""
        with self._lock:
            if self._state != RecorderState.RECORDING:
                raise RuntimeError(f"Cannot stop recording in state: {self._state}")

            if self._stream is not None:
                self._stream.stop()
                self._stream.close()
                self._stream = None

            if not self._frames:
                raise RuntimeError("No audio captured")

            audio = np.concatenate(self._frames, axis=0).flatten()
            self._last_wav_path = self._save_wav(audio)
            self._frames = []
            logger.info("Recording stopped — saved %s", self._last_wav_path)
            return self._last_wav_path

    def _save_wav(self, audio: np.ndarray) -> Path:
        audio_int16 = np.clip(audio * 32767, -32768, 32767).astype(np.int16)
        tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False, prefix="wisprlocal_")
        tmp_path = Path(tmp.name)
        tmp.close()

        with wave.open(str(tmp_path), "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(self.sample_rate)
            wf.writeframes(audio_int16.tobytes())

        return tmp_path

    def _cleanup_last_wav(self) -> None:
        if self._last_wav_path and self._last_wav_path.exists():
            try:
                self._last_wav_path.unlink()
            except OSError:
                logger.warning("Failed to delete temp wav: %s", self._last_wav_path)
        self._last_wav_path = None

    def cleanup(self) -> None:
        with self._lock:
            if self._stream is not None:
                try:
                    self._stream.stop()
                    self._stream.close()
                except Exception:
                    pass
                self._stream = None
            self._frames = []
            self._cleanup_last_wav()
            self._state = RecorderState.IDLE