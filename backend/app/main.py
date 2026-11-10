import json
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.config import UPLOAD_DIR
from app.database import engine, Base, SessionLocal, get_db
from app.seed import seed_database
from app.auth import get_current_user_from_token
from app.models import User, ConversationMember
from app.websocket_manager import manager
from app.routers import auth, contacts, conversations, messages, upload

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield
    # Shutdown

app = FastAPI(
    title="Signal Messenger Platform API",
    description="Real-Time Fullstack Secure Messaging API replicating Signal's architecture and UX workflows.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files for Uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(contacts.router)
app.include_router(conversations.router)
app.include_router(messages.router)
app.include_router(upload.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "Signal Messenger Clone API",
        "version": "1.0.0",
        "encryption_mode": "Simulated Signal Protocol (Double Ratchet / Safety Numbers)",
        "docs_url": "/docs"
    }

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None)
):
    db: Session = SessionLocal()
    authenticated_user = None

    try:
        # Authenticate via JWT token or fallback user_id for dev testing
        if token:
            authenticated_user = get_current_user_from_token(token, db)
        elif user_id:
            authenticated_user = db.query(User).filter(User.id == user_id).first()

        if not authenticated_user:
            await websocket.close(code=4001, reason="Unauthorized")
            return

        current_uid = authenticated_user.id
        await manager.connect(websocket, current_uid, db)

        # Connection success welcome event
        await websocket.send_text(json.dumps({
            "type": "connected",
            "user_id": current_uid,
            "display_name": authenticated_user.display_name,
            "message": "Connected to Signal Real-Time Gateway"
        }))

        while True:
            raw_data = await websocket.receive_text()
            try:
                data = json.loads(raw_data)
                event_type = data.get("type")

                if event_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))

                elif event_type == "typing":
                    # Typing indicator event
                    conv_id = data.get("conversation_id")
                    is_typing = data.get("is_typing", False)
                    if conv_id:
                        await manager.broadcast_to_conversation(
                            db,
                            conv_id,
                            {
                                "type": "typing",
                                "conversation_id": conv_id,
                                "user_id": current_uid,
                                "user_name": authenticated_user.display_name,
                                "is_typing": is_typing
                            },
                            exclude_user_id=current_uid
                        )

                elif event_type == "call_signal":
                    # Mocked voice/video call signaling
                    conv_id = data.get("conversation_id")
                    action = data.get("action")  # "offer", "answer", "ice_candidate", "end"
                    if conv_id:
                        await manager.broadcast_to_conversation(
                            db,
                            conv_id,
                            {
                                "type": "call_signal",
                                "conversation_id": conv_id,
                                "sender_id": current_uid,
                                "sender_name": authenticated_user.display_name,
                                "action": action,
                                "call_type": data.get("call_type", "audio")
                            },
                            exclude_user_id=current_uid
                        )

            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        if authenticated_user:
            await manager.disconnect(websocket, authenticated_user.id, db)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        if authenticated_user:
            await manager.disconnect(websocket, authenticated_user.id, db)
    finally:
        db.close()

