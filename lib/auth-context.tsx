'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

interface AdminInfo {
  id: string;
  email: string;
  nombre: string | null;
  es_super_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  adminInfo: AdminInfo | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  adminInfo: null,
  loading: true,
  signIn: async () => ({ success: false }),
  signOut: async () => {},
  isAdmin: false,
  isSuperAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAdminInfo(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAdminInfo(session.user.id);
      } else {
        setAdminInfo(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAdminInfo = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('id, email, nombre, es_super_admin')
        .eq('user_id', userId)
        .eq('activo', true)
        .single();

      if (error) {
        console.error('Error fetching admin info:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        setAdminInfo(null);
      } else {
        setAdminInfo(data);
      }
    } catch (error) {
      console.error('Error:', error);
      setAdminInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Verificar que el usuario sea admin
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', data.user.id)
          .eq('activo', true)
          .single();

        if (adminError || !adminData) {
          // No es admin, cerrar sesión
          await supabase.auth.signOut();
          return { success: false, error: 'No tienes permisos de administrador' };
        }

        return { success: true };
      }

      return { success: false, error: 'Error al iniciar sesión' };
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setAdminInfo(null);
  };

  const isAdmin = !!adminInfo;
  const isSuperAdmin = adminInfo?.es_super_admin ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        adminInfo,
        loading,
        signIn,
        signOut,
        isAdmin,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
