-- Script SQL para crear las tablas en Supabase
-- Ejecuta esto en el SQL Editor de Supabase

-- Tabla: tiendas
CREATE TABLE IF NOT EXISTS tiendas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  logo TEXT,
  direccion TEXT,
  telefono VARCHAR(50),
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  activa BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Tabla: categorias
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  tienda_id INTEGER REFERENCES tiendas(id) ON DELETE CASCADE,
  activa BOOLEAN DEFAULT true
);

-- Tabla: productos
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL,
  disponible BOOLEAN DEFAULT true,
  activa BOOLEAN DEFAULT true,
  tienda_id INTEGER REFERENCES tiendas(id) ON DELETE CASCADE,
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Tabla: imagenesproducto
CREATE TABLE IF NOT EXISTS imagenesproducto (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
  url_imagen TEXT NOT NULL
);

-- Tabla: usuariosadmin (para el panel admin futuro)
CREATE TABLE IF NOT EXISTS usuariosadmin (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_productos_tienda ON productos(tienda_id);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_categorias_tienda ON categorias(tienda_id);
CREATE INDEX idx_imagenes_producto ON imagenesproducto(producto_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE tiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagenesproducto ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público para lectura
CREATE POLICY "Permitir lectura pública de tiendas activas"
  ON tiendas FOR SELECT
  USING (activa = true);

CREATE POLICY "Permitir lectura pública de categorías activas"
  ON categorias FOR SELECT
  USING (activa = true);

CREATE POLICY "Permitir lectura pública de productos activos"
  ON productos FOR SELECT
  USING (activa = true);

CREATE POLICY "Permitir lectura pública de imágenes"
  ON imagenesproducto FOR SELECT
  USING (true);

-- Datos de ejemplo (opcional)
INSERT INTO tiendas (nombre, descripcion, direccion, telefono, latitud, longitud, activa) VALUES
('Tienda Principal', 'Nuestra tienda principal con todos los productos', 'Calle Principal 123', '+1234567890', 40.416775, -3.703790, true),
('Sucursal Norte', 'Sucursal ubicada en la zona norte', 'Avenida Norte 456', '+0987654321', 40.463667, -3.749220, true);

INSERT INTO categorias (nombre, tienda_id, activa) VALUES
('Electrónica', 1, true),
('Ropa', 1, true),
('Alimentos', 1, true),
('Electrónica', 2, true),
('Hogar', 2, true);

INSERT INTO productos (nombre, descripcion, precio, disponible, activa, tienda_id, categoria_id) VALUES
('Laptop HP', 'Laptop HP 15 pulgadas, 8GB RAM', 599.99, true, true, 1, 1),
('Camiseta Básica', 'Camiseta 100% algodón', 19.99, true, true, 1, 2),
('Arroz 1kg', 'Arroz blanco de primera calidad', 2.50, true, true, 1, 3),
('Mouse Inalámbrico', 'Mouse óptico inalámbrico', 15.99, true, true, 2, 4),
('Lámpara LED', 'Lámpara de escritorio LED regulable', 29.99, true, true, 2, 5);
