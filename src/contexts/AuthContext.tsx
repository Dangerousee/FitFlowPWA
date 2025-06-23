// src/contexts/AuthContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useLogin as useLoginHook, UseLoginResult } from '@hooks/useLogin';


const LoginContext = createContext<UseLoginResult | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useLoginHook();
  return <LoginContext.Provider value={auth}>{children}</LoginContext.Provider>;
};

export const useLogin = (): UseLoginResult => {
  const context = useContext(LoginContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};