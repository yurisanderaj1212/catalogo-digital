'use client';

import { useEffect, useState } from 'react';
import { supabase, WaSession, SchedulerConfig, MensajeLog, Tienda } from '@/lib/supabase';
import { Wifi, WifiOff, Clock, CheckCircle, XCircle, AlertCircle, Send, RefreshCw } from 'lucide-react';

interface TiendaConEstado extends Tienda {
  session: WaSession | null;
  scheduler: SchedulerConfig | null;
}

interface MensajeConNombres extends MensajeLog {
  tienda_nombre?: string;
  producto_nombre?: string;
}

export default function AutomatizacionPage() {
  const [tiendas, setTiendas] = useState<TiendaConEstado[]>([]);
  const [ultimosMensajes, setUltimosMensajes] = useState<MensajeConNombres[]>([]);
  const [pendientes, setPendientes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [tiendasRes, sessionsRes, schedulersRes, mensajesRes, pendientesRes] = await Promise.all([
        supabase.from('tiendas').select('*').eq('activa', true).order('nombre'),
        supabase.from('wa_sessions').select('*'),
        supabase.from('scheduler_config').select('*'),
        supabase.from('mensajes_log').select('*, tiendas(nombre), productos(nombre)')
          .order('created_at', { ascending: false }).limit(5),
        supabase.from('price_change_log').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      ]);

      const tiendasData = tiendasRes.data || [];
      const sessions = sessionsRes.data || [];
      const schedulers = schedulersRes.data || [];

      const tiendasConEstado: TiendaConEstado[] = tiendasData.map((t) => ({
        ...t,
        session: sessions.find((s) => s.tienda_id === t.id) ?? null,
        scheduler: schedulers.find((s) => s.tienda_id === t.id) ?? null,
      }));

      setTiendas(tiendasConEstado);
      setPendientes(pendientesRes.count ?? 0);

      // Mapear nombres en mensajes
      const msgs = (mensajesRes.data || []).map((m: any) => ({
        ...m,
        tienda_nombre: m.tiendas?.nombre ?? '—',
        producto_nombre: m.productos?.nombre ?? '—',
      }));
      setUltimosMensajes(msgs);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const estadoColor = (estado: string | undefined) => {
    if (estado === 'conectado') return 'text-green-600 bg-green-50 border-green-200';
    if (estado === 'esperando_qr') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const estadoIcon = (estado: string | undefined) => {
    if (estado === 'conectado') return <Wifi className="w-4 h-4" />;
    if (estado === 'esperando_qr') return <AlertCircle className="w-4 h-4" />;
    return <WifiOff className="w-4 h-4" />;
  };

  const estadoLabel = (estado: string | undefined) => {
    if (estado === 'conectado') return 'Conectado';
    if (estado === 'esperando_qr') return 'Esperando QR';
    return 'Desconectado';
  };

  const mensajeEstadoIcon = (estado: string) => {
    if (estado === 'enviado') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (estado === 'fallido') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Alertas pendientes */}
      {pendientes > 0 && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800">
              {pendientes} cambio{pendientes > 1 ? 's' : ''} de precio pendiente{pendientes > 1 ? 's' : ''} de aprobación
            </p>
          </div>
          <a href="/admin/dashboard/automatizacion/precios" className="text-xs font-medium text-yellow-700 hover:underline">
            Revisar →
          </a>
        </div>
      )}

      {/* Estado de sesiones por tienda */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Estado de conexiones</h2>
          <button onClick={fetchData} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <RefreshCw className="w-3 h-3" /> Actualizar
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiendas.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">{t.nombre}</h3>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${estadoColor(t.session?.estado)}`}>
                  {estadoIcon(t.session?.estado)}
                  {estadoLabel(t.session?.estado)}
                </span>
              </div>

              {t.session?.numero_telefono && (
                <p className="text-xs text-gray-500 mb-2">📱 {t.session.numero_telefono}</p>
              )}

              {/* Scheduler status */}
              <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${t.scheduler?.activo ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${t.scheduler?.activo ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                {t.scheduler?.activo
                  ? `Scheduler activo — cada ${t.scheduler.intervalo_horas}h`
                  : 'Scheduler inactivo'}
              </div>

              {t.scheduler?.activo && t.scheduler.hora_inicio && (
                <p className="text-xs text-gray-400 mt-1 pl-1">
                  🕐 {t.scheduler.hora_inicio.slice(0, 5)} – {t.scheduler.hora_fin?.slice(0, 5)}
                </p>
              )}

              <a
                href="/admin/dashboard/automatizacion/sesiones"
                className="block mt-3 text-center text-xs text-blue-600 hover:underline"
              >
                {t.session?.estado === 'conectado' ? 'Ver sesión' : 'Conectar →'}
              </a>
            </div>
          ))}

          {tiendas.length === 0 && (
            <p className="col-span-3 text-center text-sm text-gray-400 py-8">No hay tiendas activas</p>
          )}
        </div>
      </div>

      {/* Últimos mensajes enviados */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Últimos envíos</h2>
          <a href="/admin/dashboard/automatizacion/historial" className="text-xs text-blue-600 hover:underline">Ver todo →</a>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {ultimosMensajes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Send className="w-8 h-8 mb-2" />
              <p className="text-sm">Aún no hay mensajes enviados</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Producto</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden md:table-cell">Tienda</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden md:table-cell">Grupo</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Estado</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden sm:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ultimosMensajes.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900 truncate max-w-[140px]">{m.producto_nombre}</td>
                    <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell">{m.tienda_nombre}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs hidden md:table-cell truncate max-w-[120px]">{m.grupo_jid}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        {mensajeEstadoIcon(m.estado)}
                        <span className="text-xs capitalize">{m.estado}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400 hidden sm:table-cell">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString('es-CU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
