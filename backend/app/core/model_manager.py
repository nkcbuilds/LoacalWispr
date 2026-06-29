import logging
import threading
from dataclasses import dataclass
from pathlib import Path

from huggingface_hub import snapshot_download

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ModelDefinition:
    id: str
    name: str
    size_mb: int
    speed: str
    quality: str
    vram_gb: float
    hf_repo: str
    recommended: bool = False


MODEL_CATALOG: list[ModelDefinition] = [
    ModelDefinition(
        "tiny.en", "Tiny (EN)", 75, "very_fast", "basic", 1.0,
        "Systran/faster-whisper-tiny.en",
    ),
    ModelDefinition(
        "base.en", "Base (EN)", 145, "fast", "good", 1.5,
        "Systran/faster-whisper-base.en",
    ),
    ModelDefinition(
        "small.en", "Small (EN)", 466, "fast", "better", 2.0,
        "Systran/faster-whisper-small.en", recommended=True,
    ),
    ModelDefinition(
        "medium.en", "Medium (EN)", 1500, "good", "better", 4.5,
        "Systran/faster-whisper-medium.en",
    ),
    ModelDefinition(
        "large-v3", "Large v3", 3100, "acceptable", "best", 6.5,
        "Systran/faster-whisper-large-v3",
    ),
]


class ModelManager:
    def __init__(self, models_dir: Path | None = None) -> None:
        self.models_dir = models_dir or settings.models_dir
        self._download_lock = threading.Lock()

    def get_definition(self, model_id: str) -> ModelDefinition | None:
        for model in MODEL_CATALOG:
            if model.id == model_id:
                return model
        return None

    def get_local_dir(self, model_id: str) -> Path:
        return self.models_dir / model_id

    def is_downloaded(self, model_id: str) -> bool:
        local_dir = self.get_local_dir(model_id)
        if not local_dir.exists():
            return False
        # faster-whisper needs model.bin or similar weight file
        weight_files = list(local_dir.rglob("model.bin")) + list(local_dir.rglob("*.bin"))
        return len(weight_files) > 0

    def list_models(self) -> list[dict]:
        result = []
        for model in MODEL_CATALOG:
            result.append({
                "id": model.id,
                "name": model.name,
                "size_mb": model.size_mb,
                "speed": model.speed,
                "quality": model.quality,
                "vram_gb": model.vram_gb,
                "downloaded": self.is_downloaded(model.id),
                "recommended": model.recommended,
            })
        return result

    def get_model_path(self, model_id: str) -> Path | None:
        if self.is_downloaded(model_id):
            return self.get_local_dir(model_id)
        return None

    def download_model(self, model_id: str) -> Path:
        definition = self.get_definition(model_id)
        if definition is None:
            raise ValueError(f"Unknown model: {model_id}")

        local_dir = self.get_local_dir(model_id)
        with self._download_lock:
            if self.is_downloaded(model_id):
                return local_dir

            logger.info("Downloading model %s from %s", model_id, definition.hf_repo)
            snapshot_download(
                repo_id=definition.hf_repo,
                local_dir=str(local_dir),
            )
            logger.info("Model %s downloaded to %s", model_id, local_dir)
            return local_dir