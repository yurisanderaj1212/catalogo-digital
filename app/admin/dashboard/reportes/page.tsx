'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, TrendingUp, Package, CheckCircle, XCircle, Search, Filter, ChevronLeft, ChevronRight, FileText, Printer } from 'lucide-react';

interface ProductoPDF {
  nombre: string;
  precio: number;
  moneda: string;
  disponible: boolean;
  tipo_venta: string;
  categoria: string | null;
}

interface TiendaPDF {
  id: string;
  nombre: string;
  productos: ProductoPDF[];
}

interface ResumenTienda {
  id: string;
  nombre: string;
  totalProductos: number;
  productosDisponibles: number;
  productosAgotados: number;
}

interface ResumenGeneral {
  mensajesEsteMes: number;
  mensajesMesAnterior: number;
  tasaExito: number;
  cambiosPrecioEsteMes: number;
  tiendas: ResumenTienda[];
}

export default function ReportesPage() {
  const [resumen, setResumen] = useState<ResumenGeneral | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Historial de precios ──
  const [precios, setPrecios] = useState<any[]>([]);
  const [loadingPrecios, setLoadingPrecios] = useState(false);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [paginaPrecios, setPaginaPrecios] = useState(0);
  const POR_PAGINA = 20;

  // ── PDF de inventario ──
  const [generandoPDF, setGenerandoPDF] = useState<string | null>(null);

  // ── Limpieza de historial ──
  const [periodoLimpiar, setPeriodoLimpiar] = useState<'1mes' | '3meses' | '6meses' | 'personalizado'>('3meses');
  const [fechaLimpiarHasta, setFechaLimpiarHasta] = useState('');
  const [limpiando, setLimpiando] = useState(false);
  const [modalLimpiar, setModalLimpiar] = useState(false);
  const [conteoLimpiar, setConteoLimpiar] = useState<{ mensajes: number; precios: number } | null>(null);

  useEffect(() => {
    fetchResumen();
  }, []);

  const fetchPrecios = useCallback(async () => {
    setLoadingPrecios(true);
    try {
      let query = supabase
        .from('price_change_log')
        .select('*, productos(nombre)')
        .order('created_at', { ascending: false })
        .range(paginaPrecios * POR_PAGINA, (paginaPrecios + 1) * POR_PAGINA - 1);

      if (fechaDesde) query = query.gte('created_at', fechaDesde);
      if (fechaHasta) query = query.lte('created_at', fechaHasta + 'T23:59:59');

      const { data } = await query;
      const logs = data || [];

      // Obtener tiendas de los productos via productos_tiendas
      const productoIds = [...new Set(logs.map((r: any) => r.producto_id).filter(Boolean))];
      let tiendasPorProducto: Record<string, string> = {};

      if (productoIds.length > 0) {
        const { data: rels } = await supabase
          .from('productos_tiendas')
          .select('producto_id, tiendas(nombre)')
          .in('producto_id', productoIds);

        for (const rel of rels || []) {
          const tid = (rel as any).producto_id;
          const nombre = (rel as any).tiendas?.nombre;
          if (tid && nombre && !tiendasPorProducto[tid]) {
            tiendasPorProducto[tid] = nombre;
          }
        }
      }

      let resultado = logs.map((r: any) => ({
        ...r,
        producto_nombre: r.productos?.nombre ?? '—',
        tienda_nombre: tiendasPorProducto[r.producto_id] ?? '—',
      }));

      if (busquedaProducto.trim()) {
        resultado = resultado.filter((r: any) =>
          r.producto_nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
        );
      }

      setPrecios(resultado);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingPrecios(false);
    }
  }, [paginaPrecios, fechaDesde, fechaHasta, busquedaProducto]);

  useEffect(() => {
    fetchPrecios();
  }, [fetchPrecios]);

  const generarPDF = async (tiendaId: string, tiendaNombre: string) => {
    setGenerandoPDF(tiendaId);
    try {
      const { data: relaciones } = await supabase
        .from('productos_tiendas')
        .select('producto_id')
        .eq('tienda_id', tiendaId);

      if (!relaciones || relaciones.length === 0) {
        alert('Esta tienda no tiene productos asignados');
        return;
      }

      const ids = relaciones.map((r: any) => r.producto_id);

      const { data: productos } = await supabase
        .from('productos')
        .select('nombre, precio, moneda, disponible, tipo_venta, categorias:categoria_id(nombre)')
        .in('id', ids)
        .eq('activo', true)
        .order('nombre');

      if (!productos || productos.length === 0) {
        alert('No hay productos activos en esta tienda');
        return;
      }

      const fecha = new Date().toLocaleDateString('es-CU', { day: '2-digit', month: 'long', year: 'numeric' });
      const fmt = (n: number) => new Intl.NumberFormat('es-CU').format(Math.round(n));

      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Inventario ${tiendaNombre}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 20px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .meta { font-size: 11px; color: #666; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #1e40af; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
    td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #f9fafb; }
    .disponible { color: #16a34a; font-weight: bold; }
    .agotado { color: #dc2626; font-weight: bold; }
    .footer { margin-top: 20px; font-size: 10px; color: #9ca3af; text-align: right; }
    @media print { body { padding: 10px; } button { display: none; } }
  </style>
</head>
<body>
  <h1>Inventario de Productos — ${tiendaNombre}</h1>
  <p class="meta">Generado el ${fecha} · ${productos.length} productos activos</p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Producto</th>
        <th>Categoría</th>
        <th>Tipo</th>
        <th>Precio</th>
        <th>Moneda</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      ${productos.map((p: any, i: number) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.nombre}</td>
          <td>${(p.categorias as any)?.nombre ?? '—'}</td>
          <td>${p.tipo_venta ?? '—'}</td>
          <td style="text-align:right">${fmt(p.precio)}</td>
          <td>${p.moneda}</td>
          <td class="${p.disponible ? 'disponible' : 'agotado'}">${p.disponible ? 'Disponible' : 'Agotado'}</td>
        </tr>`).join('')}
    </tbody>
  </table>
  <p class="footer">${productos.filter((p: any) => p.disponible).length} disponibles · ${productos.filter((p: any) => !p.disponible).length} agotados</p>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
      }
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setGenerandoPDF(null);
    }
  };

  const fetchResumen = async () => {
    setLoading(true);
    try {
      const ahora = new Date();
      const inicioEsteMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
      const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1).toISOString();
      const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59).toISOString();

      const [
        tiendasRes,
        mensajesEsteMesRes,
        mensajesMesAnteriorRes,
        mensajesExitoRes,
        cambiosPrecioRes,
        productosRes,
        relacionesRes,
      ] = await Promise.all([
        supabase.from('tiendas').select('id, nombre').eq('activa', true).order('nombre'),
        supabase.from('mensajes_log').select('id').gte('created_at', inicioEsteMes),
        supabase.from('mensajes_log').select('id').gte('created_at', inicioMesAnterior).lte('created_at', finMesAnterior),
        supabase.from('mensajes_log').select('id').gte('created_at', inicioEsteMes).eq('estado', 'enviado'),
        supabase.from('price_change_log').select('id').gte('created_at', inicioEsteMes),
        // Todos los productos (activos e inactivos) con su estado para conteo correcto
        supabase.from('productos').select('id, disponible, activo'),
        // Relaciones producto↔tienda via tabla pivot
        supabase.from('productos_tiendas').select('tienda_id, producto_id'),
      ]);

      const tiendas = tiendasRes.data || [];
      const productos = productosRes.data || [];
      const relaciones = relacionesRes.data || [];
      const totalEnviados = mensajesEsteMesRes.data?.length ?? 0;
      const totalExito = mensajesExitoRes.data?.length ?? 0;

      // Mapa rápido: producto_id → { disponible, activo }
      const disponibilidadMap = new Map<string, { disponible: boolean; activo: boolean }>(
        productos.map((p) => [p.id, { disponible: p.disponible, activo: p.activo }])
      );

      const resumenTiendas: ResumenTienda[] = tiendas.map((t) => {
        const idsEnTienda = relaciones
          .filter((r) => r.tienda_id === t.id)
          .map((r) => r.producto_id);

        const todosEnTienda = idsEnTienda.filter((id) => disponibilidadMap.has(id));
        // Activos = activo true
        const productosActivos = todosEnTienda.filter((id) => disponibilidadMap.get(id)?.activo === true);
        // Disponibles = activos y disponibles
        const disponibles = productosActivos.filter((id) => disponibilidadMap.get(id)?.disponible === true).length;
        // Agotados = activos pero no disponibles, O inactivos
        const agotados = todosEnTienda.filter((id) => disponibilidadMap.get(id)?.disponible === false).length;

        return {
          id: t.id,
          nombre: t.nombre,
          totalProductos: productosActivos.length,
          productosDisponibles: disponibles,
          productosAgotados: agotados,
        };
      });

      setResumen({
        mensajesEsteMes: totalEnviados,
        mensajesMesAnterior: mensajesMesAnteriorRes.data?.length ?? 0,
        tasaExito: totalEnviados > 0 ? Math.round((totalExito / totalEnviados) * 100) : 0,
        cambiosPrecioEsteMes: cambiosPrecioRes.data?.length ?? 0,
        tiendas: resumenTiendas,
      });
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const variacionMensajes = resumen
    ? resumen.mensajesMesAnterior > 0
      ? Math.round(((resumen.mensajesEsteMes - resumen.mensajesMesAnterior) / resumen.mensajesMesAnterior) * 100)
      : 0
    : 0;

  const getFechaCorte = (): string => {
    const ahora = new Date();
    if (periodoLimpiar === '1mes') return new Date(ahora.getFullYear(), ahora.getMonth() - 1, ahora.getDate()).toISOString();
    if (periodoLimpiar === '3meses') return new Date(ahora.getFullYear(), ahora.getMonth() - 3, ahora.getDate()).toISOString();
    if (periodoLimpiar === '6meses') return new Date(ahora.getFullYear(), ahora.getMonth() - 6, ahora.getDate()).toISOString();
    return fechaLimpiarHasta ? new Date(fechaLimpiarHasta).toISOString() : '';
  };

  const verificarConteo = async () => {
    const corte = getFechaCorte();
    if (!corte) return;
    const [m, p] = await Promise.all([
      supabase.from('mensajes_log').select('id').lt('created_at', corte),
      supabase.from('price_change_log').select('id').lt('created_at', corte),
    ]);
    setConteoLimpiar({ mensajes: m.data?.length ?? 0, precios: p.data?.length ?? 0 });
    setModalLimpiar(true);
  };

  const ejecutarLimpieza = async () => {
    const corte = getFechaCorte();
    if (!corte) return;
    setLimpiando(true);
    try {
      await Promise.all([
        supabase.from('mensajes_log').delete().lt('created_at', corte),
        supabase.from('price_change_log').delete().lt('created_at', corte),
      ]);
      setModalLimpiar(false);
      setConteoLimpiar(null);
      fetchResumen();
      fetchPrecios();
    } catch (err) {
      console.error('Error en limpieza:', err);
    } finally {
      setLimpiando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Reportes</h1>
        <p className="text-sm text-gray-500">Resumen de actividad y herramientas de análisis</p>
      </div>

      {/* Cards de resumen general */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Resumen del mes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Mensajes enviados */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              {variacionMensajes !== 0 && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${variacionMensajes > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {variacionMensajes > 0 ? '+' : ''}{variacionMensajes}% vs mes anterior
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{resumen?.mensajesEsteMes.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Mensajes enviados este mes</p>
            <p className="text-xs text-gray-400 mt-1">{resumen?.mensajesMesAnterior.toLocaleString()} el mes anterior</p>
          </div>

          {/* Tasa de éxito */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{resumen?.tasaExito}%</p>
            <p className="text-sm text-gray-500 mt-1">Tasa de éxito de envíos</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${resumen?.tasaExito}%` }} />
            </div>
          </div>

          {/* Cambios de precio */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{resumen?.cambiosPrecioEsteMes}</p>
            <p className="text-sm text-gray-500 mt-1">Cambios de precio este mes</p>
          </div>

          {/* Total productos */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {resumen?.tiendas.reduce((a, t) => a + t.productosDisponibles, 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Productos disponibles en total</p>
            <p className="text-xs text-gray-400 mt-1">
              {resumen?.tiendas.reduce((a, t) => a + t.productosAgotados, 0)} agotados
            </p>
          </div>
        </div>
      </div>

      {/* Resumen por tienda */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Estado de inventario por tienda</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resumen?.tiendas.map((t) => {
            const pct = t.totalProductos > 0 ? Math.round((t.productosDisponibles / t.totalProductos) * 100) : 0;
            return (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4">{t.nombre}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total activos</span>
                    <span className="font-semibold text-gray-900">{t.totalProductos}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" /> Disponibles
                    </span>
                    <span className="font-semibold text-green-700">{t.productosDisponibles}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-red-500">
                      <XCircle className="w-3.5 h-3.5" /> Agotados
                    </span>
                    <span className="font-semibold text-red-600">{t.productosAgotados}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Disponibilidad</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct > 70 ? 'bg-green-500' : pct > 40 ? 'bg-yellow-400' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historial de cambios de precio */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Historial de cambios de precio</h2>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre de producto..."
              value={busquedaProducto}
              onChange={(e) => { setBusquedaProducto(e.target.value); setPaginaPrecios(0); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setPaginaPrecios(0); }}
              className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-400">hasta</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => { setFechaHasta(e.target.value); setPaginaPrecios(0); }}
              className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {(fechaDesde || fechaHasta || busquedaProducto) && (
              <button
                onClick={() => { setFechaDesde(''); setFechaHasta(''); setBusquedaProducto(''); setPaginaPrecios(0); }}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loadingPrecios ? (
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
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden md:table-cell">Tienda</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Anterior</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Nuevo</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden sm:table-cell">Estado</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {precios.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900 truncate max-w-[160px]">{p.producto_nombre}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs hidden md:table-cell">{p.tienda_nombre}</td>
                    <td className="px-4 py-2.5 text-gray-400 line-through text-xs">{p.valor_anterior ?? '—'}</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-900 text-xs">{p.valor_nuevo ?? '—'}</td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.estado === 'aprobado' ? 'bg-green-100 text-green-700' :
                        p.estado === 'rechazado' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">
                      {new Date(p.created_at).toLocaleString('es-CU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Paginación */}
          {!loadingPrecios && precios.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setPaginaPrecios(p => Math.max(0, p - 1))}
                disabled={paginaPrecios === 0}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 disabled:opacity-40 px-2 py-1 rounded hover:bg-gray-100"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
              </button>
              <span className="text-xs text-gray-400">Página {paginaPrecios + 1}</span>
              <button
                onClick={() => setPaginaPrecios(p => p + 1)}
                disabled={precios.length < POR_PAGINA}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 disabled:opacity-40 px-2 py-1 rounded hover:bg-gray-100"
              >
                Siguiente <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PDF de inventario */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">PDF de inventario por tienda</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resumen?.tiendas.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{t.nombre}</h3>
                  <p className="text-xs text-gray-400">{t.totalProductos} productos activos</p>
                </div>
              </div>
              <div className="space-y-1 mb-4 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span className="text-green-600">Disponibles</span>
                  <span className="font-medium text-green-700">{t.productosDisponibles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-500">Agotados</span>
                  <span className="font-medium text-red-600">{t.productosAgotados}</span>
                </div>
              </div>
              <button
                onClick={() => generarPDF(t.id, t.nombre)}
                disabled={generandoPDF === t.id}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {generandoPDF === t.id
                  ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generando...</>
                  : <><Printer className="w-3.5 h-3.5" /> Generar PDF</>
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Limpieza de historial */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Limpieza de historial</h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-5">
            Elimina registros antiguos de envíos y cambios de precio para liberar espacio en la base de datos.
            Esta acción no afecta productos, tiendas ni configuración.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-2">Eliminar registros anteriores a:</label>
              <div className="flex flex-wrap gap-2">
                {([
                  { val: '1mes', label: 'Hace 1 mes' },
                  { val: '3meses', label: 'Hace 3 meses' },
                  { val: '6meses', label: 'Hace 6 meses' },
                  { val: 'personalizado', label: 'Fecha personalizada' },
                ] as const).map((op) => (
                  <button
                    key={op.val}
                    onClick={() => setPeriodoLimpiar(op.val)}
                    className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                      periodoLimpiar === op.val
                        ? 'bg-red-600 text-white border-red-600'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
              {periodoLimpiar === 'personalizado' && (
                <input
                  type="date"
                  value={fechaLimpiarHasta}
                  onChange={(e) => setFechaLimpiarHasta(e.target.value)}
                  className="mt-3 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              )}
            </div>
            <button
              onClick={verificarConteo}
              disabled={periodoLimpiar === 'personalizado' && !fechaLimpiarHasta}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shrink-0"
            >
              <XCircle className="w-4 h-4" />
              Limpiar historial
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmación de limpieza */}
      {modalLimpiar && conteoLimpiar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Confirmar limpieza</h3>
            <p className="text-sm text-gray-600 mb-4">
              Se eliminarán permanentemente:
            </p>
            <div className="bg-red-50 rounded-lg p-3 mb-5 space-y-1">
              <p className="text-sm text-red-800">
                <span className="font-bold">{conteoLimpiar.mensajes.toLocaleString()}</span> registros de envíos WA
              </p>
              <p className="text-sm text-red-800">
                <span className="font-bold">{conteoLimpiar.precios.toLocaleString()}</span> registros de cambios de precio
              </p>
            </div>
            <p className="text-xs text-gray-400 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setModalLimpiar(false); setConteoLimpiar(null); }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarLimpieza}
                disabled={limpiando}
                className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {limpiando ? 'Limpiando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
