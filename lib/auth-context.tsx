'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, AdminUser } from './api-client';

interface AuthContextType {
  user: AdminUser | null;
  adminInfo: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  adminInfo: null,
  loading: true,
  signIn: async () => ({ success: false }),
  signOut: async () => {},
  isAdmin: false,
  isSuperAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión activa al montar
    auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
      setLoading(false);
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await auth.signInWithPassword(email, password);

      if (error || !data) {
        return { success: false, error: error ?? 'Error al iniciar sesión' };
      }

      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'Error al iniciar sesión' };
    }
  };

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        adminInfo: user,
        loading,
        signIn,
        signOut,
        isAdmin: !!user,
        isSuperAdmin: user?.es_super_admin ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
