-- ============================================
-- POLÍTICAS DE SEGURIDAD PARA SUPABASE
-- Ejecuta este script en SQL Editor de Supabase
-- ============================================

-- IMPORTANTE: Primero habilita RLS en todas las tablas
ALTER TABLE tiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagenes_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_admin ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 1. POLÍTICAS PARA LECTURA PÚBLICA (Catálogo)
-- ============================================

-- Tiendas: Permitir lectura pública de tiendas activas
DROP POLICY IF EXISTS "Lectura pública de tiendas activas" ON tiendas;
CREATE POLICY "Lectura pública de tiendas activas"
ON tiendas FOR SELECT
TO public
USING (activa = true);

-- Categorías: Permitir lectura pública de categorías activas
DROP POLICY IF EXISTS "Lectura pública de categorías activas" ON categorias;
CREATE POLICY "Lectura pública de categorías activas"
ON categorias FOR SELECT
TO public
USING (activa = true);

-- Productos: Permitir lectura pública de productos activos
DROP POLICY IF EXISTS "Lectura pública de productos activos" ON productos;
CREATE POLICY "Lectura pública de productos activos"
ON productos FOR SELECT
TO public
USING (activo = true);

-- Imágenes: Permitir lectura pública de todas las imágenes
DROP POLICY IF EXISTS "Lectura pública de imágenes" ON imagenes_producto;
CREATE POLICY "Lectura pública de imágenes"
ON imagenes_producto FOR SELECT
TO public
USING (true);

-- ============================================
-- 2. POLÍTICAS PARA ESCRITURA (Panel Admin)
-- ============================================

-- TIENDAS: Permitir todas las operaciones
DROP POLICY IF EXISTS "Permitir todas las operaciones en tiendas" ON tiendas;
CREATE POLICY "Permitir todas las operaciones en tiendas"
ON tiendas FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- CATEGORÍAS: Permitir todas las operaciones
DROP POLICY IF EXISTS "Permitir todas las operaciones en categorías" ON categorias;
CREATE POLICY "Permitir todas las operaciones en categorías"
ON categorias FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- PRODUCTOS: Permitir todas las operaciones
DROP POLICY IF EXISTS "Permitir todas las operaciones en productos" ON productos;
CREATE POLICY "Permitir todas las operaciones en productos"
ON productos FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- IMÁGENES: Permitir todas las operaciones
DROP POLICY IF EXISTS "Permitir todas las operaciones en imágenes" ON imagenes_producto;
CREATE POLICY "Permitir todas las operaciones en imágenes"
ON imagenes_producto FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- USUARIOS ADMIN: Permitir lectura para login
DROP POLICY IF EXISTS "Permitir lectura de usuarios admin" ON usuarios_admin;
CREATE POLICY "Permitir lectura de usuarios admin"
ON usuarios_admin FOR SELECT
TO public
USING (activo = true);

-- ============================================
-- 3. POLÍTICAS PARA STORAGE (Bucket de Imágenes)
-- ============================================

-- NOTA: Estas políticas se aplican en Storage → Policies, no aquí
-- Pero las incluyo como referencia:

/*
-- Permitir lectura pública de imágenes
CREATE POLICY "Lectura pública de imágenes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'imagenes');

-- Permitir subida de imágenes
CREATE POLICY "Permitir subida de imágenes"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'imagenes');

-- Permitir actualización de imágenes
CREATE POLICY "Permitir actualización de imágenes"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'imagenes')
WITH CHECK (bucket_id = 'imagenes');

-- Permitir eliminación de imágenes
CREATE POLICY "Permitir eliminación de imágenes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'imagenes');
*/

-- ============================================
-- 4. VERIFICAR POLÍTICAS CREADAS
-- ============================================

-- Ejecuta esto para ver todas las políticas:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

/*
1. SEGURIDAD ACTUAL:
   - Las políticas actuales permiten acceso público total
   - Esto es TEMPORAL para desarrollo
   - En producción, deberías implementar autenticación real

2. PARA MEJORAR SEGURIDAD EN PRODUCCIÓN:
   - Implementar Supabase Auth
   - Cambiar políticas para requerir autenticación
   - Usar auth.uid() para verificar usuarios
   - Agregar roles (admin, editor, viewer)

3. EJEMPLO DE POLÍTICA SEGURA:
   CREATE POLICY "Solo admins pueden editar"
   ON productos FOR UPDATE
   TO authenticated
   USING (
     auth.uid() IN (
       SELECT id FROM usuarios_admin WHERE activo = true
     )
   );

4. BUCKET DE IMÁGENES:
   - Debe ser PÚBLICO para que las imágenes se vean
   - Las políticas de Storage se configuran en:
     Storage → bucket "imagenes" → Policies
*/
