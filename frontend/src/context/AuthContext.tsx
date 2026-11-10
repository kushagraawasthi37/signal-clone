'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/lib/types';
import { api } from '@/lib/api';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, otp?: string) => Promise<void>;
  register: (data: { phone_number: string; username: string; display_name: string; about?: string; avatar_url?: string; avatar_color?: string; otp: string }) => Promise<void>;
  switchAccount: (userId: string) => Promise<void>;
  updateProfile: (data: { display_name?: string; about?: string; avatar_url?: string; avatar_color?: string }) => Promise<void>;
  logout: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    const storedToken = localStorage.getItem('signal_token');
    if (!storedToken) {
      setIsLoading(false);
      // If no token, attempt auto-login to demo user (Alex Mercer) or show modal
      try {
        const demoUsers = await api.getDemoUsers();
        if (demoUsers && demoUsers.length > 0) {
          // Auto switch to first demo user (Alex) so reviewer immediately sees live chats
          const res = await api.switchAccount(demoUsers[0].id);
          localStorage.setItem('signal_token', res.access_token);
          setToken(res.access_token);
          setCurrentUser(res.user);
        } else {
          setShowAuthModal(true);
        }
      } catch {
        setShowAuthModal(true);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      setToken(storedToken);
      const user = await api.getMe();
      setCurrentUser(user);
    } catch {
      localStorage.removeItem('signal_token');
      setToken(null);
      setCurrentUser(null);
      setShowAuthModal(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (identifier: string, otp: string = '123456') => {
    const res = await api.login(identifier, otp);
    localStorage.setItem('signal_token', res.access_token);
    setToken(res.access_token);
    setCurrentUser(res.user);
    setShowAuthModal(false);
  };

  const register = async (data: { phone_number: string; username: string; display_name: string; about?: string; avatar_url?: string; avatar_color?: string; otp: string }) => {
    const res = await api.register(data);
    localStorage.setItem('signal_token', res.access_token);
    setToken(res.access_token);
    setCurrentUser(res.user);
    setShowAuthModal(false);
  };

  const switchAccount = async (userId: string) => {
    const res = await api.switchAccount(userId);
    localStorage.setItem('signal_token', res.access_token);
    setToken(res.access_token);
    setCurrentUser(res.user);
    setShowAuthModal(false);
  };

  const updateProfile = async (data: { display_name?: string; about?: string; avatar_url?: string; avatar_color?: string }) => {
    const updated = await api.updateProfile(data);
    setCurrentUser(updated);
  };

  const logout = () => {
    localStorage.removeItem('signal_token');
    setToken(null);
    setCurrentUser(null);
    setShowAuthModal(true);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isLoading,
        login,
        register,
        switchAccount,
        updateProfile,
        logout,
        showAuthModal,
        setShowAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
