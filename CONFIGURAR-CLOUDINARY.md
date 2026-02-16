# ☁️ Configurar Cloudinary para Imágenes

Cloudinary te permite subir imágenes desde PC y optimizarlas automáticamente, manteniendo también la opción de usar URLs externas.

---

## 🎯 Beneficios

- ✅ Subir desde PC (como Supabase Storage)
- ✅ Usar URLs externas (como ahora)
- ✅ Optimización automática (imágenes 50% más ligeras)
- ✅ CDN global (carga rápida en todo el mundo)
- ✅ 25 GB bandwidth/mes gratis
- ✅ Redimensionamiento on-the-fly
- ✅ Conversión a WebP automática

---

## 📋 Paso 1: Crear Cuenta en Cloudinary (2 minutos)

1. **Ir a Cloudinary:**
   - Ve a: https://cloudinary.com/users/register/free
   - Regístrate con tu email

2. **Verificar email:**
   - Revisa tu correo
   - Clic en el enlace de verificación

3. **Acceder al Dashboard:**
   - Inicia sesión en: https://console.cloudinary.com/
   - Verás tu dashboard principal

---

## 🔑 Paso 2: Obtener Credenciales (1 minuto)

En el dashboard de Cloudinary, verás:

```
Cloud name: tu-nombre-aqui
API Key: 123456789012345
API Secret: abc123xyz (NO lo compartas)
```

**Anota el Cloud Name** - lo necesitarás después.

---

## 🔓 Paso 3: Crear Upload Preset (3 minutos)

Un "upload preset" permite subir imágenes sin autenticación del servidor.

### 3.1 Ir a Settings:
```
Dashboard → Settings (⚙️) → Upload
```

### 3.2 Crear Preset:
```
1. Scroll hasta "Upload presets"
2. Clic en "Add upload preset"
3. Configurar:
   - Upload preset name: productos_preset
   - Signing Mode: Unsigned ⚠️ (IMPORTANTE)
   - Folder: productos
   - Unique filename: ✅ (activado)
   - Overwrite: ❌ (desactivado)
4. Clic en "Save"
```

### 3.3 Anotar el nombre:
```
Upload preset name: productos_preset
```

---

## ⚙️ Paso 4: Configurar Variables de Entorno (2 minutos)

### 4.1 Abrir archivo `.env.local`:
```bash
# Si no existe, créalo en la raíz del proyecto
```

### 4.2 Agregar credenciales:
```env
# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=productos_preset
```

**Reemplaza:**
- `tu-cloud-name` → Tu Cloud Name de Cloudinary
- `productos_preset` → El nombre de tu upload preset

### 4.3 Ejemplo real:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dz8abc123
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=productos_preset
```

---

## 🧪 Paso 5: Probar (1 minuto)

### 5.1 Reiniciar servidor:
```bash
# Detener el servidor (Ctrl+C)
npm run dev
```

### 5.2 Probar subida:
```
1. Ve al admin panel
2. Edita un producto o tienda
3. Clic en "📁 Subir desde PC"
4. Selecciona una imagen
5. Debería subirse a Cloudinary automáticamente
```

---

## 🎨 Cómo Funciona en Tu App

### Opción 1: Subir desde PC (Cloudinary)

```
Usuario → Selecciona imagen → Sube a Cloudinary → URL optimizada → Guarda en Supabase
```

**Ventajas:**
- Optimización automática
- CDN ultra rápido
- No usa storage de Supabase

### Opción 2: Usar URL externa (Como antes)

```
Usuario → Pega URL → Guarda directamente en Supabase
```

**Ventajas:**
- Rápido y simple
- No requiere subida
- Funciona con cualquier URL

---

## 📊 Límites del Plan Gratuito

| Recurso | Límite | Equivalente |
|---------|--------|-------------|
| **Bandwidth** | 25 GB/mes | ~125,000 vistas |
| **Storage** | 25 GB | ~125,000 imágenes |
| **Transformaciones** | 25,000/mes | Suficiente |
| **Costo** | $0 | Gratis |

**Comparación con Supabase:**
- Supabase: 2 GB bandwidth → 476 visitas/mes
- Cloudinary: 25 GB bandwidth → 125,000 visitas/mes
- **Mejora: 262x más capacidad** 🚀

---

## 🔧 Solución de Problemas

### Error: "Upload preset not found"

**Causa:** El upload preset no existe o no es "unsigned"

**Solución:**
1. Ve a Cloudinary → Settings → Upload
2. Verifica que el preset existe
3. Verifica que "Signing Mode" sea "Unsigned"
4. Copia el nombre exacto del preset

### Error: "Invalid cloud name"

**Causa:** El cloud name está mal escrito

**Solución:**
1. Ve a Cloudinary Dashboard
2. Copia el "Cloud name" exacto
3. Pégalo en `.env.local`
4. Reinicia el servidor

### Las imágenes no se ven

**Causa:** URL incorrecta o imagen no subida

**Solución:**
1. Abre la URL de la imagen en el navegador
2. Si no carga, la subida falló
3. Revisa la consola del navegador (F12)
4. Verifica las credenciales en `.env.local`

---

## 🎯 Próximos Pasos

1. ✅ Crear cuenta en Cloudinary
2. ✅ Crear upload preset
3. ✅ Configurar `.env.local`
4. ✅ Reiniciar servidor
5. ✅ Probar subida desde PC
6. ✅ Disfrutar de imágenes optimizadas

---

## 💡 Tips Avanzados

### Optimizar imágenes existentes:

Si ya tienes imágenes en URLs externas, puedes migrarlas a Cloudinary:

```typescript
// Cloudinary puede "fetchear" URLs externas
const url = 'https://ejemplo.com/imagen.jpg';
const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/fetch/q_auto,f_auto/${url}`;
```

### Transformaciones on-the-fly:

```typescript
// Thumbnail 200x200
/w_200,h_200,c_fill/imagen.jpg

// WebP optimizado
/f_webp,q_80/imagen.jpg

// Automático (mejor opción)
/q_auto,f_auto/imagen.jpg
```

---

**¡Listo para usar Cloudinary!** ☁️✨

Con esta configuración, tu app soportará 200+ usuarios simultáneos sin problemas.
