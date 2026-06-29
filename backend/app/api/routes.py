import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, ConfigDict

from app import __version__
from app.core.events import EventBroadcaster
from app.core.transcription_service import TranscriptionService

logger = logging.getLogger(__name__)

router = APIRouter()


class ModelSelectRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_id: str


class ModelDownloadRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_id: str


def get_service(request: Request) -> TranscriptionService:
    service: TranscriptionService | None = getattr(request.app.state, "transcription_service", None)
    if service is None:
        raise HTTPException(status_code=503, detail="Transcription service not initialized")
    return service


def get_broadcaster(request: Request) -> EventBroadcaster:
    broadcaster: EventBroadcaster | None = getattr(request.app.state, "broadcaster", None)
    if broadcaster is None:
        raise HTTPException(status_code=503, detail="Event broadcaster not initialized")
    return broadcaster


@router.get("/health")
async def health(service: TranscriptionService = Depends(get_service)) -> dict:
    return {
        "status": "ok",
        "version": __version__,
        "backend": "fastapi",
        "provider": service.provider_name,
        "current_model": service.current_model,
    }


@router.get("/models")
async def list_models(service: TranscriptionService = Depends(get_service)) -> list[dict]:
    return service.list_models()


@router.get("/models/current")
async def current_model(service: TranscriptionService = Depends(get_service)) -> dict:
    return {"model_id": service.current_model}


@router.post("/models/select")
async def select_model(
    body: ModelSelectRequest,
    service: TranscriptionService = Depends(get_service),
) -> dict:
    try:
        await service.select_model(body.model_id)
        return {"model_id": body.model_id, "status": "ok"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Model selection failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/models/download")
async def download_model(
    body: ModelDownloadRequest,
    service: TranscriptionService = Depends(get_service),
) -> dict:
    try:
        await service.download_model(body.model_id)
        return {"model_id": body.model_id, "status": "downloaded"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Model download failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/recording/state")
async def recording_state(service: TranscriptionService = Depends(get_service)) -> dict:
    return {"state": service.state.value}


@router.post("/recording/toggle")
async def toggle_recording(service: TranscriptionService = Depends(get_service)) -> dict:
    result = await service.toggle_recording()
    return result.to_dict()


@router.websocket("/ws/status")
async def websocket_status(websocket: WebSocket, request: Request) -> None:
    broadcaster: EventBroadcaster = request.app.state.broadcaster
    service: TranscriptionService = request.app.state.transcription_service

    await broadcaster.connect(websocket)

    await websocket.send_json({
        "type": "status",
        "state": service.state.value,
        "model_id": service.current_model,
        "provider": service.provider_name,
    })

    try:
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
            except asyncio.TimeoutError:
                # Keepalive ping — client may ignore
                await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.debug("WebSocket disconnected")
    finally:
        await broadcaster.disconnect(websocket)