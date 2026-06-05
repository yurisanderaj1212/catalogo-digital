'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, Tienda, WaSession } from '@/lib/supabase';
import { Wifi, WifiOff, QrCode, AlertCircle, RefreshCw, Phone, Loader } from 'lucide-react';

interface TiendaConSesion extends Tienda {
  session: WaSession | null;
}

const BOT_URL = process.env.NEXT_PUBLIC_BOT_SERVICE_URL ?? '';
const BOT_SECRET = process.env.NEXT_PUBLIC_BOT_SERVICE_SECRET ?? '';

async function llamarBot(path: string, method = 'GET') {
  if (!BOT_URL) return null;
  try {
    const res = await fetch(`${BOT_URL}${path}`, {
      method,
      headers: { 'x-bot-secret': BOT_SECRET },
    });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export default function SesionesPage() {
  const [tiendas, setTiendas] = useState<TiendaConSesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<string | null>(null);
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [iniciando, setIniciando] = useState<string | null>(null);
  const [qrs, setQrs] = useState<Record<string, string | null>>({});
  const [mensaje, setMensaje] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tiendasRes, sessionsRes] = await Promise.all([
        supabase.from('tiendas').select('*').eq('activa', true).order('nombre'),
        supabase.from('wa_sessions').select('*'),
      ]);
      const tiendasData = tiendasRes.data || [];
      const sessions = sessionsRes.data || [];
      setTiendas(tiendasData.map((t) => ({
        ...t,
        session: sessions.find((s) => s.tienda_id === t.id) ?? null,
      })));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Polling del estado cada 10s cuando alguna sesión está esperando QR
  useEffect(() => {
    const hayEsperandoQR = tiendas.some(t => t.session?.estado === 'esperando_qr');
    if (!hayEsperandoQR) return;
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [tiendas, fetchData]);

  const guardarSesion = async (tiendaId: string) => {
    if (!telefono.trim()) return;
    setGuardando(true);
    try {
      const existing = tiendas.find((t) => t.id === tiendaId)?.session;
      if (existing) {
        await supabase.from('wa_sessions').update({
          numero_telefono: telefono.trim(),
          estado: 'desconectado',
          auth_data: null,
        }).eq('id', existing.id);
      } else {
        await supabase.from('wa_sessions').insert({
          tienda_id: tiendaId,
          numero_telefono: telefono.trim(),
          estado: 'desconectado',
        });
      }
      setEditando(null);
      setTelefono('');
      await fetchData();

      // Notificar al bot-service para que inicie la sesión
      await iniciarSesion(tiendaId);
    } catch (err) {
      console.error('Error:', err);
      mostrarMensaje('Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const iniciarSesion = async (tiendaId: string) => {
    setIniciando(tiendaId);
    const resultado = await llamarBot(`/api/sesiones/${tiendaId}/iniciar`, 'POST');
    if (resultado?.ok) {
      mostrarMensaje('Sesión iniciada — espera el QR en los logs de Render');
    } else if (!BOT_URL) {
      mostrarMensaje('BOT_SERVICE_URL no configurada en las variables de entorno');
    } else {
      mostrarMensaje('No se pudo contactar el bot-service');
    }
    setIniciando(null);
    await fetchData();
  };

  const pedirQR = async (tiendaId: string) => {
    const resultado = await llamarBot(`/api/qr/${tiendaId}`);
    if (resultado?.qr) {
      setQrs(prev => ({ ...prev, [tiendaId]: resultado.qr }));
    } else {
      mostrarMensaje('QR no disponible — revisa los logs del bot-service');
    }
  };

  const mostrarMensaje = (msg: string) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(''), 4000);
  };

  const estadoConfig = (estado?: string) => {
    if (estado === 'conectado') return { icon: <Wifi className="w-5 h-5" />, label: 'Conectado', cls: 'text-green-600 bg-green-50 border-green-200' };
    if (estado === 'esperando_qr') return { icon: <QrCode className="w-5 h-5" />, label: 'Esperando QR', cls: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
    return { icon: <WifiOff className="w-5 h-5" />, label: 'Desconectado', cls: 'text-red-600 bg-red-50 border-red-200' };
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-4">
      {/* Toast */}
      {mensaje && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">{mensaje}</div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Vincula un número de WhatsApp dedicado por cada tienda.</p>
        <button onClick={fetchData} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-3 h-3" /> Actualizar
        </button>
      </div>

      {/* Aviso importante */}
      <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">Números dedicados únicamente al bot</p>
          <p className="text-xs leading-relaxed">Usa números que no se usen para conversaciones personales. El QR se genera en el bot-service — revisa los logs de Render para verlo, o usa el botón "Ver QR" si está disponible.</p>
        </div>
      </div>

      {!BOT_URL && (
        <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p><strong>BOT_SERVICE_URL</strong> no está configurada. Agrega <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_BOT_SERVICE_URL</code> en las variables de entorno del catálogo en Render.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiendas.map((t) => {
          const cfg = estadoConfig(t.session?.estado);
          const isEditando = editando === t.id;
          const tieneQR = qrs[t.id];
          return (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{t.nombre}</h3>
                  {t.session?.numero_telefono && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Phone className="w-3 h-3" />
                      {t.session.numero_telefono}
                    </div>
                  )}
                </div>
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.cls}`}>
                  {cfg.icon} {cfg.label}
                </span>
              </div>

              {t.session?.ultimo_ping && (
                <p className="text-xs text-gray-400 mb-3">
                  Último ping: {new Date(t.session.ultimo_ping).toLocaleString('es-CU')}
                </p>
              )}

              {/* QR inline si está disponible */}
              {tieneQR && (
                <div className="mb-3 p-2 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-2">Escanea con WhatsApp → Dispositivos vinculados</p>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tieneQR)}`}
                    alt="QR WhatsApp" className="mx-auto rounded" width={160} height={160} />
                  <button onClick={() => setQrs(prev => ({ ...prev, [t.id]: null }))}
                    className="mt-2 text-xs text-gray-400 hover:text-gray-600">Cerrar QR</button>
                </div>
              )}

              {/* Registro de número */}
              {isEditando ? (
                <div className="space-y-2">
                  <input type="tel" placeholder="+5355123456" value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <div className="flex gap-2">
                    <button onClick={() => guardarSesion(t.id)} disabled={guardando || !telefono.trim()}
                      className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {guardando ? 'Guardando...' : 'Guardar e iniciar'}
                    </button>
                    <button onClick={() => { setEditando(null); setTelefono(''); }}
                      className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <button onClick={() => { setEditando(t.id); setTelefono(t.session?.numero_telefono ?? ''); }}
                    className="w-full py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                    {t.session ? 'Editar número' : '+ Registrar número'}
                  </button>

                  {t.session && t.session.estado !== 'conectado' && (
                    <button onClick={() => iniciarSesion(t.id)} disabled={iniciando === t.id}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      {iniciando === t.id ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
                      {iniciando === t.id ? 'Iniciando...' : 'Generar QR'}
                    </button>
                  )}

                  {t.session?.estado === 'esperando_qr' && (
                    <button onClick={() => pedirQR(t.id)}
                      className="w-full py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors">
                      Ver QR
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
