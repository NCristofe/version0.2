import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../supabase';

export type UserSlot = 'user1' | 'user2';

// Cada "slot" (user1/user2) corresponde a uma conta real no Supabase Auth.
// O e-mail não precisa ser real - é só um identificador estável de login.
// As contas devem ser criadas uma única vez (ver supabase/schema.sql / README de setup).
export const SLOT_EMAILS: Record<UserSlot, string> = {
  user1: 'user1@nosso-amor.app',
  user2: 'user2@nosso-amor.app',
};

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: UserSlot | null;
  session: Session | null;
  loading: boolean;
  login: (username: UserSlot) => void;
  logout: () => Promise<void>;
  authenticate: (password: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadSlot(): UserSlot | null {
  const saved = localStorage.getItem('currentUser');
  return saved === 'user1' || saved === 'user2' ? saved : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserSlot | null>(loadSlot);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAuthenticated = !!session && currentUser !== null;

  const login = useCallback((username: UserSlot) => {
    setCurrentUser(username);
    localStorage.setItem('currentUser', username);
  }, []);

  const authenticate = useCallback(async (password: string) => {
    if (!currentUser) {
      return { success: false, error: 'Nenhum usuário selecionado.' };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: SLOT_EMAILS[currentUser],
      password,
    });

    if (error) {
      // Log completo pra debug: o Supabase distingue "senha errada" de
      // "e-mail não confirmado", "usuário não existe", falha de rede, etc.
      console.error('[auth] signInWithPassword falhou:', error.status, error.message);

      if (error.message.toLowerCase().includes('email not confirmed')) {
        return { success: false, error: 'Conta ainda não confirmada. No painel do Supabase, marque "Auto Confirm User" ao criar o usuário.' };
      }

      return { success: false, error: 'Senha incorreta.' };
    }

    return { success: true };
  }, [currentUser]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!currentUser) {
      return { success: false, error: 'Nenhum usuário selecionado.' };
    }

    // Reconfirma a senha atual antes de trocar (o Supabase não tem "verify password" direto)
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: SLOT_EMAILS[currentUser],
      password: currentPassword,
    });

    if (verifyError) {
      return { success: false, error: 'Senha atual incorreta.' };
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      return { success: false, error: 'Não foi possível trocar a senha. Tente novamente.' };
    }

    return { success: true };
  }, [currentUser]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, currentUser, session, loading, login, logout, authenticate, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
