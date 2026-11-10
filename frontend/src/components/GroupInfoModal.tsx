'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { User } from '@/lib/types';
import { getInitials } from '@/lib/utils';
import {
  X, Users, UserPlus, UserMinus, ShieldAlert, Shield, Check, Trash2, Edit2
} from 'lucide-react';

export function GroupInfoModal() {
  const { activeModal, setActiveModal, activeConversation, refreshConversations } = useChat();
  const { currentUser } = useAuth();

  const [isAdding, setIsAdding] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeModal === 'group_info') {
      api.getDemoUsers().then(setAllUsers).catch(console.error);
    }
  }, [activeModal]);

  if (activeModal !== 'group_info' || !activeConversation || !activeConversation.is_group) {
    return null;
  }

  const members = activeConversation.members;
  const currentMemberRecord = members.find((m) => m.user.id === currentUser?.id);
  const isAdmin = currentMemberRecord?.role === 'admin';

  // Available users to add (not already members)
  const availableUsers = allUsers.filter(
    (u) => !members.some((m) => m.user.id === u.id)
  );

  const handleAddMembers = async () => {
    if (selectedToAdd.length === 0) return;
    setLoading(true);
    try {
      await api.addGroupMembers(activeConversation.id, selectedToAdd);
      await refreshConversations();
      setIsAdding(false);
      setSelectedToAdd([]);
    } catch (err) {
      console.error('Failed to add members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.removeGroupMember(activeConversation.id, userId);
      await refreshConversations();
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#1f2024] border border-[#2a2b2f] rounded-2xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2b2f]">
          <h3 className="font-semibold text-base text-gray-100 flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#2090ea]" />
            <span>Group Details</span>
          </h3>
          <button
            onClick={() => { setActiveModal(null); setIsAdding(false); }}
            className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-[#282828]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Group Banner */}
        <div className="p-6 text-center border-b border-[#2a2b2f] bg-[#1a1b1e]">
          <div className="w-16 h-16 rounded-full bg-[#125199] mx-auto flex items-center justify-center text-white shadow-lg mb-3">
            {activeConversation.avatar_url ? (
              <img src={activeConversation.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <Users className="w-8 h-8" />
            )}
          </div>
          <h4 className="font-bold text-lg text-white">{activeConversation.name}</h4>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            {activeConversation.description || 'End-to-end encrypted group'}
          </p>
          <div className="text-xs text-[#2090ea] font-medium mt-2">
            {members.length} members
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {!isAdding ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Members
                </span>
                <button
                  onClick={() => setIsAdding(true)}
                  className="text-xs text-[#2090ea] hover:underline flex items-center space-x-1 font-medium"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#28292d] border border-transparent hover:border-[#383a40]"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
                        style={{ backgroundColor: member.user.avatar_color || '#2090ea' }}
                      >
                        {getInitials(member.user.display_name)}
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-medium text-white flex items-center space-x-1.5 truncate">
                          <span>{member.user.display_name}</span>
                          {member.user.id === currentUser?.id && (
                            <span className="text-[10px] text-gray-400">(You)</span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">{member.user.phone_number}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          member.role === 'admin'
                            ? 'bg-[#2090ea]/20 text-[#2090ea] border border-[#2090ea]/40'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {member.role === 'admin' ? 'Admin' : 'Member'}
                      </span>

                      {/* Admin action: remove member */}
                      {isAdmin && member.user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleRemoveMember(member.user.id)}
                          title="Remove from group"
                          className="p-1 text-gray-400 hover:text-red-400 rounded-lg hover:bg-[#323338]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-300">Select users to add:</span>
                <button
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 mb-3">
                {availableUsers.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-500">
                    All demo users are already in this group.
                  </div>
                ) : (
                  availableUsers.map((u) => {
                    const isSelected = selectedToAdd.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedToAdd(selectedToAdd.filter((id) => id !== u.id));
                          } else {
                            setSelectedToAdd([...selectedToAdd, u.id]);
                          }
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-[#28292d] cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: u.avatar_color || '#2090ea' }}
                          >
                            {getInitials(u.display_name)}
                          </div>
                          <span className="text-sm font-medium">{u.display_name}</span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isSelected ? 'bg-[#2090ea] border-[#2090ea]' : 'border-gray-500'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                onClick={handleAddMembers}
                disabled={loading || selectedToAdd.length === 0}
                className="w-full py-2 bg-[#2090ea] hover:bg-[#1b7fd1] disabled:bg-gray-700 text-white text-xs font-medium rounded-xl transition-colors"
              >
                Add Selected to Group
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
