'use client';

import React, { useState, useEffect } from 'react';
import { Message, Reaction } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { formatTime, formatFileSize } from '@/lib/utils';
import {
  Check, CheckCheck, Clock, Reply, Smile, Trash2,
  Download, FileText, Hourglass
} from 'lucide-react';

interface Props {
  message: Message;
  isGroup: boolean;
  onScrollToMessage?: (id: string) => void;
}

const QUICK_EMOJIS = ['❤️', '👍', '👎', '😂', '😮', '😢'];

export function MessageBubble({ message, isGroup, onScrollToMessage }: Props) {
  const { currentUser } = useAuth();
  const { toggleReaction, setReplyToMessage, deleteMessage } = useChat();

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const isMine = message.sender.id === currentUser?.id;
  const isSystem = message.message_type === 'system';

  // Handle functional disappearing message countdown
  useEffect(() => {
    if (!message.expires_at) return;
    const calculateRemaining = () => {
      const now = new Date().getTime();
      const expire = new Date(message.expires_at!).getTime();
      const diff = Math.max(0, Math.floor((expire - now) / 1000));
      setRemainingSeconds(diff);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [message.expires_at]);

  if (remainingSeconds !== null && remainingSeconds <= 0) {
    return null; // Expired disappearing message
  }

  // System Message (e.g. End-to-end encrypted notification, group member changes, timer updates)
  if (isSystem) {
    return (
      <div className="flex justify-center my-3 px-4 select-none">
        <div className="max-w-md px-3.5 py-1.5 rounded-full bg-[#262626]/70 border border-[#383a40]/50 text-center text-xs text-gray-300 shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  // Group reactions by emoji
  const reactionsByEmoji: { [emoji: string]: Reaction[] } = {};
  for (const r of message.reactions) {
    if (!reactionsByEmoji[r.emoji]) reactionsByEmoji[r.emoji] = [];
    reactionsByEmoji[r.emoji].push(r);
  }

  return (
    <div
      id={`message-${message.id}`}
      className={`group relative flex flex-col my-1 px-4 transition-colors ${
        isMine ? 'items-end' : 'items-start'
      }`}
    >
      {/* Floating Action Menu on Hover (Signal Desktop style) */}
      <div
        className={`absolute -top-3 z-10 hidden group-hover:flex items-center space-x-0.5 bg-[#28292d] border border-[#383a40] rounded-full shadow-lg px-1.5 py-0.5 animate-in fade-in zoom-in-95 duration-100 ${
          isMine ? 'right-6' : 'left-6'
        }`}
      >
        {/* Quick Emoji Bar */}
        <div className="flex items-center space-x-0.5 pr-1 border-r border-[#383a40]">
          {QUICK_EMOJIS.slice(0, 4).map((emoji) => (
            <button
              key={emoji}
              onClick={() => toggleReaction(message.id, emoji)}
              className="w-6 h-6 flex items-center justify-center hover:scale-125 transition-transform text-xs"
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Reply Action */}
        <button
          onClick={() => setReplyToMessage(message)}
          title="Reply"
          className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-[#383a40]"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>

        {/* Delete Action (only for own messages) */}
        {isMine && (
          <button
            onClick={() => deleteMessage(message.id)}
            title="Delete"
            className="p-1 text-gray-400 hover:text-red-400 rounded-full hover:bg-[#383a40]"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Expanded Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          className={`absolute top-6 z-20 flex items-center space-x-1.5 bg-[#28292d] border border-[#383a40] rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in-95 ${
            isMine ? 'right-6' : 'left-6'
          }`}
        >
          {['❤️', '👍', '👎', '😂', '😮', '😢', '🔥', '🎉', '🚀', '🙏', '💯', '👏'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                toggleReaction(message.id, emoji);
                setShowEmojiPicker(false);
              }}
              className="text-base hover:scale-125 transition-transform p-0.5"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Sender Name in Group Chat */}
      {isGroup && !isMine && (
        <span
          className="text-[11px] font-semibold mb-1 ml-1 select-none"
          style={{ color: message.sender.avatar_color || '#2090ea' }}
        >
          {message.sender.display_name}
        </span>
      )}

      {/* Message Bubble Body */}
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] px-3.5 py-2 shadow-sm ${
          isMine
            ? 'bg-[#2090ea] text-white rounded-2xl rounded-br-xs'
            : 'bg-[#2c2c2e] text-white rounded-2xl rounded-bl-xs'
        }`}
      >
        {/* Quoted Message / Reply Preview */}
        {message.reply_to && (
          <div
            onClick={() => onScrollToMessage && onScrollToMessage(message.reply_to!.id)}
            className={`mb-2 p-2 rounded-lg cursor-pointer border-l-3 text-xs transition-opacity hover:opacity-90 ${
              isMine
                ? 'bg-black/20 border-white/80 text-white/90'
                : 'bg-black/25 border-[#2090ea] text-gray-200'
            }`}
          >
            <div className="font-semibold text-[11px] text-[#2090ea] dark:text-[#60a5fa] mb-0.5">
              {message.reply_to.sender_name}
            </div>
            <div className="line-clamp-2 text-[11px] opacity-80">
              {message.reply_to.content}
            </div>
          </div>
        )}

        {/* Attachment Images */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-1.5 mb-1.5">
            {message.attachments.map((att) => {
              const isImg = att.file_type.startsWith('image/');
              return isImg ? (
                <div key={att.id} className="rounded-xl overflow-hidden max-h-80 bg-black/20">
                  <img
                    src={att.file_url.startsWith('http') ? att.file_url : `http://localhost:8000${att.file_url}`}
                    alt={att.file_name}
                    className="w-full h-auto object-cover hover:scale-[1.01] transition-transform cursor-pointer"
                    onClick={() => window.open(att.file_url.startsWith('http') ? att.file_url : `http://localhost:8000${att.file_url}`, '_blank')}
                  />
                </div>
              ) : (
                <a
                  key={att.id}
                  href={att.file_url.startsWith('http') ? att.file_url : `http://localhost:8000${att.file_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-2.5 p-2 rounded-xl bg-black/20 hover:bg-black/30 transition-colors"
                >
                  <FileText className="w-5 h-5 text-gray-200" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{att.file_name}</div>
                    <div className="text-[10px] opacity-75">{formatFileSize(att.file_size)}</div>
                  </div>
                  <Download className="w-4 h-4 opacity-75 hover:opacity-100" />
                </a>
              );
            })}
          </div>
        )}

        {/* Text Content */}
        {message.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}

        {/* Footer: Disappearing Countdown + Timestamp + Delivery Receipts */}
        <div
          className={`flex items-center justify-end space-x-1.5 mt-1 text-[10px] select-none ${
            isMine ? 'text-white/75' : 'text-gray-400'
          }`}
        >
          {/* Disappearing Timer Pill */}
          {remainingSeconds !== null && (
            <span className="flex items-center space-x-0.5 text-amber-300 font-mono">
              <Hourglass className="w-2.5 h-2.5" />
              <span>{remainingSeconds}s</span>
            </span>
          )}

          {/* Time */}
          <span>{formatTime(message.created_at)}</span>

          {/* Single / Double Checkmarks for sent messages */}
          {isMine && (
            <span className="ml-0.5">
              {message.status === 'sending' && <Clock className="w-3 h-3 text-white/60" />}
              {message.status === 'sent' && <Check className="w-3 h-3 text-white/80" />}
              {message.status === 'delivered' && <CheckCheck className="w-3.5 h-3.5 text-white/90" />}
              {message.status === 'read' && <CheckCheck className="w-3.5 h-3.5 text-white" />}
            </span>
          )}
        </div>
      </div>

      {/* Emoji Reaction Badges Below Bubble */}
      {Object.keys(reactionsByEmoji).length > 0 && (
        <div className={`flex flex-wrap gap-1 mt-1 z-10 ${isMine ? 'justify-end mr-1' : 'justify-start ml-1'}`}>
          {Object.entries(reactionsByEmoji).map(([emoji, list]) => {
            const hasMyReaction = list.some((r) => r.user_id === currentUser?.id);
            return (
              <button
                key={emoji}
                onClick={() => toggleReaction(message.id, emoji)}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs transition-all shadow-sm ${
                  hasMyReaction
                    ? 'bg-[#2090ea]/20 border border-[#2090ea] text-white'
                    : 'bg-[#28292d] hover:bg-[#323338] border border-[#383a40] text-gray-300'
                }`}
                title={list.map((r) => r.user_name).join(', ')}
              >
                <span>{emoji}</span>
                <span className="text-[10px] font-semibold">{list.length}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
