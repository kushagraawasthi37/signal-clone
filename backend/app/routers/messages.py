from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import Message, Conversation, ConversationMember, Attachment, MessageReaction, User
from app.schemas import (
    MessageOut, SendMessageRequest, ToggleReactionRequest,
    MarkReadRequest, QuotedMessageOut, AttachmentOut, ReactionOut
)
from app.auth import get_current_user
from app.websocket_manager import manager

router = APIRouter(prefix="/api/messages", tags=["Messages"])

def format_message_out(msg: Message) -> MessageOut:
    reply_to_out = None
    if msg.reply_to and not msg.reply_to.is_deleted:
        reply_to_out = QuotedMessageOut(
            id=msg.reply_to.id,
            sender_id=msg.reply_to.sender_id,
            sender_name=msg.reply_to.sender.display_name if msg.reply_to.sender else "User",
            content=msg.reply_to.content,
            message_type=msg.reply_to.message_type
        )

    reactions_out = [
        ReactionOut(
            id=r.id,
            emoji=r.emoji,
            user_id=r.user_id,
            user_name=r.user.display_name if r.user else "User"
        )
        for r in msg.reactions
    ]

    attachments_out = [
        AttachmentOut(
            id=a.id,
            file_name=a.file_name,
            file_url=a.file_url,
            file_type=a.file_type,
            file_size=a.file_size
        )
        for a in msg.attachments
    ]

    return MessageOut(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender=msg.sender,
        content=msg.content,
        message_type=msg.message_type,
        status=msg.status,
        reply_to=reply_to_out,
        attachments=attachments_out,
        reactions=reactions_out,
        expires_at=msg.expires_at,
        is_expired=msg.is_expired,
        created_at=msg.created_at
    )

@router.get("/{conversation_id}", response_model=List[MessageOut])
def get_messages(
    conversation_id: str,
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get message history for conversation, filtering out expired disappearing messages."""
    # Verify membership
    membership = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to view messages in this conversation.")

    now = datetime.now(timezone.utc)

    # Check for expired messages and update them
    expired_msgs = db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.expires_at.isnot(None),
        Message.expires_at <= now,
        Message.is_expired == False
    ).all()
    for em in expired_msgs:
        em.is_expired = True
        em.is_deleted = True
    if expired_msgs:
        db.commit()

    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.is_deleted == False
    ).order_by(Message.created_at.asc()).limit(limit).all()

    return [format_message_out(m) for m in messages]

@router.post("", response_model=MessageOut)
async def send_message(
    payload: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send text, image, or attachment message in real-time."""
    conv = db.query(Conversation).filter(Conversation.id == payload.conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    # Verify membership
    is_member = any(m.user_id == current_user.id for m in conv.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="You are not a member of this conversation.")

    # Calculate disappearing expiration if active
    expires_at = None
    if conv.disappearing_timer_seconds and conv.disappearing_timer_seconds > 0:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=conv.disappearing_timer_seconds)

    # Determine initial delivery status
    # If any other member is currently connected, mark as delivered
    other_members = [m.user_id for m in conv.members if m.user_id != current_user.id]
    any_online = any(manager.is_user_online(uid) for uid in other_members)
    initial_status = "delivered" if any_online else "sent"

    msg = Message(
        conversation_id=payload.conversation_id,
        sender_id=current_user.id,
        content=payload.content,
        message_type=payload.message_type,
        status=initial_status,
        reply_to_id=payload.reply_to_id,
        expires_at=expires_at,
        is_expired=False,
        is_deleted=False
    )
    db.add(msg)
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(msg)

    # Attach any pre-uploaded attachments
    if payload.attachment_ids:
        for att_id in payload.attachment_ids:
            att = db.query(Attachment).filter(Attachment.id == att_id).first()
            if att:
                att.message_id = msg.id
        db.commit()
        db.refresh(msg)

    formatted = format_message_out(msg)

    # Broadcast real-time message to all members in conversation
    await manager.broadcast_to_conversation(db, conv.id, {
        "type": "new_message",
        "conversation_id": conv.id,
        "message": formatted.dict()
    })

    return formatted

@router.post("/{message_id}/reactions", response_model=MessageOut)
async def toggle_reaction(
    message_id: str,
    payload: ToggleReactionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle emoji reaction on a message."""
    msg = db.query(Message).filter(Message.id == message_id, Message.is_deleted == False).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")

    emoji = payload.emoji.strip()
    existing_reaction = db.query(MessageReaction).filter(
        MessageReaction.message_id == msg.id,
        MessageReaction.user_id == current_user.id,
        MessageReaction.emoji == emoji
    ).first()

    if existing_reaction:
        db.delete(existing_reaction)
    else:
        new_reaction = MessageReaction(
            message_id=msg.id,
            user_id=current_user.id,
            emoji=emoji
        )
        db.add(new_reaction)

    db.commit()
    db.refresh(msg)

    formatted = format_message_out(msg)

    # Broadcast reaction update
    await manager.broadcast_to_conversation(db, msg.conversation_id, {
        "type": "reaction_updated",
        "conversation_id": msg.conversation_id,
        "message_id": msg.id,
        "reactions": [r.dict() for r in formatted.reactions]
    })

    return formatted

@router.post("/read")
async def mark_messages_read(
    payload: MarkReadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all unread incoming messages in a conversation as read (Signal double blue checks!)."""
    conv = db.query(Conversation).filter(Conversation.id == payload.conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    membership = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv.id,
        ConversationMember.user_id == current_user.id
    ).first()

    if not membership:
        raise HTTPException(status_code=403, detail="Not a member.")

    # Update status of all messages sent by others in this conversation to 'read'
    unread_messages = db.query(Message).filter(
        Message.conversation_id == conv.id,
        Message.sender_id != current_user.id,
        Message.status != "read",
        Message.is_deleted == False
    ).all()

    for m in unread_messages:
        m.status = "read"

    if payload.last_message_id:
        membership.last_read_message_id = payload.last_message_id
    elif unread_messages:
        membership.last_read_message_id = unread_messages[-1].id

    db.commit()

    # Broadcast read receipts to conversation
    await manager.broadcast_to_conversation(db, conv.id, {
        "type": "messages_read",
        "conversation_id": conv.id,
        "reader_id": current_user.id,
        "reader_name": current_user.display_name,
        "read_message_ids": [m.id for m in unread_messages]
    })

    return {"success": True, "count": len(unread_messages)}

@router.delete("/{message_id}")
async def delete_message(
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")

    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own messages.")

    msg.is_deleted = True
    db.commit()

    await manager.broadcast_to_conversation(db, msg.conversation_id, {
        "type": "message_deleted",
        "conversation_id": msg.conversation_id,
        "message_id": msg.id
    })

    return {"success": True, "message": "Message deleted."}
