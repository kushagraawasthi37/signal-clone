'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useTheme } from '@/context/ThemeContext';
import { sounds } from '@/lib/sounds';
import { getInitials, AVATAR_COLORS } from '@/lib/utils';
import {
  X, User as UserIcon, Moon, Sun, Shield, Bell,
  Laptop, Keyboard, Info, LogOut, Check, Save, Lock
} from 'lucide-react';

export function SettingsModal() {
  const { currentUser, updateProfile, logout } = useAuth();
  const { activeModal, setActiveModal } = useChat();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'privacy' | 'notifications' | 'about'>('profile');

  // Profile edit state
  const [displayName, setDisplayName] = useState(currentUser?.display_name || '');
  const [about, setAbout] = useState(currentUser?.about || '');
  const [avatarColor, setAvatarColor] = useState(currentUser?.avatar_color || '#2090ea');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings state
  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);
  const [readReceipts, setReadReceipts] = useState(true);
  const [typingEnabled, setTypingEnabled] = useState(true);

  if (activeModal !== 'settings') return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        display_name: displayName.trim(),
        about: about.trim(),
        avatar_color: avatarColor
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#1f2024] border border-[#2a2b2f] rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col md:flex-row h-[550px] animate-in fade-in zoom-in-95 duration-200">
        {/* Left Settings Navigation Bar */}
        <div className="w-full md:w-56 bg-[#18181b] border-r border-[#2a2b2f] p-3 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center space-x-2 px-3 py-3 mb-2 border-b border-[#2a2b2f]">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: currentUser?.avatar_color || '#2090ea' }}
              >
                {getInitials(currentUser?.display_name)}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold truncate">{currentUser?.display_name}</div>
                <div className="text-[10px] text-gray-400 font-mono">@{currentUser?.username}</div>
              </div>
            </div>

            <nav className="space-y-1 text-xs">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-[#2090ea] text-white font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-[#28292d]'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-colors ${
                  activeTab === 'appearance'
                    ? 'bg-[#2090ea] text-white font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-[#28292d]'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Appearance</span>
              </button>

              <button
                onClick={() => setActiveTab('privacy')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-colors ${
                  activeTab === 'privacy'
                    ? 'bg-[#2090ea] text-white font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-[#28292d]'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Privacy</span>
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-[#2090ea] text-white font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-[#28292d]'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </button>

              <button
                onClick={() => { setActiveModal('linked_devices'); }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#28292d] transition-colors"
              >
                <Laptop className="w-4 h-4" />
                <span>Linked Devices</span>
              </button>

              <button
                onClick={() => setActiveTab('about')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl transition-colors ${
                  activeTab === 'about'
                    ? 'bg-[#2090ea] text-white font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-[#28292d]'
                }`}
              >
                <Info className="w-4 h-4" />
                <span>About</span>
              </button>
            </nav>
          </div>

          {/* Logout Button */}
          <div className="pt-2 border-t border-[#2a2b2f]">
            <button
              onClick={() => { logout(); setActiveModal(null); }}
              className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Right Tab Content Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1f2024]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#2a2b2f]">
            <h3 className="font-semibold text-sm capitalize text-gray-100">{activeTab} Settings</h3>
            <button
              onClick={() => setActiveModal(null)}
              className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-[#282828]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Views */}
          <div className="flex-1 overflow-y-auto p-6 text-xs">
            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-sm">
                <div className="flex items-center space-x-4 mb-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {getInitials(displayName)}
                  </div>
                  <div>
                    <div className="text-xs text-gray-300 font-medium mb-1">Avatar Theme Color</div>
                    <div className="flex space-x-1.5">
                      {AVATAR_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setAvatarColor(color)}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            avatarColor === color ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#28292d] border border-[#383a40] rounded-xl text-white focus:outline-none focus:border-[#2090ea]"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">About / Bio</label>
                  <input
                    type="text"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="w-full px-3 py-2 bg-[#28292d] border border-[#383a40] rounded-xl text-white focus:outline-none focus:border-[#2090ea]"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={currentUser?.phone_number || ''}
                    disabled
                    className="w-full px-3 py-2 bg-[#28292d]/50 border border-[#383a40] rounded-xl text-gray-400 cursor-not-allowed font-mono"
                  />
                </div>

                <div className="pt-2 flex items-center space-x-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-[#2090ea] hover:bg-[#1b7fd1] text-white font-medium rounded-xl transition-colors flex items-center space-x-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                  {savedSuccess && (
                    <span className="text-emerald-400 flex items-center space-x-1 text-xs font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </span>
                  )}
                </div>
              </form>
            )}

            {/* TAB: APPEARANCE (DARK MODE) */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 max-w-sm">
                <div>
                  <div className="text-sm font-semibold text-white mb-1">Theme</div>
                  <p className="text-gray-400 text-[11px] mb-3">
                    Choose between authentic Signal Dark, Light, or follow your OS system setting.
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {(['dark', 'light', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`p-3 rounded-xl border flex flex-col items-center space-y-1.5 capitalize transition-all ${
                          theme === t
                            ? 'border-[#2090ea] bg-[#2090ea]/10 text-white font-semibold'
                            : 'border-[#383a40] bg-[#28292d] text-gray-400 hover:text-white'
                        }`}
                      >
                        {t === 'dark' ? <Moon className="w-5 h-5 text-[#2090ea]" /> : t === 'light' ? <Sun className="w-5 h-5 text-amber-400" /> : <Laptop className="w-5 h-5" />}
                        <span>{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#28292d] border border-[#383a40]">
                  <div className="text-xs font-semibold text-white mb-1">Signal Dark Theme Palette</div>
                  <div className="text-[11px] text-gray-400">
                    Matches official Signal Desktop specifications: <code className="text-[#2090ea]">#121212</code> background and <code className="text-[#2090ea]">#2090ea</code> Ultramarine.
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PRIVACY */}
            {activeTab === 'privacy' && (
              <div className="space-y-4 max-w-md">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#28292d] border border-[#383a40]">
                  <div>
                    <div className="text-sm font-semibold text-white">Read Receipts</div>
                    <div className="text-[11px] text-gray-400">Show double blue checkmarks when messages are read</div>
                  </div>
                  <button
                    onClick={() => setReadReceipts(!readReceipts)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${readReceipts ? 'bg-[#2090ea]' : 'bg-gray-600'}`}
                  >
                    <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${readReceipts ? 'left-5.5' : 'left-0.5'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#28292d] border border-[#383a40]">
                  <div>
                    <div className="text-sm font-semibold text-white">Typing Indicators</div>
                    <div className="text-[11px] text-gray-400">Broadcast real-time typing status when composing messages</div>
                  </div>
                  <button
                    onClick={() => setTypingEnabled(!typingEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${typingEnabled ? 'bg-[#2090ea]' : 'bg-gray-600'}`}
                  >
                    <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${typingEnabled ? 'left-5.5' : 'left-0.5'}`} />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-[#28292d] border border-[#383a40]">
                  <div className="flex items-center space-x-2 text-white font-semibold mb-1">
                    <Lock className="w-4 h-4 text-[#2090ea]" />
                    <span>Signal PIN & Key Backup</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Signal PIN keeps your profile and contacts encrypted and recoverable without storing them on central servers.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-4 max-w-md">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#28292d] border border-[#383a40]">
                  <div>
                    <div className="text-sm font-semibold text-white">Message Sound Effects</div>
                    <div className="text-[11px] text-gray-400">Play Signal chimes when sending and receiving messages</div>
                  </div>
                  <button
                    onClick={handleToggleSound}
                    className={`w-11 h-6 rounded-full transition-colors relative ${soundEnabled ? 'bg-[#2090ea]' : 'bg-gray-600'}`}
                  >
                    <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${soundEnabled ? 'left-5.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB: ABOUT */}
            {activeTab === 'about' && (
              <div className="space-y-4 max-w-md">
                <div className="p-4 rounded-xl bg-[#28292d] border border-[#383a40]">
                  <div className="text-base font-bold text-white mb-1">Signal Messenger Clone</div>
                  <div className="text-xs text-[#2090ea] font-mono mb-3">Version 1.0.0 • Fullstack SDE Assignment</div>
                  <p className="text-[11px] text-gray-300 leading-relaxed mb-3">
                    Replicating Signal's design, user experience, and real-time core messaging workflows using FastAPI, Next.js (TypeScript), SQLite, and WebSockets.
                  </p>
                  <div className="text-[11px] text-gray-400 space-y-1">
                    <div>✓ Mock Authentication with fixed OTP (123456)</div>
                    <div>✓ One-on-One and Group Messaging with Admin Controls</div>
                    <div>✓ Real-time WebSockets with Delivery & Read Receipts</div>
                    <div>✓ All Bonus: Attachments, Emoji Reactions, Quoted Replies, Disappearing Messages</div>
                    <div>✓ Dark Mode, Responsive Layout & Keyboard Shortcuts</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

