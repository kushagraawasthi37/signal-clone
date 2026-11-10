'use client';

import React, { useEffect, useRef } from 'react';
import { useChat } from '@/context/ChatContext';
import { MessageBubble } from './MessageBubble';
import { formatDateDivider } from '@/lib/utils';
import { Lock, Shield, Hourglass } from 'lucide-react';

export function MessageList() {
  const { activeConversation, messages, isLoadingMessages } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on messages load
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`message-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-[#2090ea]/10', 'rounded-xl');
      setTimeout(() => {
        el.classList.remove('bg-[#2090ea]/10', 'rounded-xl');
      }, 1500);
    }
  };

  if (!activeConversation) return null;

  // Group messages by date divider
  let lastDateDivider = '';

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto px-2 py-4 space-y-2 bg-[#121212] select-text scrollbar-thin scrollbar-thumb-gray-800"
    >
      {/* End-to-End Encryption Security Card */}
      <div className="flex justify-center my-4 px-4 select-none">
        <div className="max-w-md p-3.5 rounded-2xl bg-[#1b1b1b] border border-[#2a2a2a] text-center shadow-md">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-[#2090ea]/10 flex items-center justify-center text-[#2090ea]">
            <Lock className="w-4 h-4" />
          </div>
          <div className="text-xs font-semibold text-gray-200">
            End-to-End Encrypted
          </div>
          <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
            Messages and calls are end-to-end encrypted. No one outside of this chat, not even Signal, can read or listen to them.
          </p>
          {activeConversation.disappearing_timer_seconds > 0 && (
            <div className="mt-2 inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px]">
              <Hourglass className="w-3 h-3" />
              <span>Disappearing messages enabled</span>
            </div>
          )}
        </div>
      </div>

      {isLoadingMessages ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#2090ea] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 text-xs text-gray-500">
          No messages yet. Send a message to start the conversation!
        </div>
      ) : (
        messages.map((msg) => {
          const divider = formatDateDivider(msg.created_at);
          const showDivider = divider !== lastDateDivider;
          if (showDivider) {
            lastDateDivider = divider;
          }

          return (
            <React.Fragment key={msg.id}>
              {showDivider && (
                <div className="flex justify-center my-4 select-none">
                  <span className="px-3 py-1 bg-[#1e1e1e] border border-[#2c2c2e] rounded-full text-[11px] font-medium text-gray-400 shadow-sm">
                    {divider}
                  </span>
                </div>
              )}
              <MessageBubble
                message={msg}
                isGroup={activeConversation.is_group}
                onScrollToMessage={scrollToMessage}
              />
            </React.Fragment>
          );
        })
      )}

      <div ref={bottomRef} />
    </div>
  );
}

