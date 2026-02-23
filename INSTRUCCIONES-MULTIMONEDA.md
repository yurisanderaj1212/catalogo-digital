# 💱 Instrucciones para Activar Multimoneda

## ✅ ¿Qué se Implementó?

Se agregó soporte para 3 monedas en el sistema:
- **CUP** - Peso Cubano (moneda por defecto)
- **USD** - Dólar Estadounidense
- **EUR** - Euro

---

## 📋 Pasos para Activar

### Paso 1: Ejecutar Script SQL en Supabase

1. Ve a https://supabase.com
2. Inicia sesión y selecciona tu proyecto
3. Click en **"SQL Editor"** en el menú lateral
4. Click en **"New query"**
5. Abre el archivo `agregar-multimoneda.sql` de este proyecto
6. Copia TODO el contenido
7. Pégalo en el editor SQL
8. Click en **"Run"** o presiona `Ctrl + Enter`

### Paso 2: Verificar Resultados

Después de ejecutar el script, verás dos tablas de verificación:

**Tabla 1: Estructura de columnas**
```
column_name | data_type | column_default | is_nullable
precio      | numeric   | NULL           | NO
moneda      | varchar   | 'CUP'          | NO
```

**Tabla 2: Productos actualizados**
```
Todos los productos existentes tendrán moneda = 'CUP'
```

✅ Si ves esto, la actualización fue exitosa.

---

## 🎯 Cómo Usar la Multimoneda

### En el Panel Admin:

1. Ve a **Productos** → **Nuevo Producto** o edita uno existente
2. En el campo **Precio**, verás:
   - Input numérico para el precio
   - Selector desplegable con: CUP, USD, EUR
3. Selecciona la moneda correspondiente
4. Guarda el producto

### En el Catálogo Público:

- Los precios se mostrarán con su moneda correspondiente
- Ejemplo: `$150 CUP`, `$5 USD`, `€4 EUR`

---

## 📊 Comportamiento del Sistema

### Productos Existentes:
- Todos los productos actuales se configuraron automáticamente como **CUP**
- No necesitas hacer nada, seguirán funcionando normalmente

### Productos Nuevos:
- Por defecto se crean en **CUP**
- Puedes cambiar la moneda antes de guardar

### Productos Editados:
- Puedes cambiar la moneda en cualquier momento
- El cambio se aplica inmediatamente

---

## 🔍 Validaciones Implementadas

El sistema solo permite estas 3 monedas:
- ✅ CUP
- ✅ USD
- ✅ EUR
- ❌ Cualquier otra moneda será rechazada por la base de datos

---

## 💡 Ejemplos de Uso

### Producto en Pesos Cubanos:
```
Nombre: Arroz
Precio: 150
Moneda: CUP
Resultado: $150 CUP
```

### Producto en Dólares:
```
Nombre: Laptop
Precio: 500
Moneda: USD
Resultado: $500 USD
```

### Producto en Euros:
```
Nombre: Perfume
Precio: 45
Moneda: EUR
Resultado: $45 EUR
```

---

## 🚀 Desplegar a Producción

Después de ejecutar el script SQL en Supabase:

1. Los cambios de código ya están listos
2. Compila el proyecto: `npm run build`
3. Sube a Git: `git add .` → `git commit` → `git push`
4. Render desplegará automáticamente
5. La multimoneda estará disponible en producción

---

## ⚠️ Notas Importantes

1. **No hay conversión automática**: El sistema NO convierte entre monedas. Cada producto tiene su precio fijo en la moneda seleccionada.

2. **Responsabilidad del admin**: El administrador debe ingresar el precio correcto en la moneda correcta.

3. **Filtros**: Los productos se pueden filtrar por tienda y categoría, pero no por moneda (por ahora).

4. **Compatibilidad**: Todos los productos existentes seguirán funcionando sin cambios.

---

## ✅ Checklist de Activación

Antes de usar en producción, verifica:

- [ ] Script SQL ejecutado en Supabase
- [ ] Verificación muestra moneda = 'CUP' por defecto
- [ ] Probado crear producto con CUP localmente
- [ ] Probado crear producto con USD localmente
- [ ] Probado crear producto con EUR localmente
- [ ] Precios se muestran correctamente en catálogo
- [ ] Precios se muestran correctamente en admin
- [ ] Código compilado sin errores
- [ ] Cambios subidos a Git
- [ ] Desplegado en producción

---

**¡Multimoneda implementada exitosamente!** 💱✨

Ahora puedes manejar productos en CUP, USD y EUR.
