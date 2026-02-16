-- Crear bucket para logos de tiendas en Supabase Storage
-- Ejecutar esto en el SQL Editor de Supabase

-- 1. Crear el bucket 'tiendas' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('tiendas', 'tiendas', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear política para permitir lectura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'tiendas');

-- 3. Crear política para permitir subida de archivos (autenticados)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tiendas');

-- 4. Crear política para permitir actualización de archivos (autenticados)
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'tiendas');

-- 5. Crear política para permitir eliminación de archivos (autenticados)
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'tiendas');
