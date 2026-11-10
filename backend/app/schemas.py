from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field

# User Schemas
class UserBase(BaseModel):
    phone_number: str
    username: str
    display_name: str
    about: Optional[str] = "Hey there! I am using Signal."
    avatar_url: Optional[str] = None
    avatar_color: Optional[str] = "#2090ea"

class UserRegister(UserBase):
    otp: Optional[str] = "123456"

class UserLogin(BaseModel):
    identifier: str  # Phone number or username
    otp: str = "123456"

class RequestOTPRequest(BaseModel):
    identifier: str

class VerifyOTPRequest(BaseModel):
    identifier: str
    otp: str

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    about: Optional[str] = None
    avatar_url: Optional[str] = None
    avatar_color: Optional[str] = None

class UserOut(UserBase):
    id: str
    safety_number: Optional[str] = None
    is_online: bool = False
    last_seen: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class SwitchAccountRequest(BaseModel):
    user_id: str

# Contact Schemas
class AddContactRequest(BaseModel):
    phone_or_username: str
    custom_nickname: Optional[str] = None

class ContactOut(BaseModel):
    id: str
    owner_id: str
    contact_user: UserOut
    custom_nickname: Optional[str] = None
    is_blocked: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

# Attachment Schemas
class AttachmentOut(BaseModel):
    id: str
    file_name: str
    file_url: str
    file_type: str
    file_size: int

    class Config:
        from_attributes = True

# Reaction Schemas
class ReactionOut(BaseModel):
    id: str
    emoji: str
    user_id: str
    user_name: str

    class Config:
        from_attributes = True

class ToggleReactionRequest(BaseModel):
    emoji: str

# Message Schemas
class QuotedMessageOut(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    content: str
    message_type: str = "text"

class MessageOut(BaseModel):
    id: str
    conversation_id: str
    sender: UserOut
    content: str
    message_type: str = "text"
    status: str = "sent"
    reply_to: Optional[QuotedMessageOut] = None
    attachments: List[AttachmentOut] = []
    reactions: List[ReactionOut] = []
    expires_at: Optional[datetime] = None
    is_expired: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class SendMessageRequest(BaseModel):
    conversation_id: str
    content: str
    message_type: str = "text"  # text, image, file, system
    reply_to_id: Optional[str] = None
    attachment_ids: Optional[List[str]] = None

class MarkReadRequest(BaseModel):
    conversation_id: str
    last_message_id: Optional[str] = None

# Conversation Schemas
class ConversationMemberOut(BaseModel):
    id: str
    user: UserOut
    role: str
    joined_at: datetime
    is_pinned: bool = False
    is_muted: bool = False

    class Config:
        from_attributes = True

class ConversationOut(BaseModel):
    id: str
    is_group: bool
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    description: Optional[str] = None
    disappearing_timer_seconds: int = 0
    updated_at: datetime
    members: List[ConversationMemberOut] = []
    last_message: Optional[MessageOut] = None
    unread_count: int = 0
    other_user: Optional[UserOut] = None  # Populated for 1-on-1 chats

    class Config:
        from_attributes = True

class CreateDirectChatRequest(BaseModel):
    target_user_id: str

class CreateGroupRequest(BaseModel):
    name: str
    member_ids: List[str]
    description: Optional[str] = None
    avatar_url: Optional[str] = None

class UpdateGroupRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None

class AddGroupMembersRequest(BaseModel):
    user_ids: List[str]

class UpdateDisappearingTimerRequest(BaseModel):
    timer_seconds: int = Field(ge=0, le=604800)  # Max 7 days
