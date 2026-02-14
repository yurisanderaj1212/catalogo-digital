import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para la base de datos (adaptados a tu estructura con UUIDs)
export interface Tienda {
  id: string; // UUID
  nombre: string;
  descripcion: string | null;
  logo: string | null;
  direccion: string | null;
  telefono: string | null;
  latitud: number | null;
  longitud: number | null;
  activa: boolean;
  fecha_creacion: string;
  whatsapp: string | null; // DEPRECATED - mantener por compatibilidad
  // Nuevos campos para horarios
  hora_apertura: string | null; // Formato: "08:00:00" (TIME)
  hora_cierre: string | null; // Formato: "17:00:00" (TIME)
  dias_laborales: string[] | null; // ["lunes", "martes", "miercoles", "jueves", "viernes"]
}

export interface Categoria {
  id: string; // UUID
  nombre: string;
  tienda_id: string; // UUID
  activa: boolean;
}

export interface Producto {
  id: string; // UUID
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  activo: boolean; // Nota: tu tabla usa "activo" no "activa"
  tienda_id: string; // UUID
  categoria_id: string | null; // UUID
  fecha_creacion: string;
}

export interface ImagenProducto {
  id: string; // UUID
  producto_id: string; // UUID
  url_imagen: string;
  orden: number;
}

export interface GrupoWhatsApp {
  id: string; // UUID
  tienda_id: string; // UUID
  nombre: string;
  enlace: string;
  orden: number;
  activo: boolean;
  fecha_creacion: string;
}
