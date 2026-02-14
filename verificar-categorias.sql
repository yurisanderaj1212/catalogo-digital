-- Verificar categorías existentes
SELECT 
  t.id as tienda_id,
  t.nombre as tienda,
  c.id as categoria_id,
  c.nombre as categoria,
  c.activa
FROM tiendas t
LEFT JOIN categorias c ON c.tienda_id = t.id
WHERE t.id IN (
  '93816244-8bfd-4a0f-a720-f542dd834a21',
  '1ae5b64b-5e1b-4184-9ed7-a3d204111179'
)
ORDER BY t.nombre, c.nombre;
