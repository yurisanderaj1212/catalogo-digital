'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, TrendingUp, Package, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ResumenTienda {
  id: string;
  nombre: string;
  totalProductos: number;
  productosDisponibles: number;
  productosAgotados: number;
}

interface ResumenGeneral {
  mensajesEsteMes: number;
  mensajesMesAnterior: number;
  tasaExito: number;
  cambiosPrecioEsteMes: number;
  tiendas: ResumenTienda[];
}

export default function ReportesPage() {
  const [resumen, setResumen] = useState<ResumenGeneral | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumen();
  }, []);

  const fetchResumen = async () => {
    setLoading(true);
    try {
      const ahora = new Date();
      const inicioEsteMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
      const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1).toISOString();
      const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59).toISOString();

      const [
        tiendasRes,
        mensajesEsteMesRes,
        mensajesMesAnteriorRes,
        mensajesExitoRes,
        cambiosPrecioRes,
        productosRes,
      ] = await Promise.all([
        supabase.from('tiendas').select('id, nombre').eq('activa', true).order('nombre'),
        supabase.from('mensajes_log').select('id', { count: 'exact', head: true }).gte('created_at', inicioEsteMes),
        supabase.from('mensajes_log').select('id', { count: 'exact', head: true }).gte('created_at', inicioMesAnterior).lte('created_at', finMesAnterior),
        supabase.from('mensajes_log').select('id', { count: 'exact', head: true }).gte('created_at', inicioEsteMes).eq('estado', 'enviado'),
        supabase.from('price_change_log').select('id', { count: 'exact', head: true }).gte('created_at', inicioEsteMes),
        supabase.from('productos').select('id, tienda_id, disponible, activo').eq('activo', true),
      ]);

      const tiendas = tiendasRes.data || [];
      const productos = productosRes.data || [];
      const totalEnviados = mensajesEsteMesRes.count ?? 0;
      const totalExito = mensajesExitoRes.count ?? 0;

      const resumenTiendas: ResumenTienda[] = tiendas.map((t) => {
        const prods = productos.filter((p) => p.tienda_id === t.id);
        return {
          id: t.id,
          nombre: t.nombre,
          totalProductos: prods.length,
          productosDisponibles: prods.filter((p) => p.disponible).length,
          productosAgotados: prods.filter((p) => !p.disponible).length,
        };
      });

      setResumen({
        mensajesEsteMes: totalEnviados,
        mensajesMesAnterior: mensajesMesAnteriorRes.count ?? 0,
        tasaExito: totalEnviados > 0 ? Math.round((totalExito / totalEnviados) * 100) : 0,
        cambiosPrecioEsteMes: cambiosPrecioRes.count ?? 0,
        tiendas: resumenTiendas,
      });
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const variacionMensajes = resumen
    ? resumen.mensajesMesAnterior > 0
      ? Math.round(((resumen.mensajesEsteMes - resumen.mensajesMesAnterior) / resumen.mensajesMesAnterior) * 100)
      : 0
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Reportes</h1>
        <p className="text-sm text-gray-500">Resumen de actividad y herramientas de análisis</p>
      </div>

      {/* Cards de resumen general */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Resumen del mes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Mensajes enviados */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              {variacionMensajes !== 0 && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${variacionMensajes > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {variacionMensajes > 0 ? '+' : ''}{variacionMensajes}% vs mes anterior
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{resumen?.mensajesEsteMes.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Mensajes enviados este mes</p>
            <p className="text-xs text-gray-400 mt-1">{resumen?.mensajesMesAnterior.toLocaleString()} el mes anterior</p>
          </div>

          {/* Tasa de éxito */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{resumen?.tasaExito}%</p>
            <p className="text-sm text-gray-500 mt-1">Tasa de éxito de envíos</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${resumen?.tasaExito}%` }} />
            </div>
          </div>

          {/* Cambios de precio */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{resumen?.cambiosPrecioEsteMes}</p>
            <p className="text-sm text-gray-500 mt-1">Cambios de precio este mes</p>
          </div>

          {/* Total productos */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {resumen?.tiendas.reduce((a, t) => a + t.productosDisponibles, 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Productos disponibles en total</p>
            <p className="text-xs text-gray-400 mt-1">
              {resumen?.tiendas.reduce((a, t) => a + t.productosAgotados, 0)} agotados
            </p>
          </div>
        </div>
      </div>

      {/* Resumen por tienda */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Estado de inventario por tienda</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resumen?.tiendas.map((t) => {
            const pct = t.totalProductos > 0 ? Math.round((t.productosDisponibles / t.totalProductos) * 100) : 0;
            return (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4">{t.nombre}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total activos</span>
                    <span className="font-semibold text-gray-900">{t.totalProductos}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" /> Disponibles
                    </span>
                    <span className="font-semibold text-green-700">{t.productosDisponibles}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-red-500">
                      <XCircle className="w-3.5 h-3.5" /> Agotados
                    </span>
                    <span className="font-semibold text-red-600">{t.productosAgotados}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Disponibilidad</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct > 70 ? 'bg-green-500' : pct > 40 ? 'bg-yellow-400' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Próximamente — resto de secciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50 pointer-events-none">
        {['Historial de precios', 'PDF de inventario', 'Limpieza de historial'].map((s) => (
          <div key={s} className="bg-white rounded-xl border border-dashed border-gray-300 p-5 text-center">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">{s}</p>
            <p className="text-xs text-gray-300 mt-1">Próximamente</p>
          </div>
        ))}
      </div>
    </div>
  );
}
