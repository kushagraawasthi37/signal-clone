'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { ConversationItem } from './ConversationItem';
import { getInitials } from '@/lib/utils';
import {
  Search, Edit3, Settings, Shield, Plus, Sparkles, X,
  Command, Users, Lock, ChevronDown, UserCheck
} from 'lucide-react';

export function Sidebar() {
  const { currentUser, setShowAuthModal } = useAuth();
  const {
    conversations,
    activeConversation,
    selectConversation,
    filterTab,
    setFilterTab,
    searchQuery,
    setSearchQuery,
    setActiveModal
  } = useChat();

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Tab filter
      if (filterTab === 'unread' && c.unread_count === 0) return false;
      if (filterTab === 'groups' && !c.is_group) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (c.name || '').toLowerCase().includes(q);
        const matchesLastMsg = (c.last_message?.content || '').toLowerCase().includes(q);
        const matchesMember = c.members.some((m) => m.user.display_name.toLowerCase().includes(q));
        return matchesName || matchesLastMsg || matchesMember;
      }
      return true;
    });
  }, [conversations, filterTab, searchQuery]);

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-[#1b1b1b] border-r border-[#262626] select-none shrink-0">
      {/* Top Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-[#262626]">
        <div
          onClick={() => setActiveModal('settings')}
          className="flex items-center space-x-2.5 cursor-pointer hover:opacity-85 transition-opacity"
        >
          {/* User Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/10"
            style={{ backgroundColor: currentUser?.avatar_color || '#2090ea' }}
          >
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt={currentUser.display_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(currentUser?.display_name)
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-gray-100 flex items-center space-x-1">
              <span>{currentUser?.display_name || 'Signal'}</span>
            </span>
            <span className="text-[10px] text-gray-400 font-mono">@{currentUser?.username}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          {/* Quick Demo Switcher Pill */}
          <button
            onClick={() => setShowAuthModal(true)}
            title="Switch User / Demo Accounts"
            className="px-2 py-1 bg-[#282828] hover:bg-[#323338] text-[11px] text-[#2090ea] font-medium rounded-lg border border-[#383a40] transition-colors flex items-center space-x-1 mr-1"
          >
            <UserCheck className="w-3 h-3" />
            <span>Switch</span>
          </button>

          {/* New Chat Pencil Button */}
          <button
            onClick={() => setActiveModal('new_chat')}
            title="New Chat or Group"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#282828] transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setActiveModal('settings')}
            title="Settings"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#282828] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 pb-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-gray-400 pointer-events-none" />
          <input
            id="signal-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-8 py-1.5 bg-[#262626] hover:bg-[#2a2a2a] focus:bg-[#2c2c2e] border border-transparent focus:border-[#2090ea]/50 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none transition-all"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="absolute right-2.5 text-[10px] text-gray-500 font-mono hidden md:block">
              Ctrl+K
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 pb-2 flex items-center space-x-1 border-b border-[#262626]/70">
        {(['all', 'unread', 'groups'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
              filterTab === tab
                ? 'bg-[#2090ea] text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#262626]'
            }`}
          >
            {tab}
          </button>
        ))}

        {/* Stories Shortcut */}
        <button
          onClick={() => setActiveModal('stories')}
          className="ml-auto text-xs text-gray-400 hover:text-[#2090ea] transition-colors flex items-center space-x-1 py-1 px-2 rounded-lg hover:bg-[#262626]"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Stories</span>
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-transparent py-1 scrollbar-thin scrollbar-thumb-gray-700">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs">
            {searchQuery ? 'No conversations found matching your search' : 'No conversations yet'}
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={activeConversation?.id === conv.id}
              onClick={() => selectConversation(conv)}
            />
          ))
        )}
      </div>

      {/* Bottom Status & End-to-End Encryption Banner */}
      <div className="p-2.5 px-3 border-t border-[#262626] bg-[#181818] flex items-center justify-between text-[11px] text-gray-400">
        <div
          onClick={() => setActiveModal('shortcuts')}
          className="flex items-center space-x-1.5 cursor-pointer hover:text-white transition-colors"
        >
          <Lock className="w-3 h-3 text-[#2090ea]" />
          <span>Signal Protocol Verified</span>
        </div>
        <button
          onClick={() => setActiveModal('shortcuts')}
          className="text-[10px] text-gray-500 hover:text-gray-300 font-mono"
        >
          Ctrl+/ for keys
        </button>
      </div>
    </aside>
  );
}

