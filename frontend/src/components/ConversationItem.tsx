'use client';

import React from 'react';
import { Conversation } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { formatConversationTime, getInitials } from '@/lib/utils';
import { Check, CheckCheck, Clock, Hourglass, Pin, Users } from 'lucide-react';

interface Props {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: void | any) {
  const { currentUser } = useAuth();
  const { typingUsers, onlineUsers } = useChat();

  const isGroup = conversation.is_group;
  const otherUser = conversation.other_user;
  const isOnline = otherUser ? (onlineUsers[otherUser.id] ?? otherUser.is_online) : false;
  const isSelf = !isGroup && otherUser?.id === currentUser?.id;

  const typers = typingUsers[conversation.id] || [];
  const isAnyoneTyping = typers.length > 0;

  const lastMsg = conversation.last_message;
  const isLastMsgMine = lastMsg && lastMsg.sender.id === currentUser?.id;

  // Determine avatar background color
  const avatarColor = isGroup ? '#125199' : (otherUser?.avatar_color || '#2090ea');

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center px-3 py-3 mx-2 my-0.5 rounded-xl cursor-pointer transition-all ${
        isActive
          ? 'bg-[#2a2b2f] dark:bg-[#2a2b2f]'
          : 'hover:bg-[#232428] dark:hover:bg-[#232428]'
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0 mr-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm select-none"
          style={{ backgroundColor: avatarColor }}
        >
          {conversation.avatar_url ? (
            <img
              src={conversation.avatar_url}
              alt={conversation.name || 'Chat'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : isGroup ? (
            <Users className="w-5 h-5 text-white" />
          ) : (
            getInitials(conversation.name)
          )}
        </div>

        {/* Online Presence Indicator */}
        {!isGroup && !isSelf && isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#1b1b1b] rounded-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="font-semibold text-sm text-gray-100 truncate">
              {conversation.name}
            </span>
            {isSelf && (
              <span className="text-[10px] font-medium text-gray-400 bg-gray-700/60 px-1.5 py-0.2 rounded">
                You
              </span>
            )}
            {conversation.disappearing_timer_seconds > 0 && (
              <Hourglass className="w-3 h-3 text-amber-400 shrink-0" />
            )}
          </div>

          {/* Timestamp */}
          {lastMsg && (
            <span className="text-[11px] text-gray-400 shrink-0 ml-1">
              {formatConversationTime(lastMsg.created_at)}
            </span>
          )}
        </div>

        {/* Last Message Snippet or Typing Indicator */}
        <div className="flex items-center justify-between text-xs">
          {isAnyoneTyping ? (
            <div className="flex items-center space-x-1 text-[#2090ea] font-medium animate-pulse">
              <span>{typers.join(', ')} is typing</span>
              <span className="flex space-x-0.5">
                <span className="w-1 h-1 bg-[#2090ea] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1 h-1 bg-[#2090ea] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1 h-1 bg-[#2090ea] rounded-full animate-bounce"></span>
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-gray-400 truncate pr-2">
              {/* Delivery / Read receipt icon for own messages */}
              {isLastMsgMine && (
                <span className="shrink-0">
                  {lastMsg.status === 'sending' && <Clock className="w-3 h-3 text-gray-400" />}
                  {lastMsg.status === 'sent' && <Check className="w-3 h-3 text-gray-400" />}
                  {lastMsg.status === 'delivered' && <CheckCheck className="w-3.5 h-3.5 text-gray-400" />}
                  {lastMsg.status === 'read' && <CheckCheck className="w-3.5 h-3.5 text-[#2090ea]" />}
                </span>
              )}

              <span className="truncate">
                {isLastMsgMine ? 'You: ' : isGroup && lastMsg?.sender ? `${lastMsg.sender.display_name.split(' ')[0]}: ` : ''}
                {lastMsg ? (lastMsg.message_type === 'image' ? '📷 Photo' : lastMsg.content) : 'No messages yet'}
              </span>
            </div>
          )}

          {/* Unread Counter Badge */}
          {conversation.unread_count > 0 && (
            <span className="shrink-0 bg-[#2090ea] text-white font-bold text-[10px] min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center">
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

