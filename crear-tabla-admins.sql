-- ============================================
-- TABLA PARA GESTIONAR ADMINS
-- Ejecuta este script en SQL Editor de Supabase
-- ============================================

-- Crear tabla para gestionar qué usuarios son admins
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT,
  activo BOOLEAN DEFAULT true,
  es_super_admin BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  creado_por UUID REFERENCES auth.users(id),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Habilitar RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Política: Solo admins autenticados pueden ver la lista de admins
CREATE POLICY "admins_can_read_admins"
ON public.admins FOR SELECT
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM public.admins WHERE activo = true)
);

-- Política: Solo super admins pueden crear/editar/eliminar admins
CREATE POLICY "super_admins_can_manage_admins"
ON public.admins FOR ALL
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM public.admins WHERE activo = true AND es_super_admin = true)
)
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.admins WHERE activo = true AND es_super_admin = true)
);

-- Índices para mejor rendimiento
CREATE INDEX idx_admins_user_id ON public.admins(user_id);
CREATE INDEX idx_admins_email ON public.admins(email);
CREATE INDEX idx_admins_activo ON public.admins(activo);

-- ============================================
-- INSERTAR TUS USUARIOS COMO SUPER ADMINS
-- ============================================

-- IMPORTANTE: Ejecuta esto DESPUÉS de crear los usuarios en auth.users
-- Reemplaza los emails si son diferentes

INSERT INTO public.admins (user_id, email, nombre, activo, es_super_admin, creado_por)
SELECT 
  id,
  email,
  'Yuri Sander (Principal)',
  true,
  true,
  id
FROM auth.users
WHERE email = 'yurisanderaj@gmail.com'
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.admins (user_id, email, nombre, activo, es_super_admin, creado_por)
SELECT 
  id,
  email,
  'Yuri Sander (Backup)',
  true,
  true,
  (SELECT id FROM auth.users WHERE email = 'yurisanderaj@gmail.com')
FROM auth.users
WHERE email = 'yurisanderalmirajimenez@gmail.com'
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- FUNCIÓN HELPER: Verificar si usuario es admin
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.user_id = is_admin.user_id
    AND activo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN HELPER: Verificar si usuario es super admin
-- ============================================

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.user_id = is_super_admin.user_id
    AND activo = true
    AND es_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICAR QUE TODO FUNCIONA
-- ============================================

-- Ver todos los admins
SELECT 
  a.id,
  a.email,
  a.nombre,
  a.activo,
  a.es_super_admin,
  a.fecha_creacion,
  u.email_confirmed_at,
  u.last_sign_in_at
FROM public.admins a
LEFT JOIN auth.users u ON a.user_id = u.id
ORDER BY a.fecha_creacion;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

/*
1. SUPER ADMIN vs ADMIN NORMAL:
   - Super Admin: Puede agregar/eliminar otros admins
   - Admin Normal: Solo puede gestionar productos/tiendas

2. AGREGAR MÁS ADMINS:
   - Primero crear usuario en Authentication → Users
   - Luego agregarlo a la tabla admins con es_super_admin = false

3. SEGURIDAD:
   - Solo usuarios en tabla 'admins' pueden acceder al panel
   - Solo super admins pueden gestionar otros admins
   - Los admins inactivos no pueden acceder

4. PARA AGREGAR UN NUEVO ADMIN MANUALMENTE:
   
   -- Paso 1: Crear usuario en auth.users (desde Dashboard)
   -- Paso 2: Agregarlo a tabla admins
   INSERT INTO public.admins (user_id, email, nombre, activo, es_super_admin, creado_por)
   SELECT 
     id,
     'nuevo@email.com',
     'Nombre del Admin',
     true,
     false,  -- false = admin normal, true = super admin
     (SELECT id FROM auth.users WHERE email = 'yurisanderaj@gmail.com')
   FROM auth.users
   WHERE email = 'nuevo@email.com';
*/

