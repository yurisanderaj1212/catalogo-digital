# 🔄 Sistema de Productos Compartidos entre Tiendas

## 📝 ¿Qué es esto?

Permite que un mismo producto esté disponible en múltiples tiendas sin necesidad de duplicarlo.

**Antes:**
```
Arroz en DIEZMERO → Crear producto "Arroz" (ID: 1)
Arroz en PEREZ LAZOS → Crear producto "Arroz" (ID: 2) ❌ Duplicado
```

**Ahora:**
```
Arroz → Un solo producto (ID: 1)
  ✓ Disponible en DIEZMERO
  ✓ Disponible en PEREZ LAZOS
```

---

## ✅ Ventajas

1. **Sin duplicación**: Un producto, múltiples tiendas
2. **Fácil de mantener**: Cambias precio/descripción una vez
3. **Consistencia**: Mismo producto, misma información
4. **Escalable**: Funciona para 2, 5 o más tiendas

---

## 📋 Pasos para Activar

### Paso 1: Ejecutar Script SQL

1. Ve a https://supabase.com
2. Inicia sesión y selecciona tu proyecto
3. Click en **"SQL Editor"**
4. Click en **"New query"**
5. Abre el archivo `productos-compartidos.sql`
6. Copia TODO el contenido
7. Pégalo en el editor
8. Click en **"Run"** o `Ctrl + Enter`

### Paso 2: Verificar Migración

Después de ejecutar el script, verás 3 tablas de verificación:

**Tabla 1: Relaciones migradas**
```
Muestra todos los productos con sus tiendas actuales
```

**Tabla 2: Productos por tienda**
```
Cuenta cuántos productos tiene cada tienda
```

**Tabla 3: Productos compartidos**
```
Muestra productos que están en múltiples tiendas
(Al inicio estará vacía, es normal)
```

### Paso 3: Desplegar Código

Los cambios de código ya están listos. Solo necesitas:

1. Esperar el deploy automático en Render (ya se está ejecutando)
2. O reiniciar manualmente si es necesario

---

## 🎯 Cómo Usar

### Crear Producto Compartido

1. Ve a **Admin** → **Productos** → **Nuevo Producto**
2. Llena los datos del producto
3. En **"Tiendas donde se vende"**, marca las tiendas:
   ```
   ☑ DIEZMERO
   ☑ PEREZ LAZOS S.R.L.
   ```
4. Guarda

**Resultado**: El producto aparecerá en ambos catálogos

### Editar Producto Compartido

1. Ve a **Admin** → **Productos**
2. Edita el producto
3. Cambia precio, descripción, o lo que necesites
4. Guarda

**Resultado**: Los cambios se aplican en todas las tiendas

### Agregar/Quitar Tiendas

1. Edita el producto
2. Marca o desmarca las tiendas
3. Guarda

**Resultado**: El producto aparece/desaparece de los catálogos

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Producto en ambas tiendas

```
Producto: Arroz
Precio: 150 CUP
Tiendas: ☑ DIEZMERO, ☑ PEREZ LAZOS

Resultado:
- Aparece en catálogo de DIEZMERO
- Aparece en catálogo de PEREZ LAZOS
- Mismo precio en ambas
```

### Ejemplo 2: Producto solo en una tienda

```
Producto: Laptop
Precio: 500 USD
Tiendas: ☑ DIEZMERO, ☐ PEREZ LAZOS

Resultado:
- Aparece en catálogo de DIEZMERO
- NO aparece en catálogo de PEREZ LAZOS
```

### Ejemplo 3: Cambiar precio

```
Editas "Arroz" y cambias precio a 160 CUP

Resultado:
- Precio actualizado en DIEZMERO
- Precio actualizado en PEREZ LAZOS
- Un solo cambio, dos tiendas actualizadas
```

---

## 🔍 Visualización en Admin

En la lista de productos verás:

```
┌─────────────────────────────────────┐
│ Arroz                               │
│ $150 CUP                            │
│ 🏪 DIEZMERO, PEREZ LAZOS           │ ← Tiendas donde está
│ [Editar] [Eliminar]                 │
└─────────────────────────────────────┘
```

---

## ⚠️ Notas Importantes

### Precio Único

- El precio es el mismo en todas las tiendas
- Si necesitas precios diferentes, tendrías que crear productos separados

### Disponibilidad

- El estado "Disponible/Agotado" es global
- Si marcas "Agotado", se agota en todas las tiendas

### Categorías

- La categoría debe existir en todas las tiendas seleccionadas
- Si una tienda no tiene esa categoría, el producto no se mostrará correctamente

### Eliminación

- Si eliminas un producto, se elimina de todas las tiendas
- No hay forma de eliminarlo solo de una tienda (desmarca la tienda en su lugar)

---

## 🚀 Escalabilidad

Este sistema funciona perfectamente para:
- ✅ 2 tiendas (tu caso actual)
- ✅ 5 tiendas (tu plan futuro)
- ✅ 10+ tiendas (si creces más)

No hay límite en el número de tiendas que puede tener un producto.

---

## 🔧 Solución de Problemas

### Problema: No veo los checkboxes de tiendas

**Solución**: Asegúrate de que el script SQL se ejecutó correctamente

### Problema: Producto no aparece en catálogo

**Solución**: Verifica que:
1. El producto esté marcado como "Activo"
2. El producto esté marcado como "Disponible"
3. La tienda esté seleccionada en los checkboxes

### Problema: Cambios no se reflejan

**Solución**: 
1. Limpia caché del navegador (Ctrl+Shift+Delete)
2. Recarga la página (F5)

---

## ✅ Checklist de Activación

Antes de usar en producción:

- [ ] Script SQL ejecutado en Supabase
- [ ] Verificación muestra productos migrados
- [ ] Código desplegado en Render
- [ ] Probado crear producto con múltiples tiendas
- [ ] Probado editar producto compartido
- [ ] Probado agregar/quitar tiendas
- [ ] Verificado que aparece en catálogos correctos

---

**¡Sistema de productos compartidos implementado!** 🔄✨

Ahora puedes gestionar productos en múltiples tiendas de forma eficiente.
