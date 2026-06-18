-- Migración: sesión compartida entre tiendas
-- Permite que Diezmero y Ayestaran usen el socket del número español (Cubana)
-- sesion_maestra_id apunta al id de la fila en wa_sessions que tiene la sesión real

ALTER TABLE wa_sessions
  ADD COLUMN IF NOT EXISTS sesion_maestra_id UUID DEFAULT NULL
    REFERENCES wa_sessions(id) ON DELETE SET NULL;

COMMENT ON COLUMN wa_sessions.sesion_maestra_id IS
  'Si está configurado, esta tienda usa el socket de la sesión indicada en lugar del propio. La tienda apuntada debe tener su propia conexión activa.';
