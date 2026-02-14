-- ============================================
-- Prueba de Carga SEGURA: 200 Productos por Tienda
-- Este script verifica las categorías antes de crear productos
-- ============================================

-- PASO 1: Verificar categorías existentes
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '🔍 Verificando categorías...';
  
  -- Verificar DIEZMERO
  SELECT COUNT(*) INTO v_count
  FROM categorias
  WHERE tienda_id = '93816244-8bfd-4a0f-a720-f542dd834a21'
    AND activa = true;
  RAISE NOTICE '  DIEZMERO tiene % categorías activas', v_count;
  
  -- Verificar PEREZ LAZOS
  SELECT COUNT(*) INTO v_count
  FROM categorias
  WHERE tienda_id = '1ae5b64b-5e1b-4184-9ed7-a3d204111179'
    AND activa = true;
  RAISE NOTICE '  PEREZ LAZOS tiene % categorías activas', v_count;
END $$;

-- PASO 2: Generar productos para DIEZMERO
DO $$
DECLARE
  v_tienda_id UUID := '93816244-8bfd-4a0f-a720-f542dd834a21';
  v_categorias UUID[];
  v_categoria_id UUID;
  v_producto_id UUID;
  v_nombre TEXT;
  v_precio NUMERIC;
  v_num_categorias INTEGER;
  i INTEGER;
  categoria_index INTEGER;
BEGIN
  -- Obtener categorías activas de la tienda
  SELECT ARRAY_AGG(id) INTO v_categorias
  FROM categorias
  WHERE tienda_id = v_tienda_id AND activa = true;
  
  v_num_categorias := array_length(v_categorias, 1);
  
  IF v_num_categorias IS NULL OR v_num_categorias = 0 THEN
    RAISE EXCEPTION 'No hay categorías activas para DIEZMERO';
  END IF;
  
  RAISE NOTICE '🚀 Generando 200 productos para DIEZMERO (% categorías)...', v_num_categorias;
  
  FOR i IN 1..200 LOOP
    -- Distribuir productos entre categorías disponibles
    categoria_index := ((i - 1) % v_num_categorias) + 1;
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
      random() > 0.1,
      true,
      v_tienda_id,
      v_categoria_id
    ) RETURNING id INTO v_producto_id;
    
    -- Agregar 2-3 imágenes
    INSERT INTO imagenes_producto (producto_id, url_imagen, orden) VALUES
      (v_producto_id, 'https://via.placeholder.com/400x400/0066cc/ffffff?text=DIEZMERO+' || i, 0),
      (v_producto_id, 'https://via.placeholder.com/400x400/00cc66/ffffff?text=Imagen+2', 1);
    
    IF random() > 0.5 THEN
      INSERT INTO imagenes_producto (producto_id, url_imagen, orden) VALUES
        (v_producto_id, 'https://via.placeholder.com/400x400/cc6600/ffffff?text=Imagen+3', 2);
    END IF;
    
    IF i % 50 = 0 THEN
      RAISE NOTICE '  ✓ % productos creados para DIEZMERO...', i;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Completado: 200 productos creados para DIEZMERO!';
END $$;

-- PASO 3: Generar productos para PEREZ LAZOS
DO $$
DECLARE
  v_tienda_id UUID := '1ae5b64b-5e1b-4184-9ed7-a3d204111179';
  v_categorias UUID[];
  v_categoria_id UUID;
  v_producto_id UUID;
  v_nombre TEXT;
  v_precio NUMERIC;
  v_num_categorias INTEGER;
  i INTEGER;
  categoria_index INTEGER;
BEGIN
  -- Obtener categorías activas de la tienda
  SELECT ARRAY_AGG(id) INTO v_categorias
  FROM categorias
  WHERE tienda_id = v_tienda_id AND activa = true;
  
  v_num_categorias := array_length(v_categorias, 1);
  
  IF v_num_categorias IS NULL OR v_num_categorias = 0 THEN
    RAISE EXCEPTION 'No hay categorías activas para PEREZ LAZOS';
  END IF;
  
  RAISE NOTICE '🚀 Generando 200 productos para PEREZ LAZOS (% categorías)...', v_num_categorias;
  
  FOR i IN 1..200 LOOP
    -- Distribuir productos entre categorías disponibles
    categoria_index := ((i - 1) % v_num_categorias) + 1;
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
      random() > 0.15,
      true,
      v_tienda_id,
      v_categoria_id
    ) RETURNING id INTO v_producto_id;
    
    -- Agregar 2-3 imágenes
    INSERT INTO imagenes_producto (producto_id, url_imagen, orden) VALUES
      (v_producto_id, 'https://via.placeholder.com/400x400/cc0066/ffffff?text=PEREZ+' || i, 0),
      (v_producto_id, 'https://via.placeholder.com/400x400/6600cc/ffffff?text=Imagen+2', 1);
    
    IF random() > 0.5 THEN
      INSERT INTO imagenes_producto (producto_id, url_imagen, orden) VALUES
        (v_producto_id, 'https://via.placeholder.com/400x400/00cccc/ffffff?text=Imagen+3', 2);
    END IF;
    
    IF i % 50 = 0 THEN
      RAISE NOTICE '  ✓ % productos creados para PEREZ LAZOS...', i;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Completado: 200 productos creados para PEREZ LAZOS!';
END $$;

-- PASO 4: Verificar resultados
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

-- Ver total de imágenes
SELECT 
  COUNT(*) as total_imagenes,
  COUNT(DISTINCT producto_id) as productos_con_imagenes
FROM imagenes_producto
WHERE producto_id IN (
  SELECT id FROM productos 
  WHERE descripcion LIKE '%Producto de prueba de carga%'
);
