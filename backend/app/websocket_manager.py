import json
from datetime import datetime, timezone
from typing import Dict, Set, Optional, List
from fastapi import WebSocket
from sqlalchemy.orm import Session
from app.models import ConversationMember, User, Message

class WebSocketManager:
    def __init__(self):
        # Map: user_id -> Set of active WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str, db: Session):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

        # Update user's online status in DB
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_online = True
            user.last_seen = datetime.now(timezone.utc)
            db.commit()

        # Broadcast online status to user's conversation contacts
        await self.broadcast_user_status(db, user_id, is_online=True)

    async def disconnect(self, websocket: WebSocket, user_id: str, db: Session):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                # User has no remaining active connections
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    user.is_online = False
                    user.last_seen = datetime.now(timezone.utc)
                    db.commit()
                await self.broadcast_user_status(db, user_id, is_online=False)

    def is_user_online(self, user_id: str) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    async def send_to_user(self, user_id: str, message_data: dict):
        if user_id in self.active_connections:
            dead_sockets = set()
            payload = json.dumps(message_data, default=str)
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                self.active_connections[user_id].discard(ws)

    async def broadcast_to_conversation(
        self,
        db: Session,
        conversation_id: str,
        message_data: dict,
        exclude_user_id: Optional[str] = None
    ):
        members = db.query(ConversationMember).filter(
            ConversationMember.conversation_id == conversation_id
        ).all()
        for member in members:
            if exclude_user_id and member.user_id == exclude_user_id:
                continue
            await self.send_to_user(member.user_id, message_data)

    async def broadcast_user_status(self, db: Session, user_id: str, is_online: bool):
        # Find all conversations the user is a part of
        memberships = db.query(ConversationMember).filter(
            ConversationMember.user_id == user_id
        ).all()
        conv_ids = [m.conversation_id for m in memberships]

        if not conv_ids:
            return

        # Find all unique other members in those conversations
        other_members = db.query(ConversationMember.user_id).filter(
            ConversationMember.conversation_id.in_(conv_ids),
            ConversationMember.user_id != user_id
        ).distinct().all()

        status_event = {
            "type": "presence_update",
            "user_id": user_id,
            "is_online": is_online,
            "last_seen": datetime.now(timezone.utc).isoformat()
        }

        for (other_id,) in other_members:
            await self.send_to_user(other_id, status_event)

manager = WebSocketManager()

