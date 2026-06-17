-- Migración: agregar campos de mensaje de bienvenida a la tabla tiendas
-- Este mensaje se envía como primera publicación en cada ciclo del bot

ALTER TABLE tiendas
  ADD COLUMN IF NOT EXISTS mensaje_bienvenida_linea1 TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS mensaje_bienvenida_linea2 TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS mensaje_bienvenida_linea3 TEXT DEFAULT NULL;

COMMENT ON COLUMN tiendas.mensaje_bienvenida_linea1 IS 'Primera línea del mensaje de bienvenida (ej: nombre de la tienda / encabezado)';
COMMENT ON COLUMN tiendas.mensaje_bienvenida_linea2 IS 'Segunda línea del mensaje de bienvenida (ej: descripción / eslogan)';
COMMENT ON COLUMN tiendas.mensaje_bienvenida_linea3 IS 'Tercera línea del mensaje de bienvenida (ej: contacto / cierre)';
