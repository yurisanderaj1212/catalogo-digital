# 🚀 Guía de Deploy en Render.com

Esta guía te llevará paso a paso para desplegar tu catálogo digital en Render.com (alternativa gratuita a Vercel).

---

## ✅ Requisitos Previos

Antes de empezar, asegúrate de tener:

- [ ] Cuenta en Supabase (gratis)
- [ ] Cuenta en GitHub (gratis)
- [ ] Cuenta en Render (gratis)
- [ ] Código funcionando localmente
- [ ] Políticas de Supabase configuradas

---

## PASO 1: Preparar Supabase

### 1.1 Ejecutar Script de Políticas

1. Ve a Supabase → SQL Editor
2. Abre el archivo `politicas-supabase.sql`
3. Copia TODO el contenido
4. Pégalo en SQL Editor
5. Click en "Run" o presiona Ctrl+Enter
6. Verifica que diga "Success"

### 1.2 Verificar Bucket de Imágenes

1. Ve a Supabase → Storage
2. Verifica que exista el bucket `imagenes`
3. Click en el bucket → Settings
4. Verifica que "Public bucket" esté ACTIVADO ✅

### 1.3 Configurar Políticas de Storage

1. En el bucket `imagenes`, ve a "Policies"
2. Click en "New Policy"
3. Agrega estas 3 políticas:

**Política 1: Lectura pública**
```sql
CREATE POLICY "Lectura pública de imágenes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'imagenes');
```

**Política 2: Subida permitida**
```sql
CREATE POLICY "Permitir subida de imágenes"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'imagenes');
```

**Política 3: Eliminación permitida**
```sql
CREATE POLICY "Permitir eliminación de imágenes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'imagenes');
```

### 1.4 Obtener Credenciales

1. Ve a Supabase → Project Settings → API
2. Copia y guarda estos valores:
   - **Project URL**: `https://xmfvfhfizlgrcwylrtlg.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## PASO 2: Preparar el Código

### 2.1 Verificar que Compile

Abre terminal en la carpeta `catalogo-digital` y ejecuta:

```bash
npm run build
```

Si hay errores, corrígelos antes de continuar.

### 2.2 Verificar .gitignore

Asegúrate de que el archivo `.gitignore` incluya:

```
# dependencies
/node_modules

# next.js
/.next/
/out/

# local env files
.env*.local

# vercel
.vercel
```

⚠️ **IMPORTANTE:** El archivo `.env.local` NO debe subirse a GitHub.

---

## PASO 3: Subir a GitHub

### 3.1 Crear Repositorio en GitHub

1. Ve a [https://github.com](https://github.com)
2. Click en "+" → "New repository"
3. Completa:
   - Repository name: `catalogo-digital`
   - Description: "Catálogo digital multitiendas"
   - Visibility: **Public** (recomendado para Render gratis)
   - ❌ NO marques "Add a README file"
4. Click "Create repository"

### 3.2 Subir el Código

Abre terminal en la carpeta `catalogo-digital` y ejecuta estos comandos:

```bash
# Inicializar repositorio Git
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit: Catálogo digital completo"

# Configurar rama principal
git branch -M main

# Conectar con GitHub (REEMPLAZA TU-USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU-USUARIO/catalogo-digital.git

# Subir código
git push -u origin main
```

### 3.3 Verificar

1. Refresca la página de tu repositorio en GitHub
2. Deberías ver todos los archivos
3. Verifica que NO esté el archivo `.env.local`

---

## PASO 4: Deploy en Render

### 4.1 Crear Cuenta en Render

1. Ve a [https://render.com](https://render.com)
2. Click en "Get Started"
3. Selecciona "Sign up with GitHub"
4. Autoriza a Render para acceder a tu GitHub

### 4.2 Crear Nuevo Web Service

1. En el dashboard de Render, click en "New +"
2. Selecciona "Web Service"
3. Click en "Connect" junto a tu repositorio `catalogo-digital`
   - Si no lo ves, click en "Configure account" y autoriza el repositorio

### 4.3 Configurar el Servicio

Completa el formulario con estos valores:

**Name:**
```
catalogo-digital
```

**Region:**
```
Oregon (US West) o el más cercano a ti
```

**Branch:**
```
main
```

**Root Directory:**
```
catalogo-digital
```

**Runtime:**
```
Node
```

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm start
```

**Instance Type:**
```
Free
```

### 4.4 Agregar Variables de Entorno

Scroll hacia abajo hasta "Environment Variables" y agrega:

**Variable 1:**
- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://xmfvfhfizlgrcwylrtlg.supabase.co`

**Variable 2:**
- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (tu clave completa)

**Variable 3 (Importante para Next.js):**
- Key: `NODE_VERSION`
- Value: `18.17.0`

### 4.5 Crear el Servicio

1. Verifica que todos los campos estén correctos
2. Click en "Create Web Service"
3. Render comenzará a construir tu proyecto
4. Esto tomará 5-10 minutos la primera vez

### 4.6 Monitorear el Deploy

1. Verás los logs en tiempo real
2. Busca estas líneas para confirmar que va bien:
   ```
   ==> Installing dependencies
   ==> Building application
   ==> Starting application
   ```
3. Cuando veas "Your service is live 🎉", el deploy está completo

---

## PASO 5: Verificar que Todo Funcione

### 5.1 Acceder a tu Sitio

Tu sitio estará disponible en:

```
https://catalogo-digital.onrender.com
```

O una URL similar que Render te asigne.

### 5.2 Probar el Catálogo Público

1. Abre tu sitio en Render
2. Deberías ver la lista de tiendas
3. Click en una tienda
4. Verifica que se muestren los productos
5. Click en un producto para ver el modal
6. Verifica que las imágenes carguen
7. Prueba el botón de WhatsApp
8. Prueba el botón "Volver arriba"
9. Verifica que el badge "Nuevo" aparezca

### 5.3 Probar el Panel Admin

1. Ve a: `https://tu-sitio.onrender.com/admin/login`
2. Inicia sesión con: `admin` / `admin123`
3. Verifica que puedas:
   - Ver el dashboard
   - Ver tiendas, categorías y productos
   - Crear nuevos productos
   - Subir imágenes desde PC
   - Editar y eliminar

---

## PASO 6: Configurar Dominio Personalizado (Opcional)

Si tienes un dominio propio:

1. En Render, ve a tu servicio → Settings
2. Scroll hasta "Custom Domain"
3. Click en "Add Custom Domain"
4. Ingresa tu dominio (ejemplo: `www.micatalogo.com`)
5. Render te dará instrucciones para configurar DNS
6. Agrega un registro CNAME en tu proveedor de dominio:
   - Name: `www`
   - Value: `catalogo-digital.onrender.com`
7. Espera 24-48 horas para propagación

---

## 🔄 Actualizar el Sitio

Cada vez que hagas cambios en el código:

```bash
# Agregar cambios
git add .

# Hacer commit
git commit -m "Descripción de los cambios"

# Subir a GitHub
git push
```

Render detectará automáticamente los cambios y hará un nuevo deploy (5-10 minutos).

---

## ⚡ Optimizaciones para Render

### Evitar que el Servicio se Duerma

El plan gratuito de Render "duerme" después de 15 minutos de inactividad. Para evitarlo:

**Opción 1: Usar un servicio de ping (Recomendado)**

1. Ve a [https://uptimerobot.com](https://uptimerobot.com) (gratis)
2. Crea una cuenta
3. Agrega un nuevo monitor:
   - Monitor Type: HTTP(s)
   - URL: `https://tu-sitio.onrender.com`
   - Monitoring Interval: 5 minutos
4. UptimeRobot hará ping cada 5 minutos para mantenerlo activo

**Opción 2: Upgrade a plan pagado**

- Render Starter: $7/mes (sin sleep, más recursos)

### Mejorar Velocidad de Build

Si los builds son lentos, puedes agregar caché:

1. En Render, ve a tu servicio → Settings
2. En "Build Command", cambia a:
```bash
npm ci && npm run build
```

`npm ci` es más rápido que `npm install` en CI/CD.

---

## 🐛 Solución de Problemas

### Problema: Build falla con "Module not found"

**Solución:**
1. Ve a Render → tu servicio → Logs
2. Busca qué módulo falta
3. Verifica que esté en `package.json`
4. Si falta, agrégalo localmente:
   ```bash
   npm install nombre-del-modulo
   git add package.json package-lock.json
   git commit -m "Add missing dependency"
   git push
   ```

### Problema: "Error: Invalid Supabase URL"

**Solución:**
1. Ve a Render → tu servicio → Environment
2. Verifica que las variables estén correctas
3. No debe haber espacios extra
4. Guarda cambios
5. Render hará redeploy automáticamente

### Problema: No se muestran las tiendas

**Solución:**
1. Ve a Supabase → Table Editor → tiendas
2. Verifica que existan tiendas con `activa = true`
3. Ejecuta en SQL Editor:
   ```sql
   SELECT * FROM tiendas WHERE activa = true;
   ```
4. Si no hay resultados, agrega tiendas desde el panel admin

### Problema: Error 403 al subir imágenes

**Solución:**
1. Ve a Supabase → Storage → bucket `imagenes`
2. Verifica que sea público
3. Ve a Policies y verifica que existan las 3 políticas
4. Si no existen, ejecútalas desde el Paso 1.3

### Problema: El sitio es muy lento

**Solución:**
1. El plan gratuito tiene recursos limitados
2. Considera upgrade a Render Starter ($7/mes)
3. O usa Vercel (también gratis pero más rápido)
4. Optimiza imágenes (usa TinyPNG antes de subir)

### Problema: "Service Unavailable"

**Solución:**
1. El servicio está "dormido" (plan gratuito)
2. Espera 30-60 segundos, se despertará automáticamente
3. Para evitarlo, usa UptimeRobot (ver Optimizaciones)

---

## 📊 Monitoreo

### Ver Logs en Tiempo Real

1. Ve a Render → tu servicio → Logs
2. Verás todos los logs de tu aplicación
3. Útil para debugging

### Ver Métricas

1. Ve a Render → tu servicio → Metrics
2. Verás:
   - CPU usage
   - Memory usage
   - Request count
   - Response time

---

## 💰 Costos

### Plan Gratuito (Free)

- ✅ 750 horas/mes de runtime
- ✅ Builds ilimitados
- ✅ SSL automático
- ⚠️ Se duerme después de 15 min de inactividad
- ⚠️ 512MB RAM
- ⚠️ 0.1 CPU

### Plan Starter ($7/mes)

- ✅ Sin sleep
- ✅ 512MB RAM
- ✅ 0.5 CPU
- ✅ Mejor rendimiento

Para un catálogo pequeño-mediano, el plan gratuito es suficiente si usas UptimeRobot.

---

## 🔒 Seguridad

### Proteger Variables de Entorno

- ✅ Las variables están seguras en Render
- ✅ No se muestran en logs
- ✅ Solo tu servicio puede acceder a ellas

### HTTPS Automático

- ✅ Render proporciona SSL gratis
- ✅ Tu sitio será `https://` automáticamente
- ✅ Certificado renovado automáticamente

---

## ✅ Checklist Final

- [ ] Supabase configurado con políticas RLS
- [ ] Bucket de imágenes público con políticas
- [ ] Código subido a GitHub
- [ ] Servicio creado en Render
- [ ] Variables de entorno configuradas
- [ ] Build completado exitosamente
- [ ] Sitio accesible en la URL de Render
- [ ] Catálogo público funciona
- [ ] Panel admin funciona
- [ ] Imágenes cargan correctamente
- [ ] WhatsApp funciona
- [ ] Todas las mejoras funcionan
- [ ] (Opcional) UptimeRobot configurado
- [ ] (Opcional) Dominio personalizado configurado

---

## 🎉 ¡Felicidades!

Tu catálogo digital está en línea en Render. Ahora puedes:

1. Compartir el link con tus clientes
2. Agregar productos desde el panel admin
3. Actualizar precios y disponibilidad
4. Monitorear el sitio en Render Dashboard

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en Render → Logs
2. Revisa la consola del navegador (F12)
3. Verifica las políticas en Supabase
4. Consulta la documentación:
   - [Render Docs](https://render.com/docs)
   - [Supabase Docs](https://supabase.com/docs)
   - [Next.js Docs](https://nextjs.org/docs)

---

## 🆚 Render vs Vercel

| Característica | Render (Free) | Vercel (Free) |
|----------------|---------------|---------------|
| Precio | Gratis | Gratis |
| Sleep | Sí (15 min) | No |
| Build Time | 5-10 min | 2-3 min |
| RAM | 512MB | 1GB |
| Bandwidth | 100GB/mes | 100GB/mes |
| Dominio Custom | ✅ | ✅ |
| SSL | ✅ | ✅ |
| Velocidad | Media | Rápida |

**Recomendación:** 
- Usa Vercel si quieres máxima velocidad
- Usa Render si prefieres tener todo en un solo lugar (también tiene bases de datos)

---

¡Éxito con tu catálogo digital en Render! 🚀
