# 🚀 Inicio Rápido - 5 Minutos

## ✅ Lo que ya tienes:
- ✅ Proyecto Next.js configurado
- ✅ Integración con Supabase lista
- ✅ Diseño responsive mobile-first
- ✅ Deploy automático a GitHub Pages

## 📝 Checklist de 5 pasos:

### 1️⃣ Configurar Supabase (2 min)
```bash
# En Supabase SQL Editor, ejecuta:
supabase-schema.sql
datos-ejemplo.sql
```

### 2️⃣ Configurar Variables Locales (30 seg)
```bash
# Edita .env.local con tus credenciales de Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
```

### 3️⃣ Probar Localmente (30 seg)
```bash
npm run dev
# Abre http://localhost:3000
```

### 4️⃣ Subir a GitHub (1 min)
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU-USUARIO/catalogo-digital.git
git push -u origin main
```

### 5️⃣ Configurar GitHub Pages (1 min)
1. Settings → Pages → Source: GitHub Actions
2. Settings → Secrets → Agregar:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🎉 ¡Listo!

Tu sitio estará en:
```
https://TU-USUARIO.github.io/catalogo-digital/
```

---

## 📚 Documentación Completa:

- `INSTRUCCIONES-DEPLOY.md` - Guía paso a paso detallada
- `CONFIGURAR-IMAGENES.md` - Cómo agregar imágenes
- `README.md` - Documentación técnica completa
- `supabase-schema.sql` - Script para crear tablas
- `datos-ejemplo.sql` - Datos de prueba

---

## 🆘 ¿Necesitas ayuda?

1. Revisa `INSTRUCCIONES-DEPLOY.md` para guía detallada
2. Verifica la consola del navegador (F12)
3. Revisa GitHub Actions para errores de deploy

---

## 🎨 Próximos Pasos:

1. Personaliza colores en `app/globals.css`
2. Agrega tus productos en Supabase
3. Sube imágenes (ver `CONFIGURAR-IMAGENES.md`)
4. Comparte el enlace con tus clientes

---

¡Tu catálogo digital está listo para usar! 🎊
