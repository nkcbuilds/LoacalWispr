from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="WISPRLLOCAL_")

    port: int = 8741
    host: str = "127.0.0.1"
    cache_dir: Path = Path.home() / ".cache" / "wisprlocal"
    models_dir: Path | None = None
    bin_dir: Path | None = None
    default_model: str = "small"
    sample_rate: int = 16000

    def model_post_init(self, __context: object) -> None:
        if self.models_dir is None:
            self.models_dir = self.cache_dir / "models"
        if self.bin_dir is None:
            self.bin_dir = self.cache_dir / "bin"

        self.models_dir.mkdir(parents=True, exist_ok=True)
        self.bin_dir.mkdir(parents=True, exist_ok=True)


settings = Settings()