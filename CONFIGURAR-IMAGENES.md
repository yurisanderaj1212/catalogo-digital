# 📸 Guía para Configurar Imágenes en Supabase

## ✅ Bucket Ya Configurado

Tu proyecto ya tiene el bucket "imagenes" configurado y público en Supabase Storage. Puedes empezar a usar el sistema de imágenes inmediatamente.

---

## 🚀 Cómo Usar el Sistema (3 Opciones)

### Opción 1: Subir desde el Panel Admin (Más Fácil) ⭐

Esta es la forma más rápida y recomendada:

1. Ve a `/admin/dashboard/productos`
2. Crea o edita un producto
3. En la sección "Imágenes", selecciona "📁 Subir desde PC"
4. Haz clic y selecciona una imagen de tu computadora
5. La imagen se subirá automáticamente a Supabase Storage
6. ¡Listo! La URL se guarda automáticamente

**Características:**
- Validación automática (solo imágenes, máximo 5MB)
- Nombres únicos (sin conflictos)
- Indicador de progreso
- URLs públicas generadas automáticamente

---

### Opción 2: Agregar URLs desde el Panel Admin

Si ya tienes imágenes en internet:

1. Ve a `/admin/dashboard/productos`
2. Crea o edita un producto
3. En la sección "Imágenes", selecciona "🔗 Agregar URL"
4. Pega la URL de la imagen
5. Click en el botón "+"
6. ¡Listo!

**Servicios compatibles:**

**Servicios compatibles:**

1. **Imgur** - [https://imgur.com](https://imgur.com)
   - Sube imagen → Click derecho → "Copy image address"

2. **Cloudinary** - [https://cloudinary.com](https://cloudinary.com)
   - Más profesional, optimización automática

3. **ImgBB** - [https://imgbb.com](https://imgbb.com)
   - Simple y rápido, no requiere cuenta

---

### Opción 3: Usar Imágenes de Prueba (Placeholder)

Para probar el sistema rápidamente:

Para probar el sistema rápidamente:

**Desde el Panel Admin:**
1. Ve a crear/editar producto
2. Selecciona "🔗 Agregar URL"
3. Usa URLs como:
   - `https://picsum.photos/800/800?random=1`
   - `https://picsum.photos/800/800?random=2`
   - `https://via.placeholder.com/800x800/3B82F6/FFFFFF?text=Producto`
4. Cambia el número para diferentes imágenes

**Desde SQL (Avanzado):**

Si prefieres agregar imágenes directamente en la base de datos:

```sql
-- Agregar imágenes de prueba a un producto específico
-- Reemplaza 'tu-producto-id-uuid' con el ID real del producto
INSERT INTO imagenes_producto (producto_id, url_imagen, orden) VALUES
('tu-producto-id-uuid', 'https://picsum.photos/800/800?random=1', 0),
('tu-producto-id-uuid', 'https://picsum.photos/800/800?random=2', 1);
```

---

## 📋 Resumen de Opciones

| Opción | Facilidad | Velocidad | Recomendado |
|--------|-----------|-----------|-------------|
| 📁 Subir desde PC | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Sí |
| 🔗 Agregar URL | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Sí |
| 💾 SQL Directo | ⭐⭐ | ⭐⭐⭐ | Solo avanzados |

**Recomendación:** Usa el panel admin (opciones 1 o 2). Es más fácil, rápido y seguro.

---

## 🎨 Recomendaciones para Imágenes de Productos

### Tamaño Óptimo:
- **Resolución:** 800x800 píxeles (cuadradas)
- **Formato:** JPG (mejor compresión) o PNG (si necesitas transparencia)
- **Peso:** Menos de 500KB por imagen (el sistema valida máximo 5MB)

### Calidad Visual:
- ✅ Fondo blanco o neutro
- ✅ Buena iluminación natural
- ✅ Producto centrado y enfocado
- ✅ Sin marcas de agua
- ✅ Múltiples ángulos (agrega varias imágenes por producto)

### Herramientas Gratuitas para Optimizar:
- [TinyPNG](https://tinypng.com) - Comprimir imágenes sin perder calidad
- [Squoosh](https://squoosh.app) - Optimizar y convertir formatos
- [Remove.bg](https://remove.bg) - Quitar fondos automáticamente
- [Canva](https://canva.com) - Crear fondos profesionales

---

## 🔍 Verificar que Todo Funciona

### Método 1: Desde el Panel Admin (Más Fácil)
1. Ve a `/admin/dashboard/productos`
2. Crea un producto de prueba
3. Sube una imagen desde PC o agrega una URL
4. Guarda el producto
5. Ve al catálogo público (página principal)
6. Busca el producto y verifica que la imagen se muestre

### Método 2: Desde SQL (Avanzado)

```sql
-- Ver todos los productos con conteo de imágenes
SELECT 
  p.id,
  p.nombre,
  p.precio,
  t.nombre as tienda,
  COUNT(i.id) as total_imagenes
FROM productos p
LEFT JOIN tiendas t ON p.tienda_id = t.id
LEFT JOIN imagenes_producto i ON p.id = i.producto_id
GROUP BY p.id, p.nombre, p.precio, t.nombre
ORDER BY p.nombre;

-- Ver todas las imágenes de un producto específico
SELECT * FROM imagenes_producto 
WHERE producto_id = 'tu-producto-id-uuid'
ORDER BY orden;
```

---

## ❓ Problemas Comunes y Soluciones

### 1. Error al subir imagen desde el panel admin

**Síntoma:** Aparece un error o la imagen no se sube

**Soluciones:**
- ✅ Verifica que la imagen sea menor a 5MB
- ✅ Verifica que sea un formato válido (JPG, PNG, GIF, WebP)
- ✅ Abre la consola del navegador (F12) y revisa el error específico
- ✅ Verifica que el bucket "imagenes" sea público en Supabase
- ✅ Verifica que tengas conexión a internet

**Cómo verificar el bucket:**
1. Ve a Supabase → Storage → bucket "imagenes"
2. Click en Settings (⚙️)
3. Verifica que "Public bucket" esté activado

---

### 2. Las imágenes no se muestran en el catálogo

**Síntoma:** Los productos aparecen sin imagen o con icono de placeholder

**Soluciones:**
- ✅ Verifica que el producto tenga imágenes guardadas:
  - Ve a `/admin/dashboard/productos`
  - Edita el producto
  - Revisa la sección "Imágenes"
- ✅ Verifica las URLs en la base de datos:
  - Ve a Supabase → Table Editor → `imagenes_producto`
  - Copia una URL y ábrela en el navegador
  - Debería mostrar la imagen
- ✅ Verifica que el bucket sea público (ver solución anterior)

---

### 3. Error "Storage bucket not found"

**Síntoma:** Error al intentar subir imagen desde PC

**Solución:**
- El bucket "imagenes" no existe o tiene otro nombre
- Ve a Supabase → Storage
- Verifica que exista un bucket llamado exactamente "imagenes" (sin mayúsculas)
- Si no existe, créalo y márcalo como público

---

### 4. Error "Failed to load resource" o imagen rota

**Síntoma:** Icono de imagen rota en el catálogo

**Soluciones:**
- ✅ La URL de la imagen es incorrecta o la imagen fue eliminada
- ✅ Si usas servicio externo (Imgur, etc.), verifica que la imagen siga existiendo
- ✅ Si usas Supabase Storage, verifica que el archivo no fue eliminado
- ✅ Intenta eliminar la imagen del producto y volver a subirla

---

### 5. La imagen se sube pero no aparece en la lista

**Síntoma:** Después de subir, no ves la imagen en el modal

**Solución:**
- Puede ser un problema de caché
- Cierra y vuelve a abrir el modal de edición
- Refresca la página (F5)
- Verifica en la base de datos que se guardó correctamente

---

### 6. Error de CORS (Cross-Origin)

**Síntoma:** Error en consola sobre CORS al cargar imágenes externas

**Solución:**
- Algunos servicios externos bloquean el acceso desde otros dominios
- **Recomendación:** Usa Supabase Storage (opción 1) para evitar problemas de CORS
- O usa servicios que permitan CORS como Imgur o Cloudinary

---

## 💡 Tips y Mejores Prácticas

### Para Mejores Resultados:

1. **Usa la opción "Subir desde PC"** para imágenes propias
   - Es más confiable que URLs externas
   - No depende de servicios de terceros
   - Las imágenes nunca desaparecerán

2. **Agrega múltiples imágenes por producto**
   - La primera imagen es la que se muestra en la lista
   - Las demás se ven en la galería del modal
   - Muestra diferentes ángulos del producto

3. **Optimiza las imágenes antes de subirlas**
   - Usa TinyPNG para reducir el tamaño
   - Mantén buena calidad pero peso bajo
   - Carga más rápida = mejor experiencia

4. **Usa nombres descriptivos** al guardar las fotos
   - Aunque el sistema genera nombres únicos
   - Te ayuda a organizarte localmente

5. **Haz pruebas con imágenes placeholder primero**
   - Verifica que todo funcione
   - Luego reemplaza con imágenes reales

---

## 🎯 Resumen Final

**El sistema está listo para usar:**
- ✅ Bucket "imagenes" configurado y público
- ✅ Panel admin con interfaz de subida
- ✅ Soporte para subir desde PC o agregar URLs
- ✅ Validaciones automáticas
- ✅ Múltiples imágenes por producto

**Empieza ahora:**
1. Ve a `/admin/dashboard/productos`
2. Crea o edita un producto
3. Sube imágenes
4. ¡Disfruta tu catálogo con imágenes profesionales!

---

¡Todo listo para gestionar las imágenes de tu catálogo! 📸✨
