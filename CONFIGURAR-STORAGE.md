# 📦 Configurar Storage en Supabase

Para poder subir logos desde la PC, necesitas tener el bucket configurado en Supabase.

---

## ✅ Si Ya Tienes un Bucket (Recomendado)

Si ya tienes un bucket público (como `imagenes`), **NO necesitas hacer nada más**.

La aplicación creará automáticamente una carpeta `logos/` dentro de tu bucket existente.

**Estructura resultante:**
```
imagenes/
  ├── productos/
  └── logos/        ← Se crea automáticamente
```

---

## 🚀 Si NO Tienes un Bucket

### Opción 1: Desde la Interfaz de Supabase (Recomendado)

1. **Ir a Storage:**
   - Abre tu proyecto en Supabase
   - Ve a la sección "Storage" en el menú lateral

2. **Crear Bucket:**
   - Clic en "New bucket"
   - Nombre: `imagenes`
   - Marcar como "Public bucket" ✅
   - Clic en "Create bucket"

3. **Configurar Políticas:**
   - Clic en el bucket `imagenes`
   - Ve a la pestaña "Policies"
   - Clic en "New policy"
   - Selecciona "For full customization"
   
   **Política 1: Lectura pública**
   ```
   Policy name: Public Access
   Allowed operation: SELECT
   Target roles: public
   USING expression: true
   ```
   
   **Política 2: Subida autenticada**
   ```
   Policy name: Authenticated Upload
   Allowed operation: INSERT
   Target roles: authenticated
   WITH CHECK expression: true
   ```

---

## ✅ Verificar Configuración

1. Ve a Storage → imagenes
2. Intenta subir un archivo de prueba
3. Si funciona, ¡listo! ✅

---

## 🎯 Cómo Funciona en la App

### Subir Logo desde PC:

1. **En el modal de tienda:**
   - Clic en "📁 Subir desde PC"
   - Selecciona una imagen (máx. 2MB)
   - Se muestra un preview
   - Al guardar, se sube automáticamente a `imagenes/logos/`

2. **Usar URL externa:**
   - Clic en "🔗 Usar URL"
   - Ingresa la URL de la imagen
   - Se guarda directamente (no usa Storage)

---

## 📊 Límites del Plan Gratuito

- **Storage:** 1 GB
- **Bandwidth:** 2 GB/mes
- **Archivos:** Ilimitados

**Recomendación:** Si usas URLs externas (Imgur, Cloudinary), no ocupas Storage de Supabase.

---

## 🔧 Solución de Problemas

### Error: "new row violates row-level security policy"

**Causa:** Las políticas de Storage no están configuradas correctamente.

**Solución:**
1. Ve a Storage → imagenes → Policies
2. Asegúrate de tener las políticas de INSERT y SELECT
3. Si no existen, créalas siguiendo los pasos de arriba

### Error: "Bucket not found"

**Causa:** El bucket 'imagenes' no existe.

**Solución:**
1. Ve a Storage
2. Crea el bucket 'imagenes'
3. Márcalo como público

---

## 💡 Notas Importantes

- Las imágenes subidas se guardan en: `https://[tu-proyecto].supabase.co/storage/v1/object/public/imagenes/logos/[archivo]`
- Los archivos se nombran automáticamente con un hash único
- Las imágenes son públicas (cualquiera puede verlas con la URL)
- Puedes eliminar imágenes antiguas manualmente desde Storage
- La carpeta `logos/` se crea automáticamente al subir el primer logo

---

**¡Listo para usar!** 🎉
