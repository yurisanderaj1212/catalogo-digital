-- Script para crear usuario administrador de prueba
-- Ejecuta esto en el SQL Editor de Supabase

-- Verificar si ya existe un usuario admin
SELECT * FROM usuarios_admin WHERE username = 'admin';

-- Si no existe, crear uno nuevo
-- IMPORTANTE: En producción deberías usar bcrypt para hashear la contraseña
-- Por ahora usamos texto plano para pruebas
INSERT INTO usuarios_admin (username, password_hash, activo)
VALUES ('admin', 'admin123', true)
ON CONFLICT (username) DO NOTHING;

-- Verificar que se creó correctamente
SELECT id, username, activo, fecha_creacion 
FROM usuarios_admin 
WHERE username = 'admin';
