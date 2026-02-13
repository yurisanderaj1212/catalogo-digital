# Catálogo Digital Multitiendas

MVP profesional de catálogo digital con Next.js y Supabase.

## 🚀 Características

- ✅ Catálogo público sin login
- ✅ Multitienda escalable
- ✅ Diseño mobile-first responsive
- ✅ Integración con Google Maps
- ✅ Búsqueda y filtros por categoría
- ✅ Optimizado para GitHub Pages

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Cuenta de Supabase con base de datos configurada
- Cuenta de GitHub

## 🛠️ Instalación Local

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/catalogo-digital.git
cd catalogo-digital
```

2. Instala dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
Crea un archivo `.env.local` con:
```
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

4. Ejecuta en desarrollo:
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📦 Estructura de Base de Datos Supabase

Asegúrate de tener estas tablas en Supabase:

### Tabla: tiendas
```sql
CREATE TABLE tiendas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  logo TEXT,
  direccion TEXT,
  telefono VARCHAR(50),
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  activa BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);
```

### Tabla: categorias
```sql
CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  tienda_id INTEGER REFERENCES tiendas(id) ON DELETE CASCADE,
  activa BOOLEAN DEFAULT true
);
```

### Tabla: productos
```sql
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL,
  disponible BOOLEAN DEFAULT true,
  activa BOOLEAN DEFAULT true,
  tienda_id INTEGER REFERENCES tiendas(id) ON DELETE CASCADE,
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);
```

### Tabla: imagenesproducto
```sql
CREATE TABLE imagenesproducto (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
  url_imagen TEXT NOT NULL
);
```

## 🌐 Deploy en GitHub Pages

### Paso 1: Crear repositorio en GitHub

1. Ve a GitHub y crea un nuevo repositorio llamado `catalogo-digital`
2. NO inicialices con README

### Paso 2: Subir código

```bash
cd catalogo-digital
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/catalogo-digital.git
git push -u origin main
```

### Paso 3: Configurar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. Source: GitHub Actions

### Paso 4: Agregar Secrets

1. Settings → Secrets and variables → Actions
2. Agrega estos secrets:
   - `NEXT_PUBLIC_SUPABASE_URL`: Tu URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu clave anon de Supabase

### Paso 5: Deploy automático

El workflow se ejecutará automáticamente en cada push a `main`.

Tu sitio estará disponible en:
`https://tu-usuario.github.io/catalogo-digital/`

## 🎨 Personalización

### Cambiar colores
Edita `app/globals.css`:
```css
:root {
  --primary: #2563eb; /* Azul por defecto */
  --primary-dark: #1e40af;
}
```

### Cambiar nombre del proyecto
Si quieres usar otro nombre en la URL, edita `next.config.ts`:
```typescript
basePath: '/tu-nombre-proyecto'
```

## 📱 Características Mobile-First

- Diseño optimizado para móviles
- Navegación táctil intuitiva
- Imágenes optimizadas
- Carga rápida

## 🔒 Seguridad

- Variables de entorno para credenciales
- No expone claves privadas
- Solo usa Supabase anon key (segura para frontend)

## 🐛 Troubleshooting

### Error: "Supabase client not initialized"
- Verifica que `.env.local` tenga las variables correctas
- Reinicia el servidor de desarrollo

### Error 404 en GitHub Pages
- Verifica que GitHub Pages esté configurado con "GitHub Actions"
- Revisa que los secrets estén configurados correctamente

### Imágenes no cargan
- Verifica que las URLs en Supabase sean públicas
- Usa Supabase Storage para imágenes

## 📄 Licencia

MIT

## 👨‍💻 Autor

Tu nombre
