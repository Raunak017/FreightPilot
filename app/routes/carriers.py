"""Carrier verification routes."""
from fastapi import APIRouter

from app.schemas import VerifyCarrierRequest, VerifyCarrierResponse
from app.services.fmcsa import verify_carrier

router = APIRouter(prefix="/carriers", tags=["carriers"])


@router.post("/verify", response_model=VerifyCarrierResponse)
async def verify(req: VerifyCarrierRequest) -> VerifyCarrierResponse:
    return verify_carrier(req.mc_number)
