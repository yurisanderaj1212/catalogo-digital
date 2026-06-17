-- Migración: agregar campo mensaje_bienvenida a la tabla tiendas
-- Este mensaje se envía como primera publicación en cada ciclo del bot
-- Si ya corriste la versión anterior con 3 columnas, esta migración las consolida en una sola

-- Eliminar columnas anteriores si existen (versión previa con 3 campos)
ALTER TABLE tiendas
  DROP COLUMN IF EXISTS mensaje_bienvenida_linea1,
  DROP COLUMN IF EXISTS mensaje_bienvenida_linea2,
  DROP COLUMN IF EXISTS mensaje_bienvenida_linea3;

-- Agregar columna única de texto libre
ALTER TABLE tiendas
  ADD COLUMN IF NOT EXISTS mensaje_bienvenida TEXT DEFAULT NULL;

COMMENT ON COLUMN tiendas.mensaje_bienvenida IS 'Mensaje de bienvenida enviado como primer mensaje de cada ciclo WA. Texto libre, soporta saltos de línea y emojis.';
