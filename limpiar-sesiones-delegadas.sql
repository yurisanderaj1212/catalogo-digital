-- Ejecutar en Supabase SQL Editor
-- Limpia las sesiones de Diezmero y Ayestaran para que no intenten conectarse
-- ANTES de ejecutar, asegúrate de haber configurado la delegación en el panel

-- Ver el estado actual
SELECT t.nombre, s.numero_telefono, s.estado, s.sesion_maestra_id
FROM wa_sessions s
JOIN tiendas t ON t.id = s.tienda_id
ORDER BY t.nombre;

-- Limpiar sesiones que deben ser delegadas (ajusta los nombres si es necesario)
UPDATE wa_sessions
SET 
  auth_data = NULL,
  qr_actual = NULL,
  numero_telefono = '',
  estado = 'desconectado'
WHERE tienda_id IN (
  SELECT id FROM tiendas WHERE nombre ILIKE '%diezmero%' OR nombre ILIKE '%ayestaran%'
)
AND sesion_maestra_id IS NULL; -- solo las que todavía no tienen delegación configurada
