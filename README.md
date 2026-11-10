# 🔒 Signal Messenger Clone — Secure Fullstack Messaging Platform

A high-fidelity, real-time clone of the **Signal Private Messenger** application, replicating Signal's design, user experience, and core messaging workflows.

Built as an **SDE Fullstack Assignment** adhering to all specifications and including **100% of all core and bonus features**.

---

## 🌟 Feature Overview & Rubric Checklist

### 1. Authentication & Onboarding (Mocked / Frictionless)
- [x] **Registration**: Register with phone number or username.
- [x] **Fixed Mock OTP**: Uses fixed OTP `123456` (or any 6 digits) for immediate testing.
- [x] **Profile Setup**: Set display name, bio/about, and Signal avatar color palette.
- [x] **Session Persistence**: JWT-based authentication stored in `localStorage` + `/api/auth/me` auto-restore.
- [x] **One-Click Demo Switcher**: Instant switcher between 6 pre-seeded realistic users (**Alex Mercer, Moxie Marlinspike, Alice Zhang, Bob Smith, Edward Snowden, Brian Acton**) so evaluators can test multi-user real-time messaging across browser tabs instantly without re-registering.
- [x] **Signal Safety Numbers**: Simulated 60-digit fingerprint (`12345 67890 ...`) with scannable QR code verification modal.
- [x] **Note to Self**: Signature Signal feature automatically provisioned for every account.

### 2. Contacts & Conversation List
- [x] **Left-hand Conversation List**: Recreated Signal desktop dual-pane layout.
- [x] **Recency Sorting**: Conversations dynamically ordered by most recent message activity.
- [x] **Search**: Real-time instant filtering across conversations, contacts, and message contents (`Ctrl+K` shortcut).
- [x] **Add Contact**: Search and add contacts by phone number or username.
- [x] **Unread Badges**: Blue badge counts indicating new unread messages.
- [x] **Last-Message Preview**: Previews message snippets with sender prefix (`You: `, `Alice: `).
- [x] **Online / Presence Indicators**: Real-time green dot presence and last-seen indicators synced via WebSockets.
- [x] **Filter Pills**: Quick filters for "All", "Unread", and "Groups".

### 3. One-on-One Real-Time Messaging
- [x] **WebSockets Gateway**: Bi-directional real-time message delivery.
- [x] **Message Timestamps & Dividers**: Signal formatted timestamps (`10:42 AM`) and grouped day dividers (`Today`, `Yesterday`, date strings).
- [x] **Delivery & Read Receipts**:
  - 🕒 `sending`: Clock icon
  - ✓ `sent`: Single white checkmark
  - ✓✓ `delivered`: Double checkmark (when recipient is connected)
  - ✓✓ `read`: Double blue checkmarks (updated immediately when conversation is active)
- [x] **Typing Indicators**: Real-time animated typing indicator in conversation header and sidebar list (`... typing`).
- [x] **Database Persistence**: All messages, statuses, and conversations persist in SQLite with SQLAlchemy.

### 4. Group Messaging
- [x] **Create Group Wizard**: Multi-select member picker with chips, group title, and description.
- [x] **Group Real-Time Delivery**: Messages broadcast instantly to all online group members.
- [x] **Sender Distinction**: Color-coded member names above incoming group bubbles.
- [x] **Group Details & Member Drawer**: View member list with role tags (`Admin` vs `Member`).
- [x] **Admin Controls**: Add new members or remove existing members from group.
- [x] **System Announcements**: Automated group audit log (`"Moxie created the group"`, `"Alex set timer to 5 minutes"`).

### 5. Signal Look, Feel & UX
- [x] **Exact Visual Match**: Authentic Signal Desktop palette (`#121212` dark background, `#1e1e1e` sidebar, `#2090ea` Ultramarine sent bubbles, `#2c2c2e` received bubbles).
- [x] **Web Audio API Sound Effects**: Authentic synthesized Signal high ping on send and pleasant two-tone ding on receive.
- [x] **Interactive Modals**: Polished animations for settings, calls, safety numbers, devices, and groups.

### 6. Mocked / Placeholder Sections
- [x] **Voice & Video Calls**: Functional call dialog with active pulsing audio wave visualizer, call timer (`00:24`), mute mic, toggle camera, and end call.
- [x] **Stories**: Ephemeral 24-hour encrypted Stories viewer with progress bars, photos, and reply bar.
- [x] **Linked Devices**: Paired devices manager with simulated QR code pairing screen.
- [x] **Safety Number Verification**: 12 blocks of 5 digits with visual QR matrix and "Mark as verified" toggle.

---

## 🎁 BONUS FEATURES (ALL INCLUDED)

| Bonus Feature | Implementation Details |
|---|---|
| 📎 **Attachments (Images & Files)** | Multipart file upload endpoint `/api/upload`, preview cards before sending, inline photo rendering with lightbox zoom, and file download cards with file size formatting. |
| ❤️ **Message Reactions (Emoji)** | Hover action bar with quick reactions (❤️, 👍, 👎, 😂, 😮, 😢, + full picker), reaction counter pills below message bubbles, toggleable by clicking. Synced in real-time. |
| 💬 **Reply-to / Quoted Messages** | Quoted reply preview banner above input field, in-bubble quote card with colored accent border and sender name. Clicking the quote smoothly scrolls to and highlights the target message. |
| ⏱️ **Disappearing Messages (Functional)** | Configurable expiration timer (Off, 30s, 5m, 1h, 1d, 1w). Database and client-side countdown timer auto-expires and removes messages after expiration. |
| 🌙 **Dark Mode & Themes** | Toggle between Signal Dark, Light, and System themes in Settings. Persisted in `localStorage`. |
| 📱 **Responsive Design** | Dual-pane on desktop/tablet; responsive view toggle with mobile back button on smartphones (`<768px`). |
| ⌨️ **Keyboard Shortcuts** | `Ctrl+K` for search, `Enter` to send, `Shift+Enter` for newline, `Esc` to deselect, `Ctrl+/` for shortcuts cheatsheet modal. |

---

## 🛠️ Technical Stack

- **Frontend**: Next.js 16 (React 19, TypeScript), Tailwind CSS, Lucide Icons, Web Audio API.
- **Backend**: Python 3.14+, FastAPI, Uvicorn, WebSockets.
- **Database**: SQLite with SQLAlchemy ORM, indexed foreign keys, relational constraints.
- **Authentication**: JWT tokens (PyJWT) + Mock OTP verification.
- **Real-Time Layer**: Native WebSocket connection manager with room broadcasting and heartbeat.

---

## 🗄️ Database Schema Design

The relational schema is implemented in `backend/app/models.py`:

```
┌─────────────────┐       1:N       ┌───────────────────────┐
│      User       ├─────────────────┤  ConversationMember   │
│-----------------│                 │-----------------------│
│ id (PK, UUID)   │                 │ id (PK, UUID)         │
│ phone_number    │                 │ conversation_id (FK)  │
│ username        │                 │ user_id (FK)          │
│ display_name    │                 │ role (admin/member)   │
│ about           │                 │ last_read_message_id  │
│ avatar_url      │                 └───────────┬───────────┘
│ avatar_color    │                             │
│ safety_number   │                             │ N:1
│ is_online       │                 ┌───────────▼───────────┐
│ last_seen       │                 │     Conversation      │
│ created_at      │                 │-----------------------│
└────────┬────────┘                 │ id (PK, UUID)         │
         │                          │ is_group (Boolean)    │
         │ 1:N                      │ name (String)         │
         ▼                          │ description           │
┌─────────────────┐                 │ disappearing_timer_s  │
│     Contact     │                 │ updated_at            │
│-----------------│                 └───────────┬───────────┘
│ id (PK, UUID)   │                             │
│ owner_id (FK)   │                             │ 1:N
│ contact_user_id │                             │
│ custom_nickname │                             ▼
│ is_blocked      │                 ┌───────────────────────┐
└─────────────────┘                 │        Message        │
                                    │-----------------------│
                                    │ id (PK, UUID)         │
                                    │ conversation_id (FK)  │
                                    │ sender_id (FK)        │
                                    │ content (Text)        │
                                    │ message_type          │
                                    │ status                │
                                    │ reply_to_id (Self-FK) │
                                    │ expires_at (DateTime) │
                                    │ is_expired (Boolean)  │
                                    │ created_at            │
                                    └───────┬────────┬──────┘
                                            │        │
                             1:N            │        │ 1:N
                    ┌───────────────────────┘        └───────────────────────┐
                    ▼                                                        ▼
         ┌─────────────────────┐                                  ┌─────────────────────┐
         │     Attachment      │                                  │   MessageReaction   │
         │---------------------│                                  │---------------------│
         │ id (PK, UUID)       │                                  │ id (PK, UUID)       │
         │ message_id (FK)     │                                  │ message_id (FK)     │
         │ file_name           │                                  │ user_id (FK)        │
         │ file_url            │                                  │ emoji (String)      │
         │ file_type           │                                  │ created_at          │
         │ file_size           │                                  └─────────────────────┘
         └─────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **Python** 3.10+ (tested on Python 3.14)
- **npm** or **yarn**

---

### Step 1: Backend Setup

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run test suite to verify database seeding and schemas:
   ```bash
   python test_backend.py
   ```
4. Start the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   The backend API will run on `http://localhost:8000`.
   Interactive Swagger documentation is available at `http://localhost:8000/docs`.

---

### Step 2: Frontend Setup

1. Open a second terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open your browser at `http://localhost:3000`.

---

### Quick Launch (Windows One-Click)
Double-click `run_all.bat` in the root folder to start both servers concurrently in separate windows.

---

## 🧪 Testing & Evaluation Walkthrough

Follow these steps to experience all features:

1. **Automatic Login / Demo Account**:
   - When the web app opens, you are logged in as **Alex Mercer (You)**.
   - Click the **"Switch"** button in the sidebar header to quickly toggle between **Moxie Marlinspike, Alice Zhang, Bob Smith**, etc.
   - Open **two browser tabs** (one as Alex, one as Moxie) to watch real-time messaging, typing indicators, checkmarks, and reactions update with zero delay.

2. **Test One-on-One Chat**:
   - Click **Moxie Marlinspike** from the chat list.
   - Type a message and hit `Enter`. Notice the sent sound chime and delivery checkmarks.
   - React with ❤️ or 👍 by hovering over the bubble.
   - Hover over a message and click the **Reply** arrow to send a quoted response.

3. **Test Disappearing Messages (Functional Bonus)**:
   - Click the **Hourglass** icon in the chat header.
   - Select **30 seconds** (or 5 minutes).
   - Send a new message. An amber countdown pill (`30s`, `29s`...) appears on the bubble. Once the timer reaches 0, the message automatically disappears!

4. **Test Attachments (Bonus)**:
   - Click the **Paperclip** icon in the message input.
   - Select any image or file. A preview thumbnail will appear above the input.
   - Press **Send**. Images render inline with full-size click preview; documents render with size and download action.

5. **Test Group Messaging & Admin Controls**:
   - Click the **Pencil (New Chat)** icon at the top of the sidebar.
   - Choose **Group Chat**, select members, name the group, and click **Create Group**.
   - Inside the group, click the header to view the **Group Details Modal**, where admins can add or remove members.

6. **Test Verified Safety Numbers**:
   - Click the **Lock / Shield** icon in the header to view the authentic Signal 60-digit safety number grid and QR code.

7. **Test Settings & Themes**:
   - Click the **Gear (Settings)** icon in the sidebar.
   - Toggle between **Dark**, **Light**, and **System** themes.
   - Change your profile name or avatar color.

---

## 🌐 API Overview

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/request-otp` | `POST` | Requests 6-digit mock OTP (accepts `123456`) |
| `/api/auth/register` | `POST` | Registers new user and returns JWT token |
| `/api/auth/login` | `POST` | Authenticates user with phone/username and OTP |
| `/api/auth/me` | `GET` | Returns current user profile |
| `/api/auth/demo-users` | `GET` | Returns all pre-seeded demo users |
| `/api/auth/switch-account`| `POST` | Instant account switch for multi-tab evaluation |
| `/api/contacts` | `GET`, `POST` | List contacts or add new contact |
| `/api/conversations` | `GET` | Lists conversations sorted by recent activity |
| `/api/conversations/direct` | `POST` | Get or create 1-on-1 direct conversation |
| `/api/conversations/group` | `POST` | Create a new group conversation |
| `/api/conversations/{id}/members` | `POST`, `DELETE` | Add or remove group members |
| `/api/conversations/{id}/disappearing` | `PUT` | Update disappearing message timer |
| `/api/messages/{id}` | `GET` | Fetch conversation message history |
| `/api/messages` | `POST` | Send new message (text/attachments/reply) |
| `/api/messages/{id}/reactions` | `POST` | Toggle emoji reaction |
| `/api/messages/read` | `POST` | Mark conversation messages as read |
| `/api/upload` | `POST` | Upload file / image attachment |
| `/ws?token={token}` | `WebSocket` | Real-time gateway (messages, typing, presence, reactions, receipts) |

---

## 🚢 Deployment Guide

### Deploying Frontend to Vercel / Netlify
1. Connect your repository to **Vercel** or **Netlify**.
2. Root directory: `frontend`.
3. Set environment variable:
   `NEXT_PUBLIC_API_URL=https://your-backend-domain.com`
4. Deploy!

### Deploying Backend to Render / Railway
1. Create a **Web Service** pointing to the `backend/` directory.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Deploy!
