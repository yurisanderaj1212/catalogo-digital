# PASO 1: Configurar Supabase Auth

## 🎯 OBJETIVO
Configurar autenticación profesional en Supabase Dashboard.

---

## 📋 PARTE A: HABILITAR EMAIL AUTH

### 1. Ir a Authentication Settings
1. Abre tu proyecto en Supabase: https://supabase.com/dashboard
2. En el menú lateral, ve a **Authentication** → **Providers**
3. Busca **Email** en la lista de providers

### 2. Configurar Email Provider
```
✅ Enable Email provider: ON
✅ Confirm email: OFF (importante para admin)
✅ Secure email change: ON
✅ Secure password change: ON
```

**¿Por qué desactivar "Confirm email"?**
- Los admins no necesitan confirmar email
- Acceso inmediato al panel
- Más simple para gestionar

### 3. Guardar cambios
- Haz clic en **Save**

---

## 📋 PARTE B: CONFIGURAR URL CONFIGURATION

### 1. Ir a URL Configuration
1. En **Authentication** → **URL Configuration**
2. Configura estas URLs:

```
Site URL: http://localhost:3000
(Cambiarás esto a tu dominio después)

Redirect URLs:
http://localhost:3000/**
http://localhost:3000/admin/**
http://localhost:3000/admin/dashboard
```

### 2. Guardar cambios

---

## 📋 PARTE C: CREAR USUARIOS ADMIN MANUALMENTE

### Opción 1: Desde Dashboard (MÁS FÁCIL)

1. Ve a **Authentication** → **Users**
2. Haz clic en **Add user** → **Create new user**
3. Completa el formulario:

**Usuario 1 (Principal):**
```
Email: yurisanderaj@gmail.com
Password: [Crea una contraseña segura]
✅ Auto Confirm User: ON (importante)
```

**Usuario 2 (Backup):**
```
Email: yurisanderalmirajimenez@gmail.com
Password: [Crea una contraseña segura]
✅ Auto Confirm User: ON (importante)
```

4. Haz clic en **Create user**

### Opción 2: Desde SQL Editor (ALTERNATIVA)

Si prefieres SQL, ve a **SQL Editor** y ejecuta:

```sql
-- Crear usuario admin principal
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'yurisanderaj@gmail.com',
  crypt('TU_CONTRASEÑA_AQUI', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Crear usuario admin backup
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'yurisanderalmirajimenez@gmail.com',
  crypt('TU_CONTRASEÑA_AQUI', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
```

**⚠️ IMPORTANTE:** Reemplaza `TU_CONTRASEÑA_AQUI` con tu contraseña real.

---

## 📋 PARTE D: VERIFICAR USUARIOS CREADOS

1. Ve a **Authentication** → **Users**
2. Deberías ver tus 2 usuarios:
   - yurisanderaj@gmail.com
   - yurisanderalmirajimenez@gmail.com
3. Verifica que ambos tengan:
   - ✅ Email confirmed
   - ✅ Status: Active

---

## 📋 PARTE E: CONFIGURAR POLÍTICAS DE EMAIL

### 1. Deshabilitar registro público
1. Ve a **Authentication** → **Policies**
2. Busca **Enable email signups**
3. **Desactívalo** (OFF)

**¿Por qué?**
- Solo tú puedes crear admins desde el Dashboard
- Nadie puede auto-registrarse
- Mayor seguridad

---

## 📋 PARTE F: ANOTAR CREDENCIALES

**Guarda esta información en un lugar seguro:**

```
=== CREDENCIALES ADMIN ===

Usuario Principal:
Email: yurisanderaj@gmail.com
Password: ___________________

Usuario Backup:
Email: yurisanderalmirajimenez@gmail.com
Password: ___________________

=== SUPABASE PROJECT ===
Project URL: ___________________
Anon Key: ___________________
Service Role Key: ___________________ (NO compartir)
```

---

## ✅ VERIFICACIÓN

Marca cuando completes cada paso:

- [x] Email provider habilitado
- [x] Confirm email desactivado
- [x] URLs de redirección configuradas
- [x] Usuario principal creado (yurisanderaj@gmail.com)
- [x] Usuario backup creado (yurisanderalmirajimenez@gmail.com)
- [x] Ambos usuarios confirmados
- [x] Registro público deshabilitado
- [x] Credenciales anotadas en lugar seguro

---

## 🎯 SIGUIENTE PASO

Una vez completado esto, pasaremos a:
**PASO 2: Actualizar Políticas RLS**

---

## ❓ PROBLEMAS COMUNES

**Problema: No puedo crear usuarios**
- Verifica que Email provider esté habilitado
- Asegúrate de marcar "Auto Confirm User"

**Problema: Usuario creado pero no aparece**
- Refresca la página
- Verifica en SQL Editor: `SELECT * FROM auth.users;`

**Problema: No encuentro "Add user"**
- Ve a Authentication → Users
- El botón está arriba a la derecha

---

**¿Listo para continuar?** Avísame cuando hayas completado estos pasos.
