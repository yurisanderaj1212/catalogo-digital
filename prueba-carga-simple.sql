-- ============================================
-- Prueba de Carga: 200 Productos por Tienda
-- ============================================

-- TIENDA 1: DIEZMERO (200 productos)
DO $$
DECLARE
  v_tienda_id UUID := '93816244-8bfd-4a0f-a720-f542dd834a21';
  v_categorias UUID[] := ARRAY[
    'ecfb8462-5346-4b5f-895b-d24057e83fd8'::UUID, -- Deportesiii
    '1388c07b-34fd-4740-942f-d63b1ae1557a'::UUID, -- dsfgfgsfgfgsfgfsfsgdfgs
    '5b155c53-c803-4727-a8d4-334330e0e505'::UUID, -- Electrónica
    '183931eb-e054-4562-887e-e73e2923c009'::UUID, -- Juguetes
    '9ae19b26-8ebe-4ebd-8d70-06db7004280f'::UUID  -- pepe
  ];
  v_categoria_id UUID;
  v_producto_id UUID;
  v_nombre TEXT;
  v_precio NUMERIC;
  i INTEGER;
  categoria_index INTEGER;
BEGIN
  RAISE NOTICE '🚀 Generando 200 productos para DIEZMERO...';
  
  FOR i IN 1..200 LOOP
    -- Distribuir productos entre categorías (40 por categoría)
    categoria_index := ((i - 1) / 40) + 1;
    IF categoria_index > 5 THEN categoria_index := 5; END IF;
    v_categoria_id := v_categorias[categoria_index];
    
    -- Generar nombre único
    v_nombre := 'Producto DIEZMERO ' || LPAD(i::TEXT, 3, '0');
    
    -- Precio aleatorio entre 100 y 5000 CUP
    v_precio := 100 + floor(random() * 4900);
    
    -- Insertar producto
    INSERT INTO productos (
      nombre,
      descripcion,
      precio,
      disponible,
      activo,
      tienda_id,
      categoria_id
    ) VALUES (
      v_nombre,
      'Producto de prueba de carga para DIEZMERO. ' ||
      'Descripción detallada del producto número ' || i || '. ' ||
      'Características: Excelente calidad, garantía de 1 año, envío disponible. ' ||
      'Ideal para uso diario y profesional. Fabricado con materiales de primera calidad.',
      v_precio,
      random() > 0.1, -- 90% disponibles
      true,
      v_tienda_id,
      v_categoria_id
    ) RETURNING id INTO v_producto_id;
    
    -- Agregar 2-3 imágenes de placeholder por producto
    INSERT INTO imagenes_producto (producto_id, url_imagen, orden) VALUES
      (v_producto_id, 'https://via.placeholder.com/400x400/0066cc/ffffff?text=DIEZMERO+' || i, 0),
      (v_producto_id, 'https://via.placeholder.com/400x400/00cc66/ffffff?text=Imagen+2', 1);
    
    -- Algunos productos con 3 imágenes
    IF random() > 0.5 THEN
      INSERT INTO imagenes_producto (producto_id, url_imagen, orden) VALUES
        (v_producto_id, 'https://via.placeholder.com/400x400/cc6600/ffffff?text=Imagen+3', 2);
    END IF;
    
    -- Progreso cada 50 productos
    IF i % 50 = 0 THEN
      RAISE NOTICE '  ✓ % productos creados para DIEZMERO...', i;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Completado: 200 productos creados para DIEZMERO!';
END $$;

-- TIENDA 2: PEREZ LAZOS S.R.L. (200 productos)
DO $$
DECLARE
  v_tienda_id UUID := '1ae5b64b-5e1b-4184-9ed7-a3d204111179';
  v_categorias UUID[] := ARRAY[
    'aa3365ab-6c58-4e83-af73-20cdfc3a1e42'::UUID, -- Electrónica
    '28080200-18ad-48bb-b7ab-c92b7d622747'::UUID, -- Hogar
    '085ab0b3-b43c-4eaf-9635-8aec9f581a4c'::UUID, -- pepe
    '283894e3-1032-46e0-bdd6-90c5188888f0'::UUID  -- Ropa
  ];
  v_categoria_id UUID;
  v_producto_id UUID;
  v_nombre TEXT;
  v_precio NUMERIC;
  i INTEGER;
  categoria_index INTEGER;
BEGIN
  RAISE NOTICE '🚀 Generando 200 productos para PEREZ LAZOS S.R.L....';
  
  FOR i IN 1..200 LOOP
    -- Distribuir productos entre categorías (50 por categoría)
    categoria_index := ((i - 1) / 50) + 1;
    IF categoria_index > 4 THEN categoria_index := 4; END IF;
    v_categoria_id := v_categorias[categoria_index];
    
    -- Generar nombre único
    v_nombre := 'Producto PEREZ LAZOS ' || LPAD(i::TEXT, 3, '0');
    
    -- Precio aleatorio entre 150 y 6000 CUP
    v_precio := 150 + floor(random() * 5850);
    
    -- Insertar producto
    INSERT INTO productos (
      nombre,
      descripcion,
      precio,
      disponible,
      activo,
      tienda_id,
      categoria_id
    ) VALUES (
      v_nombre,
      'Producto de prueba de carga para PEREZ LAZOS S.R.L. ' ||
      'Descripción detallada del producto número ' || i || '. ' ||
      'Características: Alta calidad, garantía extendida, servicio post-venta. ' ||
      'Perfecto para clientes exigentes. Importado directamente.',
      v_precio,
      random() > 0.15, -- 85% disponibles
      true,
      v_tienda_id,
      v_categoria_id
    ) RETURNING id INTO v_producto_id;
    
    -- Agregar 2-3 imágenes de placeholder por producto
    INSERT INTO imagenes_producto (producto_id, url_imagen, orden) VALUES
      (v_producto_id, 'https://via.placeholder.com/400x400/cc0066/ffffff?text=PEREZ+' || i, 0),
      (v_producto_id, 'https://via.placeholder.com/400x400/6600cc/ffffff?text=Imagen+2', 1);
    
    -- Algunos productos con 3 imágenes
    IF random() > 0.5 THEN
      INSERT INTO imagenes_producto (producto_id, url_imagen, orden) VALUES
        (v_producto_id, 'https://via.placeholder.com/400x400/00cccc/ffffff?text=Imagen+3', 2);
    END IF;
    
    -- Progreso cada 50 productos
    IF i % 50 = 0 THEN
      RAISE NOTICE '  ✓ % productos creados para PEREZ LAZOS...', i;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Completado: 200 productos creados para PEREZ LAZOS S.R.L.!';
END $$;

-- ============================================
-- Verificar productos creados
-- ============================================

SELECT 
  t.nombre as tienda,
  COUNT(p.id) as total_productos,
  COUNT(CASE WHEN p.disponible THEN 1 END) as disponibles,
  COUNT(CASE WHEN NOT p.disponible THEN 1 END) as no_disponibles,
  ROUND(AVG(p.precio), 2) as precio_promedio,
  MIN(p.precio) as precio_minimo,
  MAX(p.precio) as precio_maximo
FROM tiendas t
LEFT JOIN productos p ON p.tienda_id = t.id AND p.activo = true
WHERE t.activa = true
GROUP BY t.id, t.nombre
ORDER BY total_productos DESC;

-- Ver distribución por categoría
SELECT 
  t.nombre as tienda,
  c.nombre as categoria,
  COUNT(p.id) as total_productos
FROM tiendas t
LEFT JOIN categorias c ON c.tienda_id = t.id
LEFT JOIN productos p ON p.categoria_id = c.id AND p.activo = true
WHERE t.activa = true AND c.activa = true
GROUP BY t.id, t.nombre, c.id, c.nombre
ORDER BY t.nombre, total_productos DESC;

-- Ver total de imágenes generadas
SELECT 
  COUNT(*) as total_imagenes,
  COUNT(DISTINCT producto_id) as productos_con_imagenes
FROM imagenes_producto
WHERE producto_id IN (
  SELECT id FROM productos 
  WHERE descripcion LIKE '%Producto de prueba de carga%'
);
