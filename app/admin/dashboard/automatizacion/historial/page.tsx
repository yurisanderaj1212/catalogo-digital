'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, Tienda } from '@/lib/supabase';
import { CheckCircle, XCircle, Clock, TrendingUp, Send, Filter, Trash2, Search, AlertTriangle } from 'lucide-react';

type TabType = 'envios' | 'precios' | 'borrar';

const BOT_URL = process.env.NEXT_PUBLIC_BOT_SERVICE_URL ?? '';
const BOT_SECRET = process.env.NEXT_PUBLIC_BOT_SERVICE_SECRET ?? '';

export default function HistorialPage() {
  const [tab, setTab] = useState<TabType>('envios');
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [filtroTienda, setFiltroTienda] = useState('');
  const [envios, setEnvios] = useState<any[]>([]);
  const [precios, setPrecios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(0);
  const POR_PAGINA = 20;

  // ── Estado de borrado selectivo ──
  const [borrables, setBorrables] = useState<any[]>([]);
  const [loadingBorrables, setLoadingBorrables] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTiendaBorrar, setFiltroTiendaBorrar] = useState('');
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [borrando, setBorrando] = useState(false);
  const [mensajeOp, setMensajeOp] = useState('');

  useEffect(() => {
    supabase.from('tiendas').select('*').eq('activa', true).order('nombre').then(({ data }) => setTiendas(data || []));
  }, []);

  useEffect(() => {
    if (tab !== 'borrar') fetchData();
  }, [tab, filtroTienda, pagina]);

  useEffect(() => {
    if (tab === 'borrar') fetchBorrables();
  }, [tab, filtroTiendaBorrar]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'envios') {
        let query = supabase
          .from('mensajes_log')
          .select('*, tiendas(nombre), productos(nombre)')
          .order('created_at', { ascending: false })
          .range(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA - 1);
        if (filtroTienda) query = query.eq('tienda_id', filtroTienda);
        const { data } = await query;
        setEnvios((data || []).map((r: any) => ({ ...r, tienda_nombre: r.tiendas?.nombre, producto_nombre: r.productos?.nombre })));
      } else if (tab === 'precios') {
        let query = supabase
          .from('price_change_log')
          .select('*, productos(nombre, tienda_id)')
          .order('created_at', { ascending: false })
          .range(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA - 1);
        const { data } = await query;
        setPrecios((data || []).map((r: any) => ({ ...r, producto_nombre: r.productos?.nombre })));
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBorrables = useCallback(async () => {
    setLoadingBorrables(true);
    setSeleccionados(new Set());
    try {
      const hace55h = new Date(Date.now() - 55 * 60 * 60 * 1000).toISOString();
      let query = supabase
        .from('mensajes_log')
        .select('*, tiendas(nombre), productos(nombre)')
        .eq('estado', 'enviado')
        .not('wa_message_key', 'is', null)
        .gte('enviado_at', hace55h)
        .order('enviado_at', { ascending: false });
      if (filtroTiendaBorrar) query = query.eq('tienda_id', filtroTiendaBorrar);
      const { data } = await query;
      setBorrables((data || []).map((r: any) => ({
        ...r,
        tienda_nombre: r.tiendas?.nombre ?? '—',
        producto_nombre: r.productos?.nombre ?? '(bienvenida)',
      })));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingBorrables(false);
    }
  }, [filtroTiendaBorrar]);

  const borrablesFiltrados = borrables.filter((b) =>
    busqueda === '' || b.producto_nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    if (seleccionados.size === borrablesFiltrados.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(borrablesFiltrados.map((b) => b.id)));
    }
  };

  const ejecutarBorradoSelectivo = async () => {
    if (seleccionados.size === 0) return;

    // Agrupar seleccionados por tienda
    const porTienda = new Map<string, string[]>();
    for (const id of seleccionados) {
      const msg = borrables.find((b) => b.id === id);
      if (!msg) continue;
      if (!porTienda.has(msg.tienda_id)) porTienda.set(msg.tienda_id, []);
      porTienda.get(msg.tienda_id)!.push(id);
    }

    setBorrando(true);
    try {
      for (const [tiendaId, logIds] of porTienda) {
        const res = await fetch(`${BOT_URL}/api/borrar-seleccionados/${tiendaId}`, {
          method: 'POST',
          headers: { 'x-bot-secret': BOT_SECRET, 'Content-Type': 'application/json' },
          body: JSON.stringify({ logIds }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Error en el bot');
      }
      setMensajeOp(`Borrando ${seleccionados.size} mensaje(s) en background...`);
      setTimeout(() => { setMensajeOp(''); fetchBorrables(); }, 4000);
    } catch (err: any) {
      setMensajeOp(`Error: ${err.message}`);
      setTimeout(() => setMensajeOp(''), 4000);
    } finally {
      setBorrando(false);
    }
  };

  const estadoIcon = (estado: string) => {
    if (estado === 'enviado' || estado === 'aprobado') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (estado === 'fallido' || estado === 'rechazado') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  const formatFecha = (f: string) => new Date(f).toLocaleString('es-CU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-4">
      {/* Toast */}
      {mensajeOp && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">{mensajeOp}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => { setTab('envios'); setPagina(0); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'envios' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Send className="w-3.5 h-3.5" /> Envíos WA
        </button>
        <button onClick={() => { setTab('precios'); setPagina(0); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'precios' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <TrendingUp className="w-3.5 h-3.5" /> Cambios de precio
        </button>
        <button onClick={() => setTab('borrar')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'borrar' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Trash2 className="w-3.5 h-3.5" /> Borrado selectivo
        </button>
      </div>

      {/* ── TAB: BORRADO SELECTIVO ── */}
      {tab === 'borrar' && (
        <div className="space-y-4">
          {/* Aviso */}
          <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Borrado selectivo de mensajes</p>
              <p className="text-xs leading-relaxed">
                Solo se muestran mensajes enviados en las últimas 55 horas que aún pueden borrarse de WhatsApp.
                Busca por nombre de producto, selecciona los que quieres eliminar y pulsa "Borrar seleccionados".
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por producto (ej: pañal)"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={filtroTiendaBorrar}
                onChange={(e) => setFiltroTiendaBorrar(e.target.value)}
                className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">Todas las tiendas</option>
                {tiendas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Barra de acción */}
          {seleccionados.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-xl">
              <span className="text-sm font-medium text-red-800">
                {seleccionados.size} mensaje{seleccionados.size > 1 ? 's' : ''} seleccionado{seleccionados.size > 1 ? 's' : ''}
              </span>
              <button
                onClick={ejecutarBorradoSelectivo}
                disabled={borrando}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {borrando ? 'Enviando al bot...' : 'Borrar seleccionados'}
              </button>
            </div>
          )}

          {/* Tabla de borrables */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loadingBorrables ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
              </div>
            ) : borrablesFiltrados.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-400">
                <Trash2 className="w-8 h-8 mb-2" />
                <p className="text-sm">
                  {busqueda ? `No hay mensajes que coincidan con "${busqueda}"` : 'No hay mensajes borrables en las últimas 55h'}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 w-10">
                      <input
                        type="checkbox"
                        checked={seleccionados.size === borrablesFiltrados.length && borrablesFiltrados.length > 0}
                        onChange={toggleTodos}
                        className="w-4 h-4 text-red-600 rounded"
                      />
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Producto</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden md:table-cell">Tienda</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden lg:table-cell">Grupo</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden sm:table-cell">Enviado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {borrablesFiltrados.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => toggleSeleccion(b.id)}
                      className={`cursor-pointer transition-colors ${seleccionados.has(b.id) ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={seleccionados.has(b.id)}
                          onChange={() => toggleSeleccion(b.id)}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{b.producto_nombre}</td>
                      <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell">{b.tienda_nombre}</td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs hidden lg:table-cell truncate max-w-[140px]">{b.grupo_jid}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-400 hidden sm:table-cell">
                        {b.enviado_at ? formatFecha(b.enviado_at) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loadingBorrables && borrablesFiltrados.length > 0 && (
            <p className="text-xs text-gray-400 text-right">
              {borrablesFiltrados.length} mensaje{borrablesFiltrados.length !== 1 ? 's' : ''} borrables encontrados
            </p>
          )}
        </div>
      )}

      {/* ── TAB: ENVÍOS ── */}
      {tab === 'envios' && (
        <>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={filtroTienda} onChange={(e) => { setFiltroTienda(e.target.value); setPagina(0); }}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Todas las tiendas</option>
              {tiendas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : envios.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-400">
                <Send className="w-8 h-8 mb-2" />
                <p className="text-sm">No hay envíos registrados</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Producto</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden md:table-cell">Tienda</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden lg:table-cell">Grupo</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Estado</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden sm:table-cell">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {envios.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-900 truncate max-w-[140px]">{e.producto_nombre ?? '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell">{e.tienda_nombre ?? '—'}</td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs hidden lg:table-cell truncate max-w-[140px]">{e.grupo_jid}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          {estadoIcon(e.estado)}
                          <span className="text-xs capitalize">{e.estado}</span>
                        </div>
                        {e.error_msg && <p className="text-xs text-red-500 mt-0.5 truncate max-w-[160px]">{e.error_msg}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-400 hidden sm:table-cell">{formatFecha(e.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0}
                  className="text-xs text-gray-600 hover:text-gray-900 disabled:opacity-40 px-2 py-1 rounded hover:bg-gray-100">
                  ← Anterior
                </button>
                <span className="text-xs text-gray-400">Página {pagina + 1}</span>
                <button onClick={() => setPagina(p => p + 1)}
                  className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100">
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB: PRECIOS ── */}
      {tab === 'precios' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : precios.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <TrendingUp className="w-8 h-8 mb-2" />
              <p className="text-sm">No hay cambios de precio registrados</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Producto</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Anterior</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Nuevo</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Estado</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden sm:table-cell">Publicado WA</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden sm:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {precios.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900 truncate max-w-[140px]">{p.producto_nombre ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-400 line-through">{p.valor_anterior}</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-900">{p.valor_nuevo}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        {estadoIcon(p.estado)}
                        <span className="text-xs capitalize">{p.estado}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.publicado_wa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.publicado_wa ? 'Sí' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400 hidden sm:table-cell">{formatFecha(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0}
                className="text-xs text-gray-600 hover:text-gray-900 disabled:opacity-40 px-2 py-1 rounded hover:bg-gray-100">
                ← Anterior
              </button>
              <span className="text-xs text-gray-400">Página {pagina + 1}</span>
              <button onClick={() => setPagina(p => p + 1)}
                className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100">
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
