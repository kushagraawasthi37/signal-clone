'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { User } from '@/lib/types';
import { getInitials } from '@/lib/utils';
import {
  X, Search, UserPlus, Users, ArrowRight, Check, Shield
} from 'lucide-react';

export function NewChatModal() {
  const { activeModal, setActiveModal, startDirectChatWithUser, createNewGroup } = useChat();
  const { currentUser } = useAuth();

  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupStep, setGroupStep] = useState<'members' | 'details'>('members');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeModal === 'new_chat') {
      api.getDemoUsers().then((users: User[]) => {
        setAllUsers(users.filter((u: User) => u.id !== currentUser?.id));
      }).catch(console.error);
    }
  }, [activeModal, currentUser]);

  if (activeModal !== 'new_chat') return null;

  const filteredUsers = allUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.display_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.phone_number.includes(q)
    );
  });

  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUserIds.length === 0) return;

    setLoading(true);
    try {
      await createNewGroup(groupName.trim(), selectedUserIds, groupDescription.trim());
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#1f2024] border border-[#2a2b2f] rounded-2xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2b2f]">
          <h3 className="font-semibold text-base text-gray-100">
            {mode === 'direct' ? 'New Conversation' : groupStep === 'members' ? 'New Group: Add Members' : 'New Group: Details'}
          </h3>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-[#282828]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex border-b border-[#2a2b2f] text-xs">
          <button
            onClick={() => { setMode('direct'); setGroupStep('members'); }}
            className={`flex-1 py-2.5 font-medium flex items-center justify-center space-x-1.5 transition-colors border-b-2 ${
              mode === 'direct'
                ? 'border-[#2090ea] text-[#2090ea] bg-[#2090ea]/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Direct Chat</span>
          </button>
          <button
            onClick={() => setMode('group')}
            className={`flex-1 py-2.5 font-medium flex items-center justify-center space-x-1.5 transition-colors border-b-2 ${
              mode === 'group'
                ? 'border-[#2090ea] text-[#2090ea] bg-[#2090ea]/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Group Chat</span>
          </button>
        </div>

        {/* MODE: DIRECT CHAT */}
        {mode === 'direct' && (
          <div className="p-4">
            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find by name, username, or phone..."
                className="w-full pl-9 pr-4 py-2 bg-[#28292d] border border-[#383a40] rounded-xl text-white text-xs focus:outline-none focus:border-[#2090ea] transition-colors"
              />
            </div>

            {/* Users List */}
            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500">No users found</div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => startDirectChatWithUser(user)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#28292d] transition-colors text-left group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
                        style={{ backgroundColor: user.avatar_color || '#2090ea' }}
                      >
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.display_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(user.display_name)
                        )}
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-semibold text-white group-hover:text-[#2090ea] transition-colors truncate">
                          {user.display_name}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {user.phone_number} • @{user.username}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-[#2090ea] transition-transform group-hover:translate-x-1" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* MODE: GROUP CHAT */}
        {mode === 'group' && groupStep === 'members' && (
          <div className="p-4">
            <div className="text-xs text-gray-400 mb-2">
              Select members to include in the group ({selectedUserIds.length} selected):
            </div>

            {/* Selected Chips */}
            {selectedUserIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-[#28292d] rounded-xl max-h-24 overflow-y-auto">
                {selectedUserIds.map((uid) => {
                  const u = allUsers.find((x) => x.id === uid);
                  return (
                    <span
                      key={uid}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#2090ea]/20 border border-[#2090ea]/40 text-[#2090ea] text-xs font-medium"
                    >
                      <span>{u?.display_name.split(' ')[0]}</span>
                      <button onClick={() => toggleUserSelection(uid)}>
                        <X className="w-3 h-3 hover:text-white" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-9 pr-4 py-2 bg-[#28292d] border border-[#383a40] rounded-xl text-white text-xs focus:outline-none focus:border-[#2090ea]"
              />
            </div>

            {/* Users Checkbox List */}
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {filteredUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#28292d] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                        style={{ backgroundColor: user.avatar_color || '#2090ea' }}
                      >
                        {getInitials(user.display_name)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{user.display_name}</div>
                        <div className="text-xs text-gray-400">{user.phone_number}</div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-[#2090ea] border-[#2090ea] text-white'
                          : 'border-gray-500 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-3" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-[#2a2b2f] flex justify-end">
              <button
                type="button"
                disabled={selectedUserIds.length === 0}
                onClick={() => setGroupStep('details')}
                className="px-4 py-2 bg-[#2090ea] hover:bg-[#1b7fd1] disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium text-xs rounded-xl transition-colors flex items-center space-x-1.5"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* MODE: GROUP CHAT DETAILS */}
        {mode === 'group' && groupStep === 'details' && (
          <form onSubmit={handleCreateGroup} className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Signal Developers"
                required
                className="w-full px-3 py-2 bg-[#28292d] border border-[#383a40] rounded-xl text-white text-sm focus:outline-none focus:border-[#2090ea]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Description (optional)</label>
              <textarea
                rows={2}
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="What is this group about?"
                className="w-full px-3 py-2 bg-[#28292d] border border-[#383a40] rounded-xl text-white text-xs focus:outline-none focus:border-[#2090ea] resize-none"
              />
            </div>

            <div className="text-xs text-gray-400">
              {selectedUserIds.length + 1} members will join this encrypted group.
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setGroupStep('members')}
                className="px-4 py-2 bg-[#28292d] hover:bg-[#323338] text-gray-300 text-xs font-medium rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !groupName.trim()}
                className="px-5 py-2 bg-[#2090ea] hover:bg-[#1b7fd1] text-white text-xs font-medium rounded-xl transition-colors flex items-center space-x-1.5 shadow-lg shadow-[#2090ea]/20"
              >
                <span>Create Group</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
