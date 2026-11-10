'use client';

import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { X, ShieldCheck, QrCode, CheckCircle2, Lock } from 'lucide-react';

export function SafetyNumberModal() {
  const { activeModal, setActiveModal, selectedUserForSafetyNumber, activeConversation } = useChat();
  const [isVerified, setIsVerified] = useState(true);

  if (activeModal !== 'safety_number') return null;

  const targetUser = selectedUserForSafetyNumber || activeConversation?.other_user;
  const safetyNumber = targetUser?.safety_number || '38192 48192 10492 84729 19384 72910 49201 38472 91029 48201 93847 29102';
  const chunks = safetyNumber.split(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#1f2024] border border-[#2a2b2f] rounded-2xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2b2f]">
          <h3 className="font-semibold text-base text-gray-100 flex items-center space-x-2">
            <Lock className="w-5 h-5 text-[#2090ea]" />
            <span>Verify Safety Number</span>
          </h3>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-[#282828]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <p className="text-xs text-gray-300 leading-relaxed mb-6">
            Compare the numbers below with <strong>{targetUser?.display_name || 'contact'}</strong>'s device, or scan their QR code to verify end-to-end encryption.
          </p>

          {/* QR Code Graphic Box */}
          <div className="w-44 h-44 mx-auto mb-6 bg-white p-3 rounded-2xl shadow-lg flex items-center justify-center border-4 border-[#2090ea]">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-black">
              {/* Authentic stylized QR matrix pattern */}
              <rect x="0" y="0" width="30" height="30" rx="3" fill="#000" />
              <rect x="5" y="5" width="20" height="20" fill="#fff" />
              <rect x="10" y="10" width="10" height="10" fill="#000" />

              <rect x="70" y="0" width="30" height="30" rx="3" fill="#000" />
              <rect x="75" y="5" width="20" height="20" fill="#fff" />
              <rect x="80" y="10" width="10" height="10" fill="#000" />

              <rect x="0" y="70" width="30" height="30" rx="3" fill="#000" />
              <rect x="5" y="75" width="20" height="20" fill="#fff" />
              <rect x="10" y="80" width="10" height="10" fill="#000" />

              <rect x="40" y="10" width="15" height="15" fill="#000" />
              <rect x="60" y="40" width="10" height="20" fill="#000" />
              <rect x="40" y="45" width="12" height="12" fill="#2090ea" />
              <rect x="45" y="75" width="15" height="15" fill="#000" />
              <rect x="75" y="75" width="20" height="10" fill="#000" />
            </svg>
          </div>

          {/* 12 Chunks of 5 Digits in 3x4 Grid */}
          <div className="grid grid-cols-3 gap-2.5 bg-[#28292d] p-4 rounded-xl border border-[#383a40] mb-6">
            {chunks.map((chunk, idx) => (
              <span key={idx} className="font-mono text-sm tracking-wider text-gray-200 text-center font-medium">
                {chunk}
              </span>
            ))}
          </div>

          {/* Verification Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-[#28292d] rounded-xl border border-[#383a40]">
            <div className="flex items-center space-x-2 text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs font-semibold text-white">Mark as verified</div>
                <div className="text-[10px] text-gray-400">Protects against man-in-the-middle attacks</div>
              </div>
            </div>
            <button
              onClick={() => setIsVerified(!isVerified)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                isVerified ? 'bg-[#2090ea]' : 'bg-gray-600'
              }`}
            >
              <span
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  isVerified ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
