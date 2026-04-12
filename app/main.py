"""FastAPI application entrypoint."""
from fastapi import Depends, FastAPI

from app.auth import require_api_key
from app.routes import health

app = FastAPI(
    title="CarrierCallsAI",
    description="Inbound carrier sales automation backend.",
    dependencies=[Depends(require_api_key)],
)

app.include_router(health.router)
