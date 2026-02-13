'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ success: false }),
  signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión guardada
    const savedUser = localStorage.getItem('admin_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      // Buscar usuario en la base de datos
      const { data: usuarios, error } = await supabase
        .from('usuarios_admin')
        .select('*')
        .eq('username', username)
        .eq('activo', true)
        .single();

      if (error || !usuarios) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      // Verificar contraseña (en producción deberías usar bcrypt)
      // Por ahora comparamos directamente con el hash almacenado
      if (usuarios.password_hash === password) {
        const userData = {
          id: usuarios.id,
          username: usuarios.username,
        };
        setUser(userData);
        localStorage.setItem('admin_user', JSON.stringify(userData));
        return { success: true };
      } else {
        return { success: false, error: 'Contraseña incorrecta' };
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('admin_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
