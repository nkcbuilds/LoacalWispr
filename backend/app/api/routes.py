from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app import __version__
from app.core import AudioRecorder, ModelManager

router = APIRouter()
model_manager = ModelManager()
audio_recorder = AudioRecorder()


@router.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "version": __version__,
        "backend": "fastapi",
    }


@router.get("/models")
async def list_models() -> list[dict]:
    return model_manager.list_models()


@router.get("/recording/state")
async def recording_state() -> dict:
    return {"state": audio_recorder.state.value}


@router.post("/recording/toggle")
async def toggle_recording() -> dict:
    if audio_recorder.state.value == "idle":
        audio_recorder.start()
    elif audio_recorder.state.value == "recording":
        audio_recorder.stop()
        audio_recorder.reset()
    return {"state": audio_recorder.state.value}


@router.websocket("/ws/status")
async def websocket_status(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            await websocket.send_json({
                "type": "status",
                "recording": audio_recorder.state.value,
                "backend": "ready",
            })
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass