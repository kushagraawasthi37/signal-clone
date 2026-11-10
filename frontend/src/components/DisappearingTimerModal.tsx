'use client';

import React from 'react';
import { useChat } from '@/context/ChatContext';
import { X, Hourglass, Check } from 'lucide-react';

const TIMER_OPTIONS = [
  { label: 'Off', seconds: 0, description: 'Messages do not disappear' },
  { label: '30 seconds', seconds: 30, description: 'Quick demo mode' },
  { label: '5 minutes', seconds: 300, description: 'Brief discussions' },
  { label: '1 hour', seconds: 3600, description: 'Temporary conversations' },
  { label: '1 day', seconds: 86400, description: 'Daily cleanup' },
  { label: '1 week', seconds: 604800, description: 'Standard privacy default' },
];

export function DisappearingTimerModal() {
  const { activeModal, setActiveModal, activeConversation, setDisappearingTimer } = useChat();

  if (activeModal !== 'disappearing' || !activeConversation) return null;

  const currentSeconds = activeConversation.disappearing_timer_seconds;

  const handleSelect = async (seconds: number) => {
    await setDisappearingTimer(seconds);
    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#1f2024] border border-[#2a2b2f] rounded-2xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2b2f]">
          <h3 className="font-semibold text-base text-gray-100 flex items-center space-x-2">
            <Hourglass className="w-5 h-5 text-amber-400" />
            <span>Disappearing Messages</span>
          </h3>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-[#282828]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <div className="p-4 pb-2 text-xs text-gray-400 leading-relaxed">
          When enabled, new messages sent and received in this chat will disappear after they have been seen.
        </div>

        {/* Options List */}
        <div className="p-3 space-y-1">
          {TIMER_OPTIONS.map((opt) => {
            const isSelected = currentSeconds === opt.seconds;
            return (
              <button
                key={opt.seconds}
                onClick={() => handleSelect(opt.seconds)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                  isSelected
                    ? 'bg-[#2090ea]/15 border border-[#2090ea]/40 text-white'
                    : 'hover:bg-[#28292d] text-gray-300 border border-transparent'
                }`}
              >
                <div>
                  <div className={`text-sm font-semibold ${isSelected ? 'text-[#2090ea]' : 'text-white'}`}>
                    {opt.label}
                  </div>
                  <div className="text-[11px] text-gray-400">{opt.description}</div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#2090ea] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
