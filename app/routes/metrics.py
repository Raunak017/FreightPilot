"""Aggregated metrics for the dashboard."""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Call, Load

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/")
async def get_metrics(
    days: int | None = Query(None, description="Filter to last N days"),
    db: Session = Depends(get_db),
) -> dict:
    # Base query with optional date filter
    base_query = db.query(Call)
    if days:
        cutoff = datetime.utcnow() - timedelta(days=days)
        base_query = base_query.filter(Call.created_at >= cutoff)

    total_calls = base_query.count()

    booked_count = base_query.filter(Call.outcome == "booked").count()
    booking_rate = round(booked_count / total_calls * 100, 1) if total_calls > 0 else 0

    avg_price = (
        base_query.filter(Call.outcome == "booked", Call.final_price.isnot(None))
        .with_entities(func.avg(Call.final_price))
        .scalar()
    )
    avg_price = round(avg_price, 2) if avg_price else 0

    avg_rounds = (
        base_query.filter(Call.outcome == "booked", Call.rounds_used.isnot(None))
        .with_entities(func.avg(Call.rounds_used))
        .scalar()
    )
    avg_rounds = round(avg_rounds, 1) if avg_rounds else 0

    # Outcome breakdown
    outcome_rows = (
        base_query.with_entities(Call.outcome, func.count(Call.id))
        .group_by(Call.outcome)
        .all()
    )
    outcomes = {row[0]: row[1] for row in outcome_rows}

    # Sentiment breakdown
    sentiment_rows = (
        base_query.filter(Call.sentiment.isnot(None))
        .with_entities(Call.sentiment, func.count(Call.id))
        .group_by(Call.sentiment)
        .all()
    )
    sentiments = {row[0]: row[1] for row in sentiment_rows}

    # Rounds distribution (for booked calls)
    rounds_rows = (
        base_query.filter(Call.outcome == "booked", Call.rounds_used.isnot(None))
        .with_entities(Call.rounds_used, func.count(Call.id))
        .group_by(Call.rounds_used)
        .all()
    )
    rounds_distribution = {str(row[0]): row[1] for row in rounds_rows}

    # --- New metrics ---

    # Conversion funnel
    verified_count = base_query.filter(Call.mc_number.isnot(None)).count()
    matched_count = base_query.filter(Call.matched_load_id.isnot(None)).count()
    funnel = {
        "total_calls": total_calls,
        "verified_mc": verified_count,
        "load_matched": matched_count,
        "booked": booked_count,
    }

    # Margin protection: how much above loadboard_rate we're paying
    # (final_price - loadboard_rate) for booked calls
    booked_calls_with_loads = (
        db.query(Call, Load)
        .join(Load, Call.matched_load_id == Load.load_id)
        .filter(Call.outcome == "booked", Call.final_price.isnot(None))
    )
    if days:
        booked_calls_with_loads = booked_calls_with_loads.filter(Call.created_at >= cutoff)

    margin_rows = booked_calls_with_loads.all()
    total_margin_given = sum(
        (call.final_price - load.loadboard_rate) for call, load in margin_rows
    )
    avg_margin_per_deal = (
        round(total_margin_given / len(margin_rows), 2) if margin_rows else 0
    )
    margin_protection = {
        "total_margin_given": round(total_margin_given, 2),
        "avg_margin_per_deal": avg_margin_per_deal,
        "deals_count": len(margin_rows),
    }

    # Top lanes (origin → destination from matched loads)
    lane_rows = (
        db.query(Load.origin, Load.destination, func.count(Call.id))
        .join(Call, Call.matched_load_id == Load.load_id)
        .filter(Call.matched_load_id.isnot(None))
    )
    if days:
        lane_rows = lane_rows.filter(Call.created_at >= cutoff)
    lane_rows = lane_rows.group_by(Load.origin, Load.destination).order_by(func.count(Call.id).desc()).limit(10).all()
    top_lanes = [
        {"lane": f"{row[0]} → {row[1]}", "count": row[2]} for row in lane_rows
    ]

    # Equipment demand
    equip_rows = (
        db.query(Load.equipment_type, func.count(Call.id))
        .join(Call, Call.matched_load_id == Load.load_id)
        .filter(Call.matched_load_id.isnot(None))
    )
    if days:
        equip_rows = equip_rows.filter(Call.created_at >= cutoff)
    equip_rows = equip_rows.group_by(Load.equipment_type).order_by(func.count(Call.id).desc()).all()
    equipment_demand = {row[0]: row[1] for row in equip_rows}

    # Commodity breakdown
    commodity_rows = (
        db.query(Load.commodity_type, func.count(Call.id))
        .join(Call, Call.matched_load_id == Load.load_id)
        .filter(Call.matched_load_id.isnot(None))
    )
    if days:
        commodity_rows = commodity_rows.filter(Call.created_at >= cutoff)
    commodity_rows = commodity_rows.group_by(Load.commodity_type).order_by(func.count(Call.id).desc()).all()
    commodity_breakdown = {row[0]: row[1] for row in commodity_rows}

    # Rate per mile (for booked calls with matched loads)
    rpm_data = [
        call.final_price / load.miles
        for call, load in margin_rows
        if load.miles and load.miles > 0
    ]
    avg_rate_per_mile = round(sum(rpm_data) / len(rpm_data), 2) if rpm_data else 0

    # Average haul distance
    haul_distances = [load.miles for _, load in margin_rows if load.miles and load.miles > 0]
    avg_haul_distance = round(sum(haul_distances) / len(haul_distances)) if haul_distances else 0

    # Average call duration
    avg_duration = (
        base_query.filter(Call.duration.isnot(None))
        .with_entities(func.avg(Call.duration))
        .scalar()
    )
    avg_duration = round(avg_duration) if avg_duration else 0

    return {
        "total_calls": total_calls,
        "booked_count": booked_count,
        "booking_rate": booking_rate,
        "avg_agreed_price": avg_price,
        "avg_rounds_to_close": avg_rounds,
        "outcomes": outcomes,
        "sentiments": sentiments,
        "rounds_distribution": rounds_distribution,
        "funnel": funnel,
        "margin_protection": margin_protection,
        "top_lanes": top_lanes,
        "equipment_demand": equipment_demand,
        "commodity_breakdown": commodity_breakdown,
        "avg_rate_per_mile": avg_rate_per_mile,
        "avg_haul_distance": avg_haul_distance,
        "avg_duration": avg_duration,
    }
