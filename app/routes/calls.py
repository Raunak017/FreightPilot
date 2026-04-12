"""Call logging routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Call
from app.schemas import CallListResponse, CallResponse, LogCallRequest

router = APIRouter(prefix="/calls", tags=["calls"])


@router.post("/", response_model=CallResponse, status_code=201)
async def log_call(req: LogCallRequest, db: Session = Depends(get_db)) -> CallResponse:
    call = Call(
        mc_number=req.mc_number,
        carrier_name=req.carrier_name,
        dot_number=req.dot_number,
        matched_load_id=req.matched_load_id,
        final_price=req.final_price,
        rounds_used=req.rounds_used,
        outcome=req.outcome,
        sentiment=req.sentiment,
        transcript_summary=req.transcript_summary,
    )
    db.add(call)
    db.commit()
    db.refresh(call)
    return _call_to_response(call)


@router.get("/", response_model=CallListResponse)
async def list_calls(
    limit: int = 50,
    outcome: str | None = None,
    sentiment: str | None = None,
    db: Session = Depends(get_db),
) -> CallListResponse:
    query = db.query(Call).order_by(Call.created_at.desc())
    if outcome:
        query = query.filter(Call.outcome == outcome)
    if sentiment:
        query = query.filter(Call.sentiment == sentiment)
    calls = query.limit(limit).all()
    return CallListResponse(
        results=[_call_to_response(c) for c in calls],
        count=len(calls),
    )


def _call_to_response(call: Call) -> CallResponse:
    return CallResponse(
        id=call.id,
        mc_number=call.mc_number,
        carrier_name=call.carrier_name,
        dot_number=call.dot_number,
        matched_load_id=call.matched_load_id,
        final_price=call.final_price,
        rounds_used=call.rounds_used,
        outcome=call.outcome,
        sentiment=call.sentiment,
        transcript_summary=call.transcript_summary,
        created_at=str(call.created_at),
    )
