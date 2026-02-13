# 🎨 Guía de Personalización

## 🌈 Cambiar Colores

### Colores Principales

Edita `app/globals.css`:

```css
:root {
  --primary: #2563eb;        /* Azul principal */
  --primary-dark: #1e40af;   /* Azul oscuro */
}
```

### Paletas de Colores Sugeridas:

**Verde Moderno:**
```css
:root {
  --primary: #10b981;
  --primary-dark: #059669;
}
```

**Morado Elegante:**
```css
:root {
  --primary: #8b5cf6;
  --primary-dark: #7c3aed;
}
```

**Naranja Vibrante:**
```css
:root {
  --primary: #f97316;
  --primary-dark: #ea580c;
}
```

**Rojo Intenso:**
```css
:root {
  --primary: #ef4444;
  --primary-dark: #dc2626;
}
```

---

## 📝 Cambiar Textos

### Título Principal

Edita `app/page.tsx`:

```typescript
<h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
  Tu Nombre de Negocio  {/* Cambia aquí */}
</h1>
<p className="text-lg text-gray-600">
  Tu eslogan o descripción  {/* Cambia aquí */}
</p>
```

### Metadata (SEO)

Edita `app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: "Tu Catálogo - Nombre de Negocio",
  description: "Descripción de tu negocio para SEO",
};
```

---

## 🖼️ Cambiar Logo/Favicon

### Agregar Favicon

1. Coloca tu favicon en `app/favicon.ico`
2. O usa PNG: `app/icon.png` (recomendado 512x512px)

### Agregar Logo en Header

Edita `app/tienda/[id]/page.tsx`:

```typescript
<header className="bg-white shadow-sm sticky top-0 z-10">
  <div className="container mx-auto px-4 py-4">
    <div className="flex items-center gap-4 mb-4">
      {/* Agrega tu logo aquí */}
      <img src="/logo.png" alt="Logo" className="h-10 w-10" />
      
      <button onClick={() => router.push('/')}>
        <ArrowLeft className="w-6 h-6" />
      </button>
      {/* ... resto del código */}
    </div>
  </div>
</header>
```

---

## 🔤 Cambiar Fuente

### Usar Google Fonts

Edita `app/layout.tsx`:

```typescript
import { Poppins } from "next/font/google";  // Cambia Inter por otra fuente

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]  // Pesos que necesites
});

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={poppins.className}>{children}</body>
    </html>
  );
}
```

### Fuentes Recomendadas:
- `Poppins` - Moderna y limpia
- `Montserrat` - Profesional
- `Roboto` - Clásica
- `Open Sans` - Legible
- `Lato` - Elegante

---

## 📱 Personalizar Diseño de Tarjetas

### Tarjetas de Productos

Edita `app/tienda/[id]/page.tsx`:

```typescript
<div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
  {/* Cambia rounded-lg por rounded-xl para bordes más redondeados */}
  {/* Cambia shadow-md por shadow-xl para sombra más pronunciada */}
  
  <div className="aspect-square bg-gray-200 relative">
    {/* Cambia aspect-square por aspect-video para formato 16:9 */}
  </div>
</div>
```

### Estilos de Botones

```typescript
// Botón principal
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  {/* Cambia rounded-lg por rounded-full para botones redondeados */}
</button>

// Botón secundario
<button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
  Texto
</button>
```

---

## 🌍 Cambiar Idioma

### Español a Inglés

Busca y reemplaza estos textos en los archivos:

**app/page.tsx:**
- "Catálogo Digital" → "Digital Catalog"
- "Selecciona una tienda" → "Select a store"
- "No hay tiendas disponibles" → "No stores available"

**app/tienda/[id]/page.tsx:**
- "Buscar productos..." → "Search products..."
- "Todas" → "All"
- "Ver ubicación" → "View location"
- "No disponible" → "Not available"
- "No se encontraron productos" → "No products found"

---

## 📐 Ajustar Layout

### Cambiar Número de Columnas

Edita `app/tienda/[id]/page.tsx`:

```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* 
    grid-cols-1: 1 columna en móvil
    sm:grid-cols-2: 2 columnas en tablet
    lg:grid-cols-3: 3 columnas en laptop
    xl:grid-cols-4: 4 columnas en desktop
    
    Ajusta según prefieras
  */}
</div>
```

### Cambiar Ancho Máximo del Contenedor

```typescript
<div className="container mx-auto px-4 py-6">
  {/* Cambia por: */}
  <div className="max-w-7xl mx-auto px-4 py-6">
  {/* O para más ancho: */}
  <div className="max-w-screen-2xl mx-auto px-4 py-6">
</div>
```

---

## 💰 Formato de Precios

### Cambiar Moneda

Edita `app/tienda/[id]/page.tsx`:

```typescript
// Actual (pesos mexicanos)
<p className="text-2xl font-bold text-blue-600">
  ${producto.precio.toLocaleString()}
</p>

// Dólares
<p className="text-2xl font-bold text-blue-600">
  ${producto.precio.toLocaleString('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  })}
</p>

// Euros
<p className="text-2xl font-bold text-blue-600">
  {producto.precio.toLocaleString('es-ES', { 
    style: 'currency', 
    currency: 'EUR' 
  })}
</p>

// Soles peruanos
<p className="text-2xl font-bold text-blue-600">
  S/ {producto.precio.toLocaleString('es-PE')}
</p>
```

---

## 🎯 Agregar Funcionalidades Extra

### Botón de WhatsApp

Agrega en `app/tienda/[id]/page.tsx`:

```typescript
{tienda.telefono && (
  <a
    href={`https://wa.me/${tienda.telefono.replace(/[^0-9]/g, '')}`}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
  >
    <Phone className="w-4 h-4" />
    <span>WhatsApp</span>
  </a>
)}
```

### Compartir en Redes Sociales

```typescript
const compartir = () => {
  if (navigator.share) {
    navigator.share({
      title: tienda.nombre,
      text: tienda.descripcion || '',
      url: window.location.href,
    });
  }
};

<button onClick={compartir} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
  Compartir
</button>
```

### Ordenar Productos por Precio

```typescript
const [orden, setOrden] = useState<'asc' | 'desc'>('asc');

const productosOrdenados = [...productosFiltrados].sort((a, b) => {
  return orden === 'asc' ? a.precio - b.precio : b.precio - a.precio;
});

// Botón para cambiar orden
<button onClick={() => setOrden(orden === 'asc' ? 'desc' : 'asc')}>
  Precio: {orden === 'asc' ? '↑' : '↓'}
</button>
```

---

## 🔧 Configuración Avanzada

### Cambiar Nombre del Proyecto en URL

Si tu repositorio se llama diferente a `catalogo-digital`:

Edita `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: process.env.NODE_ENV === 'production' ? '/tu-repo-name' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/tu-repo-name/' : '',
};
```

### Agregar Google Analytics

1. Obtén tu ID de Google Analytics (G-XXXXXXXXXX)
2. Edita `app/layout.tsx`:

```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `
        }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

---

## 📱 PWA (Progressive Web App)

Para que tu catálogo se pueda instalar como app:

1. Crea `app/manifest.json`:

```json
{
  "name": "Tu Catálogo",
  "short_name": "Catálogo",
  "description": "Catálogo digital de productos",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

2. Agrega en `app/layout.tsx`:

```typescript
<head>
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#2563eb" />
</head>
```

---

¡Personaliza tu catálogo y hazlo único! 🎨
