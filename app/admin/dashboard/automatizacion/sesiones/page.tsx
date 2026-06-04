'use client';

import { useEffect, useState } from 'react';
import { supabase, Tienda, WaSession } from '@/lib/supabase';
import { Wifi, WifiOff, QrCode, AlertCircle, RefreshCw, Phone } from 'lucide-react';

interface TiendaConSesion extends Tienda {
  session: WaSession | null;
}

export default function SesionesPage() {
  const [tiendas, setTiendas] = useState<TiendaConSesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<string | null>(null);
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setGuardando(false);
    }
  };

  const estadoConfig = (estado?: string) => {
    if (estado === 'conectado') return { icon: <Wifi className="w-5 h-5" />, label: 'Conectado', cls: 'text-green-600 bg-green-50 border-green-200' };
    if (estado === 'esperando_qr') return { icon: <QrCode className="w-5 h-5" />, label: 'Esperando QR', cls: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
    return { icon: <WifiOff className="w-5 h-5" />, label: 'Desconectado', cls: 'text-red-600 bg-red-50 border-red-200' };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Vincula un número de WhatsApp por cada tienda. El bot-service usará estos números para enviar mensajes.</p>
        <button onClick={fetchData} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-3 h-3" /> Actualizar
        </button>
      </div>

      {/* Aviso importante */}
      <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">Números dedicados únicamente al bot</p>
          <p className="text-xs leading-relaxed">Usa números que no se usen para conversaciones personales. El primer escaneo de QR lo realiza el bot-service — aquí solo registras el número y monitoreas el estado.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiendas.map((t) => {
          const cfg = estadoConfig(t.session?.estado);
          const isEditando = editando === t.id;
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
                  {cfg.icon}
                  {cfg.label}
                </span>
              </div>

              {t.session?.ultimo_ping && (
                <p className="text-xs text-gray-400 mb-3">
                  Último ping: {new Date(t.session.ultimo_ping).toLocaleString('es-CU')}
                </p>
              )}

              {/* Formulario de registro */}
              {isEditando ? (
                <div className="space-y-2">
                  <input
                    type="tel"
                    placeholder="+5355123456"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => guardarSesion(t.id)}
                      disabled={guardando || !telefono.trim()}
                      className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {guardando ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => { setEditando(null); setTelefono(''); }}
                      className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setEditando(t.id); setTelefono(t.session?.numero_telefono ?? ''); }}
                  className="w-full py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t.session ? 'Editar número' : '+ Registrar número'}
                </button>
              )}

              {/* Info QR */}
              {t.session?.estado === 'esperando_qr' && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-700 text-center">
                  El bot-service está generando el QR. Revisa los logs de Render.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
