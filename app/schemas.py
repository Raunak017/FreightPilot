"""Request and response schemas."""
from pydantic import BaseModel, Field


class VerifyCarrierRequest(BaseModel):
    mc_number: str = Field(..., description="Motor Carrier number, e.g. '123456' or 'MC-123456'")


class VerifyCarrierResponse(BaseModel):
    eligible: bool
    carrier_name: str | None = None
    dot_number: int | None = None
    mc_number: str | None = None
    reason: str


# --- Loads ---

class SearchLoadsRequest(BaseModel):
    origin: str | None = Field(None, description="Origin city/state, e.g. 'Dallas, TX'")
    destination: str | None = Field(None, description="Destination city/state")
    equipment_type: str | None = Field(None, description="e.g. 'Dry Van', 'Reefer', 'Flatbed'")
    pickup_date: str | None = Field(None, description="Desired pickup date, YYYY-MM-DD")


class LoadResponse(BaseModel):
    load_id: str
    origin: str
    destination: str
    pickup_datetime: str
    delivery_datetime: str
    equipment_type: str
    loadboard_rate: float
    notes: str
    weight: int
    commodity_type: str
    num_of_pieces: int
    miles: int
    dimensions: str


class SearchLoadsResponse(BaseModel):
    results: list[LoadResponse]
    count: int


# --- Negotiation ---

class NegotiateRequest(BaseModel):
    load_id: str = Field(..., description="The load being negotiated")
    carrier_offer: float = Field(..., description="The carrier's asking price in USD")
    round_number: int = Field(..., ge=1, le=3, description="Current negotiation round (1-3)")


class NegotiateResponse(BaseModel):
    action: str = Field(..., description="'accept', 'counter', or 'reject'")
    counter_price: float | None = Field(None, description="Our counter offer (only when action='counter')")
    message: str = Field(..., description="Human-readable message for the agent to relay")
    round_number: int = Field(..., description="The round this response is for")
    loadboard_rate: float = Field(..., description="The original listed rate for reference")


# --- Call logging ---

class LogCallRequest(BaseModel):
    mc_number: str | None = None
    carrier_name: str | None = None
    dot_number: int | None = None
    matched_load_id: str | None = None
    final_price: float | None = None
    rounds_used: int | None = None
    outcome: str = Field(..., description="booked, declined_by_carrier, no_eligible_mc, no_matching_load, negotiation_failed, abandoned")
    sentiment: str | None = Field(None, description="positive, neutral, or negative")
    transcript_summary: str | None = None


class CallResponse(BaseModel):
    id: int
    mc_number: str | None = None
    carrier_name: str | None = None
    dot_number: int | None = None
    matched_load_id: str | None = None
    final_price: float | None = None
    rounds_used: int | None = None
    outcome: str
    sentiment: str | None = None
    transcript_summary: str | None = None
    created_at: str


class CallListResponse(BaseModel):
    results: list[CallResponse]
    count: int
