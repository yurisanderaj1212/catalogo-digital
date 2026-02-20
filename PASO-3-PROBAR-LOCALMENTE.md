# PASO 3: Probar Supabase Auth Localmente

## 🎯 OBJETIVO
Verificar que la autenticación funciona correctamente antes de subir a producción.

---

## 📋 PRUEBAS A REALIZAR

### 1. Iniciar servidor de desarrollo
```bash
npm run dev
```

### 2. Probar Catálogo Público (SIN LOGIN)
1. Abre: http://localhost:3000
2. ✅ Deberías ver la lista de tiendas
3. ✅ Haz clic en una tienda
4. ✅ Deberías ver los productos
5. ✅ Todo funciona sin necesidad de login

### 3. Intentar acceder al Admin SIN LOGIN
1. Abre: http://localhost:3000/admin/dashboard
2. ✅ Debería redirigirte automáticamente a /admin/login
3. ✅ No deberías poder acceder sin autenticarte

### 4. Probar LOGIN con tus credenciales
1. Ve a: http://localhost:3000/admin/login
2. Ingresa:
   - Email: yurisanderaj@gmail.com
   - Password: [tu contraseña]
3. Haz clic en "Iniciar Sesión"
4. ✅ Debería redirigirte a /admin/dashboard
5. ✅ Deberías ver tu email arriba a la derecha
6. ✅ Deberías ver el botón "Salir"

### 5. Probar funcionalidad del Admin
1. ✅ Ve a "Tiendas" - deberías ver todas las tiendas
2. ✅ Ve a "Productos" - deberías ver todos los productos
3. ✅ Ve a "Categorías" - deberías ver todas las categorías
4. ✅ Intenta crear un producto nuevo
5. ✅ Intenta editar un producto
6. ✅ Intenta eliminar un producto (prueba)

### 6. Probar LOGOUT
1. Haz clic en el botón "Salir" (arriba a la derecha)
2. ✅ Debería redirigirte a /admin/login
3. ✅ Si intentas volver a /admin/dashboard, debería pedirte login de nuevo

### 7. Probar con el segundo email (backup)
1. Ve a /admin/login
2. Ingresa:
   - Email: yurisanderalmirajimenez@gmail.com
   - Password: [tu contraseña]
3. ✅ Debería funcionar igual

### 8. Probar con email NO autorizado
1. Ve a /admin/login
2. Ingresa un email que NO sea admin (ejemplo: test@test.com)
3. ✅ Debería mostrar error: "No tienes permisos de administrador"

---

## ✅ CHECKLIST DE VERIFICACIÓN

Marca cuando completes cada prueba:

- [ ] Catálogo público funciona sin login
- [ ] Admin redirige a login si no estás autenticado
- [ ] Login funciona con yurisanderaj@gmail.com
- [ ] Login funciona con yurisanderalmirajimenez@gmail.com
- [ ] Dashboard muestra tu email
- [ ] Puedes ver tiendas/productos/categorías
- [ ] Puedes crear/editar/eliminar (CRUD funciona)
- [ ] Logout funciona correctamente
- [ ] Email no autorizado es rechazado
- [ ] Después de logout no puedes acceder al admin

---

## ❌ PROBLEMAS COMUNES

### Problema: "Error al iniciar sesión"
**Causa:** Credenciales incorrectas o usuario no existe
**Solución:**
1. Verifica que creaste los usuarios en Supabase Dashboard
2. Verifica que la contraseña sea correcta
3. Ve a Authentication → Users en Supabase y confirma que existen

### Problema: "No tienes permisos de administrador"
**Causa:** Usuario existe en auth.users pero no en tabla admins
**Solución:**
1. Ve a SQL Editor en Supabase
2. Ejecuta:
```sql
SELECT * FROM public.admins WHERE email = 'tu@email.com';
```
3. Si no aparece, ejecuta el INSERT del script crear-tabla-admins.sql

### Problema: No puedo ver productos en el admin
**Causa:** Políticas RLS bloqueando acceso
**Solución:**
1. Verifica que ejecutaste politicas-rls-profesionales.sql
2. Verifica que estás autenticado (mira si aparece tu email arriba)
3. Revisa la consola del navegador (F12) para ver errores

### Problema: El catálogo público no muestra productos
**Causa:** Productos inactivos o políticas RLS mal configuradas
**Solución:**
1. Verifica que los productos tengan activo = true
2. Ejecuta en SQL Editor:
```sql
SELECT * FROM productos WHERE activo = true;
```

---

## 🎯 SIGUIENTE PASO

Una vez que TODAS las pruebas pasen:
- ✅ Commit de cambios
- ✅ Push a GitHub
- ✅ Verificar en producción (Render)
- ✅ Actualizar URLs en Supabase para dominio de producción

---

**¿Todo funciona?** Avísame para continuar con el deploy.
