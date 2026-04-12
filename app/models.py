"""ORM models."""
from sqlalchemy import Column, Float, Integer, String
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
