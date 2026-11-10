'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { User } from '@/lib/types';
import { AVATAR_COLORS } from '@/lib/utils';
import { Shield, Smartphone, KeyRound, UserCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export function AuthModal() {
  const { showAuthModal, setShowAuthModal, login, register, switchAccount } = useAuth();
  const [tab, setTab] = useState<'demo' | 'register' | 'login'>('demo');
  const [demoUsers, setDemoUsers] = useState<User[]>([]);

  // Register / Login Form states
  const [phoneOrUsername, setPhoneOrUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [about, setAbout] = useState('Hey there! I am using Signal.');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [otp, setOtp] = useState('123456');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showAuthModal) {
      api.getDemoUsers().then(setDemoUsers).catch(console.error);
    }
  }, [showAuthModal]);

  if (!showAuthModal) return null;

  const handleDemoSwitch = async (userId: string) => {
    try {
      setLoading(true);
      await switchAccount(userId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to switch demo account';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phoneOrUsername.trim()) {
      setError('Please enter a phone number or username');
      return;
    }
    setLoading(true);
    try {
      await api.requestOtp(phoneOrUsername);
      setStep('otp');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error requesting verification';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(phoneOrUsername, otp);
      } else {
        await register({
          phone_number: phoneOrUsername.startsWith('+') ? phoneOrUsername : `+1 555-${Math.floor(1000 + Math.random() * 9000)}`,
          username: phoneOrUsername.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || `user_${Date.now()}`,
          display_name: displayName.trim() || 'Signal User',
          about,
          avatar_color: avatarColor,
          otp
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#1f2024] dark:bg-[#1f2024] border border-[#2a2b2f] rounded-2xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Signal Brand Header */}
        <div className="bg-gradient-to-b from-[#2090ea]/10 to-transparent p-6 text-center border-b border-[#2a2b2f]">
          <div className="w-14 h-14 bg-[#2090ea] rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-[#2090ea]/20 mb-3">
            <Shield className="w-8 h-8 text-white fill-current" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Signal Messenger</h2>
          <p className="text-xs text-gray-400 mt-1">End-to-End Encrypted Communication</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#2a2b2f] text-sm">
          <button
            onClick={() => { setTab('demo'); setStep('details'); setError(null); }}
            className={`flex-1 py-3 text-center font-medium transition-colors border-b-2 ${
              tab === 'demo'
                ? 'border-[#2090ea] text-[#2090ea] bg-[#2090ea]/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            ⚡ Demo Accounts
          </button>
          <button
            onClick={() => { setTab('register'); setStep('details'); setError(null); }}
            className={`flex-1 py-3 text-center font-medium transition-colors border-b-2 ${
              tab === 'register'
                ? 'border-[#2090ea] text-[#2090ea] bg-[#2090ea]/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => { setTab('login'); setStep('details'); setError(null); }}
            className={`flex-1 py-3 text-center font-medium transition-colors border-b-2 ${
              tab === 'login'
                ? 'border-[#2090ea] text-[#2090ea] bg-[#2090ea]/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Log In
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}

        {/* TAB 1: QUICK DEMO ACCOUNTS */}
        {tab === 'demo' && (
          <div className="p-6">
            <div className="text-xs text-gray-400 mb-3">
              Select any pre-configured seed user to test real-time messaging, safety numbers, groups, and receipts:
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleDemoSwitch(u.id)}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#28292d] hover:bg-[#323338] border border-transparent hover:border-[#2090ea]/40 transition-all text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow"
                      style={{ backgroundColor: u.avatar_color || '#2090ea' }}
                    >
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.display_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        u.display_name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-[#2090ea] transition-colors">
                        {u.display_name}
                      </div>
                      <div className="text-xs text-gray-400">{u.phone_number} • @{u.username}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-[#2090ea] transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[#2a2b2f] text-center">
              <span className="text-xs text-gray-500">Fixed mock OTP: <code className="text-[#2090ea]">123456</code></span>
            </div>
          </div>
        )}

        {/* TAB 2 & 3: REGISTER / LOGIN FORMS */}
        {tab !== 'demo' && (
          <div className="p-6">
            {step === 'details' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    Phone Number or Username
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={phoneOrUsername}
                      onChange={(e) => setPhoneOrUsername(e.target.value)}
                      placeholder="+1 555-0100 or username"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#28292d] border border-[#383a40] rounded-xl text-white text-sm focus:outline-none focus:border-[#2090ea] transition-colors"
                    />
                  </div>
                </div>

                {tab === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1.5">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your full name"
                        required
                        className="w-full px-4 py-2.5 bg-[#28292d] border border-[#383a40] rounded-xl text-white text-sm focus:outline-none focus:border-[#2090ea] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1.5">
                        Avatar Color
                      </label>
                      <div className="flex items-center space-x-2">
                        {AVATAR_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setAvatarColor(color)}
                            className={`w-7 h-7 rounded-full transition-transform ${
                              avatarColor === color ? 'scale-125 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#2090ea] hover:bg-[#1b7fd1] text-white font-medium text-sm rounded-xl transition-colors shadow-lg shadow-[#2090ea]/20 flex items-center justify-center space-x-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center mb-2">
                  <div className="text-sm font-semibold text-white">Enter 6-digit Code</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Sent to <span className="text-white font-mono">{phoneOrUsername}</span>
                  </div>
                  <div className="mt-2 inline-flex items-center px-2 py-1 rounded bg-[#2090ea]/10 text-[#2090ea] text-xs">
                    Mock OTP is preset: <strong>123456</strong>
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#28292d] border border-[#383a40] rounded-xl text-white text-center font-mono tracking-widest text-lg focus:outline-none focus:border-[#2090ea] transition-colors"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="flex-1 py-2.5 bg-[#28292d] hover:bg-[#323338] text-gray-300 text-sm font-medium rounded-xl transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-[#2090ea] hover:bg-[#1b7fd1] text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#2090ea]/20 flex items-center justify-center space-x-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Enter</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

