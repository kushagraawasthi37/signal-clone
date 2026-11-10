import os
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Attachment, User
from app.schemas import AttachmentOut
from app.auth import get_current_user
from app.config import UPLOAD_DIR

router = APIRouter(prefix="/api/upload", tags=["Upload"])

@router.post("", response_model=AttachmentOut)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload image or document attachment."""
    original_name = file.filename or "attachment"
    ext = Path(original_name).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = UPLOAD_DIR / unique_name

    # Write file to disk
    with dest_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = dest_path.stat().st_size
    content_type = file.content_type or "application/octet-stream"

    # Temporary attachment record (can be linked to message when sent)
    attachment = Attachment(
        message_id="",  # Will be assigned upon message send or left as asset
        file_name=original_name,
        file_url=f"/uploads/{unique_name}",
        file_type=content_type,
        file_size=file_size
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return attachment

