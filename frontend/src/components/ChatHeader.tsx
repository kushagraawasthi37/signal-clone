'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { formatDisappearingTimer, getInitials } from '@/lib/utils';
import {
  Phone, Video, Search, MoreVertical, ArrowLeft, Hourglass,
  ShieldCheck, Info, BellOff, Trash2, Users, Lock
} from 'lucide-react';

export function ChatHeader() {
  const { currentUser } = useAuth();
  const {
    activeConversation,
    selectConversation,
    onlineUsers,
    setActiveModal,
    setSelectedUserForSafetyNumber
  } = useChat();

  const [showMenu, setShowMenu] = useState(false);

  if (!activeConversation) return null;

  const isGroup = activeConversation.is_group;
  const otherUser = activeConversation.other_user;
  const isSelf = !isGroup && otherUser?.id === currentUser?.id;
  const isOnline = otherUser ? (onlineUsers[otherUser.id] ?? otherUser.is_online) : false;

  const avatarColor = isGroup ? '#125199' : (otherUser?.avatar_color || '#2090ea');

  const handleHeaderClick = () => {
    if (isGroup) {
      setActiveModal('group_info');
    } else if (otherUser && !isSelf) {
      setSelectedUserForSafetyNumber(otherUser);
      setActiveModal('safety_number');
    }
  };

  return (
    <header className="h-16 px-4 bg-[#1e1e1e] border-b border-[#262626] flex items-center justify-between select-none relative z-20 shrink-0">
      {/* Left: Back button (mobile) + Avatar + Info */}
      <div className="flex items-center space-x-3 min-w-0">
        {/* Mobile back button */}
        <button
          onClick={() => (selectConversation as any)(null)}
          className="md:hidden p-1.5 -ml-1 text-gray-400 hover:text-white rounded-lg hover:bg-[#282828]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <div
          onClick={handleHeaderClick}
          className="relative cursor-pointer hover:opacity-90 transition-opacity shrink-0"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm"
            style={{ backgroundColor: avatarColor }}
          >
            {activeConversation.avatar_url ? (
              <img
                src={activeConversation.avatar_url}
                alt={activeConversation.name || 'Chat'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : isGroup ? (
              <Users className="w-5 h-5 text-white" />
            ) : (
              getInitials(activeConversation.name)
            )}
          </div>
          {!isGroup && !isSelf && isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#1e1e1e] rounded-full" />
          )}
        </div>

        {/* Titles & Presence */}
        <div onClick={handleHeaderClick} className="min-w-0 cursor-pointer">
          <div className="flex items-center space-x-1.5">
            <h1 className="font-semibold text-sm text-gray-100 truncate">
              {activeConversation.name}
            </h1>
            {!isGroup && !isSelf && (
              <span title="Safety Number Verified">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2090ea] shrink-0" />
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 truncate">
            {isSelf ? (
              <span>Encrypted personal notes</span>
            ) : isGroup ? (
              <span>{activeConversation.members.length} members • tap for group details</span>
            ) : isOnline ? (
              <span className="text-emerald-400 font-medium">Online</span>
            ) : (
              <span>Last seen recently</span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-1">
        {/* Disappearing Messages Pill Button */}
        <button
          onClick={() => setActiveModal('disappearing')}
          title="Disappearing Messages Setting"
          className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors ${
            activeConversation.disappearing_timer_seconds > 0
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-gray-400 hover:text-white hover:bg-[#282828]'
          }`}
        >
          <Hourglass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {activeConversation.disappearing_timer_seconds > 0
              ? formatDisappearingTimer(activeConversation.disappearing_timer_seconds)
              : 'Timer'}
          </span>
        </button>

        {/* Voice Call (Mocked Signal Call modal) */}
        {!isSelf && (
          <button
            onClick={() => setActiveModal('call')}
            title="Start Encrypted Voice Call"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#282828] transition-colors"
          >
            <Phone className="w-4 h-4" />
          </button>
        )}

        {/* Video Call (Mocked Signal Call modal) */}
        {!isSelf && (
          <button
            onClick={() => setActiveModal('call')}
            title="Start Encrypted Video Call"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#282828] transition-colors"
          >
            <Video className="w-4 h-4" />
          </button>
        )}

        {/* More Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#282828] transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-11 w-52 bg-[#28292d] border border-[#383a40] rounded-xl shadow-2xl py-1 text-xs text-gray-200 z-50 animate-in fade-in zoom-in-95 duration-150"
              onClick={() => setShowMenu(false)}
            >
              {isGroup && (
                <button
                  onClick={() => setActiveModal('group_info')}
                  className="w-full px-4 py-2.5 text-left hover:bg-[#323338] flex items-center space-x-2"
                >
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>Group Settings & Members</span>
                </button>
              )}

              {!isGroup && otherUser && !isSelf && (
                <button
                  onClick={() => {
                    setSelectedUserForSafetyNumber(otherUser);
                    setActiveModal('safety_number');
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-[#323338] flex items-center space-x-2"
                >
                  <Lock className="w-4 h-4 text-[#2090ea]" />
                  <span>View Safety Number</span>
                </button>
              )}

              <button
                onClick={() => setActiveModal('disappearing')}
                className="w-full px-4 py-2.5 text-left hover:bg-[#323338] flex items-center space-x-2"
              >
                <Hourglass className="w-4 h-4 text-amber-400" />
                <span>Disappearing Messages</span>
              </button>

              <div className="my-1 border-t border-[#383a40]" />

              <button
                onClick={() => alert('Notifications muted for this conversation.')}
                className="w-full px-4 py-2.5 text-left hover:bg-[#323338] flex items-center space-x-2 text-gray-300"
              >
                <BellOff className="w-4 h-4 text-gray-400" />
                <span>Mute Notifications</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
