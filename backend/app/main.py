import asyncio
import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api import router
from app.config import settings
from app.core.events import EventBroadcaster
from app.core.transcription_service import TranscriptionService

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    broadcaster = EventBroadcaster()
    service = TranscriptionService(broadcaster)
    service.set_event_loop(asyncio.get_event_loop())

    app.state.broadcaster = broadcaster
    app.state.transcription_service = service

    logger.info(
        "Starting WisprLocal backend (provider=%s, model=%s)",
        service.provider_name,
        service.current_model,
    )

    try:
        await service.initialize()
        logger.info("Transcription service ready")
    except Exception:
        logger.exception("Failed to initialize transcription service — will retry on first use")

    yield

    logger.info("Shutting down transcription service")
    await service.shutdown()


app = FastAPI(
    title="WisprLocal Backend",
    version=__version__,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "file://",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
async def root() -> dict:
    return {
        "name": "WisprLocal Backend",
        "version": __version__,
        "docs": "/docs",
    }