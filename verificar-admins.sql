-- ============================================
-- SCRIPT DE VERIFICACIÓN DE ADMINS
-- Ejecuta esto en SQL Editor para diagnosticar
-- ============================================

-- 1. Ver todos los usuarios en auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Ver todos los admins en la tabla admins
SELECT 
  a.id,
  a.user_id,
  a.email,
  a.nombre,
  a.activo,
  a.es_super_admin,
  a.fecha_creacion
FROM public.admins a
ORDER BY a.fecha_creacion DESC;

-- 3. Ver la relación entre auth.users y admins
SELECT 
  u.id as user_id,
  u.email as auth_email,
  u.email_confirmed_at,
  a.id as admin_id,
  a.email as admin_email,
  a.activo,
  a.es_super_admin,
  CASE 
    WHEN a.id IS NULL THEN '❌ NO está en tabla admins'
    WHEN a.activo = false THEN '⚠️ Admin INACTIVO'
    ELSE '✅ Admin ACTIVO'
  END as estado
FROM auth.users u
LEFT JOIN public.admins a ON u.id = a.user_id
ORDER BY u.created_at DESC;

-- 4. Verificar políticas RLS de la tabla admins
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'admins'
ORDER BY policyname;

-- 5. Probar si puedes leer la tabla admins (como público)
-- Esto debería fallar si RLS está bien configurado
SELECT COUNT(*) as total_admins FROM public.admins;

-- ============================================
-- SOLUCIÓN: Si el usuario NO está en tabla admins
-- ============================================

-- Ejecuta esto reemplazando el email por el que usaste para login
INSERT INTO public.admins (user_id, email, nombre, activo, es_super_admin, creado_por)
SELECT 
  id,
  email,
  'Admin Principal',
  true,
  true,
  id
FROM auth.users
WHERE email = 'yurisanderaj@gmail.com'  -- ⚠️ REEMPLAZA CON TU EMAIL
ON CONFLICT (email) DO UPDATE
SET activo = true, es_super_admin = true;

-- ============================================
-- SOLUCIÓN: Si las políticas RLS están mal
-- ============================================

-- Temporalmente deshabilitar RLS para probar
-- ⚠️ SOLO PARA DEBUGGING, NO DEJAR ASÍ EN PRODUCCIÓN
-- ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- Mejor solución: Agregar política temporal más permisiva
DROP POLICY IF EXISTS "temp_allow_read_admins" ON public.admins;
CREATE POLICY "temp_allow_read_admins"
ON public.admins FOR SELECT
TO authenticated
USING (true);  -- Permite a cualquier usuario autenticado leer

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Después de aplicar la solución, verifica de nuevo
SELECT 
  u.email,
  a.activo,
  a.es_super_admin,
  '✅ Listo para usar' as estado
FROM auth.users u
INNER JOIN public.admins a ON u.id = a.user_id
WHERE u.email IN ('yurisanderaj@gmail.com', 'yurisanderalmirajimenez@gmail.com');
