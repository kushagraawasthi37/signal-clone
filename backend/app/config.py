import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY", "signal-clone-super-secure-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30  # 30 days session persistence

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'signal.db'}")
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Fixed mocked OTP for authentication
MOCK_OTP = "123456"
