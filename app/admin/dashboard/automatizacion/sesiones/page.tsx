'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, Tienda, WaSession } from '@/lib/supabase';
import { Wifi, WifiOff, QrCode, AlertCircle, RefreshCw, Phone, Loader, Link2 } from 'lucide-react';

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
  const [delegando, setDelegando] = useState<string | null>(null);
  const [maestraSeleccionada, setMaestraSeleccionada] = useState('');
  const [guardandoDelegacion, setGuardandoDelegacion] = useState(false);


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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const mostrarMensaje = (msg: string) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(''), 4000);
  };

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
          sesion_maestra_id: null,
        }).eq('id', existing.id);
      } else {
        await supabase.from('wa_sessions').insert({
          tienda_id: tiendaId,
          numero_telefono: telefono.trim(),
          estado: 'desconectado',
          sesion_maestra_id: null,
        });
      }
      setEditando(null);
      setTelefono('');
      await fetchData();
      await iniciarSesion(tiendaId);
    } catch (err) {
      console.error('Error:', err);
      mostrarMensaje('Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const guardarDelegacion = async (tiendaId: string) => {
    if (!maestraSeleccionada) return;
    setGuardandoDelegacion(true);
    try {
      const sesionMaestra = tiendas.find(t => t.id === maestraSeleccionada)?.session;
      if (!sesionMaestra) {
        mostrarMensaje('La tienda maestra no tiene sesión registrada');
        return;
      }
      const existing = tiendas.find((t) => t.id === tiendaId)?.session;
      if (existing) {
        await supabase.from('wa_sessions').update({
          sesion_maestra_id: sesionMaestra.id,
          estado: 'desconectado',
          auth_data: null,      // limpiar credenciales propias
          qr_actual: null,      // limpiar QR pendiente
          numero_telefono: '',  // sin número propio
        }).eq('id', existing.id);
      } else {
        await supabase.from('wa_sessions').insert({
          tienda_id: tiendaId,
          numero_telefono: '',
          estado: 'desconectado',
          sesion_maestra_id: sesionMaestra.id,
        });
      }
      setDelegando(null);
      setMaestraSeleccionada('');
      await fetchData();
      mostrarMensaje('Delegación configurada correctamente');
    } catch (err) {
      console.error('Error:', err);
      mostrarMensaje('Error al guardar delegación');
    } finally {
      setGuardandoDelegacion(false);
    }
  };

  const quitarDelegacion = async (tiendaId: string) => {
    const session = tiendas.find(t => t.id === tiendaId)?.session;
    if (!session) return;
    await supabase.from('wa_sessions').update({ sesion_maestra_id: null }).eq('id', session.id);
    await fetchData();
    mostrarMensaje('Delegación eliminada');
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

  // Solo pueden ser maestras las tiendas con sesión propia (sin delegación)
  const tiendasMaestras = tiendas.filter(t => t.session && !t.session.sesion_maestra_id);

  const estadoBadge = (t: TiendaConSesion) => {
    if (t.session?.sesion_maestra_id) {
      const maestra = tiendas.find(m => m.session?.id === t.session?.sesion_maestra_id);
      return { icon: <Link2 className="w-3.5 h-3.5" />, label: `→ ${maestra?.nombre ?? '...'}`, cls: 'text-blue-600 bg-blue-50 border-blue-200' };
    }
    const e = t.session?.estado;
    if (e === 'conectado') return { icon: <Wifi className="w-3.5 h-3.5" />, label: 'Conectado', cls: 'text-green-600 bg-green-50 border-green-200' };
    if (e === 'esperando_qr') return { icon: <QrCode className="w-3.5 h-3.5" />, label: 'Esperando QR', cls: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
    return { icon: <WifiOff className="w-3.5 h-3.5" />, label: 'Desconectado', cls: 'text-red-600 bg-red-50 border-red-200' };
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;


  return (
    <div className="space-y-4">
      {mensaje && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">{mensaje}</div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Vincula un número por tienda, o delega a la sesión de otra.</p>
        <button onClick={fetchData} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-3 h-3" /> Actualizar
        </button>
      </div>

      <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">Sesión propia o delegada</p>
          <p className="text-xs leading-relaxed">
            Una tienda puede tener su propio número o compartir el de otra (sesión delegada).
            Las delegadas usan el socket de la maestra — los schedulers siguen siendo independientes.
          </p>
        </div>
      </div>

      {!BOT_URL && (
        <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p><strong>BOT_SERVICE_URL</strong> no configurada. Agrega <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_BOT_SERVICE_URL</code> en Render.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiendas.map((t) => {
          const badge = estadoBadge(t);
          const isEditando = editando === t.id;
          const isDelegando = delegando === t.id;
          const tieneQR = qrs[t.id];
          const esDelegada = !!t.session?.sesion_maestra_id;
          const maestra = esDelegada ? tiendas.find(m => m.session?.id === t.session?.sesion_maestra_id) : null;

          return (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              {/* Cabecera */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{t.nombre}</h3>
                  {t.session?.numero_telefono && !esDelegada && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Phone className="w-3 h-3" />{t.session.numero_telefono}
                    </div>
                  )}
                </div>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.cls}`}>
                  {badge.icon} {badge.label}
                </span>
              </div>

              {/* Info delegación activa */}
              {esDelegada && maestra && (
                <div className="mb-3 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                  <p>Usando el número de <strong>{maestra.nombre}</strong></p>
                  <p className="text-blue-500 mt-0.5">{maestra.session?.numero_telefono}</p>
                </div>
              )}

              {/* Último ping */}
              {t.session?.ultimo_ping && !esDelegada && (
                <p className="text-xs text-gray-400 mb-3">
                  Último ping: {new Date(t.session.ultimo_ping).toLocaleString('es-CU')}
                </p>
              )}

              {/* QR inline */}
              {tieneQR && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg text-center border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 font-medium">
                    Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo
                  </p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tieneQR)}&bgcolor=ffffff&color=000000&margin=10`}
                    alt="QR WhatsApp" className="mx-auto rounded border" width={180} height={180}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <p className="text-xs text-gray-400 mt-2">Expira en ~60s</p>
                  <button onClick={() => setQrs(prev => ({ ...prev, [t.id]: null }))}
                    className="mt-1 text-xs text-gray-400 hover:text-gray-600 underline">Cerrar</button>
                </div>
              )}

              {/* Formulario de delegación */}
              {isDelegando && (
                <div className="space-y-2 mb-2">
                  <p className="text-xs text-gray-600">Selecciona la tienda cuyo número se usará:</p>
                  <select value={maestraSeleccionada} onChange={(e) => setMaestraSeleccionada(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">— Seleccionar tienda —</option>
                    {tiendasMaestras.filter(m => m.id !== t.id).map(m => (
                      <option key={m.id} value={m.id}>{m.nombre} ({m.session?.numero_telefono})</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => guardarDelegacion(t.id)} disabled={guardandoDelegacion || !maestraSeleccionada}
                      className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {guardandoDelegacion ? 'Guardando...' : 'Confirmar'}
                    </button>
                    <button onClick={() => { setDelegando(null); setMaestraSeleccionada(''); }}
                      className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Formulario número propio */}
              {isEditando && (
                <div className="space-y-2">
                  <input type="tel" placeholder="+5355123456" value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
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
              )}

              {/* Botones de acción principales */}
              {!isEditando && !isDelegando && (
                <div className="space-y-2">
                  {esDelegada ? (
                    <button onClick={() => quitarDelegacion(t.id)}
                      className="w-full py-2 bg-gray-50 text-gray-700 text-sm rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors">
                      Quitar delegación y usar número propio
                    </button>
                  ) : (
                    <>
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

                      {t.session?.estado === 'conectado' && (
                        <button onClick={async () => {
                          if (!confirm('¿Desconectar y limpiar esta sesión?')) return;
                          await llamarBot(`/api/sesiones/${t.id}/desconectar`, 'POST');
                          await fetchData();
                        }} className="w-full py-2 bg-red-50 text-red-700 text-sm rounded-lg hover:bg-red-100 border border-red-200 transition-colors">
                          Desconectar sesión
                        </button>
                      )}

                      {t.session?.estado === 'esperando_qr' && (
                        <button onClick={() => pedirQR(t.id)}
                          className="w-full py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors">
                          Ver QR
                        </button>
                      )}
                    </>
                  )}

                  <button onClick={() => { setDelegando(t.id); setMaestraSeleccionada(''); }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors">
                    <Link2 className="w-3.5 h-3.5" />
                    {esDelegada ? 'Cambiar sesión delegada' : 'Usar sesión de otra tienda'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
