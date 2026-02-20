-- ============================================
-- POLÍTICAS RLS PROFESIONALES CON SUPABASE AUTH
-- Ejecuta este script DESPUÉS de crear la tabla admins
-- ============================================

-- ============================================
-- 1. LIMPIAR POLÍTICAS ANTIGUAS
-- ============================================

-- Eliminar todas las políticas antiguas
DROP POLICY IF EXISTS "Lectura pública de tiendas activas" ON tiendas;
DROP POLICY IF EXISTS "Lectura pública de categorías activas" ON categorias;
DROP POLICY IF EXISTS "Lectura pública de productos activos" ON productos;
DROP POLICY IF EXISTS "Lectura pública de imágenes" ON imagenes_producto;
DROP POLICY IF EXISTS "Permitir todas las operaciones en tiendas" ON tiendas;
DROP POLICY IF EXISTS "Permitir todas las operaciones en categorías" ON categorias;
DROP POLICY IF EXISTS "Permitir todas las operaciones en productos" ON productos;
DROP POLICY IF EXISTS "Permitir todas las operaciones en imágenes" ON imagenes_producto;
DROP POLICY IF EXISTS "Permitir lectura de usuarios admin" ON usuarios_admin;

-- Eliminar políticas de grupos de WhatsApp si existen
DROP POLICY IF EXISTS "Lectura pública de grupos activos" ON grupos_whatsapp;
DROP POLICY IF EXISTS "Permitir todas las operaciones en grupos" ON grupos_whatsapp;

-- ============================================
-- 2. ASEGURAR QUE RLS ESTÁ HABILITADO
-- ============================================

ALTER TABLE tiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagenes_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_whatsapp ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. POLÍTICAS PARA CATÁLOGO PÚBLICO (LECTURA)
-- ============================================

-- TIENDAS: Lectura pública de tiendas activas
CREATE POLICY "public_read_active_stores"
ON tiendas FOR SELECT
TO public
USING (activa = true);

-- CATEGORÍAS: Lectura pública de categorías activas
CREATE POLICY "public_read_active_categories"
ON categorias FOR SELECT
TO public
USING (activa = true);

-- PRODUCTOS: Lectura pública de productos activos
CREATE POLICY "public_read_active_products"
ON productos FOR SELECT
TO public
USING (activo = true);

-- IMÁGENES: Lectura pública de todas las imágenes
-- (necesario para mostrar imágenes de productos activos)
CREATE POLICY "public_read_images"
ON imagenes_producto FOR SELECT
TO public
USING (true);

-- GRUPOS WHATSAPP: Lectura pública de grupos activos
CREATE POLICY "public_read_active_whatsapp_groups"
ON grupos_whatsapp FOR SELECT
TO public
USING (activo = true);

-- ============================================
-- 4. POLÍTICAS PARA ADMIN (ESCRITURA)
-- ============================================

-- TIENDAS: Solo admins pueden ver todas y modificar
CREATE POLICY "admins_full_access_stores"
ON tiendas FOR ALL
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM public.admins WHERE activo = true)
)
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.admins WHERE activo = true)
);

-- CATEGORÍAS: Solo admins pueden ver todas y modificar
CREATE POLICY "admins_full_access_categories"
ON categorias FOR ALL
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM public.admins WHERE activo = true)
)
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.admins WHERE activo = true)
);

-- PRODUCTOS: Solo admins pueden ver todos y modificar
CREATE POLICY "admins_full_access_products"
ON productos FOR ALL
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM public.admins WHERE activo = true)
)
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.admins WHERE activo = true)
);

-- IMÁGENES: Solo admins pueden modificar
CREATE POLICY "admins_full_access_images"
ON imagenes_producto FOR ALL
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM public.admins WHERE activo = true)
)
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.admins WHERE activo = true)
);

-- GRUPOS WHATSAPP: Solo admins pueden ver todos y modificar
CREATE POLICY "admins_full_access_whatsapp_groups"
ON grupos_whatsapp FOR ALL
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM public.admins WHERE activo = true)
)
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.admins WHERE activo = true)
);

-- ============================================
-- 5. DESHABILITAR RLS EN TABLA ANTIGUA (OPCIONAL)
-- ============================================

-- Si quieres mantener la tabla usuarios_admin como backup
-- pero sin usarla, puedes deshabilitarla:
-- ALTER TABLE usuarios_admin DISABLE ROW LEVEL SECURITY;

-- O eliminarla completamente (CUIDADO):
-- DROP TABLE IF EXISTS usuarios_admin;

-- ============================================
-- 6. VERIFICAR POLÍTICAS CREADAS
-- ============================================

-- Ver todas las políticas activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Lectura'
    WHEN cmd = 'INSERT' THEN 'Inserción'
    WHEN cmd = 'UPDATE' THEN 'Actualización'
    WHEN cmd = 'DELETE' THEN 'Eliminación'
    WHEN cmd = 'ALL' THEN 'Todas las operaciones'
  END as operacion
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('tiendas', 'categorias', 'productos', 'imagenes_producto', 'grupos_whatsapp', 'admins')
ORDER BY tablename, policyname;

-- ============================================
-- 7. PROBAR POLÍTICAS
-- ============================================

-- Probar como usuario público (sin autenticar)
-- Esto debería funcionar:
SELECT * FROM tiendas WHERE activa = true;
SELECT * FROM productos WHERE activo = true;

-- Esto NO debería funcionar (requiere autenticación):
-- INSERT INTO productos (nombre, precio, tienda_id) VALUES ('Test', 100, 'uuid-aqui');

-- ============================================
-- 8. FUNCIÓN HELPER: Obtener info del admin actual
-- ============================================

CREATE OR REPLACE FUNCTION public.get_current_admin()
RETURNS TABLE (
  id UUID,
  email TEXT,
  nombre TEXT,
  es_super_admin BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.email,
    a.nombre,
    a.es_super_admin
  FROM public.admins a
  WHERE a.user_id = auth.uid()
  AND a.activo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RESUMEN DE SEGURIDAD
-- ============================================

/*
✅ CATÁLOGO PÚBLICO:
- Cualquiera puede VER productos/tiendas/categorías activas
- Nadie puede MODIFICAR sin autenticación

✅ PANEL ADMIN:
- Solo usuarios en tabla 'admins' pueden acceder
- Requiere login con Supabase Auth
- Token JWT valida cada operación
- RLS verifica permisos en cada consulta

✅ GESTIÓN DE ADMINS:
- Solo super admins pueden agregar/eliminar admins
- Los admins normales solo gestionan productos/tiendas

✅ SEGURIDAD ADICIONAL:
- Tokens JWT con expiración
- Sesiones manejadas por Supabase
- Contraseñas hasheadas con bcrypt
- RLS a nivel de base de datos

❌ YA NO ES POSIBLE:
- Acceder al admin sin login
- Modificar datos desde el navegador sin token
- Ver contraseñas en texto plano
- Bypass de autenticación
*/

-- ============================================
-- SIGUIENTE PASO
-- ============================================

/*
Ahora debes:
1. ✅ Verificar que las políticas se crearon correctamente
2. ✅ Probar consultas públicas (SELECT de productos activos)
3. ✅ Continuar con actualización del código frontend
*/

