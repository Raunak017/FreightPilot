"""Database engine and session setup (SQLite)."""
import json
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(bind=engine)


def get_db():
    """FastAPI dependency that yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables and seed loads if the DB is empty."""
    from app.models import Base, Load

    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        if db.query(Load).count() > 0:
            return

        seed_path = Path(__file__).parent / "data" / "loads.seed.json"
        if not seed_path.exists():
            return

        with open(seed_path) as f:
            loads = json.load(f)

        for row in loads:
            db.add(Load(**row))
        db.commit()
