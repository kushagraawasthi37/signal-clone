from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import Conversation, ConversationMember, Message, User
from app.schemas import (
    ConversationOut, CreateDirectChatRequest, CreateGroupRequest,
    UpdateGroupRequest, AddGroupMembersRequest, UpdateDisappearingTimerRequest,
    MessageOut, UserOut
)
from app.auth import get_current_user
from app.websocket_manager import manager
from app.routers.messages import format_message_out

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])

def format_conversation_out(conv: Conversation, current_user_id: str, db: Session) -> ConversationOut:
    # Identify other user if 1-on-1
    other_user = None
    if not conv.is_group:
        other_member = next((m for m in conv.members if m.user_id != current_user_id), None)
        if other_member:
            other_user = other_member.user
        elif len(conv.members) == 1 and conv.members[0].user_id == current_user_id:
            # Note to Self
            other_user = conv.members[0].user

    # Get last valid message
    last_msg = db.query(Message).filter(
        Message.conversation_id == conv.id,
        Message.is_deleted == False
    ).order_by(Message.created_at.desc()).first()

    # Calculate unread count
    membership = next((m for m in conv.members if m.user_id == current_user_id), None)
    unread_count = 0
    if membership:
        query = db.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user_id,
            Message.is_deleted == False
        )
        if membership.last_read_message_id:
            last_read_msg = db.query(Message).filter(Message.id == membership.last_read_message_id).first()
            if last_read_msg:
                query = query.filter(Message.created_at > last_read_msg.created_at)
        unread_count = query.count()

    return ConversationOut(
        id=conv.id,
        is_group=conv.is_group,
        name=conv.name if conv.is_group else (other_user.display_name if other_user else "Conversation"),
        avatar_url=conv.avatar_url if conv.is_group else (other_user.avatar_url if other_user else None),
        description=conv.description,
        disappearing_timer_seconds=conv.disappearing_timer_seconds,
        updated_at=conv.updated_at,
        members=conv.members,
        last_message=format_message_out(last_msg) if last_msg else None,
        unread_count=unread_count,
        other_user=other_user
    )

@router.get("", response_model=List[ConversationOut])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all conversations for current user sorted by most recent activity."""
    memberships = db.query(ConversationMember).filter(
        ConversationMember.user_id == current_user.id
    ).all()
    conv_ids = [m.conversation_id for m in memberships]

    conversations = db.query(Conversation).filter(
        Conversation.id.in_(conv_ids)
    ).order_by(desc(Conversation.updated_at)).all()

    return [format_conversation_out(c, current_user.id, db) for c in conversations]

@router.post("/direct", response_model=ConversationOut)
def create_or_get_direct_chat(
    payload: CreateDirectChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or get existing 1-on-1 direct messaging conversation."""
    target_user = db.query(User).filter(User.id == payload.target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found.")

    # Check if target is same user (Note to Self)
    if target_user.id == current_user.id:
        existing = db.query(Conversation).join(ConversationMember).filter(
            Conversation.is_group == False,
            Conversation.name == "Note to Self",
            ConversationMember.user_id == current_user.id
        ).first()
        if existing:
            return format_conversation_out(existing, current_user.id, db)

    # Check for existing 1-on-1 conversation
    user1_convs = db.query(ConversationMember.conversation_id).filter(
        ConversationMember.user_id == current_user.id
    ).subquery()

    existing_conv = db.query(Conversation).join(ConversationMember).filter(
        Conversation.is_group == False,
        Conversation.id.in_(user1_convs),
        ConversationMember.user_id == target_user.id
    ).first()

    if existing_conv:
        return format_conversation_out(existing_conv, current_user.id, db)

    # Create new 1-on-1
    new_conv = Conversation(
        is_group=False,
        name=None,
        disappearing_timer_seconds=0
    )
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)

    # Add both members
    m1 = ConversationMember(conversation_id=new_conv.id, user_id=current_user.id, role="member")
    m2 = ConversationMember(conversation_id=new_conv.id, user_id=target_user.id, role="member")
    db.add_all([m1, m2])

    # Initial safety number system message
    sys_msg = Message(
        conversation_id=new_conv.id,
        sender_id=current_user.id,
        content=f"Messages and calls are end-to-end encrypted. Tap to verify safety number.",
        message_type="system",
        status="sent"
    )
    db.add(sys_msg)
    db.commit()
    db.refresh(new_conv)

    return format_conversation_out(new_conv, current_user.id, db)

@router.post("/group", response_model=ConversationOut)
async def create_group(
    payload: CreateGroupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new group conversation with members."""
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Group name is required.")

    # Unique members including creator
    all_member_ids = list(set([current_user.id] + payload.member_ids))

    new_group = Conversation(
        is_group=True,
        name=payload.name.strip(),
        description=payload.description,
        avatar_url=payload.avatar_url,
        disappearing_timer_seconds=0
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)

    for uid in all_member_ids:
        role = "admin" if uid == current_user.id else "member"
        m = ConversationMember(conversation_id=new_group.id, user_id=uid, role=role)
        db.add(m)

    # System announcement
    sys_msg = Message(
        conversation_id=new_group.id,
        sender_id=current_user.id,
        content=f"{current_user.display_name} created the group \"{new_group.name}\".",
        message_type="system",
        status="sent"
    )
    db.add(sys_msg)
    db.commit()
    db.refresh(new_group)

    conv_out = format_conversation_out(new_group, current_user.id, db)

    # Notify members via WS
    for uid in all_member_ids:
        if uid != current_user.id:
            await manager.send_to_user(uid, {
                "type": "new_conversation",
                "conversation": conv_out.dict()
            })

    return conv_out

@router.get("/{conversation_id}", response_model=ConversationOut)
def get_conversation_details(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    is_member = any(m.user_id == current_user.id for m in conv.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to access this conversation.")

    return format_conversation_out(conv, current_user.id, db)

@router.put("/{conversation_id}/group", response_model=ConversationOut)
async def update_group(
    conversation_id: str,
    payload: UpdateGroupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.is_group == True).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Group not found.")

    if payload.name:
        conv.name = payload.name.strip()
    if payload.description is not None:
        conv.description = payload.description.strip()
    if payload.avatar_url is not None:
        conv.avatar_url = payload.avatar_url

    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conv)

    await manager.broadcast_to_conversation(db, conv.id, {
        "type": "group_updated",
        "conversation_id": conv.id,
        "name": conv.name,
        "description": conv.description,
        "avatar_url": conv.avatar_url
    })

    return format_conversation_out(conv, current_user.id, db)

@router.post("/{conversation_id}/members", response_model=ConversationOut)
async def add_group_members(
    conversation_id: str,
    payload: AddGroupMembersRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.is_group == True).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Group not found.")

    added_names = []
    for uid in payload.user_ids:
        existing = db.query(ConversationMember).filter(
            ConversationMember.conversation_id == conv.id,
            ConversationMember.user_id == uid
        ).first()
        if not existing:
            u = db.query(User).filter(User.id == uid).first()
            if u:
                m = ConversationMember(conversation_id=conv.id, user_id=uid, role="member")
                db.add(m)
                added_names.append(u.display_name)

    if added_names:
        sys_msg = Message(
            conversation_id=conv.id,
            sender_id=current_user.id,
            content=f"{current_user.display_name} added {', '.join(added_names)} to the group.",
            message_type="system",
            status="sent"
        )
        db.add(sys_msg)
        conv.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(conv)

        await manager.broadcast_to_conversation(db, conv.id, {
            "type": "members_added",
            "conversation_id": conv.id,
            "added_names": added_names
        })

    return format_conversation_out(conv, current_user.id, db)

@router.delete("/{conversation_id}/members/{user_id}", response_model=ConversationOut)
async def remove_group_member(
    conversation_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.is_group == True).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Group not found.")

    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv.id,
        ConversationMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not in group.")

    target_user = member.user
    db.delete(member)

    leaving_or_removed = "left" if user_id == current_user.id else f"was removed by {current_user.display_name}"
    sys_msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=f"{target_user.display_name} {leaving_or_removed}.",
        message_type="system",
        status="sent"
    )
    db.add(sys_msg)
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conv)

    await manager.broadcast_to_conversation(db, conv.id, {
        "type": "member_removed",
        "conversation_id": conv.id,
        "user_id": user_id,
        "user_name": target_user.display_name
    })

    return format_conversation_out(conv, current_user.id, db)

@router.put("/{conversation_id}/disappearing", response_model=ConversationOut)
async def set_disappearing_timer(
    conversation_id: str,
    payload: UpdateDisappearingTimerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Configure functional disappearing messages timer (e.g., 30s, 5m, 1h, 1d, 1w, or 0 to turn off)."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    conv.disappearing_timer_seconds = payload.timer_seconds
    conv.updated_at = datetime.now(timezone.utc)

    # Format human-readable string
    if payload.timer_seconds == 0:
        timer_text = "off"
    elif payload.timer_seconds < 60:
        timer_text = f"{payload.timer_seconds} seconds"
    elif payload.timer_seconds < 3600:
        timer_text = f"{payload.timer_seconds // 60} minutes"
    elif payload.timer_seconds < 86400:
        timer_text = f"{payload.timer_seconds // 3600} hours"
    else:
        timer_text = f"{payload.timer_seconds // 86400} days"

    sys_msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=f"{current_user.display_name} set the disappearing message timer to {timer_text}.",
        message_type="system",
        status="sent"
    )
    db.add(sys_msg)
    db.commit()
    db.refresh(conv)

    await manager.broadcast_to_conversation(db, conv.id, {
        "type": "disappearing_timer_updated",
        "conversation_id": conv.id,
        "timer_seconds": conv.disappearing_timer_seconds,
        "timer_text": timer_text
    })

    return format_conversation_out(conv, current_user.id, db)

