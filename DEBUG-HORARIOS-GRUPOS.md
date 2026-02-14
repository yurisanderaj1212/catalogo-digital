# 🔍 Guía de Depuración: Horarios y Grupos de WhatsApp

## Problema Reportado

- ✅ Los campos aparecen en el formulario de editar tienda
- ❌ Los grupos de WhatsApp no se guardan
- ❌ Los días laborales no se reflejan en la tienda
- ❌ No aparece el botón de grupos

---

## 🛠️ Pasos para Depurar

### 1. Verificar que la migración se ejecutó correctamente

Abre Supabase SQL Editor y ejecuta:

```sql
-- Verificar campos en tabla tiendas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tiendas' 
  AND column_name IN ('hora_apertura', 'hora_cierre', 'dias_laborales');

-- Verificar tabla grupos_whatsapp
SELECT * FROM information_schema.tables WHERE table_name = 'grupos_whatsapp';

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'grupos_whatsapp';
```

**Resultado esperado:**
- 3 columnas en tiendas (hora_apertura, hora_cierre, dias_laborales)
- Tabla grupos_whatsapp existe
- 2 políticas RLS activas

---

### 2. Probar guardado de horarios y grupos

1. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Abrir consola del navegador** (F12 → Console)

3. **Ir al panel admin:**
   - Navegar a `/admin/login`
   - Iniciar sesión (admin / admin123)
   - Ir a Tiendas → Editar una tienda

4. **Configurar horarios:**
   - Seleccionar hora de apertura (ej: 08:00)
   - Seleccionar hora de cierre (ej: 17:00)
   - Marcar días laborales (ej: Lunes, Martes, Miércoles, Jueves, Viernes)

5. **Agregar un grupo de WhatsApp:**
   - Nombre: "Grupo #1 - Ofertas"
   - Enlace: `https://chat.whatsapp.com/ABC123xyz` (ejemplo)
   - Clic en "Agregar Grupo"

6. **Guardar la tienda**

7. **Revisar la consola del navegador:**
   
   Deberías ver logs como:
   ```
   Datos a guardar: {
     nombre: "...",
     hora_apertura: "08:00",
     hora_cierre: "17:00",
     dias_laborales: ["lunes", "martes", "miercoles", "jueves", "viernes"],
     ...
   }
   
   Grupos a guardar: [
     {
       id: "temp-...",
       nombre: "Grupo #1 - Ofertas",
       enlace: "https://chat.whatsapp.com/ABC123xyz",
       ...
     }
   ]
   
   Tienda actualizada: <uuid>
   Guardando grupos...
   Iniciando guardado de grupos para tienda: <uuid>
   Grupos activos a guardar: [...]
   Guardando grupo 1: {...}
   Grupo insertado: [...]
   Todos los grupos guardados exitosamente
   Grupos guardados exitosamente
   ```

---

### 3. Verificar datos en Supabase

Abre Supabase Table Editor:

1. **Tabla tiendas:**
   - Busca la tienda que editaste
   - Verifica que `hora_apertura`, `hora_cierre` y `dias_laborales` tengan valores

2. **Tabla grupos_whatsapp:**
   - Verifica que aparezca el grupo que agregaste
   - Campos importantes: `tienda_id`, `nombre`, `enlace`, `activo` (debe ser true)

---

### 4. Verificar visualización en catálogo público

1. **Ir a la tienda en el catálogo:**
   - Navegar a `/tienda/<id-de-la-tienda>`

2. **Revisar la consola del navegador:**
   
   Deberías ver logs como:
   ```
   Tienda cargada: {
     id: "...",
     nombre: "...",
     hora_apertura: "08:00:00",
     hora_cierre: "17:00:00",
     dias_laborales: ["lunes", "martes", "miercoles", "jueves", "viernes"],
     ...
   }
   
   Grupos cargados: [
     {
       id: "...",
       nombre: "Grupo #1 - Ofertas",
       enlace: "https://chat.whatsapp.com/ABC123xyz",
       ...
     }
   ]
   
   Formateando horarios para tienda: {...}
   Horarios encontrados: {
     apertura: "08:00:00",
     cierre: "17:00:00",
     dias: ["lunes", "martes", "miercoles", "jueves", "viernes"]
   }
   Horarios formateados: "Lunes a Viernes: 8:00 AM - 5:00 PM"
   ```

3. **Verificar visualmente:**
   - ✅ Debe aparecer una sección azul con el icono de reloj y los horarios
   - ✅ Debe aparecer un botón "Grupos WhatsApp" en el header
   - ✅ Debe aparecer el botón flotante verde en la esquina inferior derecha

---

## 🐛 Problemas Comunes y Soluciones

### Problema 1: "Error al guardar grupos"

**Causa:** Políticas RLS no configuradas correctamente

**Solución:**
```sql
-- Ejecutar en Supabase SQL Editor
ALTER TABLE grupos_whatsapp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura pública de grupos activos" ON grupos_whatsapp;
CREATE POLICY "Permitir lectura pública de grupos activos"
  ON grupos_whatsapp FOR SELECT
  USING (activo = true);

DROP POLICY IF EXISTS "Permitir escritura a usuarios autenticados" ON grupos_whatsapp;
CREATE POLICY "Permitir escritura a usuarios autenticados"
  ON grupos_whatsapp FOR ALL
  USING (auth.role() = 'authenticated');
```

---

### Problema 2: "dias_laborales no se guarda"

**Causa:** El campo puede no aceptar arrays

**Solución:**
```sql
-- Verificar tipo de dato
SELECT column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name = 'tiendas' AND column_name = 'dias_laborales';

-- Si no es ARRAY, corregir:
ALTER TABLE tiendas ALTER COLUMN dias_laborales TYPE TEXT[] USING dias_laborales::TEXT[];
```

---

### Problema 3: "No aparecen los horarios en el catálogo"

**Posibles causas:**

1. **Los datos no se guardaron:**
   - Verificar en Supabase Table Editor que los campos tienen valores

2. **El formato de hora es incorrecto:**
   - Debe ser "HH:MM:SS" (ej: "08:00:00")
   - Si es solo "HH:MM", agregar ":00" al final

3. **dias_laborales está vacío:**
   - Debe ser un array con al menos un día
   - Formato: `["lunes", "martes", ...]`

**Solución temporal:**
```sql
-- Actualizar manualmente para probar
UPDATE tiendas 
SET 
  hora_apertura = '08:00:00',
  hora_cierre = '17:00:00',
  dias_laborales = ARRAY['lunes', 'martes', 'miercoles', 'jueves', 'viernes']
WHERE id = '<id-de-tu-tienda>';
```

---

### Problema 4: "No aparece el botón de grupos"

**Posibles causas:**

1. **No hay grupos activos:**
   ```sql
   -- Verificar grupos
   SELECT * FROM grupos_whatsapp WHERE tienda_id = '<id-de-tu-tienda>' AND activo = true;
   ```

2. **El componente no se está renderizando:**
   - Revisar consola del navegador
   - Buscar "Grupos cargados:" en los logs

**Solución temporal:**
```sql
-- Insertar grupo manualmente para probar
INSERT INTO grupos_whatsapp (tienda_id, nombre, enlace, orden, activo)
VALUES (
  '<id-de-tu-tienda>',
  'Grupo de Prueba',
  'https://chat.whatsapp.com/TEST123',
  0,
  true
);
```

---

## 📊 Checklist de Verificación

Marca cada item después de verificarlo:

### Base de Datos
- [ ] Campos agregados a tabla `tiendas`
- [ ] Tabla `grupos_whatsapp` existe
- [ ] Políticas RLS configuradas
- [ ] Índice creado

### Panel Admin
- [ ] Campos de horarios aparecen en el formulario
- [ ] Checkboxes de días laborales funcionan
- [ ] Componente de grupos aparece
- [ ] Se pueden agregar grupos
- [ ] Botón "Guardar" funciona sin errores
- [ ] Logs en consola muestran datos correctos

### Catálogo Público
- [ ] Horarios se muestran en el header
- [ ] Botón "Grupos WhatsApp" aparece
- [ ] Botón flotante aparece
- [ ] Modal de grupos se abre
- [ ] Enlaces de grupos funcionan
- [ ] Logs en consola muestran datos correctos

---

## 🆘 Si nada funciona

1. **Limpiar caché del navegador:**
   - Ctrl + Shift + Delete
   - Borrar caché y cookies

2. **Reiniciar servidor de desarrollo:**
   ```bash
   # Detener servidor (Ctrl + C)
   npm run dev
   ```

3. **Verificar variables de entorno:**
   - Abrir `.env.local`
   - Verificar que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` sean correctos

4. **Ejecutar migración nuevamente:**
   - Abrir `migracion-horarios-grupos.sql`
   - Copiar y ejecutar en Supabase SQL Editor

---

## 📝 Reportar Problema

Si después de seguir todos los pasos el problema persiste, proporciona:

1. **Logs de la consola del navegador** (al guardar en admin)
2. **Logs de la consola del navegador** (al ver en catálogo)
3. **Screenshot de Supabase Table Editor** (tabla tiendas)
4. **Screenshot de Supabase Table Editor** (tabla grupos_whatsapp)
5. **Resultado de las consultas SQL de verificación**

---

**Última actualización:** 2026-02-13
