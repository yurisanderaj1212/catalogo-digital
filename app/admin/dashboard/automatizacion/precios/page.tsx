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
  precio_nuevo: number;
  // Múltiples candidatos por línea — el admin elige cuáles aplicar
  candidatos: {
    producto: Producto;
    confianza: number;
    precio_anterior: number;
    aplicar: boolean;
    key: string; // unique key = linea_index + producto_id
  }[];
}

// Devuelve hasta 3 candidatos por línea ordenados por confianza
function parsearTexto(texto: string, productos: Producto[]): ParseResult[] {
  const lineas = texto.split('\n').map(l => l.trim()).filter(Boolean);
  const resultados: ParseResult[] = [];

  for (let li = 0; li < lineas.length; li++) {
    const linea = lineas[li];
    const match = linea.match(/^(.+?)[\s\-:]+(\d+(?:[.,]\d+)?)\s*(?:cup|usd|eur)?$/i);
    if (!match) continue;

    const nombreBuscado = match[1].trim().toLowerCase();
    const precioNuevo = parseFloat(match[2].replace(',', '.'));

    // Calcular score para todos los productos y tomar los top 3 con score >= 50%
    const scores = productos
      .map(p => ({ producto: p, score: calcularSimilitud(nombreBuscado, p.nombre.toLowerCase()) }))
      .filter(x => x.score >= 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (scores.length === 0) {
      // Sin coincidencias — igual mostramos la línea como no encontrada
      resultados.push({ texto_original: linea, precio_nuevo: precioNuevo, candidatos: [] });
      continue;
    }

    resultados.push({
      texto_original: linea,
      precio_nuevo: precioNuevo,
      candidatos: scores.map(({ producto, score }) => ({
        producto,
        confianza: Math.round(score * 100),
        precio_anterior: producto.precio,
        aplicar: score >= 0.8, // auto-seleccionar solo los de alta confianza
        key: `${li}_${producto.id}`,
      })),
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

  const toggleAplicar = (key: string) => {
    setResultados(prev => prev.map(r => ({
      ...r,
      candidatos: r.candidatos.map(c => c.key === key ? { ...c, aplicar: !c.aplicar } : c),
    })));
  };

  const aplicarCambios = async () => {
    const aAplicar = resultados.flatMap(r =>
      r.candidatos.filter(c => c.aplicar && c.confianza >= 60).map(c => ({
        producto: c.producto,
        precio_nuevo: r.precio_nuevo,
        precio_anterior: c.precio_anterior,
      }))
    );
    if (aAplicar.length === 0) return;
    setAplicando(true);
    try {
      for (const item of aAplicar) {
        await supabase.from('productos').update({ precio: item.precio_nuevo }).eq('id', item.producto.id);
        await supabase.from('price_change_log').insert({
          producto_id: item.producto.id,
          tipo: 'precio',
          valor_anterior: String(item.precio_anterior),
          valor_nuevo: String(item.precio_nuevo),
          estado: 'aprobado',
          publicado_wa: false,
        });
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
            <h2 className="text-sm font-semibold text-gray-700">
              {resultados.flatMap(r => r.candidatos.filter(c => c.aplicar)).length} seleccionados para aplicar
            </h2>
            <button onClick={aplicarCambios} disabled={aplicando || !resultados.some(r => r.candidatos.some(c => c.aplicar))}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
              {aplicando ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {aplicando ? 'Aplicando...' : 'Aplicar seleccionados'}
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {resultados.map((r, ri) => (
              <div key={ri} className="px-5 py-3">
                {/* Texto original */}
                <p className="text-xs text-gray-400 mb-2 font-mono">{r.texto_original}</p>

                {r.candidatos.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <XCircle className="w-4 h-4" />
                    <span>No se encontraron productos</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {r.candidatos.map((c) => {
                      const cfg = c.confianza >= 80
                        ? 'text-green-700 bg-green-50 border-green-200'
                        : c.confianza >= 60
                        ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
                        : 'text-red-700 bg-red-50 border-red-200';
                      const icon = c.confianza >= 80 ? <CheckCircle className="w-3.5 h-3.5" />
                        : c.confianza >= 60 ? <AlertCircle className="w-3.5 h-3.5" />
                        : <XCircle className="w-3.5 h-3.5" />;
                      return (
                        <div key={c.key} className={`flex items-center gap-3 p-2 rounded-lg border ${c.aplicar ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                          <input type="checkbox" checked={c.aplicar} disabled={c.confianza < 60}
                            onChange={() => toggleAplicar(c.key)} className="w-4 h-4 text-blue-600 rounded" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{c.producto.nombre}</p>
                            <p className="text-xs text-gray-400">{c.producto.moneda}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-gray-400 line-through">{c.precio_anterior.toLocaleString('es-CU')}</p>
                            <p className="text-sm font-bold text-gray-900">{r.precio_nuevo.toLocaleString('es-CU')}</p>
                          </div>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${cfg}`}>
                            {icon} {c.confianza}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
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
