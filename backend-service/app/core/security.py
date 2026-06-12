from datetime import datetime, timedelta
from typing import Optional
import hashlib

from jose import JWTError, jwt

# Настройки безопасности
SECRET_KEY = "your-secret-key-change-in-production-use-openssl-rand-hex-32"  # TODO: Переместить в .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверить пароль."""
    # Используем SHA256 для простоты (для production лучше использовать argon2)
    password_hash = hashlib.sha256(plain_password.encode()).hexdigest()
    return password_hash == hashed_password


def get_password_hash(password: str) -> str:
    """Хешировать пароль."""
    # Используем SHA256 для простоты (для production лучше использовать argon2)
    return hashlib.sha256(password.encode()).hexdigest()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Создать JWT токен.

    Args:
        data: Данные для включения в токен (обычно {"sub": user_id})
        expires_delta: Время жизни токена

    Returns:
        JWT токен строкой
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Декодировать JWT токен.

    Args:
        token: JWT токен

    Returns:
        Payload токена или None если токен невалидный
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
