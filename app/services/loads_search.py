"""Load search and matching logic."""
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Load


def search_loads(
    db: Session,
    origin: str | None = None,
    destination: str | None = None,
    equipment_type: str | None = None,
    pickup_date: str | None = None,
    limit: int = 5,
) -> list[Load]:
    """Search loads with fuzzy matching and relevance scoring.

    Scoring:
    - Equipment type match: +10 (most important — wrong truck can't haul the load)
    - Origin match: +5
    - Destination match: +5
    - Pickup date proximity: +3 (within 2 days), +1 (within 5 days)

    Returns top results sorted by score descending.
    """
    query = db.query(Load)
    loads = query.all()

    if not loads:
        return []

    scored: list[tuple[int, Load]] = []

    for load in loads:
        score = 0

        if equipment_type and _fuzzy_match(equipment_type, load.equipment_type):
            score += 10

        if origin and _fuzzy_match(origin, load.origin):
            score += 5

        if destination and _fuzzy_match(destination, load.destination):
            score += 5

        if pickup_date:
            date_score = _date_proximity_score(pickup_date, load.pickup_datetime)
            score += date_score

        # Only include loads that match at least one criterion
        if score > 0:
            scored.append((score, load))

    # If no filters provided, return all loads (limited)
    if not any([origin, destination, equipment_type, pickup_date]):
        return loads[:limit]

    scored.sort(key=lambda x: x[0], reverse=True)
    return [load for _, load in scored[:limit]]


def _fuzzy_match(query: str, value: str) -> bool:
    """Case-insensitive substring match."""
    return query.strip().lower() in value.strip().lower()


def _date_proximity_score(target_date: str, load_datetime: str) -> int:
    """Score based on how close the pickup date is to the target."""
    try:
        target = datetime.strptime(target_date.strip()[:10], "%Y-%m-%d")
        load_date = datetime.fromisoformat(load_datetime.replace("Z", "+00:00")).replace(tzinfo=None)
        diff = abs((load_date - target).days)
        if diff == 0:
            return 3
        elif diff <= 2:
            return 2
        elif diff <= 5:
            return 1
        return 0
    except (ValueError, TypeError):
        return 0
