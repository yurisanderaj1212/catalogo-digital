import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

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
  moneda: 'CUP' | 'USD' | 'EUR';
  disponible: boolean;
  activo: boolean;
  tienda_id: string; // UUID
  categoria_id: string | null; // UUID
  fecha_creacion: string;
  // Campos para automatización WA
  tipo_venta: 'unidad_caja' | 'unidad_sola' | 'carnico' | 'granel';
  unidades_por_caja: number | null;
  precio_caja: number | null;      // GENERATED: precio * unidades_por_caja
  unidad_peso: 'kg' | 'lb' | 'ambos' | null;
  precio_por_libra: number | null; // GENERATED: precio / 2.205
}

export interface WaSession {
  id: string;
  tienda_id: string;
  numero_telefono: string;
  estado: 'conectado' | 'esperando_qr' | 'desconectado';
  auth_data: Record<string, unknown> | null;
  qr_actual: string | null;
  ultimo_ping: string | null;
  created_at: string;
}

export interface WaGrupo {
  id: string;
  tienda_id: string;
  grupo_jid: string;
  nombre: string;
  activo: boolean;
  orden: number;
  created_at: string;
}

export interface SchedulerConfig {
  id: string;
  tienda_id: string;
  activo: boolean;
  intervalo_horas: number;
  hora_inicio: string;  // "08:00"
  hora_fin: string;     // "20:00"
  productos_por_ciclo: number;
  modo_seleccion: 'rotacion' | 'aleatorio' | 'manual';
  ultimo_indice: number;
  updated_at: string;
}

export interface MensajeLog {
  id: string;
  tienda_id: string | null;
  grupo_jid: string;
  producto_id: string | null;
  estado: 'pendiente' | 'enviado' | 'fallido';
  error_msg: string | null;
  enviado_at: string | null;
  created_at: string;
}

export interface PriceChangeLog {
  id: string;
  producto_id: string | null;
  tipo: 'precio' | 'stock' | 'disponibilidad';
  valor_anterior: string | null;
  valor_nuevo: string | null;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  publicado_wa: boolean;
  aprobado_por: string | null;
  created_at: string;
}

export interface ImagenProducto {
  id: string; // UUID
  producto_id: string; // UUID
  url_imagen: string;
  orden: number;
}

export interface ProductoTienda {
  id: string; // UUID
  producto_id: string; // UUID
  tienda_id: string; // UUID
  fecha_agregado: string;
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
