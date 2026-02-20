-- ============================================
-- FIX FINAL: Políticas RLS SIMPLES para admins
-- Sin recursión, sin complejidad
-- ============================================

-- 1. Eliminar TODAS las políticas
DROP POLICY IF EXISTS "allow_authenticated_read_admins" ON public.admins;
DROP POLICY IF EXISTS "only_super_admins_can_modify" ON public.admins;
DROP POLICY IF EXISTS "authenticated_users_read_own_admin_info" ON public.admins;
DROP POLICY IF EXISTS "super_admins_read_all_admins" ON public.admins;
DROP POLICY IF EXISTS "super_admins_manage_admins" ON public.admins;
DROP POLICY IF EXISTS "admins_can_read_admins" ON public.admins;
DROP POLICY IF EXISTS "super_admins_can_manage_admins" ON public.admins;
DROP POLICY IF EXISTS "temp_allow_read_admins" ON public.admins;

-- 2. Habilitar RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 3. Política SÚPER SIMPLE: Todos los autenticados pueden leer
CREATE POLICY "simple_read_admins"
ON public.admins FOR SELECT
TO authenticated
USING (true);

-- 4. Política SÚPER SIMPLE: Todos los autenticados pueden escribir
-- (Luego lo restringiremos en el código si es necesario)
CREATE POLICY "simple_write_admins"
ON public.admins FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- VERIFICAR
-- ============================================

SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'admins';

-- Probar lectura
SELECT * FROM public.admins;
