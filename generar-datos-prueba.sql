-- ============================================
-- Script de Prueba de Carga: 200 Productos por Tienda
-- ============================================

-- IMPORTANTE: Este script genera datos de prueba
-- Ejecutar solo en ambiente de desarrollo/testing

-- ============================================
-- Paso 1: Obtener IDs de tiendas y categorías
-- ============================================

-- Ver tiendas disponibles
SELECT id, nombre FROM tiendas WHERE activa = true;

-- Ver categorías por tienda (ajustar tienda_id según necesites)
SELECT id, nombre, tienda_id FROM categorias WHERE activa = true;

-- ============================================
-- Paso 2: Generar 200 productos para una tienda
-- ============================================

-- REEMPLAZA estos valores con los IDs reales de tu base de datos:
-- @TIENDA_ID: ID de la tienda donde quieres agregar productos
-- @CATEGORIA_IDS: Array de IDs de categorías de esa tienda

DO $$
DECLARE
  v_tienda_id UUID := 'TU-TIENDA-ID-AQUI'; -- CAMBIAR ESTE ID
  v_categoria_ids UUID[] := ARRAY[
    'CATEGORIA-ID-1',  -- CAMBIAR ESTOS IDs
    'CATEGORIA-ID-2',
    'CATEGORIA-ID-3'
  ];
  v_categoria_id UUID;
  v_producto_id UUID;
  v_nombres TEXT[] := ARRAY[
    'Laptop', 'Mouse', 'Teclado', 'Monitor', 'Auriculares', 'Webcam', 'Micrófono',
    'Tablet', 'Smartphone', 'Smartwatch', 'Cargador', 'Cable USB', 'Adaptador',
    'Disco Duro', 'SSD', 'Memoria RAM', 'Procesador', 'Tarjeta Gráfica',
    'Impresora', 'Scanner', 'Router', 'Switch', 'Modem', 'Antena WiFi',
    'Bocinas', 'Subwoofer', 'Amplificador', 'Mezcladora', 'Consola',
    'Camisa', 'Pantalón', 'Zapatos', 'Gorra', 'Reloj', 'Bolso', 'Mochila',
    'Perfume', 'Crema', 'Shampoo', 'Jabón', 'Desodorante', 'Loción',
    'Libro', 'Cuaderno', 'Lápiz', 'Pluma', 'Marcador', 'Borrador',
    'Silla', 'Mesa', 'Escritorio', 'Estante', 'Lámpara', 'Ventilador',
    'Refrigerador', 'Microondas', 'Licuadora', 'Cafetera', 'Tostadora',
    'Televisor', 'Reproductor', 'Consola de Juegos', 'Control', 'Juego',
    'Bicicleta', 'Patineta', 'Balón', 'Raqueta', 'Pesas', 'Colchoneta',
    'Pintura', 'Brocha', 'Rodillo', 'Espátula', 'Lija', 'Cinta',
    'Martillo', 'Destornillador', 'Taladro', 'Sierra', 'Llave', 'Alicate',
    'Semillas', 'Fertilizante', 'Maceta', 'Regadera', 'Pala', 'Rastrillo',
    'Juguete', 'Muñeca', 'Carrito', 'Rompecabezas', 'Peluche', 'Bloques'
  ];
  v_adjetivos TEXT[] := ARRAY[
    'Premium', 'Profesional', 'Económico', 'Deluxe', 'Básico', 'Avanzado',
    'Compacto', 'Portátil', 'Inalámbrico', 'Bluetooth', 'USB-C', 'HD',
    'Ultra', 'Mini', 'Maxi', 'Pro', 'Plus', 'Lite', 'Max', 'Air',
    'Negro', 'Blanco', 'Azul', 'Rojo', 'Verde', 'Gris', 'Plateado',
    'Moderno', 'Clásico', 'Elegante', 'Deportivo', 'Casual', 'Formal'
  ];
  v_nombre TEXT;
  v_precio NUMERIC;
  v_disponible BOOLEAN;
  i INTEGER;
BEGIN
  -- Generar 200 productos
  FOR i IN 1..200 LOOP
    -- Seleccionar categoría aleatoria
    v_categoria_id := v_categoria_ids[1 + floor(random() * array_length(v_categoria_ids, 1))];
    
    -- Generar nombre aleatorio
    v_nombre := v_adjetivos[1 + floor(random() * array_length(v_adjetivos, 1))] || ' ' ||
                v_nombres[1 + floor(random() * array_length(v_nombres, 1))] || ' ' ||
                '#' || i;
    
    -- Generar precio aleatorio entre 50 y 5000 CUP
    v_precio := 50 + floor(random() * 4950);
    
    -- 90% de productos disponibles
    v_disponible := random() > 0.1;
    
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
      'Producto de prueba generado automáticamente. ' || 
      'Características: Alta calidad, garantía incluida, envío disponible. ' ||
      'Ideal para uso diario. Número de serie: TEST-' || i,
      v_precio,
      v_disponible,
      true,
      v_tienda_id,
      v_categoria_id
    ) RETURNING id INTO v_producto_id;
    
    -- Agregar 1-3 imágenes de ejemplo por producto
    FOR j IN 1..(1 + floor(random() * 3)) LOOP
      INSERT INTO imagenes_producto (
        producto_id,
        url_imagen,
        orden
      ) VALUES (
        v_producto_id,
        'https://via.placeholder.com/400x400/0066cc/ffffff?text=Producto+' || i || '+Img+' || j,
        j - 1
      );
    END LOOP;
    
    -- Mostrar progreso cada 50 productos
    IF i % 50 = 0 THEN
      RAISE NOTICE 'Productos creados: %', i;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Completado: 200 productos creados exitosamente';
END $$;

-- ============================================
-- Paso 3: Verificar productos creados
-- ============================================

-- Contar productos por tienda
SELECT 
  t.nombre as tienda,
  COUNT(p.id) as total_productos,
  COUNT(CASE WHEN p.disponible THEN 1 END) as disponibles,
  COUNT(CASE WHEN NOT p.disponible THEN 1 END) as no_disponibles
FROM tiendas t
LEFT JOIN productos p ON p.tienda_id = t.id AND p.activo = true
WHERE t.activa = true
GROUP BY t.id, t.nombre
ORDER BY total_productos DESC;

-- Ver distribución por categoría
SELECT 
  c.nombre as categoria,
  COUNT(p.id) as total_productos
FROM categorias c
LEFT JOIN productos p ON p.categoria_id = c.id AND p.activo = true
WHERE c.activa = true
GROUP BY c.id, c.nombre
ORDER BY total_productos DESC;

-- ============================================
-- Paso 4: Limpiar datos de prueba (OPCIONAL)
-- ============================================

-- CUIDADO: Esto eliminará TODOS los productos de prueba
-- Descomenta solo si quieres limpiar

/*
DELETE FROM imagenes_producto 
WHERE producto_id IN (
  SELECT id FROM productos 
  WHERE descripcion LIKE '%Producto de prueba generado automáticamente%'
);

DELETE FROM productos 
WHERE descripcion LIKE '%Producto de prueba generado automáticamente%';

RAISE NOTICE 'Productos de prueba eliminados';
*/
