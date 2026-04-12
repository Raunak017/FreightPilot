"""Negotiation routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Load
from app.schemas import NegotiateRequest, NegotiateResponse
from app.services.negotiation import evaluate_offer

router = APIRouter(tags=["negotiate"])


@router.post("/negotiate", response_model=NegotiateResponse)
async def negotiate(req: NegotiateRequest, db: Session = Depends(get_db)) -> NegotiateResponse:
    load = db.query(Load).filter(Load.load_id == req.load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail=f"Load {req.load_id} not found")

    return evaluate_offer(
        loadboard_rate=load.loadboard_rate,
        carrier_offer=req.carrier_offer,
        round_number=req.round_number,
    )
