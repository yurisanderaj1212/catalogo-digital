# 🔥 Prueba de Carga: 200 Productos por Tienda

## 📋 Objetivo

Probar el rendimiento de la aplicación con una carga realista de 200 productos por tienda para evaluar:
- Velocidad de carga de la página
- Rendimiento de Supabase
- Rendimiento de Render
- Experiencia del usuario

---

## 🚀 Paso 1: Generar Datos de Prueba

### Opción A: Usando Supabase SQL Editor (Recomendado)

1. **Abre Supabase SQL Editor**
   - Ve a tu proyecto en Supabase
   - Clic en "SQL Editor"

2. **Obtén los IDs necesarios**
   
   Ejecuta esta consulta:
   ```sql
   SELECT 
     t.id as tienda_id,
     t.nombre as tienda,
     c.id as categoria_id,
     c.nombre as categoria
   FROM tiendas t
   LEFT JOIN categorias c ON c.tienda_id = t.id
   WHERE t.activa = true AND c.activa = true
   ORDER BY t.nombre, c.nombre;
   ```

3. **Copia los IDs**
   - Copia el `tienda_id` de la tienda que quieres probar
   - Copia el `categoria_id` de una categoría de esa tienda

4. **Ejecuta el script de generación**
   
   Abre el archivo `prueba-carga-simple.sql` y:
   - Reemplaza `v_tienda_id` con tu ID de tienda
   - Reemplaza `v_categoria_id` con tu ID de categoría
   - Ejecuta todo el script

5. **Espera a que termine**
   - Verás mensajes de progreso cada 50 productos
   - Debería tomar 10-30 segundos

---

## 📊 Paso 2: Medir Rendimiento

### A. Métricas de Carga Inicial

1. **Abre Chrome DevTools**
   - Presiona F12
   - Ve a la pestaña "Network"
   - Marca "Disable cache"

2. **Carga la página de la tienda**
   - Ve a `/tienda/[id-de-tu-tienda]`
   - Presiona Ctrl+Shift+R para recargar sin caché

3. **Registra estas métricas:**

   | Métrica | Valor | Objetivo |
   |---------|-------|----------|
   | **Tiempo de carga total** | ___ segundos | < 3s |
   | **Tiempo hasta primer contenido (FCP)** | ___ segundos | < 1.5s |
   | **Tiempo hasta interactivo (TTI)** | ___ segundos | < 3.5s |
   | **Tamaño total transferido** | ___ MB | < 5MB |
   | **Número de requests** | ___ | < 50 |

4. **Captura de pantalla de Network tab**
   - Guarda una captura para referencia

### B. Métricas de Navegación

1. **Prueba el scroll**
   - Scroll rápido de arriba a abajo
   - ¿Se siente fluido? ✅ / ❌
   - ¿Hay lag? ✅ / ❌

2. **Prueba los filtros**
   - Cambia entre categorías
   - Tiempo de respuesta: ___ ms
   - ¿Es instantáneo? ✅ / ❌

3. **Prueba la búsqueda**
   - Escribe en el buscador
   - Tiempo de respuesta: ___ ms
   - ¿Filtra rápido? ✅ / ❌

4. **Abre un producto**
   - Clic en un producto
   - Tiempo hasta abrir modal: ___ ms
   - ¿Es rápido? ✅ / ❌

### C. Métricas de Memoria

1. **Abre Chrome DevTools → Performance**
   - Clic en "Record"
   - Navega por la página (scroll, filtros, búsqueda)
   - Detén la grabación después de 30 segundos

2. **Registra:**
   - Uso de memoria: ___ MB
   - FPS promedio: ___ fps (objetivo: 60 fps)
   - ¿Hay caídas de FPS? ✅ / ❌

### D. Métricas de Supabase

1. **Ve a Supabase Dashboard → Database → Query Performance**

2. **Registra las consultas más lentas:**
   - Consulta de productos: ___ ms
   - Consulta de imágenes: ___ ms
   - Consulta de categorías: ___ ms

---

## 🎯 Paso 3: Optimizaciones Recomendadas

### Si la carga es lenta (> 3 segundos):

#### Optimización 1: Paginación
```typescript
// En lugar de cargar todos los productos:
const { data } = await supabase
  .from('productos')
  .select('*')
  .eq('tienda_id', tiendaId)
  .range(0, 49); // Solo primeros 50

// Implementar "Load More" o scroll infinito
```

#### Optimización 2: Lazy Loading de Imágenes
```typescript
// Agregar loading="lazy" a las imágenes
<img 
  src={imagen.url} 
  loading="lazy"
  alt={producto.nombre}
/>
```

#### Optimización 3: Índices en Supabase
```sql
-- Crear índices para consultas frecuentes
CREATE INDEX idx_productos_tienda_activo 
  ON productos(tienda_id, activo) 
  WHERE activo = true;

CREATE INDEX idx_productos_categoria 
  ON productos(categoria_id) 
  WHERE activo = true;
```

#### Optimización 4: Caché de Imágenes
```typescript
// Usar next/image para optimización automática
import Image from 'next/image';

<Image
  src={imagen.url}
  width={400}
  height={400}
  alt={producto.nombre}
/>
```

#### Optimización 5: Virtualización
```bash
# Instalar react-window para virtualizar lista
npm install react-window
```

---

## 📈 Paso 4: Comparación de Resultados

### Antes de Optimizaciones

| Métrica | Valor |
|---------|-------|
| Tiempo de carga | ___ s |
| FCP | ___ s |
| TTI | ___ s |
| Tamaño transferido | ___ MB |
| FPS promedio | ___ fps |

### Después de Optimizaciones

| Métrica | Valor | Mejora |
|---------|-------|--------|
| Tiempo de carga | ___ s | ___% |
| FCP | ___ s | ___% |
| TTI | ___ s | ___% |
| Tamaño transferido | ___ MB | ___% |
| FPS promedio | ___ fps | ___% |

---

## 🧹 Paso 5: Limpiar Datos de Prueba

Cuando termines las pruebas, puedes eliminar los productos de prueba:

```sql
-- Ver cuántos productos de prueba hay
SELECT COUNT(*) FROM productos 
WHERE descripcion LIKE '%Producto de prueba de carga%';

-- Eliminar imágenes de productos de prueba
DELETE FROM imagenes_producto 
WHERE producto_id IN (
  SELECT id FROM productos 
  WHERE descripcion LIKE '%Producto de prueba de carga%'
);

-- Eliminar productos de prueba
DELETE FROM productos 
WHERE descripcion LIKE '%Producto de prueba de carga%';
```

---

## 📊 Benchmarks de Referencia

### Excelente ⭐⭐⭐⭐⭐
- Tiempo de carga: < 2s
- FCP: < 1s
- TTI: < 2.5s
- FPS: 60 fps constante

### Bueno ⭐⭐⭐⭐
- Tiempo de carga: 2-3s
- FCP: 1-1.5s
- TTI: 2.5-3.5s
- FPS: 50-60 fps

### Aceptable ⭐⭐⭐
- Tiempo de carga: 3-5s
- FCP: 1.5-2s
- TTI: 3.5-5s
- FPS: 40-50 fps

### Necesita Optimización ⭐⭐
- Tiempo de carga: > 5s
- FCP: > 2s
- TTI: > 5s
- FPS: < 40 fps

---

## 🎯 Recomendaciones Finales

### Para Producción:

1. **Implementar paginación** si tienes más de 50 productos
2. **Usar lazy loading** para imágenes
3. **Agregar índices** en Supabase
4. **Considerar CDN** para imágenes (Cloudinary, Imgix)
5. **Implementar caché** en el cliente
6. **Monitorear** con herramientas como Vercel Analytics o Google Analytics

### Para Desarrollo:

1. **Usar React DevTools Profiler** para encontrar componentes lentos
2. **Usar Lighthouse** para auditorías automáticas
3. **Probar en diferentes dispositivos** (móvil, tablet, desktop)
4. **Probar con conexión lenta** (3G, 4G)

---

## 📝 Plantilla de Reporte

```markdown
# Reporte de Prueba de Carga

**Fecha:** ___________
**Tienda probada:** ___________
**Número de productos:** 200

## Resultados

### Métricas de Rendimiento
- Tiempo de carga: ___ segundos
- FCP: ___ segundos
- TTI: ___ segundos
- Tamaño transferido: ___ MB
- FPS promedio: ___ fps

### Experiencia de Usuario
- Scroll fluido: ✅ / ❌
- Filtros rápidos: ✅ / ❌
- Búsqueda instantánea: ✅ / ❌
- Modal rápido: ✅ / ❌

### Calificación General
⭐⭐⭐⭐⭐ / ⭐⭐⭐⭐ / ⭐⭐⭐ / ⭐⭐

### Observaciones
___________________________________________
___________________________________________

### Optimizaciones Recomendadas
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________
```

---

**¡Buena suerte con la prueba de carga!** 🚀
