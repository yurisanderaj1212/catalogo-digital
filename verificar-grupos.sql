-- Verificar cuantos grupos hay y con qué tienda_id
SELECT 
  wg.tienda_id,
  t.nombre as tienda_nombre,
  COUNT(*) as total_grupos
FROM wa_grupos wg
LEFT JOIN tiendas t ON wg.tienda_id = t.id
GROUP BY wg.tienda_id, t.nombre;

-- Ver los primeros 10 grupos
SELECT id, tienda_id, grupo_jid, nombre, activo
FROM wa_grupos
ORDER BY created_at DESC
LIMIT 10;
