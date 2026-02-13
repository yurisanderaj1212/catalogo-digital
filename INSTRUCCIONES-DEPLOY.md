# 📘 Guía Completa de Deploy - Catálogo Digital

## ✅ Checklist Rápido

- [ ] Configurar base de datos en Supabase
- [ ] Obtener credenciales de Supabase
- [ ] Crear repositorio en GitHub
- [ ] Configurar variables de entorno localmente
- [ ] Probar localmente
- [ ] Subir código a GitHub
- [ ] Configurar GitHub Pages
- [ ] Agregar secrets en GitHub
- [ ] Verificar deploy automático

---

## 📝 PASO 1: Configurar Supabase

### 1.1 Crear proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión o crea una cuenta
3. Click en "New Project"
4. Completa:
   - Name: `catalogo-digital`
   - Database Password: (guarda esta contraseña)
   - Region: Elige la más cercana
5. Click "Create new project"
6. Espera 2-3 minutos mientras se crea

### 1.2 Crear las tablas

1. En tu proyecto de Supabase, ve a "SQL Editor"
2. Click en "New query"
3. Copia y pega TODO el contenido del archivo `supabase-schema.sql`
4. Click en "Run" o presiona Ctrl+Enter
5. Verifica que aparezca "Success. No rows returned"

### 1.3 Verificar tablas creadas

1. Ve a "Table Editor" en el menú lateral
2. Deberías ver estas tablas:
   - tiendas
   - categorias
   - productos
   - imagenesproducto
   - usuariosadmin

### 1.4 Obtener credenciales

1. Ve a "Project Settings" (ícono de engranaje)
2. Click en "API" en el menú lateral
3. Copia estos valores:
   - **Project URL** (ejemplo: `https://xxxxx.supabase.co`)
   - **anon public** key (la clave larga que empieza con `eyJ...`)

⚠️ **IMPORTANTE**: Guarda estos valores, los necesitarás después.

---

## 💻 PASO 2: Configurar Proyecto Localmente

### 2.1 Configurar variables de entorno

1. Abre el archivo `.env.local` en la carpeta `catalogo-digital`
2. Reemplaza con tus valores de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.2 Probar localmente

1. Abre una terminal en la carpeta `catalogo-digital`
2. Ejecuta:

```bash
npm run dev
```

3. Abre tu navegador en `http://localhost:3000`
4. Deberías ver las tiendas de ejemplo
5. Click en una tienda para ver los productos

Si todo funciona, ¡continúa al siguiente paso!

---

## 🐙 PASO 3: Subir a GitHub

### 3.1 Crear repositorio en GitHub

1. Ve a [https://github.com](https://github.com)
2. Click en el botón "+" arriba a la derecha
3. Click en "New repository"
4. Completa:
   - Repository name: `catalogo-digital`
   - Description: "Catálogo digital multitiendas"
   - Public o Private (recomiendo Public para GitHub Pages gratis)
   - ❌ NO marques "Add a README file"
5. Click "Create repository"

### 3.2 Subir el código

1. Abre una terminal en la carpeta `catalogo-digital`
2. Ejecuta estos comandos UNO POR UNO:

```bash
git init
git add .
git commit -m "Initial commit: Catálogo digital MVP"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/catalogo-digital.git
git push -u origin main
```

⚠️ **Reemplaza `TU-USUARIO`** con tu nombre de usuario de GitHub

3. Refresca la página de tu repositorio en GitHub
4. Deberías ver todos los archivos subidos

---

## 🚀 PASO 4: Configurar GitHub Pages

### 4.1 Habilitar GitHub Pages

1. En tu repositorio de GitHub, ve a "Settings"
2. En el menú lateral, click en "Pages"
3. En "Source", selecciona: **GitHub Actions**
4. No necesitas hacer nada más aquí

### 4.2 Agregar Secrets (Variables de entorno)

1. En tu repositorio, ve a "Settings"
2. En el menú lateral, click en "Secrets and variables" → "Actions"
3. Click en "New repository secret"
4. Agrega el primer secret:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Secret: Tu URL de Supabase (ejemplo: `https://xxxxx.supabase.co`)
   - Click "Add secret"
5. Click en "New repository secret" nuevamente
6. Agrega el segundo secret:
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Secret: Tu anon key de Supabase (la clave larga)
   - Click "Add secret"

### 4.3 Verificar deploy automático

1. Ve a la pestaña "Actions" en tu repositorio
2. Deberías ver un workflow ejecutándose llamado "Deploy to GitHub Pages"
3. Espera 2-5 minutos a que termine
4. Cuando aparezca un ✅ verde, el deploy fue exitoso

### 4.4 Acceder a tu sitio

Tu sitio estará disponible en:

```
https://TU-USUARIO.github.io/catalogo-digital/
```

⚠️ **Reemplaza `TU-USUARIO`** con tu nombre de usuario de GitHub

---

## 🎉 ¡LISTO! Tu catálogo está en línea

### Próximos pasos:

1. **Agregar tus propias tiendas**:
   - Ve a Supabase → Table Editor → tiendas
   - Edita o agrega nuevas tiendas

2. **Agregar productos**:
   - Ve a Supabase → Table Editor → productos
   - Agrega tus productos

3. **Subir imágenes**:
   - Ve a Supabase → Storage
   - Crea un bucket público llamado "productos"
   - Sube imágenes
   - Copia la URL pública
   - Pégala en la tabla `imagenesproducto`

4. **Actualizar el sitio**:
   - Cada vez que hagas cambios en el código
   - Ejecuta: `git add .` → `git commit -m "mensaje"` → `git push`
   - GitHub Pages se actualizará automáticamente

---

## 🐛 Solución de Problemas

### Problema: No veo las tiendas

**Solución**:
1. Verifica que ejecutaste el SQL en Supabase
2. Ve a Supabase → Table Editor → tiendas
3. Verifica que existan tiendas con `activa = true`
4. Verifica que los secrets en GitHub sean correctos

### Problema: Error 404 en GitHub Pages

**Solución**:
1. Ve a Settings → Pages
2. Verifica que Source sea "GitHub Actions"
3. Ve a Actions y verifica que el workflow terminó exitosamente
4. Espera 5-10 minutos después del primer deploy

### Problema: Las imágenes no cargan

**Solución**:
1. Verifica que las URLs en la tabla `imagenesproducto` sean públicas
2. Usa Supabase Storage para alojar imágenes
3. O usa URLs externas de servicios como Imgur, Cloudinary, etc.

### Problema: "Supabase client not initialized"

**Solución**:
1. Verifica que `.env.local` tenga las variables correctas
2. Reinicia el servidor: Ctrl+C y luego `npm run dev`
3. Verifica que los secrets en GitHub estén correctos

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12) para ver errores
2. Revisa los logs en GitHub Actions
3. Verifica que Supabase esté funcionando

---

## 🎨 Personalización

### Cambiar el nombre del proyecto en la URL

Si quieres que tu sitio sea `https://tu-usuario.github.io/mi-catalogo/`:

1. Renombra el repositorio en GitHub a `mi-catalogo`
2. Edita `next.config.ts`:
```typescript
basePath: '/mi-catalogo'
assetPrefix: '/mi-catalogo/'
```
3. Sube los cambios: `git add .` → `git commit -m "update"` → `git push`

### Cambiar colores

Edita `app/globals.css`:
```css
:root {
  --primary: #10b981; /* Verde */
  --primary-dark: #059669;
}
```

---

¡Éxito con tu catálogo digital! 🚀
