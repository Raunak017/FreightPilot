"""FastAPI application entrypoint."""
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI

from app.auth import require_api_key
from app.db import init_db
from app.routes import calls, carriers, health, loads, negotiate


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="CarrierCallsAI",
    description="Inbound carrier sales automation backend.",
    dependencies=[Depends(require_api_key)],
    lifespan=lifespan,
)

app.include_router(health.router)
app.include_router(carriers.router)
app.include_router(loads.router)
app.include_router(negotiate.router)
app.include_router(calls.router)
