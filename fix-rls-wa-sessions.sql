-- Permitir que usuarios autenticados (admins) lean y escriban wa_sessions
-- El bot-service usa service_role key que ya bypasea RLS

-- Lectura pública para el panel admin autenticado
CREATE POLICY IF NOT EXISTS "admin_read_wa_sessions"
  ON wa_sessions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Escritura para admin autenticado (insertar/actualizar desde el panel)
CREATE POLICY IF NOT EXISTS "admin_write_wa_sessions"
  ON wa_sessions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "admin_update_wa_sessions"
  ON wa_sessions FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Verificar políticas activas
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'wa_sessions';
