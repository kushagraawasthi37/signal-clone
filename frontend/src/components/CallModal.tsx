'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { getInitials } from '@/lib/utils';
import {
  PhoneOff, Mic, MicOff, Video, VideoOff, Lock, Volume2
} from 'lucide-react';

export function CallModal() {
  const { activeModal, setActiveModal, activeConversation } = useChat();
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);

  useEffect(() => {
    if (activeModal === 'call') {
      setSeconds(0);
      const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [activeModal]);

  if (activeModal !== 'call') return null;

  const targetName = activeConversation?.name || 'Signal Call';
  const formatCallTime = (total: number) => {
    const mins = Math.floor(total / 60).toString().padStart(2, '0');
    const secs = (total % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm flex flex-col items-center text-center text-white">
        {/* End-to-End Encryption Banner */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-gray-300 mb-8 border border-white/10">
          <Lock className="w-3.5 h-3.5 text-[#2090ea]" />
          <span>Signal End-to-End Encrypted</span>
        </div>

        {/* Pulsing Avatar Visualizer */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-[#2090ea]/20 animate-ping" />
          <div className="absolute -inset-4 rounded-full bg-[#2090ea]/10 animate-pulse" />
          <div className="relative w-28 h-28 rounded-full bg-[#2090ea] flex items-center justify-center text-white font-bold text-3xl shadow-2xl border-4 border-[#1f2024]">
            {activeConversation?.avatar_url ? (
              <img src={activeConversation.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(targetName)
            )}
          </div>
        </div>

        {/* Names and Timer */}
        <h3 className="text-xl font-bold tracking-tight mb-1">{targetName}</h3>
        <p className="text-sm text-emerald-400 font-mono font-medium mb-12">
          Connected • {formatCallTime(seconds)}
        </p>

        {/* Call Controls */}
        <div className="flex items-center space-x-4">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-13 h-13 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-red-500/80 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={() => setActiveModal(null)}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-xl hover:scale-105 transition-all"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          {/* Video Toggle Button */}
          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`w-13 h-13 rounded-full flex items-center justify-center transition-all ${
              isVideoOn ? 'bg-[#2090ea] text-white' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}

