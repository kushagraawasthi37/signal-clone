export interface User {
  id: string;
  phone_number: string;
  username: string;
  display_name: string;
  about: string;
  avatar_url?: string | null;
  avatar_color: string;
  safety_number?: string | null;
  is_online: boolean;
  last_seen: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

export interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
}

export interface QuotedMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  message_type: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: User;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  reply_to?: QuotedMessage | null;
  attachments: Attachment[];
  reactions: Reaction[];
  expires_at?: string | null;
  is_expired: boolean;
  created_at: string;
}

export interface ConversationMember {
  id: string;
  user: User;
  role: 'admin' | 'member';
  joined_at: string;
  is_pinned: boolean;
  is_muted: boolean;
}

export interface Conversation {
  id: string;
  is_group: boolean;
  name?: string | null;
  avatar_url?: string | null;
  description?: string | null;
  disappearing_timer_seconds: number;
  updated_at: string;
  members: ConversationMember[];
  last_message?: Message | null;
  unread_count: number;
  other_user?: User | null;
}

export interface Contact {
  id: string;
  owner_id: string;
  contact_user: User;
  custom_nickname?: string | null;
  is_blocked: boolean;
  created_at: string;
}

