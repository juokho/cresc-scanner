import os
import base64
import hashlib
from cryptography.fernet import Fernet
from config import ENCRYPTION_KEY


def _get_fernet() -> Fernet:
    hashed = hashlib.sha256(ENCRYPTION_KEY.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(hashed))


def encrypt(text: str) -> str:
    return _get_fernet().encrypt(text.encode()).decode() if text else ""


def decrypt(text: str) -> str:
    try:
        return _get_fernet().decrypt(text.encode()).decode() if text else ""
    except Exception:
        return ""
