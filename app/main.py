"""FastAPI application entrypoint."""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

from app.auth import require_api_key
from app.db import init_db
from app.routes import calls, carriers, health, loads, metrics, negotiate

API_DEPS = [Depends(require_api_key)]


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Friegh Pilot",
    description="Inbound carrier sales automation backend.",
    lifespan=lifespan,
)

# All API routes require API key
app.include_router(health.router, dependencies=API_DEPS)
app.include_router(carriers.router, dependencies=API_DEPS)
app.include_router(loads.router, dependencies=API_DEPS)
app.include_router(negotiate.router, dependencies=API_DEPS)
app.include_router(calls.router, dependencies=API_DEPS)
app.include_router(metrics.router, dependencies=API_DEPS)

# Serve frontend static files (built by Vite) — no API key needed
FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"
if FRONTEND_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="static")

    @app.get("/dashboard", include_in_schema=False)
    async def dashboard():
        return FileResponse(FRONTEND_DIR / "index.html")
