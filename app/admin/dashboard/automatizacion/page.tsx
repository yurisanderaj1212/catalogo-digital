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

interface BotStatus {
  ok: boolean;
  sesiones: Record<string, string>; // tiendaId → 'conectado'|'desconectado'
  jobs_activos: string[];           // tiendaIds con cron activo
}

// Convierte hora UTC a hora Cuba (UTC-5)
function utcALocal(horaUtc: string): string {
  const [h, m] = horaUtc.split(':').map(Number);
  const hLocal = (h - 5 + 24) % 24;
  return `${String(hLocal).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function AutomatizacionPage() {
  const [tiendas, setTiendas] = useState<TiendaConEstado[]>([]);
  const [ultimosMensajes, setUltimosMensajes] = useState<MensajeConNombres[]>([]);
  const [pendientes, setPendientes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [botOnline, setBotOnline] = useState<boolean | null>(null);

  const fetchBotStatus = useCallback(async () => {
    if (!BOT_URL) return;
    try {
      const res = await fetch(`${BOT_URL}/api/status`, {
        headers: { 'x-bot-secret': BOT_SECRET },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        setBotStatus(data);
        setBotOnline(true);
      } else {
        setBotOnline(false);
      }
    } catch {
      setBotOnline(false);
    }
  }, []);

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

  useEffect(() => {
    fetchData();
    fetchBotStatus();
    const interval = setInterval(() => { fetchData(); fetchBotStatus(); }, 30_000);
    return () => clearInterval(interval);
  }, [fetchData, fetchBotStatus]);

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

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Estado del bot-service */}
      <div className={`flex items-center justify-between p-4 rounded-xl border ${
        botOnline === null ? 'bg-gray-50 border-gray-200' :
        botOnline ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-3">
          <Bot className={`w-5 h-5 ${botOnline ? 'text-green-600' : botOnline === false ? 'text-red-600' : 'text-gray-400'}`} />
          <div>
            <p className={`text-sm font-semibold ${botOnline ? 'text-green-800' : botOnline === false ? 'text-red-800' : 'text-gray-600'}`}>
              Bot-service: {botOnline === null ? 'Verificando...' : botOnline ? 'En línea' : 'Fuera de línea'}
            </p>
            {botStatus && (
              <p className="text-xs text-gray-500 mt-0.5">
                {botStatus.jobs_activos.length} scheduler{botStatus.jobs_activos.length !== 1 ? 's' : ''} activo{botStatus.jobs_activos.length !== 1 ? 's' : ''}
                {' · '}
                {Object.values(botStatus.sesiones).filter(s => s === 'conectado').length} sesión{Object.values(botStatus.sesiones).filter(s => s === 'conectado').length !== 1 ? 'es' : ''} WA conectada{Object.values(botStatus.sesiones).filter(s => s === 'conectado').length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {botStatus && (
            <div className="flex gap-1">
              {botStatus.jobs_activos.map((id) => {
                const tienda = tiendas.find(t => t.id === id);
                return (
                  <span key={id} className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                    <Activity className="w-3 h-3" />
                    {tienda?.nombre ?? id.slice(0, 8)}
                  </span>
                );
              })}
            </div>
          )}
          <button onClick={() => { fetchData(); fetchBotStatus(); }}
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

      {/* Estado de sesiones por tienda */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Estado de conexiones</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiendas.map((t) => {
            // Para sesiones delegadas, usar el estado de la tienda maestra
            const esDelegada = !!t.session?.sesion_maestra_id;
            const tiendaMaestra = esDelegada
              ? tiendas.find(m => m.session?.id === t.session?.sesion_maestra_id)
              : null;

            // Estado real: bot > maestra (si delegada) > propio
            const estadoBot = botStatus?.sesiones[t.id]
              ?? (tiendaMaestra ? botStatus?.sesiones[tiendaMaestra.id] : undefined);
            const estadoReal = estadoBot
              ?? (tiendaMaestra ? tiendaMaestra.session?.estado : t.session?.estado);
            const jobActivo = botStatus?.jobs_activos.includes(t.id) ?? false;

            return (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">{t.nombre}</h3>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${estadoColor(estadoReal)}`}>
                    {estadoIcon(estadoReal)}
                    {estadoLabel(estadoReal)}
                  </span>
                </div>

                {/* Mostrar número — propio o el de la maestra */}
                {esDelegada && tiendaMaestra?.session?.numero_telefono ? (
                  <p className="text-xs text-blue-600 mb-2">🔗 vía {tiendaMaestra.nombre} · {tiendaMaestra.session.numero_telefono}</p>
                ) : t.session?.numero_telefono ? (
                  <p className="text-xs text-gray-500 mb-2">📱 {t.session.numero_telefono}</p>
                ) : null}

                {/* Scheduler — estado real del bot */}
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
                  {jobActivo
                    ? `Scheduler corriendo — cada ${t.scheduler?.intervalo_horas}h`
                    : t.scheduler?.activo
                    ? 'Scheduler activo (reiniciando...)'
                    : 'Scheduler inactivo'}
                </div>

                {t.scheduler?.activo && t.scheduler.hora_inicio && (
                  <p className="text-xs text-gray-400 mt-1 pl-1">
                    🕐 {utcALocal(t.scheduler.hora_inicio.slice(0, 5))} – {utcALocal(t.scheduler.hora_fin?.slice(0, 5) ?? '01:00')} (hora Cuba)
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
