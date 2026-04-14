"""Carrier verification and history routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Call, Load
from app.schemas import CarrierHistoryResponse, VerifyCarrierRequest, VerifyCarrierResponse
from app.services.fmcsa import verify_carrier

router = APIRouter(prefix="/carriers", tags=["carriers"])


@router.post("/verify", response_model=VerifyCarrierResponse)
async def verify(req: VerifyCarrierRequest) -> VerifyCarrierResponse:
    return verify_carrier(req.mc_number)


@router.get("/history", response_model=CarrierHistoryResponse)
async def carrier_history(mc_number: str, db: Session = Depends(get_db)) -> CarrierHistoryResponse:
    """Return a carrier's past interaction history for agent personalisation."""
    calls = (
        db.query(Call)
        .filter(Call.mc_number == mc_number)
        .order_by(Call.created_at.desc())
        .all()
    )

    if not calls:
        return CarrierHistoryResponse(mc_number=mc_number, total_calls=0, total_bookings=0)

    booked = [c for c in calls if c.outcome == "booked"]
    carrier_name = next((c.carrier_name for c in calls if c.carrier_name), None)

    # Lanes and equipment from matched loads
    load_ids = {c.matched_load_id for c in calls if c.matched_load_id}
    loads = db.query(Load).filter(Load.load_id.in_(load_ids)).all() if load_ids else []
    load_map = {l.load_id: l for l in loads}

    lanes: list[str] = []
    equip_set: set[str] = set()
    for c in booked:
        if c.matched_load_id and c.matched_load_id in load_map:
            ld = load_map[c.matched_load_id]
            lane = f"{ld.origin} → {ld.destination}"
            if lane not in lanes:
                lanes.append(lane)
            equip_set.add(ld.equipment_type)

    avg_rate = (
        round(sum(c.final_price for c in booked if c.final_price) / len(booked), 2)
        if booked
        else None
    )
    rounds_list = [c.rounds_used for c in booked if c.rounds_used is not None]
    avg_rounds = round(sum(rounds_list) / len(rounds_list), 1) if rounds_list else None

    return CarrierHistoryResponse(
        mc_number=mc_number,
        carrier_name=carrier_name,
        total_calls=len(calls),
        total_bookings=len(booked),
        avg_agreed_rate=avg_rate,
        last_call_date=str(calls[0].created_at),
        lanes_hauled=lanes[:5],
        equipment_types=sorted(equip_set),
        avg_rounds_to_close=avg_rounds,
        is_repeat_carrier=len(calls) > 1,
    )
