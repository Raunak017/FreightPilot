"""Application configuration loaded from environment variables."""
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    api_key: str
    fmcsa_webkey: str


def load_settings() -> Settings:
    return Settings(
        api_key=os.environ.get("API_KEY", "dev-change-me"),
        fmcsa_webkey=os.environ.get("FMCSA_WEBKEY", ""),
    )


settings = load_settings()
