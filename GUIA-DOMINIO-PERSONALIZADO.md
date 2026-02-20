# Guía: Conectar Dominio Personalizado al Catálogo Digital

## 📋 RESUMEN
Esta guía te ayudará a conectar tu dominio personalizado a la aplicación desplegada en Render.

---

## 🎯 PASO 1: VERIFICAR QUE TODO FUNCIONA EN RENDER

Antes de conectar el dominio, asegúrate de que:
- ✅ La aplicación está desplegada en Render
- ✅ Funciona correctamente en la URL de Render (ejemplo: `tu-app.onrender.com`)
- ✅ Supabase está conectado y funcionando
- ✅ Cloudinary está configurado

**URL actual de Render:** (anótala, la necesitarás)

---

## 🎯 PASO 2: PREPARAR EL DOMINIO

### ¿Dónde compraste el dominio?
Necesitas saber dónde está registrado tu dominio. Ejemplos comunes:
- GoDaddy
- Namecheap
- Google Domains
- Hostinger
- Otros

### Información que necesitas:
1. **Nombre del dominio:** (ejemplo: `mitienda.com`)
2. **Acceso al panel de control** del proveedor del dominio
3. **Capacidad de editar registros DNS**

---

## 🎯 PASO 3: CONFIGURAR DOMINIO EN RENDER

### 3.1 Ir a Render Dashboard
1. Entra a https://dashboard.render.com
2. Selecciona tu servicio (catalogo-digital)
3. Ve a la pestaña **"Settings"**
4. Busca la sección **"Custom Domain"**

### 3.2 Agregar el dominio
1. Haz clic en **"Add Custom Domain"**
2. Ingresa tu dominio de dos formas:
   - `tudominio.com` (dominio raíz)
   - `www.tudominio.com` (subdominio www)

### 3.3 Render te dará información DNS
Render te mostrará algo como:
```
Type: CNAME
Name: www
Value: tu-app.onrender.com

Type: A
Name: @
Value: 216.24.57.1 (ejemplo)
```

**¡IMPORTANTE! Anota estos valores, los necesitarás en el siguiente paso.**

---

## 🎯 PASO 4: CONFIGURAR DNS EN TU PROVEEDOR DE DOMINIO

### Opción A: Si tu dominio está en GoDaddy

1. Entra a https://dcc.godaddy.com/
2. Busca tu dominio y haz clic en **"DNS"**
3. Agrega/edita estos registros:

**Registro A (para dominio raíz):**
```
Type: A
Name: @
Value: [IP que te dio Render]
TTL: 600 (o el mínimo disponible)
```

**Registro CNAME (para www):**
```
Type: CNAME
Name: www
Value: tu-app.onrender.com
TTL: 600
```

4. **Elimina** cualquier registro A o CNAME existente que apunte a otro lugar
5. Guarda los cambios

### Opción B: Si tu dominio está en Namecheap

1. Entra a https://ap.www.namecheap.com/
2. Ve a "Domain List" → Selecciona tu dominio → "Manage"
3. Ve a "Advanced DNS"
4. Agrega estos registros:

```
Type: A Record
Host: @
Value: [IP que te dio Render]
TTL: Automatic

Type: CNAME Record
Host: www
Value: tu-app.onrender.com
TTL: Automatic
```

5. Guarda los cambios

### Opción C: Si tu dominio está en otro proveedor

El proceso es similar:
1. Busca la sección de **"DNS Management"** o **"DNS Settings"**
2. Agrega los registros A y CNAME que te dio Render
3. Elimina registros conflictivos
4. Guarda

---

## 🎯 PASO 5: ESPERAR PROPAGACIÓN DNS

### ¿Cuánto tiempo tarda?
- **Mínimo:** 15-30 minutos
- **Normal:** 2-4 horas
- **Máximo:** 24-48 horas (raro)

### ¿Cómo verificar si ya funciona?

**Método 1: Navegador**
- Abre una ventana de incógnito
- Visita `http://tudominio.com`
- Visita `http://www.tudominio.com`

**Método 2: Herramienta online**
- Ve a https://www.whatsmydns.net/
- Ingresa tu dominio
- Verifica que los registros A y CNAME se vean correctamente

**Método 3: Comando (Windows)**
```cmd
nslookup tudominio.com
nslookup www.tudominio.com
```

---

## 🎯 PASO 6: HABILITAR HTTPS (SSL/TLS)

### En Render (Automático)
1. Una vez que el dominio esté conectado, Render automáticamente:
   - Genera un certificado SSL gratuito (Let's Encrypt)
   - Habilita HTTPS
   - Redirige HTTP → HTTPS

2. Esto puede tardar 5-10 minutos después de que el DNS se propague

3. Verifica que funcione:
   - `https://tudominio.com` ✅
   - `https://www.tudominio.com` ✅

---

## 🎯 PASO 7: ACTUALIZAR CONFIGURACIONES

### 7.1 Variables de entorno en Render
Si tienes URLs hardcodeadas, actualiza:
```
NEXT_PUBLIC_SITE_URL=https://tudominio.com
```

### 7.2 Supabase - Actualizar URLs permitidas
1. Ve a tu proyecto en Supabase
2. Settings → Authentication → URL Configuration
3. Agrega a "Site URL":
   ```
   https://tudominio.com
   ```
4. Agrega a "Redirect URLs":
   ```
   https://tudominio.com/**
   https://www.tudominio.com/**
   ```

### 7.3 Cloudinary (opcional)
No necesita cambios, seguirá funcionando igual.

---

## 🎯 PASO 8: VERIFICACIÓN FINAL

### Checklist de pruebas:
- [ ] `http://tudominio.com` redirige a `https://tudominio.com`
- [ ] `http://www.tudominio.com` redirige a `https://www.tudominio.com`
- [ ] El candado SSL aparece en el navegador
- [ ] La página principal carga correctamente
- [ ] Puedes ver las tiendas
- [ ] Puedes ver los productos
- [ ] Las imágenes cargan desde Cloudinary
- [ ] El login del admin funciona
- [ ] Puedes crear/editar productos desde el admin

---

## 🎯 PASO 9: OPTIMIZACIONES PROFESIONALES (OPCIONAL)

### 9.1 Redirección www → no-www (o viceversa)
Decide cuál será tu URL principal:
- Opción A: `tudominio.com` (sin www)
- Opción B: `www.tudominio.com` (con www)

En Render, ambas funcionarán, pero es buena práctica redirigir una a la otra.

### 9.2 Google Search Console
1. Ve a https://search.google.com/search-console
2. Agrega tu dominio
3. Verifica la propiedad
4. Envía el sitemap (si lo tienes)

### 9.3 Analytics (opcional)
Considera agregar:
- Google Analytics
- Facebook Pixel
- Otros servicios de análisis

---

## ❓ PROBLEMAS COMUNES

### Problema 1: "DNS_PROBE_FINISHED_NXDOMAIN"
**Causa:** El DNS aún no se ha propagado
**Solución:** Espera más tiempo (hasta 24 horas)

### Problema 2: "Too many redirects"
**Causa:** Configuración incorrecta de SSL
**Solución:** 
- Verifica que en tu proveedor de dominio no haya redirecciones forzadas
- Asegúrate de que Render tenga SSL habilitado

### Problema 3: "Certificate error"
**Causa:** El certificado SSL aún no se ha generado
**Solución:** Espera 10-15 minutos después de que el DNS se propague

### Problema 4: El dominio no conecta
**Causa:** Registros DNS incorrectos
**Solución:**
- Verifica que los registros A y CNAME sean exactamente los que Render te dio
- Elimina registros conflictivos
- Espera la propagación

---

## 📞 NECESITAS AYUDA?

Si tienes problemas:
1. Verifica cada paso de esta guía
2. Usa las herramientas de verificación mencionadas
3. Revisa los logs en Render Dashboard
4. Contacta al soporte de tu proveedor de dominio si el problema es con DNS

---

## ✅ RESUMEN RÁPIDO

1. ✅ Aplicación funcionando en Render
2. ✅ Agregar dominio en Render Settings
3. ✅ Copiar valores DNS que Render te da
4. ✅ Configurar registros A y CNAME en tu proveedor de dominio
5. ✅ Esperar propagación DNS (2-24 horas)
6. ✅ Verificar que HTTPS funcione
7. ✅ Actualizar URLs en Supabase
8. ✅ Probar todo el flujo de la aplicación

---

**¡Listo! Tu catálogo digital ahora es profesional con dominio personalizado.**
