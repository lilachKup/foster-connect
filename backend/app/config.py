from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    """Application settings, loaded from environment / .env file."""

    model_config = SettingsConfigDict(env_file=_ENV_FILE, extra="ignore")

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/fosterconnect"

    jwt_secret: str = "change-me-to-a-long-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    admin_email: str = "admin@fosterconnect.io"
    admin_password: str = "change-me-to-a-strong-password"

    cors_origins: str = "http://localhost:5173"
    auto_create_tables: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
