# 🔍 Cómo Verificar que Cloudinary Está Bien Configurado

## Paso 1: Verificar Credenciales en Cloudinary Dashboard

### A. Acceder a tu cuenta:
1. Ve a https://console.cloudinary.com/
2. Inicia sesión con tu cuenta
3. Deberías ver el Dashboard principal

### B. Verificar Cloud Name:
1. En la esquina superior derecha, verás tu **Cloud Name**
2. Debe ser: **`dhbtlmgqd`**
3. Si es diferente, necesitas actualizar el `.env.local`

### C. Verificar Upload Preset:
1. Ve a **Settings** (⚙️ arriba a la derecha)
2. Click en **Upload** en el menú lateral
3. Scroll hasta **Upload presets**
4. Busca: **`productos_preset`**
5. Verifica que:
   - ✅ Existe
   - ✅ Signing Mode: **Unsigned**
   - ✅ Folder: `productos` (opcional)

---

## Paso 2: Probar Localmente (Antes de Render)

### A. Verificar variables locales:

Abre tu archivo `.env.local` y confirma:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhbtlmgqd
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=productos_preset
```

### B. Reiniciar servidor local:

```bash
# Detener el servidor (Ctrl+C)
# Iniciar de nuevo
npm run dev
```

### C. Probar subida de imagen:

1. Ve a http://localhost:3000/admin/dashboard/productos
2. Click en "Nuevo Producto"
3. Llena los campos básicos
4. En "Imágenes", click en "📁 Subir desde PC"
5. Selecciona una imagen de tu PC
6. **Observa la consola del navegador** (F12 → Console)

**Si funciona localmente:**
- ✅ Verás un preview de la imagen
- ✅ No habrá errores en consola
- ✅ La URL será: `https://res.cloudinary.com/dhbtlmgqd/...`

**Si NO funciona localmente:**
- ❌ Error 401: Upload preset incorrecto o no existe
- ❌ Error 404: Cloud name incorrecto
- ❌ "undefined": Variables no cargadas

---

## Paso 3: Verificar en Cloudinary Media Library

Después de subir una imagen localmente:

1. Ve a https://console.cloudinary.com/
2. Click en **Media Library** en el menú lateral
3. Deberías ver la carpeta **`productos/`**
4. Dentro verás la imagen que subiste
5. Click en la imagen para ver detalles

---

## Paso 4: Verificar Variables en Render

### A. Ver variables actuales:

1. Ve a https://dashboard.render.com
2. Selecciona tu servicio
3. Click en **"Environment"**
4. Verifica qué variables tienes

### B. Comparar con lo que necesitas:

**Variables que DEBEN estar en Render:**

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
❓ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (probablemente falta)
❓ NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET (probablemente falta)
```

---

## 🎯 Diagnóstico del Error Actual

Tu error dice:
```
api.cloudinary.com/v1_1/undefined/image/upload
                        ↑
                    Esto debería ser "dhbtlmgqd"
```

**Esto significa:**
- ✅ El código está bien
- ✅ Funciona localmente (porque tienes `.env.local`)
- ❌ NO funciona en producción (porque Render no tiene las variables)

---

## ✅ Solución Confirmada

Necesitas agregar en Render estas 2 variables:

1. **NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME** = `dhbtlmgqd`
2. **NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET** = `productos_preset`

**¿Por qué estoy seguro?**
- Estas variables están en tu `.env.local` (líneas 8-9)
- Fueron configuradas el 2026-02-14 según `CLOUDINARY-IMPLEMENTADO.md`
- El código las usa correctamente en `ModalProducto.tsx` y `ModalTienda.tsx`
- El error muestra "undefined" = variable no existe en producción

---

## 🧪 Prueba Final (Después de Agregar Variables)

1. Agrega las variables en Render
2. Espera el redeploy (2-3 minutos)
3. Ve a tu app en producción
4. Intenta subir una imagen
5. Abre la consola del navegador (F12)
6. Verifica que la URL sea: `https://api.cloudinary.com/v1_1/dhbtlmgqd/...`
7. ✅ Si sube sin errores, está funcionando

---

## 📊 Resumen Visual

```
LOCAL (funciona):
.env.local → Variables cargadas → Cloudinary funciona ✅

PRODUCCIÓN (no funciona):
Render sin variables → "undefined" → Error 401 ❌

SOLUCIÓN:
Render + variables → Variables cargadas → Cloudinary funciona ✅
```
