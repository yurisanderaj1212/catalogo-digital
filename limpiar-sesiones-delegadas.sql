-- Ejecutar en Supabase SQL Editor
-- Limpia las sesiones de Diezmero y Ayestaran para que no intenten conectarse
-- ANTES de ejecutar, asegúrate de haber configurado la delegación en el panel

-- Ver el estado actual
SELECT t.nombre, s.numero_telefono, s.estado, s.sesion_maestra_id
FROM wa_sessions s
JOIN tiendas t ON t.id = s.tienda_id
ORDER BY t.nombre;

-- Corregir estado de sesiones delegadas a desconectado
-- (evita que el bot intente reconectarlas al arrancar)
UPDATE wa_sessions
SET estado = 'desconectado', qr_actual = NULL
WHERE sesion_maestra_id IS NOT NULL;
