-- ============================================
-- FIX TEMPORAL: Deshabilitar RLS en tabla admins
-- Esto es SOLO para diagnosticar el problema
-- ============================================

-- Deshabilitar RLS temporalmente
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- Verificar que se deshabilitó
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'admins';

-- Ahora deberías poder leer la tabla sin problemas
SELECT * FROM public.admins;
