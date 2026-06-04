-- ============================================================
-- MIGRACIÓN: Sistema de Automatización WhatsApp
-- Ejecutar en Supabase SQL Editor
-- ============================================================
-- IMPORTANTE: La tabla se llama "tiendas" (no "almacenes")
-- ============================================================


-- ============================================================
-- PASO 1: Nuevas columnas en tabla productos
-- ============================================================

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS tipo_venta TEXT NOT NULL DEFAULT 'unidad_sola',
  ADD COLUMN IF NOT EXISTS unidades_por_caja INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS unidad_peso TEXT DEFAULT NULL;

-- Constraint para tipo_venta
ALTER TABLE productos
  DROP CONSTRAINT IF EXISTS check_tipo_venta;
ALTER TABLE productos
  ADD CONSTRAINT check_tipo_venta
  CHECK (tipo_venta IN ('unidad_caja', 'unidad_sola', 'carnico', 'granel'));

-- Constraint para unidad_peso
ALTER TABLE productos
  DROP CONSTRAINT IF EXISTS check_unidad_peso;
ALTER TABLE productos
  ADD CONSTRAINT check_unidad_peso
  CHECK (unidad_peso IS NULL OR unidad_peso IN ('kg', 'lb', 'ambos'));

-- Columnas GENERATED (calculadas automáticamente por PostgreSQL)
-- NOTA: precio_caja usa la columna "precio" existente en tu tabla
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS precio_caja NUMERIC
    GENERATED ALWAYS AS (precio * unidades_por_caja) STORED;

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS precio_por_libra NUMERIC
    GENERATED ALWAYS AS (precio / 2.205) STORED;

-- Verificar columnas agregadas
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'productos'
  AND column_name IN ('tipo_venta','unidades_por_caja','unidad_peso','precio_caja','precio_por_libra')
ORDER BY column_name;


-- ============================================================
-- PASO 2: Tabla wa_sessions — una sesión WA por tienda
-- ============================================================

CREATE TABLE IF NOT EXISTS wa_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id       UUID REFERENCES tiendas(id) ON DELETE CASCADE,
  numero_telefono TEXT NOT NULL,
  estado          TEXT DEFAULT 'desconectado',
  auth_data       JSONB,
  ultimo_ping     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT check_estado_wa CHECK (estado IN ('conectado', 'esperando_qr', 'desconectado'))
);

ALTER TABLE wa_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_wa_sessions" ON wa_sessions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');


-- ============================================================
-- PASO 3: Tabla wa_grupos — grupos WA por tienda
-- ============================================================

CREATE TABLE IF NOT EXISTS wa_grupos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id   UUID REFERENCES tiendas(id) ON DELETE CASCADE,
  grupo_jid   TEXT NOT NULL UNIQUE,
  nombre      TEXT NOT NULL,
  activo      BOOLEAN DEFAULT TRUE,
  orden       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wa_grupos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_wa_grupos" ON wa_grupos
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');


-- ============================================================
-- PASO 4: Tabla scheduler_config — configuración por tienda
-- ============================================================

CREATE TABLE IF NOT EXISTS scheduler_config (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id            UUID REFERENCES tiendas(id) ON DELETE CASCADE UNIQUE,
  activo               BOOLEAN DEFAULT FALSE,
  intervalo_horas      INTEGER DEFAULT 4,
  hora_inicio          TIME DEFAULT '08:00',
  hora_fin             TIME DEFAULT '20:00',
  productos_por_ciclo  INTEGER DEFAULT 5,
  modo_seleccion       TEXT DEFAULT 'rotacion',
  ultimo_indice        INTEGER DEFAULT 0,
  updated_at           TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT check_modo_seleccion CHECK (modo_seleccion IN ('rotacion', 'aleatorio', 'manual'))
);

ALTER TABLE scheduler_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_scheduler" ON scheduler_config
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');


-- ============================================================
-- PASO 5: Tabla mensajes_log — log de envíos
-- ============================================================

CREATE TABLE IF NOT EXISTS mensajes_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id    UUID REFERENCES tiendas(id) ON DELETE SET NULL,
  grupo_jid    TEXT NOT NULL,
  producto_id  UUID REFERENCES productos(id) ON DELETE SET NULL,
  estado       TEXT DEFAULT 'pendiente',
  error_msg    TEXT,
  enviado_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT check_estado_mensaje CHECK (estado IN ('pendiente', 'enviado', 'fallido'))
);

CREATE INDEX IF NOT EXISTS idx_mensajes_log_tienda ON mensajes_log(tienda_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_log_created ON mensajes_log(created_at DESC);

ALTER TABLE mensajes_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_mensajes_log" ON mensajes_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');


-- ============================================================
-- PASO 6: Tabla price_change_log — cambios de precio
-- ============================================================

CREATE TABLE IF NOT EXISTS price_change_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id     UUID REFERENCES productos(id) ON DELETE SET NULL,
  tipo            TEXT NOT NULL,
  valor_anterior  TEXT,
  valor_nuevo     TEXT,
  estado          TEXT DEFAULT 'pendiente',
  publicado_wa    BOOLEAN DEFAULT FALSE,
  aprobado_por    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT check_tipo_change CHECK (tipo IN ('precio', 'stock', 'disponibilidad')),
  CONSTRAINT check_estado_change CHECK (estado IN ('pendiente', 'aprobado', 'rechazado'))
);

CREATE INDEX IF NOT EXISTS idx_price_change_producto ON price_change_log(producto_id);
CREATE INDEX IF NOT EXISTS idx_price_change_estado ON price_change_log(estado);

ALTER TABLE price_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_price_change" ON price_change_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');


-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

-- Ver nuevas columnas de productos
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'productos'
ORDER BY ordinal_position;

-- Ver tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('wa_sessions','wa_grupos','scheduler_config','mensajes_log','price_change_log')
ORDER BY table_name;
