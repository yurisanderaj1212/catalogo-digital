-- ============================================
-- FIX: Políticas RLS para tabla admins
-- El problema es que las políticas actuales son muy restrictivas
-- ============================================

-- 1. Eliminar políticas restrictivas actuales
DROP POLICY IF EXISTS "admins_can_read_admins" ON public.admins;
DROP POLICY IF EXISTS "super_admins_can_manage_admins" ON public.admins;

-- 2. Crear política simple: cualquier usuario autenticado puede leer su propia info
CREATE POLICY "authenticated_users_read_own_admin_info"
ON public.admins FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. Política para super admins: pueden ver todos los admins
CREATE POLICY "super_admins_read_all_admins"
ON public.admins FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
    AND activo = true
    AND es_super_admin = true
  )
);

-- 4. Política para super admins: pueden modificar admins
CREATE POLICY "super_admins_manage_admins"
ON public.admins FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
    AND activo = true
    AND es_super_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
    AND activo = true
    AND es_super_admin = true
  )
);

-- ============================================
-- VERIFICAR QUE FUNCIONÓ
-- ============================================

-- Ver las políticas creadas
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Lectura'
    WHEN cmd = 'ALL' THEN 'Todas las operaciones'
  END as operacion
FROM pg_policies
WHERE tablename = 'admins'
ORDER BY policyname;

-- Probar que funciona (simular como usuario autenticado)
-- Esto debería mostrar tus admins
SELECT * FROM public.admins WHERE activo = true;
