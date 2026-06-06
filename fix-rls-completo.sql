-- ============================================================
-- Políticas RLS para todas las tablas de automatización
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- mensajes_log
CREATE POLICY "admin_read_mensajes_log" ON mensajes_log
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_write_mensajes_log" ON mensajes_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_update_mensajes_log" ON mensajes_log
  FOR UPDATE USING (auth.role() = 'authenticated');

-- price_change_log
CREATE POLICY "admin_read_price_change" ON price_change_log
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_write_price_change" ON price_change_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_update_price_change" ON price_change_log
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Verificar todas las políticas activas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN (
  'wa_sessions','wa_grupos','scheduler_config',
  'mensajes_log','price_change_log'
)
ORDER BY tablename, cmd;
