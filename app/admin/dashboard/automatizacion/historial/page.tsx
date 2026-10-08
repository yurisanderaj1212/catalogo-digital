'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, Tienda } from '@/lib/supabase';
import { CheckCircle, XCircle, Clock, TrendingUp, Send, Filter, Trash2, Search, AlertTriangle, RefreshCw } from 'lucide-react';

type TabType = 'envios' | 'precios' | 'borrar' | 'republicar';

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

  // ── Estado de republicar ──
  const [republicables, setRepublicables] = useState<any[]>([]);
  const [loadingRepublicables, setLoadingRepublicables] = useState(false);
  const [busquedaRep, setBusquedaRep] = useState('');
  const [filtroTiendaRep, setFiltroTiendaRep] = useState('');
  const [seleccionadosRep, setSeleccionadosRep] = useState<Set<string>>(new Set());
  const [republicando, setRepublicando] = useState(false);

  useEffect(() => {
    supabase.from('tiendas').select('*').eq('activa', true).order('nombre').then(({ data }) => setTiendas(data || []));
  }, []);

  useEffect(() => {
    if (tab !== 'borrar' && tab !== 'republicar') fetchData();
  }, [tab, filtroTienda, pagina]);

  useEffect(() => {
    if (tab === 'borrar') fetchBorrables();
  }, [tab, filtroTiendaBorrar]);

  useEffect(() => {
    if (tab === 'republicar') fetchRepublicables();
  }, [tab, filtroTiendaRep]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'envios') {
        let query = supabase
          .from('mensajes_log')
          .select('id, tienda_id, grupo_jid, estado, error_msg, created_at, enviado_at, tiendas(nombre), productos(nombre)')
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
        .select('id, tienda_id, grupo_jid, estado, error_msg, wa_message_key, enviado_at, tiendas(nombre), productos(nombre)')
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

  const fetchRepublicables = useCallback(async () => {
    setLoadingRepublicables(true);
    setSeleccionadosRep(new Set());
    try {
      let query = supabase
        .from('productos_tiendas')
        .select('*, tiendas(id, nombre), productos(id, nombre, disponible)');
      if (filtroTiendaRep) query = query.eq('tienda_id', filtroTiendaRep);
      const { data } = await query;
      const lista = (data || [])
        .map((r: any) => ({
          id: `${r.producto_id}_${r.tienda_id}`,
          producto_id: r.producto_id,
          tienda_id: r.tienda_id,
          producto_nombre: r.productos?.nombre ?? '—',
          tienda_nombre: r.tiendas?.nombre ?? '—',
          disponible: r.productos?.disponible,
        }))
        .sort((a: any, b: any) => a.producto_nombre.localeCompare(b.producto_nombre));
      setRepublicables(lista);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingRepublicables(false);
    }
  }, [filtroTiendaRep]);

  const republicablesFiltrados = republicables.filter((r) =>
    busquedaRep === '' || r.producto_nombre.toLowerCase().includes(busquedaRep.toLowerCase())
  );

  const toggleSeleccionRep = (id: string) => {
    setSeleccionadosRep((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTodosRep = () => {
    if (seleccionadosRep.size === republicablesFiltrados.length) {
      setSeleccionadosRep(new Set());
    } else {
      setSeleccionadosRep(new Set(republicablesFiltrados.map((r) => r.id)));
    }
  };

  const ejecutarRepublicar = async () => {
    if (seleccionadosRep.size === 0) return;
    // Agrupar por tienda → { tiendaId: Set<productoId> }
    const porTienda = new Map<string, Set<string>>();
    for (const id of seleccionadosRep) {
      const item = republicables.find((r) => r.id === id);
      if (!item) continue;
      if (!porTienda.has(item.tienda_id)) porTienda.set(item.tienda_id, new Set());
      porTienda.get(item.tienda_id)!.add(item.producto_id);
    }
    setRepublicando(true);
    try {
      let totalProductos = 0;
      let totalGrupos = 0;
      for (const [tiendaId, productoIds] of porTienda) {
        const res = await fetch(`${BOT_URL}/api/republicar/${tiendaId}`, {
          method: 'POST',
          headers: { 'x-bot-secret': BOT_SECRET, 'Content-Type': 'application/json' },
          body: JSON.stringify({ productoIds: Array.from(productoIds) }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Error en el bot');
        totalProductos += data.productos ?? 0;
        totalGrupos = Math.max(totalGrupos, data.grupos ?? 0);
      }
      setMensajeOp(`✅ ${totalProductos} producto(s) encolados en ${totalGrupos} grupo(s)`);
      setSeleccionadosRep(new Set());
      setTimeout(() => setMensajeOp(''), 5000);
    } catch (err: any) {
      setMensajeOp(`Error: ${err.message}`);
      setTimeout(() => setMensajeOp(''), 4000);
    } finally {
      setRepublicando(false);
    }
  };

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
        <button onClick={() => setTab('republicar')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'republicar' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <RefreshCw className="w-3.5 h-3.5" /> Republicar
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

      {/* ── TAB: REPUBLICAR ── */}
      {tab === 'republicar' && (
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
            <RefreshCw className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Republicar productos en WhatsApp</p>
              <p className="text-xs leading-relaxed">
                Selecciona uno o varios productos y se encolarán para publicarse en todos los grupos activos de su tienda con los delays anti-ban habituales.
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre de producto"
                value={busquedaRep}
                onChange={(e) => setBusquedaRep(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={filtroTiendaRep}
                onChange={(e) => setFiltroTiendaRep(e.target.value)}
                className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Todas las tiendas</option>
                {tiendas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Barra de acción */}
          {seleccionadosRep.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
              <span className="text-sm font-medium text-green-800">
                {seleccionadosRep.size} producto{seleccionadosRep.size > 1 ? 's' : ''} seleccionado{seleccionadosRep.size > 1 ? 's' : ''}
              </span>
              <button
                onClick={ejecutarRepublicar}
                disabled={republicando}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${republicando ? 'animate-spin' : ''}`} />
                {republicando ? 'Encolando...' : 'Republicar seleccionados'}
              </button>
            </div>
          )}

          {/* Tabla */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loadingRepublicables ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
              </div>
            ) : republicablesFiltrados.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-400">
                <RefreshCw className="w-8 h-8 mb-2" />
                <p className="text-sm">
                  {busquedaRep ? `No hay productos que coincidan con "${busquedaRep}"` : 'No hay productos disponibles'}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 w-10">
                      <input
                        type="checkbox"
                        checked={seleccionadosRep.size === republicablesFiltrados.length && republicablesFiltrados.length > 0}
                        onChange={toggleTodosRep}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Producto</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden md:table-cell">Tienda</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden sm:table-cell">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {republicablesFiltrados.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => toggleSeleccionRep(r.id)}
                      className={`cursor-pointer transition-colors ${seleccionadosRep.has(r.id) ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={seleccionadosRep.has(r.id)}
                          onChange={() => toggleSeleccionRep(r.id)}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{r.producto_nombre}</td>
                      <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell">{r.tienda_nombre}</td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.disponible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {r.disponible ? 'Disponible' : 'Agotado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loadingRepublicables && republicablesFiltrados.length > 0 && (
            <p className="text-xs text-gray-400 text-right">
              {republicablesFiltrados.length} producto{republicablesFiltrados.length !== 1 ? 's' : ''} encontrados
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
