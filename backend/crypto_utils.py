import base64
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# 암호화 키 (실제 운영시 환경변수에서 관리)
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "your-encryption-key-32-chars-long")

def get_cipher():
    """Fernet cipher 인스턴스 생성"""
    key = ENCRYPTION_KEY.encode()
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b'salt_',  # 실제 운영시 랜덤 salt 사용
        iterations=100000,
    )
    key_base64 = base64.urlsafe_b64encode(kdf.derive(key))
    return Fernet(key_base64)

def encrypt(data: str) -> str:
    """문자열 암호화"""
    cipher = get_cipher()
    encrypted_data = cipher.encrypt(data.encode())
    return base64.urlsafe_b64encode(encrypted_data).decode()

def decrypt(encrypted_data: str) -> str:
    """문자열 복호화"""
    try:
        cipher = get_cipher()
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
        decrypted_data = cipher.decrypt(encrypted_bytes)
        return decrypted_data.decode()
    except Exception as e:
        print(f"Decryption error: {e}")
        return ""
