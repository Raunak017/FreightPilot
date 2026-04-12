"""Stateless negotiation pricing policy.

The carrier wants to be paid MORE than the loadboard_rate.
The broker wants to pay as LITTLE as possible to protect margin.

Floor  = loadboard_rate          (won't go below what we listed)
Ceiling = loadboard_rate * 1.15  (most we'll pay — beyond this, margin is too thin)

Round 1: counter at 40% toward the carrier's ask
Round 2: counter at 70% toward the carrier's ask
Round 3: accept if within ceiling, otherwise reject
"""
from app.schemas import NegotiateResponse

MAX_ROUNDS = 3
CEILING_MULTIPLIER = 1.15


def evaluate_offer(
    loadboard_rate: float,
    carrier_offer: float,
    round_number: int,
) -> NegotiateResponse:
    ceiling = loadboard_rate * CEILING_MULTIPLIER

    # Carrier asking at or below our listed rate — instant accept
    if carrier_offer <= loadboard_rate:
        return NegotiateResponse(
            action="accept",
            counter_price=None,
            message=f"We can do ${carrier_offer:,.0f}. Let me get you connected to finalize the booking.",
            round_number=round_number,
            loadboard_rate=loadboard_rate,
        )

    # Carrier asking within our ceiling — accept
    if carrier_offer <= ceiling:
        if round_number >= MAX_ROUNDS:
            return NegotiateResponse(
                action="accept",
                counter_price=None,
                message=f"Alright, we can make ${carrier_offer:,.0f} work. Let me get you connected to finalize the booking.",
                round_number=round_number,
                loadboard_rate=loadboard_rate,
            )
        # Within ceiling but still early rounds — counter to save margin
        counter = _compute_counter(loadboard_rate, carrier_offer, round_number)
        if counter >= carrier_offer:
            return NegotiateResponse(
                action="accept",
                counter_price=None,
                message=f"We can do ${carrier_offer:,.0f}. Let me get you connected to finalize the booking.",
                round_number=round_number,
                loadboard_rate=loadboard_rate,
            )
        return NegotiateResponse(
            action="counter",
            counter_price=round(counter, 2),
            message=f"I appreciate that. The best I can do right now is ${counter:,.0f}. Can you work with that?",
            round_number=round_number,
            loadboard_rate=loadboard_rate,
        )

    # Carrier asking above ceiling
    if round_number >= MAX_ROUNDS:
        return NegotiateResponse(
            action="reject",
            counter_price=None,
            message=f"I understand, but unfortunately ${carrier_offer:,.0f} is more than we can offer on this load. "
                    f"Our maximum is ${ceiling:,.0f}. If that doesn't work for you, I completely understand. "
                    f"Thank you for your time.",
            round_number=round_number,
            loadboard_rate=loadboard_rate,
        )

    # Above ceiling, but still have rounds — counter at ceiling or below
    counter = _compute_counter(loadboard_rate, carrier_offer, round_number)
    counter = min(counter, ceiling)  # never exceed ceiling
    return NegotiateResponse(
        action="counter",
        counter_price=round(counter, 2),
        message=f"I hear you, but the best I can offer is ${counter:,.0f}. Does that work?",
        round_number=round_number,
        loadboard_rate=loadboard_rate,
    )


def _compute_counter(loadboard_rate: float, carrier_offer: float, round_number: int) -> float:
    """Move from loadboard_rate toward carrier_offer by a round-dependent fraction.

    Round 1: 40% of the way (we don't move much)
    Round 2: 70% of the way (we show flexibility)
    """
    fractions = {1: 0.40, 2: 0.70}
    frac = fractions.get(round_number, 0.70)
    return loadboard_rate + frac * (carrier_offer - loadboard_rate)
