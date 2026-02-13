-- Datos de ejemplo para probar el catálogo
-- Ejecuta esto DESPUÉS de crear las tablas con supabase-schema.sql

-- Limpiar datos existentes (opcional)
DELETE FROM imagenesproducto;
DELETE FROM productos;
DELETE FROM categorias;
DELETE FROM tiendas;

-- Insertar tiendas
INSERT INTO tiendas (nombre, descripcion, direccion, telefono, latitud, longitud, activa) VALUES
('Tienda Central', 'Nuestra tienda principal con la mayor variedad de productos', 'Av. Principal 123, Centro', '+52 55 1234 5678', 19.432608, -99.133209, true),
('Sucursal Norte', 'Sucursal ubicada en la zona norte de la ciudad', 'Calle Norte 456, Col. Norte', '+52 55 8765 4321', 19.485400, -99.162300, true);

-- Insertar categorías para Tienda Central (id: 1)
INSERT INTO categorias (nombre, tienda_id, activa) VALUES
('Electrónica', 1, true),
('Ropa y Accesorios', 1, true),
('Alimentos y Bebidas', 1, true),
('Hogar y Decoración', 1, true),
('Deportes', 1, true);

-- Insertar categorías para Sucursal Norte (id: 2)
INSERT INTO categorias (nombre, tienda_id, activa) VALUES
('Electrónica', 2, true),
('Papelería', 2, true),
('Juguetes', 2, true),
('Libros', 2, true);

-- Insertar productos para Tienda Central
INSERT INTO productos (nombre, descripcion, precio, disponible, activa, tienda_id, categoria_id) VALUES
-- Electrónica
('Laptop HP 15"', 'Laptop HP 15 pulgadas, Intel Core i5, 8GB RAM, 256GB SSD', 12999.00, true, true, 1, 1),
('Mouse Inalámbrico Logitech', 'Mouse óptico inalámbrico con receptor USB', 299.00, true, true, 1, 1),
('Teclado Mecánico RGB', 'Teclado mecánico gaming con iluminación RGB', 899.00, true, true, 1, 1),
('Audífonos Bluetooth', 'Audífonos inalámbricos con cancelación de ruido', 1499.00, true, true, 1, 1),
('Cargador USB-C 65W', 'Cargador rápido USB-C compatible con laptops y celulares', 399.00, false, true, 1, 1),

-- Ropa y Accesorios
('Camiseta Básica Blanca', 'Camiseta 100% algodón, tallas S-XL', 199.00, true, true, 1, 2),
('Jeans Mezclilla', 'Pantalón de mezclilla corte recto', 599.00, true, true, 1, 2),
('Gorra Deportiva', 'Gorra ajustable con protección UV', 249.00, true, true, 1, 2),
('Mochila Escolar', 'Mochila resistente con múltiples compartimentos', 449.00, true, true, 1, 2),

-- Alimentos y Bebidas
('Café Molido Premium 500g', 'Café 100% arábica, tueste medio', 189.00, true, true, 1, 3),
('Galletas de Chocolate', 'Paquete de galletas con chispas de chocolate', 45.00, true, true, 1, 3),
('Agua Mineral 1.5L', 'Agua purificada embotellada', 15.00, true, true, 1, 3),
('Cereal Integral 400g', 'Cereal de trigo integral con miel', 89.00, true, true, 1, 3),

-- Hogar y Decoración
('Lámpara de Escritorio LED', 'Lámpara LED regulable con puerto USB', 349.00, true, true, 1, 4),
('Cojín Decorativo', 'Cojín suave 40x40cm, varios colores', 129.00, true, true, 1, 4),
('Espejo de Pared', 'Espejo rectangular con marco de madera', 599.00, true, true, 1, 4),

-- Deportes
('Balón de Fútbol', 'Balón profesional tamaño 5', 399.00, true, true, 1, 5),
('Botella Deportiva 750ml', 'Botella térmica de acero inoxidable', 249.00, true, true, 1, 5),
('Yoga Mat', 'Tapete para yoga antideslizante 6mm', 349.00, true, true, 1, 5);

-- Insertar productos para Sucursal Norte
INSERT INTO productos (nombre, descripcion, precio, disponible, activa, tienda_id, categoria_id) VALUES
-- Electrónica
('Tablet Android 10"', 'Tablet con pantalla HD, 32GB almacenamiento', 3499.00, true, true, 2, 6),
('Cable HDMI 2m', 'Cable HDMI 2.0 alta velocidad', 149.00, true, true, 2, 6),
('Memoria USB 64GB', 'Memoria flash USB 3.0', 199.00, true, true, 2, 6),

-- Papelería
('Cuaderno Profesional', 'Cuaderno 100 hojas cuadrícula', 35.00, true, true, 2, 7),
('Plumas Gel Set 12 piezas', 'Set de plumas de gel colores variados', 89.00, true, true, 2, 7),
('Calculadora Científica', 'Calculadora con funciones avanzadas', 299.00, true, true, 2, 7),
('Folder Tamaño Carta', 'Folder de plástico transparente', 12.00, true, true, 2, 7),

-- Juguetes
('Rompecabezas 1000 piezas', 'Rompecabezas con imagen de paisaje', 249.00, true, true, 2, 8),
('Peluche Oso 30cm', 'Peluche suave y esponjoso', 199.00, true, true, 2, 8),
('Set de Construcción', 'Bloques de construcción 200 piezas', 399.00, true, true, 2, 8),

-- Libros
('Libro de Cocina Mexicana', 'Recetas tradicionales mexicanas', 299.00, true, true, 2, 9),
('Novela Bestseller', 'Última novela del autor reconocido', 349.00, true, true, 2, 9),
('Libro de Desarrollo Personal', 'Guía para mejorar tu vida', 249.00, false, true, 2, 9);

-- Nota: Para agregar imágenes, necesitas:
-- 1. Subir las imágenes a Supabase Storage o usar URLs externas
-- 2. Insertar las URLs en la tabla imagenesproducto
-- Ejemplo:
-- INSERT INTO imagenesproducto (producto_id, url_imagen) VALUES
-- (1, 'https://tu-bucket.supabase.co/storage/v1/object/public/productos/laptop.jpg'),
-- (2, 'https://tu-bucket.supabase.co/storage/v1/object/public/productos/mouse.jpg');
