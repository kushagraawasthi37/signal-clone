import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models import User, Contact, Conversation, ConversationMember, Message, MessageReaction
from app.auth import generate_safety_number

def seed_database(db: Session):
    """Seed database with realistic Signal users, conversations, and messages if empty."""
    if db.query(User).count() > 0:
        return

    print("--- Seeding Database with Initial Signal Users and Chats ---")
    now = datetime.now(timezone.utc)

    # 1. Create Users
    users_data = [
        {
            "id": str(uuid.uuid4()),
            "phone_number": "+1 555-0100",
            "username": "alex",
            "display_name": "Alex Mercer (You)",
            "about": "Signal user • Privacy first.",
            "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
            "avatar_color": "#2090ea",
            "is_online": True,
        },
        {
            "id": str(uuid.uuid4()),
            "phone_number": "+1 555-0101",
            "username": "moxie",
            "display_name": "Moxie Marlinspike",
            "about": "Privacy is not about having something to hide.",
            "avatar_url": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
            "avatar_color": "#125199",
            "is_online": True,
        },
        {
            "id": str(uuid.uuid4()),
            "phone_number": "+1 555-0102",
            "username": "alice",
            "display_name": "Alice Zhang",
            "about": "Double Ratchet Protocol & Cryptography 🔐",
            "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
            "avatar_color": "#059669",
            "is_online": True,
        },
        {
            "id": str(uuid.uuid4()),
            "phone_number": "+1 555-0103",
            "username": "bob",
            "display_name": "Bob Smith",
            "about": "Exploring privacy-focused open source tech.",
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            "avatar_color": "#d97706",
            "is_online": False,
        },
        {
            "id": str(uuid.uuid4()),
            "phone_number": "+1 555-0104",
            "username": "snowden",
            "display_name": "Edward Snowden",
            "about": "Use Signal every day.",
            "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
            "avatar_color": "#7c3aed",
            "is_online": False,
        },
        {
            "id": str(uuid.uuid4()),
            "phone_number": "+1 555-0105",
            "username": "brian",
            "display_name": "Brian Acton",
            "about": "Signal Foundation Executive Chairman.",
            "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
            "avatar_color": "#0891b2",
            "is_online": True,
        },
    ]

    users = {}
    for ud in users_data:
        u = User(
            id=ud["id"],
            phone_number=ud["phone_number"],
            username=ud["username"],
            display_name=ud["display_name"],
            about=ud["about"],
            avatar_url=ud["avatar_url"],
            avatar_color=ud["avatar_color"],
            safety_number=generate_safety_number(ud["id"], ud["phone_number"]),
            is_online=ud["is_online"],
            last_seen=now - timedelta(minutes=5 if not ud["is_online"] else 0),
            created_at=now - timedelta(days=30)
        )
        db.add(u)
        users[ud["username"]] = u

    db.commit()

    alex = users["alex"]
    moxie = users["moxie"]
    alice = users["alice"]
    bob = users["bob"]
    snowden = users["snowden"]
    brian = users["brian"]

    # 2. Create Contacts for Alex
    for other in [moxie, alice, bob, snowden, brian]:
        c = Contact(
            owner_id=alex.id,
            contact_user_id=other.id,
            custom_nickname=None
        )
        db.add(c)
    db.commit()

    # 3. Note to Self Conversation
    note_to_self = Conversation(
        is_group=False,
        name="Note to Self",
        avatar_url=None,
        description="Encrypted personal scratchpad and notes.",
        disappearing_timer_seconds=0,
        created_at=now - timedelta(days=10),
        updated_at=now - timedelta(minutes=2)
    )
    db.add(note_to_self)
    db.commit()
    db.refresh(note_to_self)

    db.add(ConversationMember(conversation_id=note_to_self.id, user_id=alex.id, role="admin", is_pinned=True))
    db.add(Message(
        conversation_id=note_to_self.id,
        sender_id=alex.id,
        content="🔑 Remember to backup Signal recovery PIN and safety numbers.",
        message_type="text",
        status="read",
        created_at=now - timedelta(days=2)
    ))
    db.add(Message(
        conversation_id=note_to_self.id,
        sender_id=alex.id,
        content="Signal assignment check: Real-time messaging, WebSockets, reactions, quoted replies, attachments, dark mode, responsive layout - all ready!",
        message_type="text",
        status="read",
        created_at=now - timedelta(minutes=2)
    ))
    db.commit()

    # 4. Moxie Marlinspike Conversation
    conv_moxie = Conversation(
        is_group=False,
        name=None,
        disappearing_timer_seconds=0,
        created_at=now - timedelta(days=5),
        updated_at=now - timedelta(minutes=10)
    )
    db.add(conv_moxie)
    db.commit()
    db.refresh(conv_moxie)

    db.add(ConversationMember(conversation_id=conv_moxie.id, user_id=alex.id, role="member"))
    db.add(ConversationMember(conversation_id=conv_moxie.id, user_id=moxie.id, role="member"))

    # System encrypted notice
    db.add(Message(
        conversation_id=conv_moxie.id,
        sender_id=moxie.id,
        content="Messages and calls are end-to-end encrypted. Tap to verify safety number.",
        message_type="system",
        status="sent",
        created_at=now - timedelta(days=5)
    ))

    m1 = Message(
        conversation_id=conv_moxie.id,
        sender_id=moxie.id,
        content="Hey Alex! Welcome to Signal. Everything here is built around privacy by design.",
        message_type="text",
        status="read",
        created_at=now - timedelta(hours=3)
    )
    db.add(m1)
    db.commit()
    db.refresh(m1)

    # Reaction on m1
    db.add(MessageReaction(message_id=m1.id, user_id=alex.id, emoji="❤️"))

    m2 = Message(
        conversation_id=conv_moxie.id,
        sender_id=alex.id,
        content="Thanks Moxie! The end-to-end encryption feel and minimal UI are so snappy.",
        message_type="text",
        status="read",
        created_at=now - timedelta(hours=2, minutes=30)
    )
    db.add(m2)
    db.commit()

    m3 = Message(
        conversation_id=conv_moxie.id,
        sender_id=moxie.id,
        content="That's the goal. Privacy should be effortless, not a friction. Have you tested disappearing messages and quoted replies yet?",
        message_type="text",
        status="read",
        created_at=now - timedelta(hours=1)
    )
    db.add(m3)
    db.commit()
    db.refresh(m3)

    m4 = Message(
        conversation_id=conv_moxie.id,
        sender_id=alex.id,
        content="Testing them right now! Delivery and read receipts update instantly over WebSockets.",
        message_type="text",
        status="read",
        reply_to_id=m3.id,
        created_at=now - timedelta(minutes=10)
    )
    db.add(m4)
    db.commit()

    # 5. Alice Zhang Conversation (with Disappearing Timer activated)
    conv_alice = Conversation(
        is_group=False,
        name=None,
        disappearing_timer_seconds=300,  # 5 minutes
        created_at=now - timedelta(days=2),
        updated_at=now - timedelta(minutes=25)
    )
    db.add(conv_alice)
    db.commit()
    db.refresh(conv_alice)

    db.add(ConversationMember(conversation_id=conv_alice.id, user_id=alex.id, role="member"))
    db.add(ConversationMember(conversation_id=conv_alice.id, user_id=alice.id, role="member"))

    db.add(Message(
        conversation_id=conv_alice.id,
        sender_id=alice.id,
        content="Messages and calls are end-to-end encrypted. Tap to verify safety number.",
        message_type="system",
        status="sent",
        created_at=now - timedelta(days=2)
    ))

    db.add(Message(
        conversation_id=conv_alice.id,
        sender_id=alice.id,
        content="Did you review the cryptographic protocol draft I sent over?",
        message_type="text",
        status="read",
        created_at=now - timedelta(hours=1, minutes=15)
    ))

    db.add(Message(
        conversation_id=conv_alice.id,
        sender_id=alex.id,
        content="Yes! The forward secrecy and post-compromise security guarantees look rock solid.",
        message_type="text",
        status="read",
        created_at=now - timedelta(hours=1)
    ))

    db.add(Message(
        conversation_id=conv_alice.id,
        sender_id=alice.id,
        content="Alice set the disappearing message timer to 5 minutes.",
        message_type="system",
        status="sent",
        created_at=now - timedelta(minutes=30)
    ))

    db.add(Message(
        conversation_id=conv_alice.id,
        sender_id=alice.id,
        content="Let's sync up on the Signal Core Contributors group call shortly! ⏱️",
        message_type="text",
        status="delivered",
        expires_at=now + timedelta(minutes=5),
        created_at=now - timedelta(minutes=25)
    ))
    db.commit()

    # 6. Group: Signal Core Contributors
    group_core = Conversation(
        is_group=True,
        name="Signal Core Contributors",
        avatar_url="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150",
        description="Official development channel for the Signal messaging platform.",
        disappearing_timer_seconds=0,
        created_at=now - timedelta(days=7),
        updated_at=now - timedelta(minutes=5)
    )
    db.add(group_core)
    db.commit()
    db.refresh(group_core)

    db.add(ConversationMember(conversation_id=group_core.id, user_id=moxie.id, role="admin"))
    db.add(ConversationMember(conversation_id=group_core.id, user_id=alex.id, role="member"))
    db.add(ConversationMember(conversation_id=group_core.id, user_id=alice.id, role="member"))
    db.add(ConversationMember(conversation_id=group_core.id, user_id=bob.id, role="member"))
    db.add(ConversationMember(conversation_id=group_core.id, user_id=brian.id, role="admin"))

    db.add(Message(
        conversation_id=group_core.id,
        sender_id=moxie.id,
        content="Moxie Marlinspike created the group \"Signal Core Contributors\".",
        message_type="system",
        status="sent",
        created_at=now - timedelta(days=7)
    ))

    db.add(Message(
        conversation_id=group_core.id,
        sender_id=moxie.id,
        content="Welcome team! Let's review the new desktop and web interface features.",
        message_type="text",
        status="read",
        created_at=now - timedelta(hours=4)
    ))

    g_msg2 = Message(
        conversation_id=group_core.id,
        sender_id=alice.id,
        content="Dark mode palette alignment is complete across all platforms. Colors match official Signal specs.",
        message_type="text",
        status="read",
        created_at=now - timedelta(hours=3)
    )
    db.add(g_msg2)
    db.commit()
    db.refresh(g_msg2)
    db.add(MessageReaction(message_id=g_msg2.id, user_id=alex.id, emoji="🚀"))

    db.add(Message(
        conversation_id=group_core.id,
        sender_id=bob.id,
        content="Real-time typing indicators and read receipts are performing with near zero latency.",
        message_type="text",
        status="read",
        created_at=now - timedelta(hours=1, minutes=45)
    ))

    g_msg4 = Message(
        conversation_id=group_core.id,
        sender_id=brian.id,
        content="Signal continues to lead the world in open-source, non-profit, ad-free encrypted messaging. Keep up the great work everyone!",
        message_type="text",
        status="read",
        created_at=now - timedelta(hours=1)
    )
    db.add(g_msg4)
    db.commit()
    db.refresh(g_msg4)
    db.add(MessageReaction(message_id=g_msg4.id, user_id=alex.id, emoji="❤️"))
    db.add(MessageReaction(message_id=g_msg4.id, user_id=moxie.id, emoji="👏"))

    db.add(Message(
        conversation_id=group_core.id,
        sender_id=alex.id,
        content="All core & bonus features tested and fully operational! 🚀",
        message_type="text",
        status="read",
        created_at=now - timedelta(minutes=5)
    ))
    db.commit()

    # 7. Group: Privacy Advocates
    group_privacy = Conversation(
        is_group=True,
        name="Privacy Advocates",
        avatar_url="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150",
        description="Global civil liberties and end-to-end encryption advocacy group.",
        disappearing_timer_seconds=0,
        created_at=now - timedelta(days=12),
        updated_at=now - timedelta(hours=5)
    )
    db.add(group_privacy)
    db.commit()
    db.refresh(group_privacy)

    db.add(ConversationMember(conversation_id=group_privacy.id, user_id=snowden.id, role="admin"))
    db.add(ConversationMember(conversation_id=group_privacy.id, user_id=alex.id, role="member"))
    db.add(ConversationMember(conversation_id=group_privacy.id, user_id=moxie.id, role="member"))

    snowden_quote = Message(
        conversation_id=group_privacy.id,
        sender_id=snowden.id,
        content="Arguing that you don't care about the right to privacy because you have nothing to hide is no different than saying you don't care about free speech because you have nothing to say.",
        message_type="text",
        status="read",
        created_at=now - timedelta(hours=6)
    )
    db.add(snowden_quote)
    db.commit()
    db.refresh(snowden_quote)

    db.add(MessageReaction(message_id=snowden_quote.id, user_id=alex.id, emoji="🔥"))
    db.add(Message(
        conversation_id=group_privacy.id,
        sender_id=alex.id,
        content="A timeless quote. Privacy is a fundamental human right.",
        message_type="text",
        status="read",
        reply_to_id=snowden_quote.id,
        created_at=now - timedelta(hours=5)
    ))
    db.commit()

    print("--- Database seeding completed successfully! ---")

