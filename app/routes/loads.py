"""Load search and detail routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Load
from app.schemas import LoadResponse, SearchLoadsRequest, SearchLoadsResponse
from app.services.loads_search import search_loads

router = APIRouter(prefix="/loads", tags=["loads"])


@router.get("/all", response_model=SearchLoadsResponse)
async def get_all_loads(db: Session = Depends(get_db)) -> SearchLoadsResponse:
    """Return all loads — used by dashboard for client-side metrics."""
    loads = db.query(Load).all()
    results = [LoadResponse(**_load_to_dict(l)) for l in loads]
    return SearchLoadsResponse(results=results, count=len(results))


@router.get("/by-id", response_model=LoadResponse)
async def get_load_by_query(load_id: str, db: Session = Depends(get_db)) -> LoadResponse:
    """Get load by ID via query param — alternate to GET /loads/{load_id}."""
    load = _find_load(db, load_id)
    if not load:
        raise HTTPException(status_code=404, detail=f"Load {load_id} not found")
    return LoadResponse(**_load_to_dict(load))


@router.post("/search", response_model=SearchLoadsResponse)
async def search(req: SearchLoadsRequest, db: Session = Depends(get_db)) -> SearchLoadsResponse:
    results = search_loads(
        db,
        origin=req.origin,
        destination=req.destination,
        equipment_type=req.equipment_type,
        pickup_date=req.pickup_date,
    )
    return SearchLoadsResponse(
        results=[LoadResponse(**_load_to_dict(r)) for r in results],
        count=len(results),
    )


@router.get("/{load_id}", response_model=LoadResponse)
async def get_load(load_id: str, db: Session = Depends(get_db)) -> LoadResponse:
    load = _find_load(db, load_id)
    if not load:
        raise HTTPException(status_code=404, detail=f"Load {load_id} not found")
    return LoadResponse(**_load_to_dict(load))


def _find_load(db: Session, load_id: str) -> Load | None:
    """Look up a load by exact ID, then try LD- prefix fallback."""
    load = db.query(Load).filter(Load.load_id == load_id).first()
    if not load and not load_id.upper().startswith("LD-"):
        load = db.query(Load).filter(Load.load_id == f"LD-{load_id}").first()
    return load


def _load_to_dict(load: Load) -> dict:
    return {
        "load_id": load.load_id,
        "origin": load.origin,
        "destination": load.destination,
        "pickup_datetime": load.pickup_datetime,
        "delivery_datetime": load.delivery_datetime,
        "equipment_type": load.equipment_type,
        "loadboard_rate": load.loadboard_rate,
        "notes": load.notes,
        "weight": load.weight,
        "commodity_type": load.commodity_type,
        "num_of_pieces": load.num_of_pieces,
        "miles": load.miles,
        "dimensions": load.dimensions,
    }
