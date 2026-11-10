import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.seed import seed_database
from app.models import User, Conversation, Message, Contact, MessageReaction
from app.auth import create_access_token, verify_mock_otp

def run_tests():
    print("1. Creating database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    

    print("2. Seeding database...")
    seed_database(db)

    print("3. Verifying seeded users...")
    users = db.query(User).all()
    print(f"   Found {len(users)} users:")
    for u in users:
        print(f"   - {u.display_name} ({u.username}, {u.phone_number}) | Safety: {u.safety_number[:17]}...")
    assert len(users) >= 6, "Expected at least 6 users"

    print("4. Verifying conversations...")
    convs = db.query(Conversation).all()
    print(f"   Found {len(convs)} conversations:")
    for c in convs:
        member_names = [m.user.display_name for m in c.members]
        name = c.name if c.name else f"Direct ({', '.join(member_names)})"
        print(f"   - {name} [is_group={c.is_group}, timer={c.disappearing_timer_seconds}s, members={len(member_names)}]")
    assert len(convs) >= 4, "Expected at least 4 conversations"

    print("5. Verifying messages and reactions...")
    messages = db.query(Message).all()
    print(f"   Found {len(messages)} total messages")
    assert len(messages) > 0, "Expected messages in database"

    reactions = db.query(MessageReaction).all()
    print(f"   Found {len(reactions)} reactions:")
    for r in reactions:
        print(f"   - Reaction {r.emoji} by {r.user.display_name} on message '{r.message.content[:30]}...'")
    assert len(reactions) > 0, "Expected reactions"

    print("6. Verifying JWT token generation and OTP...")
    alex = db.query(User).filter(User.username == "alex").first()
    token = create_access_token({"sub": alex.id, "username": alex.username})
    assert token, "Token generation failed"
    assert verify_mock_otp("123456"), "OTP verification failed"
    print(f"   JWT token generated for {alex.display_name}: {token[:20]}...")

    db.close()
    print("\n>>> ALL BACKEND TESTS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    run_tests()

