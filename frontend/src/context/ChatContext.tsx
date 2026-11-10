'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Conversation, Message, User } from '@/lib/types';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';
import { sounds } from '@/lib/sounds';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoadingMessages: boolean;
  typingUsers: { [convId: string]: string[] };
  onlineUsers: { [userId: string]: boolean };
  replyToMessage: Message | null;
  filterTab: 'all' | 'unread' | 'groups';
  searchQuery: string;
  activeModal: string | null;
  selectedUserForSafetyNumber: User | null;

  setFilterTab: (tab: 'all' | 'unread' | 'groups') => void;
  setSearchQuery: (query: string) => void;
  setActiveModal: (modal: string | null) => void;
  setSelectedUserForSafetyNumber: (user: User | null) => void;
  setReplyToMessage: (msg: Message | null) => void;

  selectConversation: (conv: Conversation) => Promise<void>;
  sendMessage: (content: string, messageType?: string, attachmentIds?: string[]) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  setDisappearingTimer: (seconds: number) => Promise<void>;
  refreshConversations: () => Promise<void>;
  startDirectChatWithUser: (targetUser: User) => Promise<void>;
  createNewGroup: (name: string, memberIds: string[], description?: string, avatarUrl?: string) => Promise<Conversation>;
  deleteMessage: (messageId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<{ [convId: string]: string[] }>({});
  const [onlineUsers, setOnlineUsers] = useState<{ [userId: string]: boolean }>({});
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedUserForSafetyNumber, setSelectedUserForSafetyNumber] = useState<User | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const activeConvRef = useRef<Conversation | null>(null);
  activeConvRef.current = activeConversation;

  // Refresh conversation list
  const refreshConversations = useCallback(async () => {
    if (!token) return;
    try {
      const list = await api.getConversations();
      setConversations(list);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, [token]);

  // Load conversations on auth
  useEffect(() => {
    if (token) {
      refreshConversations();
    } else {
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
    }
  }, [token, refreshConversations]);

  // WebSocket Connection
  useEffect(() => {
    if (!token || !currentUser) return;

    const wsUrl = (api.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://')) + `/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Signal WebSocket Connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const currentConv = activeConvRef.current;

        switch (data.type) {
          case 'new_message': {
            const incomingMsg: Message = data.message;
            const convId = data.conversation_id;

            // If incoming message belongs to currently active conversation
            if (currentConv && currentConv.id === convId) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === incomingMsg.id)) return prev;
                return [...prev, incomingMsg];
              });

              // Mark as read immediately if current active chat and sent by other
              if (incomingMsg.sender.id !== currentUser.id) {
                api.markAsRead(convId, incomingMsg.id);
                sounds.playReceived();
              }
            } else {
              // Sound chime for incoming message in other chat
              if (incomingMsg.sender.id !== currentUser.id) {
                sounds.playReceived();
              }
            }

            // Update conversation list item last message and ordering
            setConversations((prev) => {
              const convIndex = prev.findIndex((c) => c.id === convId);
              if (convIndex === -1) {
                refreshConversations();
                return prev;
              }
              const updatedConv = { ...prev[convIndex] };
              updatedConv.last_message = incomingMsg;
              updatedConv.updated_at = incomingMsg.created_at;
              if (currentConv?.id !== convId && incomingMsg.sender.id !== currentUser.id) {
                updatedConv.unread_count = (updatedConv.unread_count || 0) + 1;
              }
              const rest = prev.filter((c) => c.id !== convId);
              return [updatedConv, ...rest];
            });
            break;
          }

          case 'reaction_updated': {
            if (currentConv && currentConv.id === data.conversation_id) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === data.message_id
                    ? { ...msg, reactions: data.reactions }
                    : msg
                )
              );
            }
            break;
          }

          case 'messages_read': {
            // Update message status to 'read' (double blue checks)
            if (currentConv && currentConv.id === data.conversation_id) {
              setMessages((prev) =>
                prev.map((m) =>
                  data.read_message_ids.includes(m.id) ? { ...m, status: 'read' } : m
                )
              );
            }
            break;
          }

          case 'typing': {
            const convId = data.conversation_id;
            const userName = data.user_name;
            const isTyping = data.is_typing;

            setTypingUsers((prev) => {
              const currentList = prev[convId] || [];
              if (isTyping) {
                if (!currentList.includes(userName)) {
                  return { ...prev, [convId]: [...currentList, userName] };
                }
              } else {
                return { ...prev, [convId]: currentList.filter((n) => n !== userName) };
              }
              return prev;
            });
            break;
          }

          case 'presence_update': {
            setOnlineUsers((prev) => ({
              ...prev,
              [data.user_id]: data.is_online
            }));
            break;
          }

          case 'new_conversation': {
            refreshConversations();
            break;
          }

          case 'disappearing_timer_updated': {
            refreshConversations();
            if (currentConv && currentConv.id === data.conversation_id) {
              setActiveConversation((prev) => prev ? { ...prev, disappearing_timer_seconds: data.timer_seconds } : prev);
            }
            break;
          }

          case 'group_updated': {
            refreshConversations();
            break;
          }

          case 'message_deleted': {
            if (currentConv && currentConv.id === data.conversation_id) {
              setMessages((prev) => prev.filter((m) => m.id !== data.message_id));
            }
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    };

    ws.onclose = () => {
      console.log('Signal WebSocket Disconnected');
    };

    return () => {
      ws.close();
    };
  }, [token, currentUser, refreshConversations]);

  // Select active conversation
  const selectConversation = async (conv: Conversation) => {
    setActiveConversation(conv);
    setIsLoadingMessages(true);
    setReplyToMessage(null);

    // Reset unread counter locally
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
    );

    try {
      const msgs = await api.getMessages(conv.id);
      setMessages(msgs);

      // Auto mark read if there are unread messages
      if (conv.unread_count > 0 || msgs.some((m: Message) => m.sender.id !== currentUser?.id && m.status !== 'read')) {
        await api.markAsRead(conv.id);
      }
    } catch (err) {
      console.error('Failed to fetch messages for conversation:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Send message
  const sendMessage = async (content: string, messageType: string = 'text', attachmentIds?: string[]) => {
    if (!activeConversation || !currentUser) return;
    if (!content.trim() && (!attachmentIds || attachmentIds.length === 0)) return;

    sounds.playSent();
    const replyId = replyToMessage?.id;
    setReplyToMessage(null);

    try {
      const newMsg = await api.sendMessage({
        conversation_id: activeConversation.id,
        content,
        message_type: messageType,
        reply_to_id: replyId,
        attachment_ids: attachmentIds
      });

      // Optimistically append if not already added by WS
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // Update conversation in sidebar
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, last_message: newMsg, updated_at: newMsg.created_at }
            : c
        );
        return updated.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Send typing event
  const sendTyping = (isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !activeConversation) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'typing',
        conversation_id: activeConversation.id,
        is_typing: isTyping
      })
    );

    // Auto clear typing after 3s if still typing
    if (isTyping) {
      const key = activeConversation.id;
      if (typingTimeoutRef.current[key]) {
        clearTimeout(typingTimeoutRef.current[key]);
      }
      typingTimeoutRef.current[key] = setTimeout(() => {
        sendTyping(false);
      }, 3000);
    }
  };

  // Toggle reaction
  const toggleReaction = async (messageId: string, emoji: string) => {
    try {
      const updatedMsg = await api.toggleReaction(messageId, emoji);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? updatedMsg : m))
      );
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  // Set disappearing timer
  const setDisappearingTimer = async (seconds: number) => {
    if (!activeConversation) return;
    try {
      const updated = await api.setDisappearingTimer(activeConversation.id, seconds);
      setActiveConversation(updated);
      setConversations((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
    } catch (err) {
      console.error('Failed to update disappearing timer:', err);
    }
  };

  // Start direct chat with user
  const startDirectChatWithUser = async (targetUser: User) => {
    try {
      const conv = await api.createDirectChat(targetUser.id);
      await refreshConversations();
      await selectConversation(conv);
      setActiveModal(null);
    } catch (err) {
      console.error('Failed to start direct chat:', err);
    }
  };

  // Create new group
  const createNewGroup = async (name: string, memberIds: string[], description?: string, avatarUrl?: string) => {
    const group = await api.createGroup({
      name,
      member_ids: memberIds,
      description,
      avatar_url: avatarUrl
    });
    await refreshConversations();
    await selectConversation(group);
    setActiveModal(null);
    return group;
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    try {
      await api.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        isLoadingMessages,
        typingUsers,
        onlineUsers,
        replyToMessage,
        filterTab,
        searchQuery,
        activeModal,
        selectedUserForSafetyNumber,
        setFilterTab,
        setSearchQuery,
        setActiveModal,
        setSelectedUserForSafetyNumber,
        setReplyToMessage,
        selectConversation,
        sendMessage,
        sendTyping,
        toggleReaction,
        setDisappearingTimer,
        refreshConversations,
        startDirectChatWithUser,
        createNewGroup,
        deleteMessage
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
}
