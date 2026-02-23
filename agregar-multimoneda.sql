-- ============================================
-- AGREGAR SOPORTE MULTIMONEDA
-- ============================================
-- Este script agrega el campo "moneda" a la tabla productos
-- para soportar CUP, USD y EUR
-- ============================================

-- PASO 1: Agregar columna moneda con valor por defecto CUP
ALTER TABLE productos 
ADD COLUMN moneda VARCHAR(3) DEFAULT 'CUP' NOT NULL;

-- PASO 2: Agregar constraint para validar solo monedas permitidas
ALTER TABLE productos
ADD CONSTRAINT productos_moneda_check 
CHECK (moneda IN ('CUP', 'USD', 'EUR'));

-- PASO 3: Crear índice para búsquedas por moneda (opcional, mejora rendimiento)
CREATE INDEX idx_productos_moneda ON productos(moneda);

-- ============================================
-- VERIFICACIÓN: Ver estructura actualizada
-- ============================================
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'productos' 
  AND column_name IN ('precio', 'moneda')
ORDER BY ordinal_position;

-- ============================================
-- VERIFICACIÓN: Ver productos con nueva columna
-- ============================================
SELECT 
  id,
  nombre,
  precio,
  moneda,
  tienda_id
FROM productos
LIMIT 5;

-- ============================================
-- RESULTADO ESPERADO:
-- Todos los productos existentes tendrán moneda = 'CUP'
-- Nuevos productos podrán usar CUP, USD o EUR
-- ============================================
