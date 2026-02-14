-- ============================================
-- Migración: Horarios y Grupos de WhatsApp
-- Fecha: 2026-02-13
-- ============================================

-- 1. Agregar campos de horarios a tabla tiendas
ALTER TABLE tiendas 
  ADD COLUMN IF NOT EXISTS hora_apertura TIME,
  ADD COLUMN IF NOT EXISTS hora_cierre TIME,
  ADD COLUMN IF NOT EXISTS dias_laborales TEXT[];

-- 2. Agregar comentarios para documentación
COMMENT ON COLUMN tiendas.hora_apertura IS 'Hora de apertura en formato TIME (HH:MM:SS)';
COMMENT ON COLUMN tiendas.hora_cierre IS 'Hora de cierre en formato TIME (HH:MM:SS)';
COMMENT ON COLUMN tiendas.dias_laborales IS 'Array de días laborales: [lunes, martes, miercoles, jueves, viernes, sabado, domingo]';

-- 3. Crear tabla grupos_whatsapp
CREATE TABLE IF NOT EXISTS grupos_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  enlace TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- 4. Agregar comentario a la tabla
COMMENT ON TABLE grupos_whatsapp IS 'Grupos de WhatsApp asociados a cada tienda';

-- 5. Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_grupos_whatsapp_tienda 
  ON grupos_whatsapp(tienda_id) 
  WHERE activo = true;

-- 6. Habilitar RLS en nueva tabla
ALTER TABLE grupos_whatsapp ENABLE ROW LEVEL SECURITY;

-- 7. Política de lectura pública para grupos activos
DROP POLICY IF EXISTS "Permitir lectura pública de grupos activos" ON grupos_whatsapp;
CREATE POLICY "Permitir lectura pública de grupos activos"
  ON grupos_whatsapp FOR SELECT
  USING (activo = true);

-- 8. Política de escritura para usuarios autenticados (admin)
DROP POLICY IF EXISTS "Permitir escritura a usuarios autenticados" ON grupos_whatsapp;
CREATE POLICY "Permitir escritura a usuarios autenticados"
  ON grupos_whatsapp FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- Verificación de la migración
-- ============================================

-- Verificar que los campos se agregaron correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tiendas' 
  AND column_name IN ('hora_apertura', 'hora_cierre', 'dias_laborales');

-- Verificar que la tabla grupos_whatsapp existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'grupos_whatsapp';

-- Verificar que las políticas RLS están activas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'grupos_whatsapp';
