from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Contact
from app.schemas import ContactOut, AddContactRequest, UserOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/contacts", tags=["Contacts"])

@router.get("", response_model=List[ContactOut])
def list_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all saved contacts for the authenticated user."""
    contacts = db.query(Contact).filter(Contact.owner_id == current_user.id).all()
    return contacts

@router.post("", response_model=ContactOut)
def add_contact(
    payload: AddContactRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a contact by their phone number or username."""
    identifier = payload.phone_or_username.strip()
    target_user = db.query(User).filter(
        (User.phone_number == identifier) | (User.username == identifier.lower())
    ).first()

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found with provided phone number or username.")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot add yourself as a contact.")

    existing = db.query(Contact).filter(
        Contact.owner_id == current_user.id,
        Contact.contact_user_id == target_user.id
    ).first()

    if existing:
        return existing

    contact = Contact(
        owner_id=current_user.id,
        contact_user_id=target_user.id,
        custom_nickname=payload.custom_nickname
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact

@router.get("/search", response_model=List[UserOut])
def search_contacts(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for any registered users to start a chat or add as contact."""
    query = f"%{q.strip()}%"
    users = db.query(User).filter(
        (User.id != current_user.id) &
        ((User.username.ilike(query)) | 
         (User.display_name.ilike(query)) | 
         (User.phone_number.ilike(query)))
    ).limit(20).all()
    return users

@router.put("/{contact_id}/block", response_model=ContactOut)
def toggle_block_contact(
    contact_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.owner_id == current_user.id
    ).first()

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found.")

    contact.is_blocked = not contact.is_blocked
    db.commit()
    db.refresh(contact)
    return contact

@router.delete("/{contact_id}")
def delete_contact(
    contact_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.owner_id == current_user.id
    ).first()

    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found.")

    db.delete(contact)
    db.commit()
    return {"success": True, "message": "Contact removed."}

