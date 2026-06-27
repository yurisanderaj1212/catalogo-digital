/**
 * supabase.ts — compatibilidad
 * Re-exporta el cliente db y auth del api-client local.
 * Esto permite que el código existente que usa `supabase.from()`
 * siga funcionando sin cambios masivos.
 */

import { db, auth } from './api-client';

// El cliente principal — reemplaza createClient() de @supabase/supabase-js
export const supabase = {
  from: db.from.bind(db),
  auth,
};

// ─── Tipos (sin cambios) ──────────────────────────────────────

export interface Tienda {
  id: string;
  nombre: string;
  descripcion: string | null;
  logo: string | null;
  direccion: string | null;
  telefono: string | null;
  latitud: number | null;
  longitud: number | null;
  activa: boolean;
  fecha_creacion: string;
  whatsapp: string | null;
  hora_apertura: string | null;
  hora_cierre: string | null;
  dias_laborales: string[] | null;
  mensaje_bienvenida: string | null;
}

export interface Categoria {
  id: string;
  nombre: string;
  tienda_id: string;
  activa: boolean;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  moneda: 'CUP' | 'USD' | 'EUR';
  disponible: boolean;
  activo: boolean;
  tienda_id: string;
  categoria_id: string | null;
  fecha_creacion: string;
  tipo_venta: 'unidad_caja' | 'unidad_sola' | 'carnico' | 'paquete';
  unidades_por_caja: number | null;
  precio_caja: number | null;
  unidad_peso: 'kg' | 'lb' | 'ambos' | null;
  precio_por_libra: number | null;
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
  sesion_maestra_id: string | null;
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
  hora_inicio: string;
  hora_fin: string;
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
  id: string;
  producto_id: string;
  url_imagen: string;
  orden: number;
}

export interface ProductoTienda {
  id: string;
  producto_id: string;
  tienda_id: string;
  fecha_agregado: string;
}

export interface GrupoWhatsApp {
  id: string;
  tienda_id: string;
  nombre: string;
  enlace: string;
  orden: number;
  activo: boolean;
  fecha_creacion: string;
}
