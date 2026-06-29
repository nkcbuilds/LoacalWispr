from dataclasses import dataclass
from pathlib import Path

from app.config import settings


@dataclass
class ModelDefinition:
    id: str
    name: str
    size_mb: int
    speed: str
    quality: str
    vram_gb: float
    hf_repo: str
    filename: str


MODEL_CATALOG: list[ModelDefinition] = [
    ModelDefinition("tiny", "Tiny", 75, "very_fast", "basic", 1.0,
                    "ggerganov/whisper.cpp", "ggml-tiny.bin"),
    ModelDefinition("base", "Base", 142, "fast", "good", 1.5,
                    "ggerganov/whisper.cpp", "ggml-base.bin"),
    ModelDefinition("small", "Small", 466, "fast", "better", 2.0,
                    "ggerganov/whisper.cpp", "ggml-small.bin"),
    ModelDefinition("medium", "Medium", 1500, "good", "better", 4.5,
                    "ggerganov/whisper.cpp", "ggml-medium.bin"),
    ModelDefinition("large-v3", "Large v3", 3100, "acceptable", "best", 6.5,
                    "ggerganov/whisper.cpp", "ggml-large-v3.bin"),
]


class ModelManager:
    def __init__(self, models_dir: Path | None = None) -> None:
        self.models_dir = models_dir or settings.models_dir

    def list_models(self) -> list[dict]:
        result = []
        for model in MODEL_CATALOG:
            path = self.models_dir / model.filename
            result.append({
                "id": model.id,
                "name": model.name,
                "size_mb": model.size_mb,
                "speed": model.speed,
                "quality": model.quality,
                "vram_gb": model.vram_gb,
                "downloaded": path.exists(),
            })
        return result

    def get_model_path(self, model_id: str) -> Path | None:
        for model in MODEL_CATALOG:
            if model.id == model_id:
                path = self.models_dir / model.filename
                return path if path.exists() else None
        return None