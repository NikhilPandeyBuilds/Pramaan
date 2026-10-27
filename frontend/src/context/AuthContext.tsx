import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getStoredToken, setStoredToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (data: {
    full_name: string;
    email: string;
    password: string;
    role?: string;
    institution_name?: string;
    institution_code?: string;
    state?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  isOfficer: boolean;
  isAdmin: boolean;
  isInstitution: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch {
          setStoredToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const res = await api.login({ email, password: pass });
    setStoredToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const register = async (data: {
    full_name: string;
    email: string;
    password: string;
    role?: string;
    institution_name?: string;
    institution_code?: string;
    state?: string;
  }): Promise<User> => {
    const res = await api.register(data);
    setStoredToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setStoredToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const isOfficer = user?.role === 'REGULATORY_OFFICER';
  const isAdmin = user?.role === 'ADMIN';
  const isInstitution = user?.role === 'INSTITUTION_USER';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isOfficer, isAdmin, isInstitution }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
