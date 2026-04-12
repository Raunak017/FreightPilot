"""Aggregated metrics for the dashboard."""
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Call

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/")
async def get_metrics(db: Session = Depends(get_db)) -> dict:
    total_calls = db.query(func.count(Call.id)).scalar() or 0

    booked_count = (
        db.query(func.count(Call.id)).filter(Call.outcome == "booked").scalar() or 0
    )
    booking_rate = round(booked_count / total_calls * 100, 1) if total_calls > 0 else 0

    avg_price = (
        db.query(func.avg(Call.final_price))
        .filter(Call.outcome == "booked", Call.final_price.isnot(None))
        .scalar()
    )
    avg_price = round(avg_price, 2) if avg_price else 0

    avg_rounds = (
        db.query(func.avg(Call.rounds_used))
        .filter(Call.outcome == "booked", Call.rounds_used.isnot(None))
        .scalar()
    )
    avg_rounds = round(avg_rounds, 1) if avg_rounds else 0

    # Outcome breakdown
    outcome_rows = (
        db.query(Call.outcome, func.count(Call.id))
        .group_by(Call.outcome)
        .all()
    )
    outcomes = {row[0]: row[1] for row in outcome_rows}

    # Sentiment breakdown
    sentiment_rows = (
        db.query(Call.sentiment, func.count(Call.id))
        .filter(Call.sentiment.isnot(None))
        .group_by(Call.sentiment)
        .all()
    )
    sentiments = {row[0]: row[1] for row in sentiment_rows}

    # Rounds distribution (for booked calls)
    rounds_rows = (
        db.query(Call.rounds_used, func.count(Call.id))
        .filter(Call.outcome == "booked", Call.rounds_used.isnot(None))
        .group_by(Call.rounds_used)
        .all()
    )
    rounds_distribution = {str(row[0]): row[1] for row in rounds_rows}

    return {
        "total_calls": total_calls,
        "booked_count": booked_count,
        "booking_rate": booking_rate,
        "avg_agreed_price": avg_price,
        "avg_rounds_to_close": avg_rounds,
        "outcomes": outcomes,
        "sentiments": sentiments,
        "rounds_distribution": rounds_distribution,
    }
