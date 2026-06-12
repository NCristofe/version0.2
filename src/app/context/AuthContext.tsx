import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: string | null;
  login: (username: string) => void;
  logout: () => void;
  authenticate: (password: string) => boolean;
  changePassword: (currentPassword: string, newPassword: string) => boolean;
  hasPassedAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_PASSWORD = 'nossosecreto';
const PASSWORDS_KEY = 'userPasswords';

function loadPasswords() {
  try {
    const saved = localStorage.getItem(PASSWORDS_KEY);
    if (saved) {
      return { user1: DEFAULT_PASSWORD, user2: DEFAULT_PASSWORD, ...JSON.parse(saved) };
    }
  } catch {}
  return { user1: DEFAULT_PASSWORD, user2: DEFAULT_PASSWORD };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [hasPassedAuth, setHasPassedAuth] = useState(() => {
    return localStorage.getItem('hasPassedAuth') === 'true';
  });
  
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('currentUser');
  });

  const [passwords, setPasswords] = useState(loadPasswords);
  const isAuthenticated = hasPassedAuth && currentUser !== null;

  const authenticate = (password: string) => {
    if (currentUser && password === passwords[currentUser as keyof typeof passwords]) {
      setHasPassedAuth(true);
      localStorage.setItem('hasPassedAuth', 'true');
      return true;
    }
    return false;
  };

  const login = (username: string) => {
    setCurrentUser(username);
    setHasPassedAuth(false);
    localStorage.setItem('currentUser', username);
    localStorage.removeItem('hasPassedAuth');
  };

  const changePassword = (currentPassword: string, newPassword: string) => {
    if (!currentUser || currentPassword !== passwords[currentUser as keyof typeof passwords]) {
      return false;
    }

    const nextPasswords = { ...passwords, [currentUser]: newPassword };
    setPasswords(nextPasswords);
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(nextPasswords));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setHasPassedAuth(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('hasPassedAuth');
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, currentUser, login, logout, authenticate, changePassword, hasPassedAuth }}
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
