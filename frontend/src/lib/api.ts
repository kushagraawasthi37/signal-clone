const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('signal_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  baseUrl: API_BASE_URL,
  wsUrl: WS_BASE_URL,

  // Auth endpoints
  async requestOtp(identifier: string) {
    const res = await fetch(`${API_BASE_URL}/api/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to request OTP');
    return res.json();
  },

  async register(data: { phone_number: string; username: string; display_name: string; about?: string; avatar_url?: string; avatar_color?: string; otp: string }) {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to register');
    return res.json();
  },

  async login(identifier: string, otp: string = '123456') {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, otp })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to login');
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to get user profile');
    return res.json();
  },

  async updateProfile(data: { display_name?: string; about?: string; avatar_url?: string; avatar_color?: string }) {
    const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to update profile');
    return res.json();
  },

  async getDemoUsers() {
    const res = await fetch(`${API_BASE_URL}/api/auth/demo-users`);
    if (!res.ok) throw new Error('Failed to fetch demo users');
    return res.json();
  },

  async switchAccount(userId: string) {
    const res = await fetch(`${API_BASE_URL}/api/auth/switch-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    if (!res.ok) throw new Error('Failed to switch account');
    return res.json();
  },

  // Contacts endpoints
  async getContacts() {
    const res = await fetch(`${API_BASE_URL}/api/contacts`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch contacts');
    return res.json();
  },

  async addContact(phone_or_username: string, custom_nickname?: string) {
    const res = await fetch(`${API_BASE_URL}/api/contacts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone_or_username, custom_nickname })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to add contact');
    return res.json();
  },

  async searchUsers(query: string) {
    const res = await fetch(`${API_BASE_URL}/api/contacts/search?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to search users');
    return res.json();
  },

  // Conversations endpoints
  async getConversations() {
    const res = await fetch(`${API_BASE_URL}/api/conversations`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  async createDirectChat(targetUserId: string) {
    const res = await fetch(`${API_BASE_URL}/api/conversations/direct`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ target_user_id: targetUserId })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to start direct conversation');
    return res.json();
  },

  async createGroup(data: { name: string; member_ids: string[]; description?: string; avatar_url?: string }) {
    const res = await fetch(`${API_BASE_URL}/api/conversations/group`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to create group');
    return res.json();
  },

  async updateGroup(conversationId: string, data: { name?: string; description?: string; avatar_url?: string }) {
    const res = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/group`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to update group');
    return res.json();
  },

  async addGroupMembers(conversationId: string, userIds: string[]) {
    const res = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/members`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_ids: userIds })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to add members');
    return res.json();
  },

  async removeGroupMember(conversationId: string, userId: string) {
    const res = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/members/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to remove member');
    return res.json();
  },

  async setDisappearingTimer(conversationId: string, timerSeconds: number) {
    const res = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/disappearing`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ timer_seconds: timerSeconds })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to update timer');
    return res.json();
  },

  // Messages endpoints
  async getMessages(conversationId: string) {
    const res = await fetch(`${API_BASE_URL}/api/messages/${conversationId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  async sendMessage(data: { conversation_id: string; content: string; message_type?: string; reply_to_id?: string; attachment_ids?: string[] }) {
    const res = await fetch(`${API_BASE_URL}/api/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to send message');
    return res.json();
  },

  async toggleReaction(messageId: string, emoji: string) {
    const res = await fetch(`${API_BASE_URL}/api/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ emoji })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to toggle reaction');
    return res.json();
  },

  async markAsRead(conversationId: string, lastMessageId?: string) {
    const res = await fetch(`${API_BASE_URL}/api/messages/read`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ conversation_id: conversationId, last_message_id: lastMessageId })
    });
    if (!res.ok) throw new Error('Failed to mark messages as read');
    return res.json();
  },

  async deleteMessage(messageId: string) {
    const res = await fetch(`${API_BASE_URL}/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete message');
    return res.json();
  },

  // File upload
  async uploadFile(file: File) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('signal_token') : null;
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return res.json();
  }
};
