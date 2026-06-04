'use client';

import { useEffect, useState } from 'react';
import { supabase, Tienda } from '@/lib/supabase';
import { CheckCircle, XCircle, Clock, TrendingUp, Send, Filter } from 'lucide-react';

type TabType = 'envios' | 'precios';

export default function HistorialPage() {
  const [tab, setTab] = useState<TabType>('envios');
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [filtroTienda, setFiltroTienda] = useState('');
  const [envios, setEnvios] = useState<any[]>([]);
  const [precios, setPrecios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(0);
  const POR_PAGINA = 20;

  useEffect(() => {
    supabase.from('tiendas').select('*').eq('activa', true).order('nombre').then(({ data }) => setTiendas(data || []));
  }, []);

  useEffect(() => {
    fetchData();
  }, [tab, filtroTienda, pagina]);

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
      } else {
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

  const estadoIcon = (estado: string) => {
    if (estado === 'enviado' || estado === 'aprobado') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (estado === 'fallido' || estado === 'rechazado') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  const formatFecha = (f: string) => new Date(f).toLocaleString('es-CU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-4">
      {/* Tabs envíos / precios */}
      <div className="flex gap-2">
        <button onClick={() => { setTab('envios'); setPagina(0); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'envios' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Send className="w-3.5 h-3.5" /> Envíos WA
        </button>
        <button onClick={() => { setTab('precios'); setPagina(0); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'precios' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <TrendingUp className="w-3.5 h-3.5" /> Cambios de precio
        </button>
      </div>

      {/* Filtros */}
      {tab === 'envios' && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={filtroTienda} onChange={(e) => { setFiltroTienda(e.target.value); setPagina(0); }}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="">Todas las tiendas</option>
            {tiendas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : tab === 'envios' ? (
          envios.length === 0 ? (
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
          )
        ) : (
          precios.length === 0 ? (
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
          )
        )}

        {/* Paginación */}
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
    </div>
  );
}
