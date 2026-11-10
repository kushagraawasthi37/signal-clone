'use client';

import React from 'react';
import { useChat } from '@/context/ChatContext';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Shield, Lock, MessageSquarePlus, Sparkles } from 'lucide-react';

export function ChatPane() {
  const { activeConversation, setActiveModal } = useChat();

  if (!activeConversation) {
    return (
      <main className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#121212] select-none p-6 text-center">
        <div className="max-w-md flex flex-col items-center">
          {/* Signal Minimal Shield Icon */}
          <div className="w-20 h-20 rounded-3xl bg-[#1b1b1b] border border-[#2a2a2a] flex items-center justify-center text-[#2090ea] shadow-xl mb-6">
            <Shield className="w-10 h-10 fill-current opacity-90" />
          </div>

          <h2 className="text-xl font-bold text-gray-100 mb-2">Signal for Desktop</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Send and receive high-fidelity, end-to-end encrypted messages and media with complete privacy.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => setActiveModal('new_chat')}
              className="px-5 py-2.5 bg-[#2090ea] hover:bg-[#1b7fd1] text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-[#2090ea]/20 flex items-center space-x-2"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>New Conversation</span>
            </button>
            <button
              onClick={() => setActiveModal('stories')}
              className="px-4 py-2.5 bg-[#1e1e1e] hover:bg-[#282828] text-gray-300 text-sm font-medium rounded-xl border border-[#2e2f33] transition-colors flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>View Stories</span>
            </button>
          </div>

          <div className="mt-12 flex items-center space-x-2 text-xs text-gray-500">
            <Lock className="w-3.5 h-3.5 text-[#2090ea]" />
            <span>Double Ratchet Cryptographic Protocol Verified</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-[#121212] overflow-hidden">
      <ChatHeader />
      <MessageList />
      <MessageInput />
    </main>
  );
}
