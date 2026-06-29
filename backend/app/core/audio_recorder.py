"""Audio recorder stub — full implementation in next phase."""

from enum import Enum


class RecorderState(str, Enum):
    IDLE = "idle"
    RECORDING = "recording"
    TRANSCRIBING = "transcribing"


class AudioRecorder:
    def __init__(self) -> None:
        self._state = RecorderState.IDLE

    @property
    def state(self) -> RecorderState:
        return self._state

    def start(self) -> None:
        self._state = RecorderState.RECORDING

    def stop(self) -> None:
        self._state = RecorderState.TRANSCRIBING

    def reset(self) -> None:
        self._state = RecorderState.IDLE