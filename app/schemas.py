"""Request and response schemas."""
from pydantic import BaseModel, Field, field_validator


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
    outcome: str = Field(..., description="booked, declined_by_carrier, no_eligible_mc, no_matching_load, abandoned")
    sentiment: str | None = Field(None, description="positive, neutral, or negative")
    transcript_summary: str | None = None
    duration: int | None = Field(None, description="Call duration in seconds")
    created_at: str | None = Field(None, description="Override timestamp (ISO format), defaults to now")

    @field_validator("mc_number", "carrier_name", "matched_load_id", "transcript_summary", "sentiment", mode="before")
    @classmethod
    def coerce_str_fields(cls, v: object) -> str | None:
        if v is None or v == "" or v == "null":
            return None
        return str(v)

    @field_validator("final_price", mode="before")
    @classmethod
    def coerce_final_price(cls, v: object) -> float | None:
        if v is None or v == "" or v == "null":
            return None
        return float(v)

    @field_validator("rounds_used", "dot_number", "duration", mode="before")
    @classmethod
    def coerce_int_fields(cls, v: object) -> int | None:
        if v is None or v == "" or v == "null":
            return None
        return int(v)


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
    duration: int | None = None
    created_at: str


class CallListResponse(BaseModel):
    results: list[CallResponse]
    count: int


# --- Carrier History ---

class CarrierHistoryResponse(BaseModel):
    mc_number: str
    carrier_name: str | None = None
    total_calls: int
    total_bookings: int
    avg_agreed_rate: float | None = None
    last_call_date: str | None = None
    lanes_hauled: list[str] = []
    equipment_types: list[str] = []
    avg_rounds_to_close: float | None = None
    is_repeat_carrier: bool = False
