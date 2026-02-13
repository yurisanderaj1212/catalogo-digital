# 🚀 Guía Completa de Deploy - Catálogo Digital

## ⚠️ IMPORTANTE: GitHub Pages NO Funciona con Next.js

GitHub Pages solo sirve para sitios estáticos. Este proyecto usa Next.js con funcionalidades dinámicas (SSR), por lo que necesitas usar:

- **Vercel** (Recomendado - Gratis y fácil) ⭐
- **Netlify** (Alternativa gratuita)
- **Render** (Alternativa gratuita)

Esta guía usa **Vercel** porque es la más simple y está hecha por los creadores de Next.js.

---

## 📋 Checklist Previo

Antes de empezar, asegúrate de tener:

- [ ] Cuenta en Supabase (gratis)
- [ ] Cuenta en GitHub (gratis)
- [ ] Cuenta en Vercel (gratis)
- [ ] Git instalado en tu computadora
- [ ] Node.js instalado (v18 o superior)

---

## PASO 1: Configurar Supabase Correctamente

### 1.1 Verificar/Crear Tablas

Tu base de datos ya debería estar creada, pero verifica que tengas estas tablas:

1. Ve a Supabase → Table Editor
2. Verifica que existan:
   - `tiendas`
   - `categorias`
   - `productos`
   - `imagenes_producto` (con guión bajo)
   - `usuarios_admin` (con guión bajo)

### 1.2 Configurar Políticas de Seguridad (RLS)

**IMPORTANTE:** Estas políticas son necesarias para que el catálogo funcione en producción.

Ve a Supabase → SQL Editor y ejecuta este script:

```sql
-- ============================================
-- POLÍTICAS DE SEGURIDAD PARA PRODUCCIÓN
-- ============================================

-- 1. POLÍTICAS PARA LECTURA PÚBLICA (Catálogo)
-- ============================================

-- Tiendas: Permitir lectura pública de tiendas activas
CREATE POLICY IF NOT EXISTS "Lectura pública de tiendas activas"
ON tiendas FOR SELECT
TO public
USING (activa = true);

-- Categorías: Permitir lectura pública de categorías activas
CREATE POLICY IF NOT EXISTS "Lectura pública de categorías activas"
ON categorias FOR SELECT
TO public
USING (activa = true);

-- Productos: Permitir lectura pública de productos activos
CREATE POLICY IF NOT EXISTS "Lectura pública de productos activos"
ON productos FOR SELECT
TO public
USING (activo = true);

-- Imágenes: Permitir lectura pública de todas las imágenes
CREATE POLICY IF NOT EXISTS "Lectura pública de imágenes"
ON imagenes_producto FOR SELECT
TO public
USING (true);


-- 2. POLÍTICAS PARA ESCRITURA (Panel Admin)
-- ============================================

-- Tiendas: Permitir todas las operaciones (sin autenticación por ahora)
CREATE POLICY IF NOT EXISTS "Permitir todas las operaciones en tiendas"
ON tiendas FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Categorías: Permitir todas las operaciones
CREATE POLICY IF NOT EXISTS "Permitir todas las operaciones en categorías"
ON categorias FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Productos: Permitir todas las operaciones
CREATE POLICY IF NOT EXISTS "Permitir todas las operaciones en productos"
ON productos FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Imágenes: Permitir todas las operaciones
CREATE POLICY IF NOT EXISTS "Permitir todas las operaciones en imágenes"
ON imagenes_producto FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Usuarios Admin: Permitir lectura para login
CREATE POLICY IF NOT EXISTS "Permitir lectura de usuarios admin"
ON usuarios_admin FOR SELECT
TO public
USING (activo = true);
```

### 1.3 Configurar Storage (Bucket de Imágenes)

1. Ve a Supabase → Storage
2. Verifica que exista el bucket `imagenes`
3. Si no existe, créalo:
   - Click en "Create a new bucket"
   - Name: `imagenes`
   - Public bucket: ✅ ACTIVADO
   - Click "Create bucket"

4. Configurar políticas del bucket:
   - Click en el bucket `imagenes`
   - Ve a "Policies"
   - Agrega estas políticas:

```sql
-- Permitir lectura pública
CREATE POLICY "Lectura pública de imágenes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'imagenes');

-- Permitir subida pública (para el admin)
CREATE POLICY "Permitir subida de imágenes"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'imagenes');

-- Permitir eliminación pública (para el admin)
CREATE POLICY "Permitir eliminación de imágenes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'imagenes');
```

### 1.4 Obtener Credenciales

1. Ve a Supabase → Project Settings → API
2. Copia estos valores (los necesitarás después):
   - **Project URL**: `https://xmfvfhfizlgrcwylrtlg.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## PASO 2: Preparar el Código para Deploy

### 2.1 Verificar que todo funcione localmente

1. Abre terminal en la carpeta `catalogo-digital`
2. Ejecuta:

```bash
npm run build
```

3. Si hay errores, corrígelos antes de continuar
4. Si todo está bien, verás: "✓ Compiled successfully"

### 2.2 Crear archivo .gitignore

Verifica que exista el archivo `.gitignore` con este contenido:

```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

⚠️ **IMPORTANTE:** El archivo `.env.local` NO debe subirse a GitHub (ya está en .gitignore)

---

## PASO 3: Subir a GitHub

### 3.1 Crear Repositorio en GitHub

1. Ve a [https://github.com](https://github.com)
2. Click en "+" → "New repository"
3. Completa:
   - Repository name: `catalogo-digital`
   - Description: "Catálogo digital multitiendas con Next.js y Supabase"
   - Visibility: **Public** (recomendado)
   - ❌ NO marques "Add a README file"
4. Click "Create repository"

### 3.2 Inicializar Git y Subir Código

Abre terminal en la carpeta `catalogo-digital` y ejecuta:

```bash
# Inicializar repositorio
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit: Catálogo digital completo"

# Configurar rama principal
git branch -M main

# Conectar con GitHub (REEMPLAZA TU-USUARIO)
git remote add origin https://github.com/TU-USUARIO/catalogo-digital.git

# Subir código
git push -u origin main
```

⚠️ **Reemplaza `TU-USUARIO`** con tu nombre de usuario de GitHub

### 3.3 Verificar que se subió correctamente

1. Refresca la página de tu repositorio en GitHub
2. Deberías ver todos los archivos
3. Verifica que NO esté el archivo `.env.local` (debe estar oculto por .gitignore)

---

## PASO 4: Deploy en Vercel

### 4.1 Crear Cuenta en Vercel

1. Ve a [https://vercel.com](https://vercel.com)
2. Click en "Sign Up"
3. Selecciona "Continue with GitHub"
4. Autoriza a Vercel para acceder a tu GitHub

### 4.2 Importar Proyecto

1. En el dashboard de Vercel, click en "Add New..." → "Project"
2. Busca tu repositorio `catalogo-digital`
3. Click en "Import"

### 4.3 Configurar Variables de Entorno

**IMPORTANTE:** Aquí es donde agregas tus credenciales de Supabase

1. En la sección "Environment Variables", agrega:

   **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://xmfvfhfizlgrcwylrtlg.supabase.co`
   
   **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (tu clave completa)

2. Verifica que ambas variables estén agregadas

### 4.4 Deploy

1. Click en "Deploy"
2. Espera 2-3 minutos mientras Vercel construye tu proyecto
3. Verás un mensaje de "Congratulations!" cuando termine

### 4.5 Acceder a tu Sitio

Tu sitio estará disponible en:

```
https://catalogo-digital-tu-usuario.vercel.app
```

O un dominio similar que Vercel te asigne.

---

## PASO 5: Verificar que Todo Funcione

### 5.1 Probar el Catálogo Público

1. Abre tu sitio en Vercel
2. Deberías ver la lista de tiendas
3. Click en una tienda
4. Verifica que se muestren los productos
5. Click en un producto para ver el modal
6. Verifica que las imágenes carguen

### 5.2 Probar el Panel Admin

1. Ve a: `https://tu-sitio.vercel.app/admin/login`
2. Inicia sesión con: `admin` / `admin123`
3. Verifica que puedas:
   - Ver tiendas, categorías y productos
   - Crear nuevos productos
   - Subir imágenes desde PC
   - Editar y eliminar

### 5.3 Probar Funcionalidades Adicionales

- ✅ Botón flotante de WhatsApp
- ✅ Botón "Volver arriba"
- ✅ Badge "Nuevo" en productos recientes
- ✅ Contador de productos por categoría
- ✅ Miniaturas en galería del modal
- ✅ Filtros y búsqueda

---

## PASO 6: Configurar Dominio Personalizado (Opcional)

Si tienes un dominio propio (ejemplo: `www.micatalogo.com`):

1. En Vercel, ve a tu proyecto → Settings → Domains
2. Click en "Add"
3. Ingresa tu dominio
4. Sigue las instrucciones para configurar DNS
5. Espera 24-48 horas para propagación

---

## 🔄 Actualizar el Sitio

Cada vez que hagas cambios en el código:

```bash
# Agregar cambios
git add .

# Hacer commit
git commit -m "Descripción de los cambios"

# Subir a GitHub
git push
```

Vercel detectará automáticamente los cambios y hará un nuevo deploy (2-3 minutos).

---

## 🐛 Solución de Problemas

### Problema: "Error: Invalid Supabase URL"

**Solución:**
1. Ve a Vercel → tu proyecto → Settings → Environment Variables
2. Verifica que las variables estén correctas
3. Redeploy: Settings → Deployments → ... → Redeploy

### Problema: No se muestran las tiendas

**Solución:**
1. Ve a Supabase → Table Editor → tiendas
2. Verifica que existan tiendas con `activa = true`
3. Ve a Supabase → SQL Editor y ejecuta:
```sql
SELECT * FROM tiendas WHERE activa = true;
```
4. Si no hay resultados, agrega tiendas desde el panel admin

### Problema: Error 403 al subir imágenes

**Solución:**
1. Ve a Supabase → Storage → bucket `imagenes`
2. Verifica que sea público
3. Ve a Policies y verifica que existan las políticas de INSERT y DELETE
4. Si no existen, ejecuta el SQL del Paso 1.3

### Problema: El admin no funciona

**Solución:**
1. Verifica que exista el usuario admin en la tabla `usuarios_admin`
2. Ve a Supabase → SQL Editor:
```sql
SELECT * FROM usuarios_admin WHERE username = 'admin';
```
3. Si no existe, créalo con el script `crear-usuario-admin.sql`

### Problema: Build falla en Vercel

**Solución:**
1. Ve a Vercel → tu proyecto → Deployments
2. Click en el deployment fallido
3. Revisa los logs para ver el error específico
4. Comúnmente es por:
   - Variables de entorno faltantes
   - Errores de TypeScript
   - Dependencias faltantes

---

## 📊 Monitoreo y Analytics

### Ver estadísticas en Vercel:

1. Ve a tu proyecto en Vercel
2. Click en "Analytics"
3. Verás:
   - Visitas
   - Páginas más vistas
   - Tiempo de carga
   - Errores

---

## 🔒 Seguridad Adicional (Recomendado)

### Proteger el Panel Admin con Autenticación Real

Actualmente el admin usa un sistema simple. Para producción, considera:

1. **Usar Supabase Auth:**
   - Implementar login real con Supabase
   - Proteger rutas con middleware
   - Usar JWT tokens

2. **Agregar CAPTCHA:**
   - Proteger el formulario de login
   - Prevenir ataques de fuerza bruta

3. **Limitar acceso por IP:**
   - Configurar en Vercel
   - Solo permitir IPs específicas al admin

---

## 💰 Costos

### Gratis para siempre:

- **Vercel:** 100GB bandwidth/mes, builds ilimitados
- **Supabase:** 500MB database, 1GB storage, 2GB bandwidth
- **GitHub:** Repositorios ilimitados

### Si necesitas más:

- **Vercel Pro:** $20/mes (más bandwidth y features)
- **Supabase Pro:** $25/mes (más storage y database)

Para un catálogo pequeño-mediano, el plan gratuito es suficiente.

---

## ✅ Checklist Final

- [ ] Supabase configurado con políticas RLS
- [ ] Bucket de imágenes público
- [ ] Código subido a GitHub
- [ ] Variables de entorno en Vercel
- [ ] Deploy exitoso en Vercel
- [ ] Catálogo público funciona
- [ ] Panel admin funciona
- [ ] Imágenes cargan correctamente
- [ ] WhatsApp funciona
- [ ] Todas las mejoras funcionan

---

## 🎉 ¡Felicidades!

Tu catálogo digital está en línea y funcionando. Ahora puedes:

1. Compartir el link con tus clientes
2. Agregar productos desde el panel admin
3. Actualizar precios y disponibilidad
4. Monitorear visitas en Vercel Analytics

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en Vercel
2. Revisa la consola del navegador (F12)
3. Verifica las políticas en Supabase
4. Consulta la documentación:
   - [Vercel Docs](https://vercel.com/docs)
   - [Supabase Docs](https://supabase.com/docs)
   - [Next.js Docs](https://nextjs.org/docs)

---

¡Éxito con tu catálogo digital! 🚀
