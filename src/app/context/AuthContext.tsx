import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: string | null;
  login: (username: string) => void;
  logout: () => void;
  authenticate: (password: string) => boolean;
  hasPassedAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CORRECT_PASSWORD = 'nossosecreto';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [hasPassedAuth, setHasPassedAuth] = useState(() => {
    return localStorage.getItem('hasPassedAuth') === 'true';
  });
  
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('currentUser');
  });

  const isAuthenticated = hasPassedAuth && currentUser !== null;

  const authenticate = (password: string) => {
    if (password === CORRECT_PASSWORD) {
      setHasPassedAuth(true);
      localStorage.setItem('hasPassedAuth', 'true');
      return true;
    }
    return false;
  };

  const login = (username: string) => {
    setCurrentUser(username);
    localStorage.setItem('currentUser', username);
  };

  const logout = () => {
    setCurrentUser(null);
    setHasPassedAuth(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('hasPassedAuth');
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, currentUser, login, logout, authenticate, hasPassedAuth }}
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
