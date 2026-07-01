'use client';

import { useEffect, useState } from 'react';
import { supabase, Tienda, SchedulerConfig, WaGrupo } from '@/lib/supabase';
import { Save, AlertTriangle, ToggleLeft, ToggleRight, RefreshCw, Loader, Trash2, X } from 'lucide-react';

interface TiendaConConfig extends Tienda {
  config: SchedulerConfig | null;
  grupos: WaGrupo[];
}

const BOT_URL = process.env.NEXT_PUBLIC_BOT_SERVICE_URL ?? '';
const BOT_SECRET = process.env.NEXT_PUBLIC_BOT_SERVICE_SECRET ?? '';

// Cuba = UTC-4 (horario de verano, CDT). En invierno es UTC-5 (CST).
// Ajustar manualmente cuando Cuba cambie de horario.
const OFFSET_HORAS = -4;

/** Convierte hora local Cuba "HH:MM" a UTC "HH:MM" para guardar en DB */
function localAUtc(horaLocal: string): string {
  const [h, m] = horaLocal.split(':').map(Number);
  let hUtc = (h - OFFSET_HORAS + 24) % 24;
  return `${String(hUtc).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Convierte hora UTC "HH:MM" de DB a hora local Cuba "HH:MM" para mostrar */
function utcALocal(horaUtc: string): string {
  const [h, m] = horaUtc.split(':').map(Number);
  let hLocal = (h + OFFSET_HORAS + 24) % 24;
  return `${String(hLocal).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const defaultConfig = {
  activo: false,
  intervalo_horas: 4,
  hora_inicio: '08:00',
  hora_fin: '20:00',
  productos_por_ciclo: 5,
  modo_seleccion: 'rotacion' as 'rotacion' | 'aleatorio' | 'manual',
};

export default function ConfiguracionPage() {
  const [tiendas, setTiendas] = useState<TiendaConConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [formStates, setFormStates] = useState<Record<string, typeof defaultConfig>>({});
  const [pausaGlobal, setPausaGlobal] = useState(false);
  const [aplicandoPausa, setAplicandoPausa] = useState(false);
  const [sincronizando, setSincronizando] = useState<string | null>(null);
  const [limpiando, setLimpiando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [modalLimpiar, setModalLimpiar] = useState<{ id: string; nombre: string } | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tiendasRes, configsRes, gruposRes] = await Promise.all([
        supabase.from('tiendas').select('*').eq('activa', true).order('nombre'),
        supabase.from('scheduler_config').select('*'),
        supabase.from('wa_grupos').select('*').order('orden'),
      ]);
      const tiendasData = tiendasRes.data || [];
      const configs = configsRes.data || [];
      const grupos = gruposRes.data || [];

      const tiendasConConfig: TiendaConConfig[] = tiendasData.map((t) => ({
        ...t,
        config: configs.find((c) => c.tienda_id === t.id) ?? null,
        grupos: grupos.filter((g) => g.tienda_id === t.id),
      }));
      setTiendas(tiendasConConfig);

      // Inicializar form states
      const initial: Record<string, typeof defaultConfig> = {};
      tiendasConConfig.forEach((t) => {
        initial[t.id] = t.config ? {
          activo: t.config.activo,
          intervalo_horas: Number(t.config.intervalo_horas) || 4,
          // Convertir UTC de DB a hora local Cuba para mostrar en el panel
          hora_inicio: utcALocal(t.config.hora_inicio?.slice(0, 5) ?? '13:00'),
          hora_fin: utcALocal(t.config.hora_fin?.slice(0, 5) ?? '01:00'),
          productos_por_ciclo: Number(t.config.productos_por_ciclo) || 5,
          modo_seleccion: t.config.modo_seleccion as 'rotacion' | 'aleatorio' | 'manual',
        } : { ...defaultConfig };
      });
      setFormStates(initial);

      // Verificar si todos están pausados
      setPausaGlobal(configs.length > 0 && configs.every((c) => !c.activo));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const guardarConfig = async (tiendaId: string) => {
    setGuardando(tiendaId);
    const form = formStates[tiendaId];
    const tienda = tiendas.find((t) => t.id === tiendaId);
    try {
      // Convertir horas locales Cuba a UTC antes de guardar en DB
      const dataToSave = {
        ...form,
        hora_inicio: localAUtc(form.hora_inicio),
        hora_fin: localAUtc(form.hora_fin),
        updated_at: new Date().toISOString(),
      };
      if (tienda?.config) {
        await supabase.from('scheduler_config').update(dataToSave).eq('tienda_id', tiendaId);
      } else {
        await supabase.from('scheduler_config').insert({ tienda_id: tiendaId, ...dataToSave });
      }
      setMensaje('Configuración guardada');
      await fetchData();
    } catch (err) {
      setMensaje('Error al guardar');
    } finally {
      setGuardando(null);
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  const toggleGrupo = async (grupo: WaGrupo) => {
    await supabase.from('wa_grupos').update({ activo: !grupo.activo }).eq('id', grupo.id);
    fetchData();
  };

  const aplicarPausaGlobal = async () => {
    setAplicandoPausa(true);
    try {
      await supabase.from('scheduler_config').update({ activo: false, updated_at: new Date().toISOString() }).neq('id', '');
      setPausaGlobal(true);
      setMensaje('⚠️ Todos los schedulers pausados');
      await fetchData();
    } catch (err) {
      setMensaje('Error al pausar');
    } finally {
      setAplicandoPausa(false);
      setTimeout(() => setMensaje(''), 4000);
    }
  };

  const sincronizarGrupos = async (tiendaId: string) => {
    if (!BOT_URL) { setMensaje('BOT_SERVICE_URL no configurada'); return; }
    setSincronizando(tiendaId);
    try {
      const res = await fetch(`${BOT_URL}/api/grupos/${tiendaId}`, {
        headers: { 'x-bot-secret': BOT_SECRET },
      });
      const data = await res.json();
      if (data.ok) {
        setMensaje(`${data.grupos.length} grupos sincronizados`);
        await fetchData();
      } else {
        setMensaje(data.error ?? 'Error al sincronizar');
      }
    } catch {
      setMensaje('No se pudo contactar el bot-service');
    } finally {
      setSincronizando(null);
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  const confirmarLimpiar = async () => {
    if (!modalLimpiar) return;
    const { id: tiendaId } = modalLimpiar;
    setModalLimpiar(null);
    if (!BOT_URL) { setMensaje('BOT_SERVICE_URL no configurada'); return; }
    setLimpiando(tiendaId);
    try {
      // 1. Borrar todos los grupos via bot-service (service_role bypasea RLS)
      const delRes = await fetch(`${BOT_URL}/api/grupos/${tiendaId}`, {
        method: 'DELETE',
        headers: { 'x-bot-secret': BOT_SECRET },
      });
      if (!delRes.ok) throw new Error('Error al borrar grupos en el bot');

      // 2. Re-sincronizar desde el número actual
      const syncRes = await fetch(`${BOT_URL}/api/grupos/${tiendaId}`, {
        headers: { 'x-bot-secret': BOT_SECRET },
      });
      const data = await syncRes.json();
      if (data.ok) {
        setMensaje(`Limpieza completa — ${data.grupos.length} grupos del número actual`);
      } else {
        setMensaje(data.error ?? 'Limpiado pero error al re-sincronizar');
      }
      await fetchData();
    } catch (err: any) {
      setMensaje(`Error: ${err.message}`);
    } finally {
      setLimpiando(null);
      setTimeout(() => setMensaje(''), 4000);
    }
  };

  const limpiarYSincronizarGrupos = (tiendaId: string, nombreTienda: string) => {
    setModalLimpiar({ id: tiendaId, nombre: nombreTienda });
  };

  const update = (tiendaId: string, field: string, value: unknown) => {
    setFormStates((prev) => ({ ...prev, [tiendaId]: { ...prev[tiendaId], [field]: value } }));
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {mensaje && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {mensaje}
        </div>
      )}

      {/* Modal confirmar limpieza */}
      {modalLimpiar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-red-700">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-semibold">Limpiar grupos</h3>
              </div>
              <button onClick={() => setModalLimpiar(null)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              Se eliminarán <strong>todos los grupos</strong> de <strong>{modalLimpiar.nombre}</strong> y se re-sincronizarán desde el número actual.
            </p>
            <p className="text-xs text-gray-500 mb-5">
              Los grupos que tengas activos quedarán desactivados. Tendrás que volver a activarlos después.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalLimpiar(null)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={confirmarLimpiar}
                className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">
                Sí, limpiar y re-sincronizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pausa de emergencia global */}
      <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-800">Pausa de emergencia</p>
            <p className="text-xs text-red-600">Detiene todos los schedulers inmediatamente</p>
          </div>
        </div>
        <button
          onClick={aplicarPausaGlobal}
          disabled={aplicandoPausa || pausaGlobal}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {aplicandoPausa ? 'Pausando...' : pausaGlobal ? 'Pausado' : 'Pausar todo'}
        </button>
      </div>

      {/* Config por tienda */}
      {tiendas.map((t) => {
        const form = formStates[t.id] ?? defaultConfig;
        return (
          <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header tienda */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900">{t.nombre}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => limpiarYSincronizarGrupos(t.id, t.nombre)}
                  disabled={limpiando === t.id || sincronizando === t.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 disabled:opacity-50 transition-colors"
                >
                  {limpiando === t.id ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Limpiar grupos
                </button>
                <button
                  onClick={() => sincronizarGrupos(t.id)}
                  disabled={sincronizando === t.id || limpiando === t.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  {sincronizando === t.id ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Sincronizar grupos
                </button>
                <button
                  onClick={() => update(t.id, 'activo', !form.activo)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  {form.activo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  {form.activo ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Intervalo */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Intervalo (horas)</label>
                  <input type="number" min={1} max={24} value={form.intervalo_horas || ''}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v) && v >= 1) update(t.id, 'intervalo_horas', v);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                {/* Hora inicio */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora inicio (Cuba)</label>
                  <input type="time" value={form.hora_inicio}
                    onChange={(e) => update(t.id, 'hora_inicio', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                {/* Hora fin */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora fin (Cuba)</label>
                  <input type="time" value={form.hora_fin}
                    onChange={(e) => update(t.id, 'hora_fin', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                {/* Productos por ciclo */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Productos/ciclo</label>
                  <input type="number" min={1} max={20} value={form.productos_por_ciclo || ''}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v) && v >= 1) update(t.id, 'productos_por_ciclo', v);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Modo selección */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Modo de selección de productos</label>
                <div className="flex gap-2">
                  {(['rotacion', 'aleatorio', 'manual'] as const).map((modo) => (
                    <button key={modo} onClick={() => update(t.id, 'modo_seleccion', modo)}
                      className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors capitalize ${form.modo_seleccion === modo ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                      {modo === 'rotacion' ? 'Rotación' : modo === 'aleatorio' ? 'Aleatorio' : 'Manual'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {form.modo_seleccion === 'rotacion' && 'Publica en orden, vuelve al inicio al terminar'}
                  {form.modo_seleccion === 'aleatorio' && 'Selecciona productos al azar cada ciclo'}
                  {form.modo_seleccion === 'manual' && 'Solo publica cuando se activa manualmente desde el panel'}
                </p>
              </div>

              {/* Grupos de esta tienda */}
              {t.grupos.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-600">
                      Grupos ({t.grupos.filter(g => g.activo).length} activos / {t.grupos.length} total)
                    </label>
                    <input
                      type="text"
                      placeholder="Buscar grupo..."
                      className="text-xs px-2 py-1 border border-gray-300 rounded-lg w-40 focus:ring-1 focus:ring-blue-500"
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase();
                        const filtered = document.querySelectorAll(`[data-tienda="${t.id}"] .grupo-item`);
                        filtered.forEach((el) => {
                          const nombre = el.getAttribute('data-nombre') ?? '';
                          (el as HTMLElement).style.display = nombre.includes(val) ? '' : 'none';
                        });
                      }}
                    />
                  </div>
                  <div data-tienda={t.id} className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {t.grupos.map((g) => (
                      <button
                        key={g.id}
                        data-nombre={(g.nombre || g.grupo_jid).toLowerCase()}
                        className={`grupo-item flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors ${g.activo ? 'border-green-200 bg-green-50 text-green-800' : 'border-gray-200 bg-gray-50 text-gray-500'}`}
                        onClick={() => toggleGrupo(g)}
                      >
                        <span className="truncate text-left text-xs">{g.nombre || g.grupo_jid}</span>
                        <span className={`ml-2 text-xs shrink-0 font-medium ${g.activo ? 'text-green-600' : 'text-gray-400'}`}>
                          {g.activo ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {t.grupos.length === 0 && (
                <p className="text-xs text-gray-400 italic">Los grupos se sincronizarán automáticamente cuando el bot-service esté conectado</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={async () => {
                    if (!BOT_URL) { setMensaje('BOT_SERVICE_URL no configurada'); return; }
                    try {
                      const res = await fetch(`${BOT_URL}/api/trigger/${t.id}/forzar`, {
                        method: 'POST', headers: { 'x-bot-secret': BOT_SECRET },
                      });
                      const data = await res.json();
                      setMensaje(data.ok ? '▶ Ciclo disparado — revisa el grupo en ~30s' : data.error);
                    } catch { setMensaje('No se pudo contactar el bot-service'); }
                    setTimeout(() => setMensaje(''), 4000);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  ▶ Probar ahora
                </button>
                <button onClick={() => guardarConfig(t.id)} disabled={guardando === t.id}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  <Save className="w-4 h-4" />
                  {guardando === t.id ? 'Guardando...' : 'Guardar configuración'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
