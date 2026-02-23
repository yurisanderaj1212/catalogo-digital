-- ============================================
-- SISTEMA DE PRODUCTOS COMPARTIDOS ENTRE TIENDAS
-- ============================================
-- Este script permite que un producto esté en múltiples tiendas
-- sin necesidad de duplicarlo
-- ============================================

-- PASO 1: Crear tabla intermedia productos_tiendas
CREATE TABLE IF NOT EXISTS productos_tiendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  fecha_agregado TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar duplicados: un producto no puede estar 2 veces en la misma tienda
  UNIQUE(producto_id, tienda_id)
);

-- PASO 2: Crear índices para mejorar rendimiento
CREATE INDEX idx_productos_tiendas_producto ON productos_tiendas(producto_id);
CREATE INDEX idx_productos_tiendas_tienda ON productos_tiendas(tienda_id);

-- PASO 3: Migrar datos existentes
-- Copiar las relaciones actuales de productos.tienda_id a la nueva tabla
INSERT INTO productos_tiendas (producto_id, tienda_id)
SELECT id, tienda_id 
FROM productos
WHERE tienda_id IS NOT NULL
ON CONFLICT (producto_id, tienda_id) DO NOTHING;

-- PASO 4: Configurar RLS (Row Level Security)
ALTER TABLE productos_tiendas ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede ver las relaciones
CREATE POLICY "Permitir lectura pública de productos_tiendas"
  ON productos_tiendas
  FOR SELECT
  USING (true);

-- Política: Solo usuarios autenticados pueden insertar
CREATE POLICY "Permitir inserción autenticada de productos_tiendas"
  ON productos_tiendas
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política: Solo usuarios autenticados pueden actualizar
CREATE POLICY "Permitir actualización autenticada de productos_tiendas"
  ON productos_tiendas
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Política: Solo usuarios autenticados pueden eliminar
CREATE POLICY "Permitir eliminación autenticada de productos_tiendas"
  ON productos_tiendas
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- NOTA IMPORTANTE:
-- ============================================
-- NO eliminamos la columna productos.tienda_id todavía
-- La mantenemos por compatibilidad, pero ya no se usará
-- En el futuro se puede eliminar con:
-- ALTER TABLE productos DROP COLUMN tienda_id;
-- ============================================

-- ============================================
-- VERIFICACIÓN: Ver estructura y datos
-- ============================================

-- Ver la nueva tabla
SELECT 
  pt.id,
  p.nombre as producto,
  t.nombre as tienda,
  pt.fecha_agregado
FROM productos_tiendas pt
JOIN productos p ON pt.producto_id = p.id
JOIN tiendas t ON pt.tienda_id = t.id
ORDER BY p.nombre, t.nombre
LIMIT 10;

-- Contar productos por tienda
SELECT 
  t.nombre as tienda,
  COUNT(pt.producto_id) as total_productos
FROM tiendas t
LEFT JOIN productos_tiendas pt ON t.id = pt.tienda_id
GROUP BY t.id, t.nombre
ORDER BY t.nombre;

-- Ver productos que están en múltiples tiendas
SELECT 
  p.nombre as producto,
  COUNT(pt.tienda_id) as num_tiendas,
  STRING_AGG(t.nombre, ', ') as tiendas
FROM productos p
JOIN productos_tiendas pt ON p.id = pt.producto_id
JOIN tiendas t ON pt.tienda_id = t.id
GROUP BY p.id, p.nombre
HAVING COUNT(pt.tienda_id) > 1
ORDER BY num_tiendas DESC, p.nombre;

-- ============================================
-- RESULTADO ESPERADO:
-- - Tabla productos_tiendas creada
-- - Datos migrados desde productos.tienda_id
-- - Políticas RLS configuradas
-- - Cada producto mantiene su relación con su tienda original
-- - Ahora puedes agregar el mismo producto a múltiples tiendas
-- ============================================
