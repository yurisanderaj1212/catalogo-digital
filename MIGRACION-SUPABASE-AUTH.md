# Migración a Supabase Auth - Plan Profesional

## 🎯 OBJETIVO
Migrar de autenticación casera a Supabase Auth con políticas RLS profesionales.

---

## 📋 CHECKLIST DE MIGRACIÓN

### ✅ FASE 1: PREPARACIÓN
- [ ] Backup de base de datos actual
- [ ] Anotar usuarios admin existentes
- [ ] Crear plan de rollback

### ✅ FASE 2: CONFIGURAR SUPABASE AUTH
- [ ] Habilitar Email Auth en Supabase
- [ ] Crear usuarios admin en Supabase Auth
- [ ] Configurar URLs de redirección
- [ ] Deshabilitar confirmación de email (para admin)

### ✅ FASE 3: ACTUALIZAR POLÍTICAS RLS
- [ ] Políticas de lectura pública (catálogo)
- [ ] Políticas de escritura solo para autenticados
- [ ] Verificar que funcionen correctamente

### ✅ FASE 4: MIGRAR CÓDIGO FRONTEND
- [ ] Actualizar lib/supabase.ts
- [ ] Reescribir lib/auth-context.tsx
- [ ] Actualizar app/admin/login/page.tsx
- [ ] Crear middleware de protección
- [ ] Actualizar layout del admin
- [ ] Agregar botón de logout

### ✅ FASE 5: TESTING
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Catálogo público accesible
- [ ] Admin protegido sin login
- [ ] CRUD de productos funciona
- [ ] Subida de imágenes funciona

### ✅ FASE 6: DEPLOY
- [ ] Commit de cambios
- [ ] Push a GitHub
- [ ] Verificar en Render
- [ ] Probar en producción

---

## 🔐 USUARIOS ADMIN A CREAR

**Formato:**
```
Email: admin@tudominio.com
Password: [contraseña segura]
```

**Lista de admins:**
1. Admin principal: _______________
2. Admin secundario (opcional): _______________

---

## 🗄️ CAMBIOS EN BASE DE DATOS

### Tabla `usuarios_admin` (DEPRECADA)
- ❌ Ya no se usará
- ✅ Se puede eliminar después de verificar que todo funciona
- ⚠️ Mantener por ahora como backup

### Nueva autenticación
- ✅ Usa tabla `auth.users` de Supabase (automática)
- ✅ Tokens JWT seguros
- ✅ Sesiones manejadas por Supabase

---

## 📝 POLÍTICAS RLS NUEVAS

### Catálogo Público (sin cambios)
```sql
-- Lectura pública de productos activos
CREATE POLICY "public_read_active_products"
ON productos FOR SELECT
TO public
USING (activo = true);
```

### Admin Protegido (NUEVO)
```sql
-- Solo usuarios autenticados pueden modificar
CREATE POLICY "authenticated_full_access_products"
ON productos FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
```

---

## 🔄 ROLLBACK PLAN

Si algo sale mal:
1. Revertir commit en Git
2. Restaurar políticas RLS antiguas
3. Volver a código anterior
4. Investigar problema

---

## ⚠️ NOTAS IMPORTANTES

1. **No eliminar tabla `usuarios_admin` hasta verificar todo**
2. **Guardar contraseñas de admin en lugar seguro**
3. **Probar en local antes de deploy**
4. **Tener acceso a Supabase Dashboard durante migración**

---

## 📞 SOPORTE

Si hay problemas:
- Revisar logs en Supabase Dashboard
- Verificar políticas RLS
- Comprobar variables de entorno
- Revisar Network tab en DevTools

---

**Fecha de inicio:** _____________
**Fecha de completado:** _____________
**Responsable:** _____________
