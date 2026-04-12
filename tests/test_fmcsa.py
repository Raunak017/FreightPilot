"""Tests for FMCSA carrier verification."""
from app.services.fmcsa import normalize_mc, verify_carrier


def test_normalize_mc_strips_prefix():
    assert normalize_mc("MC-123456") == "123456"


def test_normalize_mc_strips_spaces():
    assert normalize_mc("  MC 0098765 ") == "98765"


def test_normalize_mc_plain_number():
    assert normalize_mc("543210") == "543210"


def test_normalize_mc_empty():
    assert normalize_mc("") == "0"


def test_verify_carrier_invalid_mc():
    result = verify_carrier("abc")
    assert result.eligible is False
    assert "Invalid" in result.reason or "not found" in result.reason.lower()
