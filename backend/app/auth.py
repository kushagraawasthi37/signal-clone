import hashlib
import random
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, MOCK_OTP
from app.database import get_db
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def generate_safety_number(user_id: str, phone: str) -> str:
    """Generate authentic Signal 60-digit safety number string grouped into 12 blocks of 5 digits."""
    raw = f"{user_id}-{phone}-signal-salt"
    digest = hashlib.sha256(raw.encode()).hexdigest()
    # convert hex into digits
    digits = "".join(str(int(c, 16) % 10) for c in digest * 2)[:60]
    # group by 5 digits
    chunks = [digits[i:i+5] for i in range(0, 60, 5)]
    return " ".join(chunks)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user_from_token(token: str, db: Session) -> Optional[User]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return db.query(User).filter(User.id == user_id).first()
    except (jwt.PyJWTError, Exception):
        return None

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = get_current_user_from_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def verify_mock_otp(provided_otp: str) -> bool:
    """Mock verification: accepts 123456 or any 6-digit mock OTP for seamless testing."""
    if not provided_otp:
        return False
    return provided_otp.strip() == MOCK_OTP or (len(provided_otp.strip()) == 6 and provided_otp.strip().isdigit())
