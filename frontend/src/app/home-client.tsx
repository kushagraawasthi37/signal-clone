// This file is a **client component** that contains the main UI logic.
// It is rendered by the server-side `page.tsx` wrapper.

'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { Sidebar } from '@/components/Sidebar';
import { ChatPane } from '@/components/ChatPane';
import { AuthModal } from '@/components/AuthModal';
import { NewChatModal } from '@/components/NewChatModal';
import { GroupInfoModal } from '@/components/GroupInfoModal';
import { SettingsModal } from '@/components/SettingsModal';
import { SafetyNumberModal } from '@/components/SafetyNumberModal';
import { CallModal } from '@/components/CallModal';
import { StoriesModal } from '@/components/StoriesModal';
import { LinkedDevicesModal } from '@/components/LinkedDevicesModal';
import { DisappearingTimerModal } from '@/components/DisappearingTimerModal';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';

export default function HomeClient() {
  const { isLoading } = useAuth();
  const {
    activeConversation,
    selectConversation,
    activeModal,
    setActiveModal,
  } = useChat();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('signal-search-input') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }

      // Escape: Close modals or clear active chat
      if (e.key === 'Escape') {
        if (activeModal) {
          setActiveModal(null);
        } else if (activeConversation) {
          (selectConversation as any)(null);
        }
      }

      // Ctrl+/ : Toggle shortcuts cheatsheet
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setActiveModal(activeModal === 'shortcuts' ? null : 'shortcuts');
      }

      // Ctrl+Shift+C : Call modal
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (activeConversation) {
          setActiveModal('call');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, activeConversation, setActiveModal, selectConversation]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#121212] text-white">
        <div className="w-12 h-12 rounded-2xl bg-[#2090ea] flex items-center justify-center shadow-lg shadow-[#2090ea]/20 mb-4 animate-pulse">
          <span className="text-2xl font-bold">💬</span>
        </div>
        <div className="text-sm font-semibold tracking-wide text-gray-200">Signal Messenger</div>
        <div className="text-xs text-gray-500 mt-1">Connecting securely...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#121212] text-gray-100 font-sans antialiased">
      {/* Sidebar: Visible on desktop, or mobile when no chat is open */}
      <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} w-full md:w-auto h-full`}>
        <Sidebar />
      </div>

      {/* Main Chat Pane: Hidden on mobile when no chat is open */}
      <div className={`${!activeConversation ? 'hidden md:flex' : 'flex'} flex-1 h-full`}>
        <ChatPane />
      </div>

      {/* Modals & Dialogs */}
      <AuthModal />
      <NewChatModal />
      <GroupInfoModal />
      <SettingsModal />
      <SafetyNumberModal />
      <CallModal />
      <StoriesModal />
      <LinkedDevicesModal />
      <DisappearingTimerModal />
      <KeyboardShortcutsModal />
    </div>
  );
}

