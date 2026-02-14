-- ============================================
-- Fix: Políticas RLS para grupos_whatsapp
-- ============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Permitir lectura pública de grupos activos" ON grupos_whatsapp;
DROP POLICY IF EXISTS "Permitir escritura a usuarios autenticados" ON grupos_whatsapp;

-- Política de lectura pública para grupos activos (sin cambios)
CREATE POLICY "Permitir lectura pública de grupos activos"
  ON grupos_whatsapp FOR SELECT
  USING (activo = true);

-- Política de escritura más permisiva
-- OPCIÓN 1: Permitir todas las operaciones (para desarrollo/testing)
CREATE POLICY "Permitir todas las operaciones en grupos_whatsapp"
  ON grupos_whatsapp FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- NOTA: Si quieres más seguridad en producción,
-- comenta la política de arriba y usa esta:
-- ============================================

-- OPCIÓN 2: Permitir solo si hay un usuario en la sesión de Supabase
-- (requiere que uses Supabase Auth en lugar de localStorage)
/*
CREATE POLICY "Permitir escritura a usuarios autenticados"
  ON grupos_whatsapp FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
*/

-- ============================================
-- Verificación
-- ============================================

-- Ver políticas activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'grupos_whatsapp';
