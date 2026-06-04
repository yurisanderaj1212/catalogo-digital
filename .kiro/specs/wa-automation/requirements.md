# Requisitos — Sistema de Automatización WhatsApp
## Contexto
Proyecto existente: catálogo digital Next.js + Supabase con 3 tiendas (almacenes).
El cliente publica productos manualmente en ~30 grupos de WhatsApp cada día.
El objetivo es automatizar eso desde un panel de control en el propio admin.

---

## FASE A — Cambios en el Catálogo Digital (este repo)
Estos son los cambios que hay que hacer AQUÍ antes de crear el bot-service.

### A1. Migración SQL en Supabase
Agregar columnas nuevas a la tabla `productos`:
- `tipo_venta` TEXT NOT NULL DEFAULT 'unidad_sola'
  - Valores: `unidad_caja` | `unidad_sola` | `carnico` | `granel`
- `unidades_por_caja` INTEGER DEFAULT NULL
- `precio_caja` NUMERIC GENERATED ALWAYS AS (precio * unidades_por_caja) STORED
- `unidad_peso` TEXT DEFAULT NULL (valores: `kg` | `lb` | `ambos`)
- `precio_por_libra` NUMERIC GENERATED ALWAYS AS (precio / 2.205) STORED

Crear tablas nuevas:
- `wa_sessions` — sesiones WhatsApp por tienda
- `wa_grupos` — grupos WA organizados por tienda
- `scheduler_config` — configuración del scheduler por tienda
- `mensajes_log` — log de cada mensaje enviado
- `price_change_log` — log de cambios de precio pendientes de aprobación

Nota crítica: En el documento dice `almacenes` pero en la DB existente se llama `tiendas`.
Todos los REFERENCES deben apuntar a `tiendas(id)`.

### A2. Actualizar tipos TypeScript (lib/supabase.ts)
Agregar los nuevos campos al interface `Producto`:
- `tipo_venta`, `unidades_por_caja`, `precio_caja`, `unidad_peso`, `precio_por_libra`

Agregar interfaces nuevas:
- `WaSession`, `WaGrupo`, `SchedulerConfig`, `MensajeLog`, `PriceChangeLog`

### A3. Actualizar ModalProducto (admin)
Agregar campos al formulario de crear/editar producto:
- Selector `tipo_venta` (radio buttons o select)
- Campo `unidades_por_caja` (visible solo si tipo_venta = unidad_caja)
- Campo `unidad_peso` (visible solo si tipo_venta = carnico | granel)
- Mostrar preview del precio_caja calculado en tiempo real
- Mostrar preview del precio_por_libra calculado en tiempo real

### A4. Actualizar vista de tienda (clientes)
Mostrar el precio según tipo_venta en la tarjeta y en el modal del producto:
- `unidad_caja`: mostrar precio unidad + precio caja
- `unidad_sola`: mostrar precio normal
- `carnico`: mostrar precio/kg y/o precio/libra según unidad_peso
- `granel`: mostrar precio/unidad_peso

### A5. Módulo de Automatización en el Admin
Crear rutas nuevas dentro del admin existente:

#### A5.1 — Dashboard de automatización (`/admin/dashboard/automatizacion`)
- Estado de cada sesión WA (conectado/desconectado/esperando QR)
- Próxima publicación por tienda con cuenta regresiva
- Últimos 5 mensajes enviados
- Alertas pendientes de aprobación

#### A5.2 — Sesiones WA (`/admin/dashboard/automatizacion/sesiones`)
- QR para vincular número por tienda
- Estado en tiempo real (Supabase Realtime)
- Botón reconectar

#### A5.3 — Configuración del Scheduler (`/admin/dashboard/automatizacion/configuracion`)
- Toggle activo/inactivo por tienda
- Intervalo en horas (slider)
- Hora inicio / hora fin
- Productos por ciclo
- Modo selección: rotación | aleatorio
- Tabla de grupos WA con toggle activo/inactivo por grupo
- Botón de pausa de emergencia global

#### A5.4 — Actualización de precios (`/admin/dashboard/automatizacion/precios`)
- Textarea para pegar texto con precios
- Botón "Analizar"
- Tabla de preview con semáforo de confianza (verde/amarillo/rojo)
- Botón "Aplicar cambios confirmados"

#### A5.5 — Historial (`/admin/dashboard/automatizacion/historial`)
- Log de mensajes enviados con filtro por tienda y fecha
- Log de cambios de precio aprobados/rechazados

---

## FASE B — Bot Service (repo separado)
Se crea después de completar FASE A.
Node.js + Baileys + Bull MQ + Redis.
Desplegado como nuevo Web Service en Render.

---

## Orden de ejecución FASE A

| # | Tarea | Archivo(s) |
|---|-------|-----------|
| 1 | SQL nuevas columnas `productos` | Supabase SQL Editor |
| 2 | SQL nuevas tablas WA | Supabase SQL Editor |
| 3 | Actualizar tipos TS | `lib/supabase.ts` |
| 4 | Actualizar ModalProducto | `app/admin/components/ModalProducto.tsx` |
| 5 | Actualizar vista tienda (precios por tipo) | `app/tienda/[id]/page.tsx` |
| 6 | Crear layout automatización | `app/admin/dashboard/automatizacion/layout.tsx` |
| 7 | Crear dashboard automatización | `app/admin/dashboard/automatizacion/page.tsx` |
| 8 | Crear página sesiones | `app/admin/dashboard/automatizacion/sesiones/page.tsx` |
| 9 | Crear página configuración | `app/admin/dashboard/automatizacion/configuracion/page.tsx` |
| 10 | Crear página precios | `app/admin/dashboard/automatizacion/precios/page.tsx` |
| 11 | Crear página historial | `app/admin/dashboard/automatizacion/historial/page.tsx` |
| 12 | Agregar enlace en nav del admin | `app/admin/dashboard/layout.tsx` |

---

## Estado actual
- [x] Catálogo digital funcionando
- [x] productos_tiendas implementado
- [x] Categorías dinámicas por tienda
- [ ] Columnas tipo_venta en productos
- [ ] Tablas WA en Supabase
- [ ] ModalProducto actualizado
- [ ] Vista tienda actualizada con tipos de venta
- [ ] Módulo automatización
