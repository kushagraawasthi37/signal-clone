import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, Integer, Text, DateTime, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    about = Column(String, default="Hey there! I am using Signal.")
    avatar_url = Column(String, nullable=True)
    avatar_color = Column(String, default="#2090ea")
    safety_number = Column(String, nullable=True)
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=utc_now)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    memberships = relationship("ConversationMember", back_populates="user", cascade="all, delete-orphan")
    sent_messages = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")
    reactions = relationship("MessageReaction", back_populates="user", cascade="all, delete-orphan")
    contacts_owned = relationship("Contact", back_populates="owner", foreign_keys="Contact.owner_id", cascade="all, delete-orphan")

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(String, primary_key=True, default=generate_uuid)
    owner_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    contact_user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    custom_nickname = Column(String, nullable=True)
    is_blocked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    owner = relationship("User", foreign_keys=[owner_id], back_populates="contacts_owned")
    contact_user = relationship("User", foreign_keys=[contact_user_id])

    __table_args__ = (
        UniqueConstraint("owner_id", "contact_user_id", name="uq_owner_contact"),
    )

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    is_group = Column(Boolean, default=False)
    name = Column(String, nullable=True)  # Name for groups, null for 1-on-1
    avatar_url = Column(String, nullable=True)
    description = Column(String, nullable=True)
    disappearing_timer_seconds = Column(Integer, default=0)  # 0 = off, 30, 300, 3600, 86400, etc.
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, index=True)

    members = relationship("ConversationMember", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at.asc()")

class ConversationMember(Base):
    __tablename__ = "conversation_members"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, default="member")  # admin, member
    joined_at = Column(DateTime, default=utc_now)
    last_read_message_id = Column(String, nullable=True)
    is_pinned = Column(Boolean, default=False)
    is_muted = Column(Boolean, default=False)

    conversation = relationship("Conversation", back_populates="members")
    user = relationship("User", back_populates="memberships")

    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_conversation_member"),
    )

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String, default="text")  # text, image, file, system
    status = Column(String, default="sent")  # sending, sent, delivered, read
    reply_to_id = Column(String, ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    expires_at = Column(DateTime, nullable=True)  # For disappearing messages
    is_expired = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now, index=True)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    reply_to = relationship("Message", remote_side=[id], backref="replies")
    attachments = relationship("Attachment", back_populates="message", cascade="all, delete-orphan")
    reactions = relationship("MessageReaction", back_populates="message", cascade="all, delete-orphan")

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(String, primary_key=True, default=generate_uuid)
    message_id = Column(String, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)

    message = relationship("Message", back_populates="attachments")

class MessageReaction(Base):
    __tablename__ = "message_reactions"

    id = Column(String, primary_key=True, default=generate_uuid)
    message_id = Column(String, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    emoji = Column(String, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    message = relationship("Message", back_populates="reactions")
    user = relationship("User", back_populates="reactions")

    __table_args__ = (
        UniqueConstraint("message_id", "user_id", "emoji", name="uq_message_user_reaction"),
    )

