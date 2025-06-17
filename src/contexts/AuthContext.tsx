// src/contexts/AuthContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth as useAuthHook, UseAuthResult } from '@/hooks/useAuth'; // 실제 useAuth 경로로 수정

const AuthContext = createContext<UseAuthResult | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthHook();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = (): UseAuthResult => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};