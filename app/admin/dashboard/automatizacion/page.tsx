'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, WaSession, SchedulerConfig, MensajeLog, Tienda } from '@/lib/supabase';
import { Wifi, WifiOff, Clock, CheckCircle, XCircle, AlertCircle, Send, RefreshCw, Bot, Activity } from 'lucide-react';

const BOT_URL = process.env.NEXT_PUBLIC_BOT_SERVICE_URL ?? '';
const BOT_SECRET = process.env.NEXT_PUBLIC_BOT_SERVICE_SECRET ?? '';

interface TiendaConEstado extends Tienda {
  session: WaSession | null;
  scheduler: SchedulerConfig | null;
}

interface MensajeConNombres extends MensajeLog {
  tienda_nombre?: string;
  producto_nombre?: string;
}

const OFFSET_HORAS_CUBA = -4;
function utcALocal(horaUtc: string): string {
  const [h, m] = horaUtc.split(':').map(Number);
  const hLocal = (h + OFFSET_HORAS_CUBA + 24) % 24;
  return `${String(hLocal).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function AutomatizacionPage() {
  const [tiendas, setTiendas] = useState<TiendaConEstado[]>([]);
  const [ultimosMensajes, setUltimosMensajes] = useState<MensajeConNombres[]>([]);
  const [pendientes, setPendientes] = useState(0);
  const [loading, setLoading] = useState(true);
  // Estado del proceso interno del bot — solo informativo, no bloquea la carga
  const [botProceso, setBotProceso] = useState<{ online: boolean; jobsActivos: string[] } | null>(null);

  // ── Carga principal desde DB — rápida, sin dependencia del bot ──
  const fetchData = useCallback(async () => {
    try {
      const [tiendasRes, sessionsRes, schedulersRes, mensajesRes, pendientesRes] = await Promise.all([
        supabase.from('tiendas').select('*').eq('activa', true).order('nombre'),
        supabase.from('wa_sessions').select('*'),
        supabase.from('scheduler_config').select('*'),
        supabase.from('mensajes_log').select('*, tiendas(nombre), productos(nombre)')
          .order('created_at', { ascending: false }).limit(5),
        supabase.from('price_change_log').select('id').eq('estado', 'pendiente'),
      ]);
      const tiendasData = tiendasRes.data || [];
      const sessions = sessionsRes.data || [];
      const schedulers = schedulersRes.data || [];
      setTiendas(tiendasData.map((t) => ({
        ...t,
        session: sessions.find((s: WaSession) => s.tienda_id === t.id) ?? null,
        scheduler: schedulers.find((s: SchedulerConfig) => s.tienda_id === t.id) ?? null,
      })));
      setPendientes((pendientesRes.data ?? []).length);
      setUltimosMensajes((mensajesRes.data || []).map((m: any) => ({
        ...m,
        tienda_nombre: m.tiendas?.nombre ?? '—',
        producto_nombre: m.productos?.nombre ?? '—',
      })));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Estado del proceso interno del bot — en background, sin bloquear ──
  const fetchBotProceso = useCallback(async () => {
    if (!BOT_URL) return;
    try {
      const res = await fetch(`${BOT_URL}/api/status`, {
        headers: { 'x-bot-secret': BOT_SECRET },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        setBotProceso({ online: true, jobsActivos: data.jobs_activos ?? [] });
      } else {
        setBotProceso({ online: false, jobsActivos: [] });
      }
    } catch {
      setBotProceso({ online: false, jobsActivos: [] });
    }
  }, []);

  useEffect(() => {
    // DB carga inmediatamente
    fetchData();
    // Bot en background — no bloquea render
    const botTimer = setTimeout(() => fetchBotProceso(), 800);
    // Refrescos cada 60s
    const intervalDB  = setInterval(() => fetchData(), 60_000);
    const intervalBot = setInterval(() => fetchBotProceso(), 60_000);
    return () => { clearTimeout(botTimer); clearInterval(intervalDB); clearInterval(intervalBot); };
  }, [fetchData, fetchBotProceso]);

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

  // Contar sesiones conectadas desde DB (fuente de verdad)
  const sesionesConectadas = tiendas.filter(t => {
    const esDelegada = !!t.session?.sesion_maestra_id;
    if (esDelegada) {
      const maestra = tiendas.find(m => m.session?.id === t.session?.sesion_maestra_id);
      return maestra?.session?.estado === 'conectado';
    }
    return t.session?.estado === 'conectado';
  }).length;

  const schedulersActivos = tiendas.filter(t => t.scheduler?.activo).length;

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Estado del bot-service — datos de DB + indicador de proceso */}
      <div className="flex items-center justify-between p-4 rounded-xl border bg-green-50 border-green-200">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-800">Bot-service</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {schedulersActivos} scheduler{schedulersActivos !== 1 ? 's' : ''} activo{schedulersActivos !== 1 ? 's' : ''}
              {' · '}
              {sesionesConectadas} sesión{sesionesConectadas !== 1 ? 'es' : ''} WA conectada{sesionesConectadas !== 1 ? 's' : ''}
              {botProceso !== null && (
                <span className={`ml-2 ${botProceso.online ? 'text-green-600' : 'text-red-500'}`}>
                  · proceso {botProceso.online ? 'activo' : 'inactivo'}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {botProceso?.jobsActivos.map((id) => {
            const tienda = tiendas.find(t => t.id === id);
            return (
              <span key={id} className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                <Activity className="w-3 h-3" />
                {tienda?.nombre ?? id.slice(0, 8)}
              </span>
            );
          })}
          <button onClick={() => { fetchData(); fetchBotProceso(); }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-white">
            <RefreshCw className="w-3 h-3" /> Actualizar
          </button>
        </div>
      </div>

      {/* Alertas pendientes */}
      {pendientes > 0 && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
          <p className="text-sm font-semibold text-yellow-800 flex-1">
            {pendientes} cambio{pendientes > 1 ? 's' : ''} de precio pendiente{pendientes > 1 ? 's' : ''} de aprobación
          </p>
          <a href="/admin/dashboard/automatizacion/precios" className="text-xs font-medium text-yellow-700 hover:underline">Revisar →</a>
        </div>
      )}

      {/* Estado de sesiones por tienda — 100% desde DB */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Estado de conexiones</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiendas.map((t) => {
            const esDelegada = !!t.session?.sesion_maestra_id;
            const tiendaMaestra = esDelegada
              ? tiendas.find(m => m.session?.id === t.session?.sesion_maestra_id)
              : null;
            // Estado desde DB — wa_sessions.estado actualizado por el keepalive cada 8 min
            const estadoReal = esDelegada
              ? (tiendaMaestra?.session?.estado)
              : t.session?.estado;
            // Scheduler activo en proceso del bot (si disponible) o de DB
            const jobActivo = botProceso?.jobsActivos.includes(t.id)
              ?? (t.scheduler?.activo ?? false);

            return (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">{t.nombre}</h3>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${estadoColor(estadoReal)}`}>
                    {estadoIcon(estadoReal)}
                    {estadoLabel(estadoReal)}
                  </span>
                </div>

                {esDelegada && tiendaMaestra?.session?.numero_telefono ? (
                  <p className="text-xs text-blue-600 mb-2">🔗 vía {tiendaMaestra.nombre} · {tiendaMaestra.session.numero_telefono}</p>
                ) : t.session?.numero_telefono ? (
                  <p className="text-xs text-gray-500 mb-2">📱 {t.session.numero_telefono}</p>
                ) : null}

                <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                  jobActivo ? 'bg-green-50 text-green-700' :
                  t.scheduler?.activo ? 'bg-yellow-50 text-yellow-700' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    jobActivo ? 'bg-green-500 animate-pulse' :
                    t.scheduler?.activo ? 'bg-yellow-400' :
                    'bg-gray-400'
                  }`} />
                  {t.scheduler?.activo
                    ? `Scheduler activo — cada ${t.scheduler?.intervalo_horas}h`
                    : 'Scheduler inactivo'}
                </div>

                {t.scheduler?.activo && t.scheduler.hora_inicio && (
                  <p className="text-xs text-gray-400 mt-1 pl-1">
                    🕐 {utcALocal(t.scheduler.hora_inicio.slice(0, 5))} – {utcALocal(t.scheduler.hora_fin?.slice(0, 5) ?? '01:00')} (hora Cuba)
                  </p>
                )}

                {t.session?.ultimo_ping && (
                  <p className="text-xs text-gray-400 mt-1 pl-1">
                    Último ping: {new Date(t.session.ultimo_ping).toLocaleString('es-CU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}

                <a href="/admin/dashboard/automatizacion/sesiones"
                  className="block mt-3 text-center text-xs text-blue-600 hover:underline">
                  {estadoReal === 'conectado' ? 'Ver sesión' : 'Conectar →'}
                </a>
              </div>
            );
          })}
          {tiendas.length === 0 && (
            <p className="col-span-3 text-center text-sm text-gray-400 py-8">No hay tiendas activas</p>
          )}
        </div>
      </div>

      {/* Últimos envíos */}
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
                    <td className="px-4 py-2.5 font-medium text-gray-900 truncate max-w-35">{m.producto_nombre}</td>
                    <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell">{m.tienda_nombre}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs hidden md:table-cell truncate max-w-30">{m.grupo_jid}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        {mensajeEstadoIcon(m.estado)}
                        <span className="text-xs capitalize">{m.estado}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400 hidden sm:table-cell">
                      {m.created_at ? new Date(m.created_at).toLocaleString('es-CU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
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
