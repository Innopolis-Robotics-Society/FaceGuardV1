from datetime import timedelta
import hashlib

from app.core.security import create_access_token, decode_access_token, get_password_hash, verify_password


def test_password_hash_is_not_plain_text_password():
    password = "correct-horse-battery-staple"

    hashed_password = get_password_hash(password)

    assert hashed_password != password


def test_same_password_produces_expected_verifiable_hash():
    password = "correct-horse-battery-staple"
    expected_hash = hashlib.sha256(password.encode()).hexdigest()

    hashed_password = get_password_hash(password)

    assert hashed_password == expected_hash
    assert verify_password(password, hashed_password)


def test_correct_password_is_accepted():
    password = "correct-horse-battery-staple"
    hashed_password = get_password_hash(password)

    assert verify_password(password, hashed_password)


def test_incorrect_password_is_rejected():
    hashed_password = get_password_hash("correct-horse-battery-staple")

    assert not verify_password("incorrect-password", hashed_password)


def test_jwt_is_created_and_decoded():
    token = create_access_token({"sub": "user-123"}, expires_delta=timedelta(minutes=5))

    payload = decode_access_token(token)

    assert payload is not None
    assert payload["sub"] == "user-123"


def test_decoded_jwt_contains_sub():
    token = create_access_token({"sub": "user-123"}, expires_delta=timedelta(minutes=5))

    payload = decode_access_token(token)

    assert payload is not None
    assert "sub" in payload


def test_decoded_jwt_contains_expiration():
    token = create_access_token({"sub": "user-123"}, expires_delta=timedelta(minutes=5))

    payload = decode_access_token(token)

    assert payload is not None
    assert "exp" in payload


def test_malformed_jwt_returns_none():
    assert decode_access_token("definitely-not-a-valid-token") is None
