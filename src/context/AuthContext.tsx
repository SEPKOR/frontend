'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (token: string, redirectUrl?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const res = await api.get('/user');
          setUser(res.data);
        } catch (error) {
          console.error("Session expired or invalid token.");
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (token: string, redirectUrl: string = '/dashboard') => {
    localStorage.setItem('auth_token', token);
    try {
      const res = await api.get('/user');
      setUser(res.data);
      router.push(redirectUrl);
    } catch (error) {
      console.error("Failed to fetch user after login.");
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {}
    localStorage.removeItem('auth_token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
