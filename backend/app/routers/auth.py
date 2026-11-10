from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Conversation, ConversationMember
from app.schemas import (
    UserRegister, UserLogin, UserOut, TokenResponse, UserUpdate,
    RequestOTPRequest, VerifyOTPRequest, SwitchAccountRequest
)
from app.auth import (
    create_access_token, get_current_user, generate_safety_number,
    verify_mock_otp
)
from app.config import MOCK_OTP

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/request-otp")
def request_otp(payload: RequestOTPRequest, db: Session = Depends(get_db)):
    """Mock OTP request. The fixed OTP '123456' is accepted for fast, frictionless onboarding."""
    identifier = payload.identifier.strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Phone number or username is required.")
    
    # Check if user already exists
    existing = db.query(User).filter(
        (User.phone_number == identifier) | (User.username == identifier)
    ).first()

    return {
        "success": True,
        "message": f"Verification code sent to {identifier}. Use mock code {MOCK_OTP}.",
        "mock_otp": MOCK_OTP,
        "is_existing_user": existing is not None
    }

@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new user with phone number or username and display name."""
    if not verify_mock_otp(payload.otp or MOCK_OTP):
        raise HTTPException(status_code=400, detail="Invalid verification code. Use 123456.")

    # Check uniqueness
    existing_phone = db.query(User).filter(User.phone_number == payload.phone_number.strip()).first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone number already registered. Please log in.")

    existing_username = db.query(User).filter(User.username == payload.username.strip().lower()).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken.")

    user = User(
        phone_number=payload.phone_number.strip(),
        username=payload.username.strip().lower(),
        display_name=payload.display_name.strip(),
        about=payload.about or "Hey there! I am using Signal.",
        avatar_url=payload.avatar_url,
        avatar_color=payload.avatar_color or "#2090ea",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate Signal 60-digit safety number
    user.safety_number = generate_safety_number(user.id, user.phone_number)

    # Automatically create a "Note to Self" conversation for the new user (Signal signature feature!)
    note_to_self_conv = Conversation(
        is_group=False,
        name="Note to Self",
        avatar_url=None,
        description="Encrypted personal scratchpad and notes."
    )
    db.add(note_to_self_conv)
    db.commit()
    db.refresh(note_to_self_conv)

    member = ConversationMember(
        conversation_id=note_to_self_conv.id,
        user_id=user.id,
        role="admin",
        is_pinned=True
    )
    db.add(member)
    db.commit()

    token = create_access_token({"sub": user.id, "username": user.username})
    return TokenResponse(access_token=token, token_type="bearer", user=user)

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Login with phone number or username and verification code."""
    if not verify_mock_otp(payload.otp):
        raise HTTPException(status_code=400, detail="Invalid verification code. Use 123456.")

    identifier = payload.identifier.strip()
    user = db.query(User).filter(
        (User.phone_number == identifier) | (User.username == identifier.lower())
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Account not found. Please register first with your phone number."
        )

    token = create_access_token({"sub": user.id, "username": user.username})
    return TokenResponse(access_token=token, token_type="bearer", user=user)

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Get profile of current logged-in user."""
    return current_user

@router.put("/profile", response_model=UserOut)
def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update display name, avatar, bio, or color."""
    if payload.display_name is not None:
        current_user.display_name = payload.display_name.strip()
    if payload.about is not None:
        current_user.about = payload.about.strip()
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    if payload.avatar_color is not None:
        current_user.avatar_color = payload.avatar_color

    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/demo-users", response_model=List[UserOut])
def get_demo_users(db: Session = Depends(get_db)):
    """Return all seed users for rapid demo switching and evaluation."""
    users = db.query(User).order_by(User.created_at.asc()).all()
    return users

@router.post("/switch-account", response_model=TokenResponse)
def switch_account(payload: SwitchAccountRequest, db: Session = Depends(get_db)):
    """Instantly switch to any demo user for multi-tab evaluation."""
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    token = create_access_token({"sub": user.id, "username": user.username})
    return TokenResponse(access_token=token, token_type="bearer", user=user)
