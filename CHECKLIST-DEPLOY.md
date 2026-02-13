# ✅ Checklist Rápido de Deploy

Usa esta lista para asegurarte de que no te falte nada antes de hacer deploy.

---

## 📋 ANTES DE EMPEZAR

- [ ] Tengo cuenta en Supabase
- [ ] Tengo cuenta en GitHub  
- [ ] Tengo cuenta en Vercel
- [ ] Git está instalado en mi PC
- [ ] Node.js está instalado (v18+)

---

## 🗄️ SUPABASE

### Base de Datos

- [ ] Tablas creadas correctamente:
  - [ ] `tiendas`
  - [ ] `categorias`
  - [ ] `productos`
  - [ ] `imagenes_producto`
  - [ ] `usuarios_admin`

- [ ] Datos de prueba insertados:
  - [ ] Al menos 1 tienda activa
  - [ ] Al menos 1 categoría
  - [ ] Al menos 1 producto activo
  - [ ] Usuario admin creado (admin/admin123)

### Políticas RLS

- [ ] Ejecuté el script `politicas-supabase.sql`
- [ ] Verifiqué que las políticas se crearon:
  ```sql
  SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
  ```

### Storage

- [ ] Bucket `imagenes` existe
- [ ] Bucket `imagenes` es PÚBLICO
- [ ] Políticas de Storage configuradas:
  - [ ] Lectura pública (SELECT)
  - [ ] Subida permitida (INSERT)
  - [ ] Eliminación permitida (DELETE)

### Credenciales

- [ ] Copié Project URL: `https://xmfvfhfizlgrcwylrtlg.supabase.co`
- [ ] Copié anon public key: `eyJhbGci...`

---

## 💻 CÓDIGO LOCAL

- [ ] Proyecto compila sin errores:
  ```bash
  npm run build
  ```

- [ ] Archivo `.env.local` tiene las credenciales correctas
- [ ] Probé localmente y todo funciona:
  ```bash
  npm run dev
  ```

- [ ] Verifiqué funcionalidades:
  - [ ] Catálogo público muestra tiendas
  - [ ] Productos se ven correctamente
  - [ ] Modal de producto funciona
  - [ ] Panel admin funciona (/admin/login)
  - [ ] Puedo crear/editar productos
  - [ ] Puedo subir imágenes

---

## 🐙 GITHUB

- [ ] Creé repositorio en GitHub
- [ ] Nombre del repositorio: `catalogo-digital`
- [ ] Repositorio es PÚBLICO (para Vercel gratis)

- [ ] Subí el código:
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  git branch -M main
  git remote add origin https://github.com/TU-USUARIO/catalogo-digital.git
  git push -u origin main
  ```

- [ ] Verifiqué que el código se subió correctamente
- [ ] Verifiqué que `.env.local` NO se subió (debe estar en .gitignore)

---

## 🚀 VERCEL

### Importar Proyecto

- [ ] Creé cuenta en Vercel con GitHub
- [ ] Importé el repositorio `catalogo-digital`

### Variables de Entorno

- [ ] Agregué `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Agregué `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Verifiqué que las variables sean correctas (sin espacios extra)

### Deploy

- [ ] Hice click en "Deploy"
- [ ] Esperé a que termine (2-3 minutos)
- [ ] Vi el mensaje "Congratulations!"
- [ ] Copié la URL de mi sitio: `https://catalogo-digital-xxx.vercel.app`

---

## ✅ VERIFICACIÓN FINAL

### Catálogo Público

- [ ] Abrí mi sitio en Vercel
- [ ] Veo la lista de tiendas
- [ ] Puedo entrar a una tienda
- [ ] Veo los productos
- [ ] Puedo abrir el modal de un producto
- [ ] Las imágenes cargan correctamente
- [ ] Botón de WhatsApp funciona
- [ ] Botón "Volver arriba" aparece al hacer scroll
- [ ] Badge "Nuevo" aparece en productos recientes
- [ ] Contador de productos por categoría funciona
- [ ] Miniaturas en galería funcionan

### Panel Admin

- [ ] Puedo acceder a `/admin/login`
- [ ] Puedo iniciar sesión con `admin` / `admin123`
- [ ] Veo el dashboard
- [ ] Puedo ver tiendas
- [ ] Puedo crear/editar tiendas
- [ ] Puedo ver categorías
- [ ] Puedo crear/editar categorías
- [ ] Puedo ver productos
- [ ] Puedo crear/editar productos
- [ ] Puedo subir imágenes desde PC
- [ ] Puedo agregar imágenes por URL
- [ ] Puedo eliminar productos

### Funcionalidades Adicionales

- [ ] Filtros por categoría funcionan
- [ ] Búsqueda de productos funciona
- [ ] Botón flotante de WhatsApp funciona
- [ ] Animación de pulso en WhatsApp se ve
- [ ] Badge "Nuevo" desaparece al ver producto
- [ ] Responsive funciona en móvil
- [ ] Todo se ve profesional

---

## 🐛 SI ALGO NO FUNCIONA

### Error: No se ven las tiendas

1. Ve a Supabase → Table Editor → tiendas
2. Verifica que haya tiendas con `activa = true`
3. Ve a SQL Editor y ejecuta:
   ```sql
   SELECT * FROM tiendas WHERE activa = true;
   ```

### Error: 403 al subir imágenes

1. Ve a Supabase → Storage → imagenes
2. Verifica que sea público
3. Ve a Policies y verifica las políticas

### Error: Build falla en Vercel

1. Ve a Vercel → Deployments → Click en el fallido
2. Lee los logs
3. Usualmente es por variables de entorno faltantes

### Error: Admin no funciona

1. Verifica que exista el usuario en `usuarios_admin`
2. Ejecuta el script `crear-usuario-admin.sql`

---

## 📝 DESPUÉS DEL DEPLOY

- [ ] Compartí el link con alguien para probar
- [ ] Agregué el link a mis redes sociales
- [ ] Configuré dominio personalizado (opcional)
- [ ] Activé Analytics en Vercel
- [ ] Guardé las credenciales en un lugar seguro

---

## 🎉 ¡LISTO!

Si marcaste todas las casillas, tu catálogo está en línea y funcionando perfectamente.

**URL de tu sitio:** _______________________________

**Fecha de deploy:** _______________________________

---

## 📞 SOPORTE

Si tienes problemas, revisa:

1. `DEPLOY-COMPLETO.md` - Guía detallada paso a paso
2. `politicas-supabase.sql` - Script de políticas
3. Logs en Vercel → Deployments
4. Consola del navegador (F12)

---

¡Felicidades por tu deploy! 🚀
