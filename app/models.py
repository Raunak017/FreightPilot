"""ORM models."""
from sqlalchemy import Column, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class Load(Base):
    __tablename__ = "loads"

    load_id = Column(String, primary_key=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    pickup_datetime = Column(String, nullable=False)
    delivery_datetime = Column(String, nullable=False)
    equipment_type = Column(String, nullable=False)
    loadboard_rate = Column(Float, nullable=False)
    notes = Column(String, default="")
    weight = Column(Integer, default=0)
    commodity_type = Column(String, default="")
    num_of_pieces = Column(Integer, default=0)
    miles = Column(Integer, default=0)
    dimensions = Column(String, default="N/A")


class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, autoincrement=True)
    mc_number = Column(String, nullable=True)
    carrier_name = Column(String, nullable=True)
    dot_number = Column(Integer, nullable=True)
    matched_load_id = Column(String, nullable=True)
    final_price = Column(Float, nullable=True)
    rounds_used = Column(Integer, nullable=True)
    outcome = Column(String, nullable=False)
    sentiment = Column(String, nullable=True)
    transcript_summary = Column(Text, nullable=True)
    duration = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
