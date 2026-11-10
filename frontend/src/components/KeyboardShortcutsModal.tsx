'use client';

import React from 'react';
import { useChat } from '@/context/ChatContext';
import { X, Command, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { key: 'Ctrl + K', action: 'Search conversations and contacts' },
  { key: 'Enter', action: 'Send message' },
  { key: 'Shift + Enter', action: 'Add new line in message' },
  { key: 'Esc', action: 'Close dialog or deselect active conversation' },
  { key: 'Ctrl + /', action: 'Toggle this keyboard shortcuts dialog' },
  { key: 'Ctrl + Shift + C', action: 'Start encrypted call' },
];

export function KeyboardShortcutsModal() {
  const { activeModal, setActiveModal } = useChat();

  if (activeModal !== 'shortcuts') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#1f2024] border border-[#2a2b2f] rounded-2xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2b2f]">
          <h3 className="font-semibold text-base text-gray-100 flex items-center space-x-2">
            <Keyboard className="w-5 h-5 text-[#2090ea]" />
            <span>Keyboard Shortcuts</span>
          </h3>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-[#282828]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2.5">
          {SHORTCUTS.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#28292d] border border-[#383a40]"
            >
              <span className="text-xs text-gray-300">{s.action}</span>
              <kbd className="px-2.5 py-1 bg-[#1c1d20] border border-[#484a50] rounded-lg text-xs font-mono text-[#2090ea] font-semibold">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

