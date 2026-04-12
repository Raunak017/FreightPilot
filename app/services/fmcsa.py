"""FMCSA QCMobile API client and eligibility logic."""
import re
from functools import lru_cache

import httpx

from app.config import settings
from app.schemas import VerifyCarrierResponse

FMCSA_BASE = "https://mobile.fmcsa.dot.gov/qc/services"
TIMEOUT = 15.0


def normalize_mc(raw: str) -> str:
    """Strip 'MC', dashes, spaces, and leading zeros from an MC number."""
    cleaned = re.sub(r"[^0-9]", "", raw)
    return cleaned.lstrip("0") or "0"


@lru_cache(maxsize=256)
def _fetch_carrier(mc: str) -> dict | None:
    """Hit FMCSA docket-number endpoint. Returns first carrier record or None."""
    url = f"{FMCSA_BASE}/carriers/docket-number/{mc}"
    try:
        resp = httpx.get(url, params={"webKey": settings.fmcsa_webkey}, timeout=TIMEOUT)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        data = resp.json()
    except (httpx.HTTPError, ValueError):
        return None

    # Response wraps results in a 'content' list
    content = data.get("content")
    if isinstance(content, list) and content:
        carrier = content[0].get("carrier", content[0])
        return carrier
    return None


def verify_carrier(mc_number: str) -> VerifyCarrierResponse:
    mc = normalize_mc(mc_number)

    if not mc or mc == "0":
        return VerifyCarrierResponse(eligible=False, reason="Invalid MC number format.")

    carrier = _fetch_carrier(mc)

    if carrier is None:
        return VerifyCarrierResponse(
            eligible=False,
            mc_number=mc,
            reason="Carrier not found in FMCSA database.",
        )

    allowed = carrier.get("allowedToOperate", "").upper()
    out_of_service = carrier.get("outOfService", "").upper()
    legal_name = carrier.get("legalName")
    dot_number = carrier.get("dotNumber")
    carrier_mc = carrier.get("mcNumber")

    if allowed != "Y":
        return VerifyCarrierResponse(
            eligible=False,
            carrier_name=legal_name,
            dot_number=dot_number,
            mc_number=str(carrier_mc) if carrier_mc else mc,
            reason="Carrier is not authorized to operate.",
        )

    if out_of_service == "Y":
        return VerifyCarrierResponse(
            eligible=False,
            carrier_name=legal_name,
            dot_number=dot_number,
            mc_number=str(carrier_mc) if carrier_mc else mc,
            reason="Carrier has an active out-of-service order.",
        )

    return VerifyCarrierResponse(
        eligible=True,
        carrier_name=legal_name,
        dot_number=dot_number,
        mc_number=str(carrier_mc) if carrier_mc else mc,
        reason="Carrier is eligible and authorized to operate.",
    )
