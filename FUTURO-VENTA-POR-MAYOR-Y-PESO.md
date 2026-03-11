# 📦 Sistema de Venta por Mayor y Peso (FUTURO)

## 📝 Descripción

Sistema para soportar diferentes formas de venta:
- **Por unidad**: Productos individuales (actual)
- **Por mayor**: Cajas, bultos, paquetes con múltiples unidades
- **Por peso**: Cárnicos, granos, etc. (kg o lb)

---

## 🎯 Casos de Uso

### Caso 1: Solo por unidad (Actual)
```
Producto: Laptop
Precio: $500 USD
Forma de venta: Unidad
```

### Caso 2: Por unidad + Por mayor
```
Producto: Refresco Coca-Cola
Precio por unidad: $2 CUP
Precio por caja: $45 CUP (24 unidades)
```

### Caso 3: Por peso
```
Producto: Carne de Res
Precio: $8 CUP/kg
o
Precio: $3.60 CUP/lb
```

### Caso 4: Combinado (unidad + mayor + peso)
```
Producto: Arroz
Precio por unidad: $2 CUP (bolsa de 1kg)
Precio por saco: $90 CUP (50kg)
Precio por kg: $1.80 CUP/kg (a granel)
```

---

## 🗄️ Estructura de Base de Datos

### Script SQL

```sql
-- ============================================
-- SISTEMA DE VENTA POR MAYOR Y PESO
-- ============================================

-- PASO 1: Agregar campos para venta por mayor
ALTER TABLE productos 
ADD COLUMN precio_por_mayor DECIMAL(10,2),
ADD COLUMN unidades_por_mayor INTEGER,
ADD COLUMN tipo_empaque VARCHAR(50); -- "Caja", "Bulto", "Paquete", "Saco", etc.

-- PASO 2: Agregar campos para venta por peso
ALTER TABLE productos
ADD COLUMN se_vende_por_peso BOOLEAN DEFAULT FALSE,
ADD COLUMN unidad_peso VARCHAR(10), -- "kg", "lb"
ADD COLUMN precio_por_peso DECIMAL(10,2);

-- PASO 3: Agregar comentarios para documentación
COMMENT ON COLUMN productos.precio IS 'Precio por unidad (obligatorio)';
COMMENT ON COLUMN productos.precio_por_mayor IS 'Precio por caja/bulto (opcional)';
COMMENT ON COLUMN productos.unidades_por_mayor IS 'Cantidad de unidades en caja/bulto (opcional)';
COMMENT ON COLUMN productos.tipo_empaque IS 'Tipo de empaque: Caja, Bulto, Paquete, Saco (opcional)';
COMMENT ON COLUMN productos.se_vende_por_peso IS 'TRUE si se vende por peso (kg/lb)';
COMMENT ON COLUMN productos.unidad_peso IS 'Unidad de peso: kg o lb';
COMMENT ON COLUMN productos.precio_por_peso IS 'Precio por kg o lb';

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'productos' 
  AND column_name IN (
    'precio', 
    'precio_por_mayor', 
    'unidades_por_mayor', 
    'tipo_empaque',
    'se_vende_por_peso',
    'unidad_peso',
    'precio_por_peso'
  )
ORDER BY ordinal_position;
```

---

## 💻 Tipos TypeScript

```typescript
export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  
  // Precio base (siempre requerido)
  precio: number;
  moneda: 'CUP' | 'USD' | 'EUR';
  
  // Venta por mayor (opcional)
  precio_por_mayor: number | null;
  unidades_por_mayor: number | null;
  tipo_empaque: string | null; // "Caja", "Bulto", "Paquete", "Saco"
  
  // Venta por peso (opcional)
  se_vende_por_peso: boolean;
  unidad_peso: 'kg' | 'lb' | null;
  precio_por_peso: number | null;
  
  // Resto de campos...
  disponible: boolean;
  activo: boolean;
  tienda_id: string;
  categoria_id: string | null;
  fecha_creacion: string;
}
```

---

## 🎨 Interfaz de Usuario

### Formulario Admin

```tsx
<form>
  {/* Información básica */}
  <input name="nombre" placeholder="Nombre del producto" />
  <textarea name="descripcion" placeholder="Descripción" />
  
  {/* Precio base (siempre visible) */}
  <div>
    <label>Precio por unidad *</label>
    <input type="number" name="precio" />
    <select name="moneda">
      <option>CUP</option>
      <option>USD</option>
      <option>EUR</option>
    </select>
  </div>
  
  {/* Venta por mayor (opcional) */}
  <div>
    <label>
      <input type="checkbox" name="tiene_venta_por_mayor" />
      Venta por mayor
    </label>
    
    {tiene_venta_por_mayor && (
      <>
        <input 
          type="number" 
          name="precio_por_mayor" 
          placeholder="Precio por caja/bulto" 
        />
        <input 
          type="number" 
          name="unidades_por_mayor" 
          placeholder="Unidades por caja" 
        />
        <select name="tipo_empaque">
          <option value="">Tipo de empaque</option>
          <option value="Caja">Caja</option>
          <option value="Bulto">Bulto</option>
          <option value="Paquete">Paquete</option>
          <option value="Saco">Saco</option>
          <option value="Cartón">Cartón</option>
        </select>
      </>
    )}
  </div>
  
  {/* Venta por peso (opcional) */}
  <div>
    <label>
      <input type="checkbox" name="se_vende_por_peso" />
      Venta por peso
    </label>
    
    {se_vende_por_peso && (
      <>
        <input 
          type="number" 
          name="precio_por_peso" 
          placeholder="Precio por kg/lb" 
        />
        <select name="unidad_peso">
          <option value="kg">Kilogramo (kg)</option>
          <option value="lb">Libra (lb)</option>
        </select>
      </>
    )}
  </div>
  
  {/* Resto del formulario... */}
</form>
```

---

## 📱 Visualización en Catálogo

### Tarjeta de Producto

#### Ejemplo 1: Solo por unidad
```
┌─────────────────────┐
│ Laptop              │
│ [Imagen]            │
│                     │
│ 💰 $500 USD         │
└─────────────────────┘
```

#### Ejemplo 2: Unidad + Por mayor
```
┌─────────────────────┐
│ Refresco Coca-Cola  │
│ [Imagen]            │
│                     │
│ 💰 $2 CUP/unidad    │
│ 📦 $45 CUP/caja(24) │
└─────────────────────┘
```

#### Ejemplo 3: Por peso
```
┌─────────────────────┐
│ Carne de Res        │
│ [Imagen]            │
│                     │
│ ⚖️ $8 CUP/kg        │
└─────────────────────┘
```

#### Ejemplo 4: Combinado
```
┌─────────────────────┐
│ Arroz               │
│ [Imagen]            │
│                     │
│ 💰 $2 CUP/bolsa     │
│ 📦 $90 CUP/saco(50) │
│ ⚖️ $1.80 CUP/kg     │
└─────────────────────┘
```

---

## 🔍 Modal de Detalle

```tsx
<Modal>
  <h2>Refresco Coca-Cola</h2>
  <ImageGallery />
  
  <div className="precios">
    <h3>Precios disponibles:</h3>
    
    {/* Precio por unidad (siempre) */}
    <div className="precio-item">
      <span className="icono">💰</span>
      <div>
        <p className="label">Por unidad</p>
        <p className="precio">$2 CUP</p>
      </div>
    </div>
    
    {/* Precio por mayor (si existe) */}
    {precio_por_mayor && (
      <div className="precio-item">
        <span className="icono">📦</span>
        <div>
          <p className="label">Por {tipo_empaque} ({unidades_por_mayor} unidades)</p>
          <p className="precio">${precio_por_mayor} {moneda}</p>
        </div>
      </div>
    )}
    
    {/* Precio por peso (si existe) */}
    {se_vende_por_peso && (
      <div className="precio-item">
        <span className="icono">⚖️</span>
        <div>
          <p className="label">Por {unidad_peso}</p>
          <p className="precio">${precio_por_peso} {moneda}/{unidad_peso}</p>
        </div>
      </div>
    )}
  </div>
  
  <Description />
  <WhatsAppButton />
</Modal>
```

---

## 📊 Lógica de Visualización

```typescript
// Función para determinar qué mostrar en la tarjeta
const getPreciosParaMostrar = (producto: Producto) => {
  const precios = [];
  
  // Siempre mostrar precio por unidad
  precios.push({
    tipo: 'unidad',
    icono: '💰',
    label: 'Por unidad',
    precio: producto.precio,
    moneda: producto.moneda,
  });
  
  // Mostrar precio por mayor si existe
  if (producto.precio_por_mayor && producto.unidades_por_mayor) {
    precios.push({
      tipo: 'mayor',
      icono: '📦',
      label: `Por ${producto.tipo_empaque || 'caja'} (${producto.unidades_por_mayor})`,
      precio: producto.precio_por_mayor,
      moneda: producto.moneda,
    });
  }
  
  // Mostrar precio por peso si existe
  if (producto.se_vende_por_peso && producto.precio_por_peso) {
    precios.push({
      tipo: 'peso',
      icono: '⚖️',
      label: `Por ${producto.unidad_peso}`,
      precio: producto.precio_por_peso,
      moneda: producto.moneda,
    });
  }
  
  return precios;
};
```

---

## 🎯 Reglas de Validación

### En el formulario admin:

1. **Precio por unidad**: Siempre obligatorio
2. **Venta por mayor**: 
   - Si se activa, `precio_por_mayor` y `unidades_por_mayor` son obligatorios
   - `tipo_empaque` es opcional (default: "Caja")
3. **Venta por peso**:
   - Si se activa, `precio_por_peso` y `unidad_peso` son obligatorios
4. **Compatibilidad**:
   - Un producto puede tener venta por unidad + por mayor
   - Un producto puede tener venta por unidad + por peso
   - Un producto puede tener las 3 opciones

```typescript
const validarProducto = (data) => {
  // Precio base siempre requerido
  if (!data.precio) {
    return "El precio por unidad es obligatorio";
  }
  
  // Si tiene venta por mayor, validar campos
  if (data.tiene_venta_por_mayor) {
    if (!data.precio_por_mayor) {
      return "El precio por mayor es obligatorio";
    }
    if (!data.unidades_por_mayor || data.unidades_por_mayor < 1) {
      return "Las unidades por mayor deben ser al menos 1";
    }
  }
  
  // Si se vende por peso, validar campos
  if (data.se_vende_por_peso) {
    if (!data.precio_por_peso) {
      return "El precio por peso es obligatorio";
    }
    if (!data.unidad_peso) {
      return "La unidad de peso es obligatoria";
    }
  }
  
  return null; // Válido
};
```

---

## 📋 Ejemplos Reales

### Ejemplo 1: Tienda de Abarrotes

```
Producto: Arroz
- Precio: $2 CUP (bolsa de 1kg)
- Por mayor: $90 CUP (saco de 50kg)
- Por peso: $1.80 CUP/kg (a granel)

Producto: Aceite
- Precio: $5 CUP (botella de 1L)
- Por mayor: $110 CUP (caja de 24 botellas)

Producto: Azúcar
- Precio: $1.50 CUP (bolsa de 1kg)
- Por peso: $1.40 CUP/kg (a granel)
```

### Ejemplo 2: Carnicería

```
Producto: Carne de Res
- Por peso: $8 CUP/kg

Producto: Pollo Entero
- Precio: $12 CUP (unidad ~2kg)
- Por peso: $6 CUP/kg

Producto: Chuletas de Cerdo
- Por peso: $10 CUP/kg
- Por peso: $4.50 CUP/lb
```

### Ejemplo 3: Bebidas

```
Producto: Refresco Coca-Cola
- Precio: $2 CUP (unidad)
- Por mayor: $45 CUP (caja de 24)

Producto: Agua Mineral
- Precio: $1 CUP (botella)
- Por mayor: $20 CUP (paquete de 24)
```

---

## ⏱️ Tiempo de Implementación

**Estimado: 2-3 horas**

1. **Base de datos** (30 min):
   - Ejecutar script SQL
   - Verificar campos

2. **Backend/Tipos** (30 min):
   - Actualizar tipos TypeScript
   - Actualizar validaciones

3. **Formulario Admin** (1 hora):
   - Agregar checkboxes y campos condicionales
   - Validaciones en frontend
   - Guardar datos

4. **Visualización Catálogo** (1 hora):
   - Actualizar tarjetas de productos
   - Actualizar modal de detalle
   - Iconos y formato

---

## ✅ Checklist de Implementación

Cuando el cliente lo pida:

- [ ] Ejecutar script SQL en Supabase
- [ ] Actualizar tipos en `lib/supabase.ts`
- [ ] Actualizar formulario en `ModalProducto.tsx`
- [ ] Agregar validaciones
- [ ] Actualizar tarjetas en catálogo
- [ ] Actualizar modal de detalle
- [ ] Probar con productos de ejemplo
- [ ] Compilar y verificar
- [ ] Desplegar a producción

---

## 🚀 Ventajas de esta Solución

1. ✅ **Flexible**: Soporta 3 formas de venta
2. ✅ **Opcional**: Campos no obligatorios
3. ✅ **Simple**: Fácil de entender y usar
4. ✅ **Escalable**: Se puede extender en el futuro
5. ✅ **Compatible**: No rompe productos existentes
6. ✅ **Intuitivo**: Iconos claros (💰 📦 ⚖️)

---

**Documento creado para implementación futura** 📝

Cuando el cliente lo solicite, este documento tiene todo lo necesario para implementar el sistema en 2-3 horas.
