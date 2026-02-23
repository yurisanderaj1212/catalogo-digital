# 🔧 Configurar Cloudinary en Render (Producción)

## ❌ Problema Actual

Las imágenes no se pueden subir en producción porque las variables de entorno de Cloudinary no están configuradas en Render.

**Error:** `api.cloudinary.com/v1_1/undefined/image/upload` (401 Unauthorized)

---

## ✅ Solución: Agregar Variables de Entorno en Render

### Paso 1: Acceder a Render Dashboard

1. Ve a https://dashboard.render.com
2. Inicia sesión con tu cuenta
3. Selecciona tu servicio web (catalogo-digital)

### Paso 2: Ir a Environment Variables

1. En el menú lateral, haz clic en **"Environment"**
2. Verás la lista de variables de entorno actuales

### Paso 3: Agregar las Variables de Cloudinary

Haz clic en **"Add Environment Variable"** y agrega estas DOS variables:

#### Variable 1:
- **Key:** `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- **Value:** `dhbtlmgqd`

#### Variable 2:
- **Key:** `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- **Value:** `productos_preset`

### Paso 4: Guardar y Redesplegar

1. Haz clic en **"Save Changes"**
2. Render automáticamente redesplegarán tu aplicación
3. Espera 2-3 minutos a que termine el deploy

---

## 🧪 Verificar que Funciona

Después del deploy:

1. Ve a tu aplicación en producción
2. Entra al panel admin
3. Intenta crear un producto nuevo
4. Sube una imagen
5. ✅ Debería subir sin errores

---

## 📋 Resumen de Variables Necesarias en Render

Tu servicio en Render debe tener estas variables de entorno:

```
NEXT_PUBLIC_SUPABASE_URL=https://xmfvfhfizlgrcwylrtlg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[tu anon key]
SUPABASE_SERVICE_ROLE_KEY=[tu service role key]
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhbtlmgqd
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=productos_preset
```

---

## ⚠️ Nota Importante

Las variables que empiezan con `NEXT_PUBLIC_` son accesibles desde el navegador (cliente). Por eso es seguro usarlas para Cloudinary con un upload preset configurado correctamente.

El upload preset `productos_preset` debe estar configurado en Cloudinary como **unsigned** para que funcione sin API key.
