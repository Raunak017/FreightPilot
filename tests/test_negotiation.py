"""Tests for negotiation pricing policy."""
from app.services.negotiation import evaluate_offer


def test_accept_at_or_below_loadboard_rate():
    """Carrier asks for loadboard rate or less — instant accept."""
    result = evaluate_offer(loadboard_rate=2400, carrier_offer=2400, round_number=1)
    assert result.action == "accept"
    assert result.counter_price is None


def test_counter_round_1_within_ceiling():
    """Round 1, carrier asks within ceiling — counter at 40%."""
    result = evaluate_offer(loadboard_rate=2400, carrier_offer=2700, round_number=1)
    assert result.action == "counter"
    # 2400 + 0.40 * (2700 - 2400) = 2400 + 120 = 2520
    assert result.counter_price == 2520.0


def test_counter_round_2_within_ceiling():
    """Round 2, carrier asks within ceiling — counter at 70%."""
    result = evaluate_offer(loadboard_rate=2400, carrier_offer=2700, round_number=2)
    assert result.action == "counter"
    # 2400 + 0.70 * (2700 - 2400) = 2400 + 210 = 2610
    assert result.counter_price == 2610.0


def test_accept_round_3_within_ceiling():
    """Round 3, carrier asks within ceiling — accept."""
    result = evaluate_offer(loadboard_rate=2400, carrier_offer=2700, round_number=3)
    assert result.action == "accept"


def test_counter_round_1_above_ceiling():
    """Round 1, carrier asks above ceiling — counter capped at ceiling."""
    # ceiling = 2400 * 1.15 = 2760
    result = evaluate_offer(loadboard_rate=2400, carrier_offer=3000, round_number=1)
    assert result.action == "counter"
    # 2400 + 0.40 * (3000 - 2400) = 2640, which is under ceiling, so 2640
    assert result.counter_price == 2640.0


def test_counter_round_2_above_ceiling_capped():
    """Round 2, carrier asks way above ceiling — counter capped at ceiling."""
    # ceiling = 2400 * 1.15 = 2760
    result = evaluate_offer(loadboard_rate=2400, carrier_offer=4000, round_number=2)
    assert result.action == "counter"
    # 2400 + 0.70 * (4000 - 2400) = 2400 + 1120 = 3520 → capped at 2760
    assert result.counter_price == 2760.0


def test_reject_round_3_above_ceiling():
    """Round 3, carrier still above ceiling — reject."""
    result = evaluate_offer(loadboard_rate=2400, carrier_offer=3000, round_number=3)
    assert result.action == "reject"
    assert result.counter_price is None


def test_loadboard_rate_always_returned():
    """Response always includes the loadboard_rate for reference."""
    result = evaluate_offer(loadboard_rate=1800, carrier_offer=2000, round_number=1)
    assert result.loadboard_rate == 1800
