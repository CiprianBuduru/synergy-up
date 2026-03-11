import React, { createContext, useContext, useState, useCallback } from 'react';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'sales';
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USERS: { email: string; password: string; user: AuthUser }[] = [
  { email: 'admin@likemedia.ro', password: 'admin123', user: { id: '1', email: 'admin@likemedia.ro', name: 'Admin LMG', role: 'admin' } },
  { email: 'sales@likemedia.ro', password: 'sales123', user: { id: '2', email: 'sales@likemedia.ro', name: 'Sales Team', role: 'sales' } },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('lmg_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((email: string, password: string) => {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      setUser(found.user);
      localStorage.setItem('lmg_user', JSON.stringify(found.user));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('lmg_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
