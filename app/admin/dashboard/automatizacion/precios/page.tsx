'use client';

import { useEffect, useState } from 'react';
import { supabase, Producto, PriceChangeLog, Tienda } from '@/lib/supabase';
import { Search, CheckCircle, XCircle, AlertCircle, ChevronRight, Loader, Trash2, RefreshCw, PackageX } from 'lucide-react';

const BOT_URL = process.env.NEXT_PUBLIC_BOT_SERVICE_URL ?? '';
const BOT_SECRET = process.env.NEXT_PUBLIC_BOT_SERVICE_SECRET ?? '';

async function llamarBot(path: string, body?: object) {
  if (!BOT_URL) return null;
  try {
    const res = await fetch(`${BOT_URL}${path}`, {
      method: 'POST',
      headers: { 'x-bot-secret': BOT_SECRET, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.ok ? res.json() : null;
  } catch { return null; }
}

interface ParseResult {
  texto_original: string;
  producto_encontrado: Producto | null;
  confianza: number;
  precio_anterior: number | null;
  precio_nuevo: number;
  aplicar: boolean;
}

function parsearTexto(texto: string, productos: Producto[]): ParseResult[] {
  const lineas = texto.split('\n').map(l => l.trim()).filter(Boolean);
  const resultados: ParseResult[] = [];
  for (const linea of lineas) {
    const match = linea.match(/^(.+?)[\s\-:]+(\d+(?:[.,]\d+)?)\s*(?:cup|usd|eur)?$/i);
    if (!match) continue;
    const nombreBuscado = match[1].trim().toLowerCase();
    const precioNuevo = parseFloat(match[2].replace(',', '.'));
    let mejorProducto: Producto | null = null;
    let mejorScore = 0;
    for (const p of productos) {
      const score = calcularSimilitud(nombreBuscado, p.nombre.toLowerCase());
      if (score > mejorScore) { mejorScore = score; mejorProducto = p; }
    }
    resultados.push({
      texto_original: linea,
      producto_encontrado: mejorProducto,
      confianza: Math.round(mejorScore * 100),
      precio_anterior: mejorProducto?.precio ?? null,
      precio_nuevo: precioNuevo,
      aplicar: mejorScore >= 0.8,
    });
  }
  return resultados;
}

function calcularSimilitud(a: string, b: string): number {
  const tokensA = new Set(a.split(/\s+/));
  const tokensB = new Set(b.split(/\s+/));
  const intersection = [...tokensA].filter(t => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  if (union === 0) return 0;
  const jaccard = intersection / union;
  const containsBonus = b.includes(a) || a.includes(b) ? 0.2 : 0;
  return Math.min(1, jaccard + containsBonus);
}

export default function PreciosPage() {
  const [texto, setTexto] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [resultados, setResultados] = useState<ParseResult[]>([]);
  const [analizando, setAnalizando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [pendientes, setPendientes] = useState<(PriceChangeLog & { producto_nombre?: string })[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [borrandoTienda, setBorrandoTienda] = useState<string | null>(null);
  const [textoAgotado, setTextoAgotado] = useState('');
  const [productosAgotados, setProductosAgotados] = useState<Producto[]>([]);
  const [enviandoAgotado, setEnviandoAgotado] = useState(false);

  useEffect(() => {
    fetchProductos();
    fetchPendientes();
    supabase.from('tiendas').select('*').eq('activa', true).order('nombre').then(({ data }) => setTiendas(data || []));
  }, []);

  const fetchProductos = async () => {
    const { data } = await supabase.from('productos').select('*').eq('activo', true).order('nombre');
    setProductos(data || []);
  };

  const fetchPendientes = async () => {
    const { data } = await supabase.from('price_change_log').select('*, productos(nombre)').eq('estado', 'pendiente').order('created_at', { ascending: false });
    setPendientes((data || []).map((r: any) => ({ ...r, producto_nombre: r.productos?.nombre ?? '---' })));
  };

  const analizar = () => {
    if (!texto.trim()) return;
    setAnalizando(true);
    setTimeout(() => { setResultados(parsearTexto(texto, productos)); setAnalizando(false); }, 300);
  };

  const toggleAplicar = (index: number) => {
    setResultados(prev => prev.map((r, i) => i === index ? { ...r, aplicar: !r.aplicar } : r));
  };

  const aplicarCambios = async () => {
    const aAplicar = resultados.filter(r => r.aplicar && r.producto_encontrado && r.confianza >= 60);
    if (aAplicar.length === 0) return;
    setAplicando(true);
    try {
      for (const r of aAplicar) {
        if (!r.producto_encontrado) continue;
        await supabase.from('productos').update({ precio: r.precio_nuevo }).eq('id', r.producto_encontrado.id);
        await supabase.from('price_change_log').insert({ producto_id: r.producto_encontrado.id, tipo: 'precio', valor_anterior: String(r.precio_anterior), valor_nuevo: String(r.precio_nuevo), estado: 'aprobado', publicado_wa: false });
      }
      mostrarMensaje(`Precios actualizados: ${aAplicar.length}`);
      setTexto(''); setResultados([]);
      await fetchProductos(); await fetchPendientes();
    } catch { mostrarMensaje('Error al aplicar cambios'); }
    setAplicando(false);
  };

  const rechazarPendiente = async (id: string) => {
    await supabase.from('price_change_log').update({ estado: 'rechazado' }).eq('id', id);
    fetchPendientes();
  };

  const borrarYRepublicar = async (tiendaId: string, republicar: boolean) => {
    setBorrandoTienda(tiendaId);
    const res = await llamarBot(`/api/borrar-y-republicar/${tiendaId}`, { republicar });
    if (res?.ok) mostrarMensaje(`${res.borrados} mensajes borrados${republicar ? ` + ${res.productos_a_republicar} productos a republicar` : ''}`);
    else mostrarMensaje('Error al borrar mensajes');
    setBorrandoTienda(null);
  };

  const buscarProductosAgotados = () => {
    if (!textoAgotado.trim()) return;
    const lineas = textoAgotado.split('\n').map(l => l.trim()).filter(Boolean);
    const encontrados: Producto[] = [];
    for (const linea of lineas) {
      let mejor: Producto | null = null; let mejorScore = 0;
      for (const p of productos) {
        const score = calcularSimilitud(linea.toLowerCase(), p.nombre.toLowerCase());
        if (score > mejorScore) { mejorScore = score; mejor = p; }
      }
      if (mejor && mejorScore >= 0.5 && !encontrados.find(p => p.id === mejor!.id)) encontrados.push(mejor);
    }
    setProductosAgotados(encontrados);
  };

  const notificarAgotados = async () => {
    if (productosAgotados.length === 0) return;
    setEnviandoAgotado(true);
    let totalEnviados = 0;
    for (const producto of productosAgotados) {
      const { data: rels } = await supabase.from('productos_tiendas').select('tienda_id').eq('producto_id', producto.id);
      for (const rel of rels || []) {
        const res = await llamarBot(`/api/agotado/${rel.tienda_id}`, { productoId: producto.id });
        if (res?.ok) totalEnviados += res.enviados ?? 0;
      }
    }
    mostrarMensaje(`${productosAgotados.length} producto(s) agotado(s) — ${totalEnviados} grupos notificados`);
    setProductosAgotados([]); setTextoAgotado('');
    await fetchProductos();
    setEnviandoAgotado(false);
  };

  const mostrarMensaje = (msg: string) => { setMensaje(msg); setTimeout(() => setMensaje(''), 5000); };

  const confianzaConfig = (c: number) => {
    if (c >= 80) return { cls: 'text-green-700 bg-green-50 border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" /> };
    if (c >= 60) return { cls: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: <AlertCircle className="w-3.5 h-3.5" /> };
    return { cls: 'text-red-700 bg-red-50 border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> };
  };

  return (
    <div className="space-y-6">
      {mensaje && <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">{mensaje}</div>}

      {/* Cambios pendientes */}
      {pendientes.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Cambios detectados ({pendientes.length})</h2>
          <div className="space-y-2">
            {pendientes.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.producto_nombre}</p>
                  <p className="text-xs text-gray-500">{p.valor_anterior} to {p.valor_nuevo}</p>
                </div>
                <button onClick={() => rechazarPendiente(p.id)} className="text-xs text-red-600 hover:underline">Rechazar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parser de precios */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Actualizar precios desde texto</h2>
        <p className="text-xs text-gray-500 mb-3">Pega una lista con formato: <span className="font-mono bg-gray-100 px-1 rounded">Producto 150</span> o <span className="font-mono bg-gray-100 px-1 rounded">Producto - 150 cup</span></p>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={6}
          placeholder={"Arroz 150\nAceite 200\nPierna de cerdo - 450"}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono resize-none" />
        <div className="flex justify-end mt-2">
          <button onClick={analizar} disabled={analizando || !texto.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {analizando ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {analizando ? 'Analizando...' : 'Analizar'}
          </button>
        </div>
      </div>

      {/* Resultados */}
      {resultados.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">{resultados.filter(r => r.aplicar).length} seleccionados</h2>
            <button onClick={aplicarCambios} disabled={aplicando || !resultados.some(r => r.aplicar)}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
              {aplicando ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {aplicando ? 'Aplicando...' : 'Aplicar seleccionados'}
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {resultados.map((r, i) => {
              const cfg = confianzaConfig(r.confianza);
              return (
                <div key={i} className={`flex items-center gap-3 px-5 py-3 ${r.confianza < 60 ? 'opacity-60' : ''}`}>
                  <input type="checkbox" checked={r.aplicar && r.confianza >= 60} disabled={r.confianza < 60} onChange={() => toggleAplicar(i)} className="w-4 h-4 text-blue-600 rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 truncate">{r.texto_original}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{r.producto_encontrado?.nombre ?? 'No encontrado'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {r.precio_anterior !== null && <p className="text-xs text-gray-400 line-through">{r.precio_anterior}</p>}
                    <p className="text-sm font-bold text-gray-900">{r.precio_nuevo}</p>
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${cfg.cls}`}>
                    {cfg.icon} {r.confianza}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Borrar publicaciones y republicar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-4 h-4 text-red-600" />
          <h2 className="text-sm font-semibold text-gray-700">Borrar publicaciones recientes</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">Borra mensajes publicados en las ultimas 55h. Util cuando cambiaron precios y quieres limpiar los mensajes con precio viejo.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {tiendas.map((t) => (
            <div key={t.id} className="border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900 mb-2">{t.nombre}</p>
              <div className="flex gap-2">
                <button onClick={() => borrarYRepublicar(t.id, false)} disabled={borrandoTienda === t.id}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 text-red-700 text-xs rounded-lg hover:bg-red-100 disabled:opacity-50 border border-red-200">
                  {borrandoTienda === t.id ? <Loader className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Solo borrar
                </button>
                <button onClick={() => borrarYRepublicar(t.id, true)} disabled={borrandoTienda === t.id}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-lg hover:bg-blue-100 disabled:opacity-50 border border-blue-200">
                  {borrandoTienda === t.id ? <Loader className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Borrar + republicar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notificar agotados */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-2">
          <PackageX className="w-4 h-4 text-orange-600" />
          <h2 className="text-sm font-semibold text-gray-700">Marcar productos como agotados</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">Escribe los nombres de los productos agotados (uno por linea). El bot los marcara como no disponibles y publicara una notificacion en los grupos.</p>
        <textarea value={textoAgotado} onChange={(e) => setTextoAgotado(e.target.value)} rows={4}
          placeholder={"Jabon Tocador 90 gr\nLimpia Hogar Marmol 1.5 lt\nGel de Bano Queray"}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono resize-none mb-2" />
        <div className="flex justify-end">
          <button onClick={buscarProductosAgotados} disabled={!textoAgotado.trim()}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 disabled:opacity-50">
            <Search className="w-3.5 h-3.5" /> Buscar productos
          </button>
        </div>

        {productosAgotados.length > 0 && (
          <div className="mt-3 border border-orange-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-orange-50 border-b border-orange-200">
              <p className="text-xs font-medium text-orange-800">{productosAgotados.length} producto(s) encontrado(s)</p>
              <button onClick={notificarAgotados} disabled={enviandoAgotado}
                className="flex items-center gap-1.5 px-3 py-1 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 disabled:opacity-50">
                {enviandoAgotado ? <Loader className="w-3 h-3 animate-spin" /> : <PackageX className="w-3 h-3" />}
                {enviandoAgotado ? 'Enviando...' : 'Confirmar y notificar'}
              </button>
            </div>
            <div className="divide-y divide-orange-100">
              {productosAgotados.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-gray-900">{p.nombre}</span>
                  <span className="text-xs text-red-600 font-medium">AGOTADO</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
