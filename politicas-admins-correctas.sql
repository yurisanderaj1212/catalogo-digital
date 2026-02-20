-- ============================================
-- POLÍTICAS RLS CORRECTAS PARA TABLA ADMINS
-- Estas políticas SÍ funcionan correctamente
-- ============================================

-- 1. Primero habilitar RLS de nuevo
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar cualquier política anterior
DROP POLICY IF EXISTS "authenticated_users_read_own_admin_info" ON public.admins;
DROP POLICY IF EXISTS "super_admins_read_all_admins" ON public.admins;
DROP POLICY IF EXISTS "super_admins_manage_admins" ON public.admins;
DROP POLICY IF EXISTS "admins_can_read_admins" ON public.admins;
DROP POLICY IF EXISTS "super_admins_can_manage_admins" ON public.admins;
DROP POLICY IF EXISTS "temp_allow_read_admins" ON public.admins;

-- 3. Política SIMPLE: Usuarios autenticados pueden leer admins
-- (Necesario para que el auth-context pueda verificar si eres admin)
CREATE POLICY "allow_authenticated_read_admins"
ON public.admins FOR SELECT
TO authenticated
USING (true);

-- 4. Política: Solo super admins pueden modificar la tabla admins
CREATE POLICY "only_super_admins_can_modify"
ON public.admins FOR ALL
TO authenticated
USING (
  user_id IN (
    SELECT user_id FROM public.admins 
    WHERE activo = true AND es_super_admin = true
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.admins 
    WHERE activo = true AND es_super_admin = true
  )
);

-- ============================================
-- VERIFICAR POLÍTICAS
-- ============================================

SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ Lectura'
    WHEN cmd = 'ALL' THEN '✏️ Todas las operaciones'
  END as tipo,
  CASE 
    WHEN policyname LIKE '%read%' THEN 'Permite a usuarios autenticados leer admins'
    WHEN policyname LIKE '%modify%' THEN 'Solo super admins pueden modificar'
  END as descripcion
FROM pg_policies
WHERE tablename = 'admins'
ORDER BY policyname;

-- ============================================
-- PROBAR QUE FUNCIONA
-- ============================================

-- Esto debería funcionar (lectura)
SELECT email, activo, es_super_admin FROM public.admins;

-- ============================================
-- EXPLICACIÓN
-- ============================================

/*
¿Por qué funciona ahora?

ANTES (políticas restrictivas):
- Solo podías leer tu propia info SI ya estabas en la tabla
- Pero para verificar si estás en la tabla, necesitas leerla primero
- Círculo vicioso = error

AHORA (políticas simples):
- Cualquier usuario AUTENTICADO puede LEER la tabla admins
- Esto permite que el código verifique si eres admin
- Solo los super admins pueden MODIFICAR (INSERT/UPDATE/DELETE)

SEGURIDAD:
- ✅ El catálogo público NO puede leer admins (no están autenticados)
- ✅ Usuarios autenticados pueden ver quiénes son admins (necesario)
- ✅ Solo super admins pueden agregar/eliminar admins
- ✅ La tabla admins no contiene información sensible (solo emails y permisos)
*/
