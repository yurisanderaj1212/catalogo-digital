'use client';

import { useEffect, useState } from 'react';
import { supabase, Producto, PriceChangeLog } from '@/lib/supabase';
import { Search, CheckCircle, XCircle, AlertCircle, ChevronRight, Loader } from 'lucide-react';

interface ParseResult {
  texto_original: string;
  producto_encontrado: Producto | null;
  confianza: number; // 0-100
  precio_anterior: number | null;
  precio_nuevo: number;
  aplicar: boolean;
}

// Parser simple de texto: extrae pares nombre → precio
function parsearTexto(texto: string, productos: Producto[]): ParseResult[] {
  const lineas = texto.split('\n').map(l => l.trim()).filter(Boolean);
  const resultados: ParseResult[] = [];

  for (const linea of lineas) {
    // Patrones: "Arroz 150", "Arroz - 150", "Arroz: 150 cup", "Arroz 150cup"
    const match = linea.match(/^(.+?)[\s\-:]+(\d+(?:[.,]\d+)?)\s*(?:cup|usd|eur)?$/i);
    if (!match) continue;

    const nombreBuscado = match[1].trim().toLowerCase();
    const precioNuevo = parseFloat(match[2].replace(',', '.'));

    // Fuzzy match simple: calcular similitud por palabras en común
    let mejorProducto: Producto | null = null;
    let mejorScore = 0;

    for (const p of productos) {
      const nombreP = p.nombre.toLowerCase();
      const score = calcularSimilitud(nombreBuscado, nombreP);
      if (score > mejorScore) {
        mejorScore = score;
        mejorProducto = p;
      }
    }

    const confianza = Math.round(mejorScore * 100);

    resultados.push({
      texto_original: linea,
      producto_encontrado: mejorProducto,
      confianza,
      precio_anterior: mejorProducto?.precio ?? null,
      precio_nuevo: precioNuevo,
      aplicar: confianza >= 80,
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
  // Jaccard + bonus si uno contiene al otro
  const jaccard = intersection / union;
  const containsBonus = b.includes(a) || a.includes(b) ? 0.2 : 0;
  return Math.min(1, jaccard + containsBonus);
}

export default function PreciosPage() {
  const [texto, setTexto] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [resultados, setResultados] = useState<ParseResult[]>([]);
  const [analizando, setAnalizando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [pendientes, setPendientes] = useState<(PriceChangeLog & { producto_nombre?: string })[]>([]);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    fetchProductos();
    fetchPendientes();
  }, []);

  const fetchProductos = async () => {
    const { data } = await supabase.from('productos').select('*').eq('activo', true).order('nombre');
    setProductos(data || []);
  };

  const fetchPendientes = async () => {
    const { data } = await supabase
      .from('price_change_log')
      .select('*, productos(nombre)')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false });
    const mapped = (data || []).map((r: any) => ({ ...r, producto_nombre: r.productos?.nombre ?? '—' }));
    setPendientes(mapped);
  };

  const analizar = () => {
    if (!texto.trim()) return;
    setAnalizando(true);
    setTimeout(() => {
      const res = parsearTexto(texto, productos);
      setResultados(res);
      setAnalizando(false);
    }, 300);
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
        // Actualizar precio
        await supabase.from('productos').update({ precio: r.precio_nuevo }).eq('id', r.producto_encontrado.id);
        // Registrar en log
        await supabase.from('price_change_log').insert({
          producto_id: r.producto_encontrado.id,
          tipo: 'precio',
          valor_anterior: String(r.precio_anterior),
          valor_nuevo: String(r.precio_nuevo),
          estado: 'aprobado',
          publicado_wa: false,
        });
      }
      setMensaje(`✅ ${aAplicar.length} precio${aAplicar.length > 1 ? 's' : ''} actualizado${aAplicar.length > 1 ? 's' : ''}`);
      setTexto('');
      setResultados([]);
      await fetchProductos();
      await fetchPendientes();
    } catch (err) {
      setMensaje('Error al aplicar cambios');
    } finally {
      setAplicando(false);
      setTimeout(() => setMensaje(''), 4000);
    }
  };

  const rechazarPendiente = async (id: string) => {
    await supabase.from('price_change_log').update({ estado: 'rechazado' }).eq('id', id);
    fetchPendientes();
  };

  const confianzaConfig = (c: number) => {
    if (c >= 80) return { cls: 'text-green-700 bg-green-50 border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Alta' };
    if (c >= 60) return { cls: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: <AlertCircle className="w-3.5 h-3.5" />, label: 'Media' };
    return { cls: 'text-red-700 bg-red-50 border-red-200', icon: <XCircle className="w-3.5 h-3.5" />, label: 'Baja' };
  };

  return (
    <div className="space-y-6">
      {mensaje && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">{mensaje}</div>
      )}

      {/* Alertas pendientes de auto-detección */}
      {pendientes.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Cambios detectados automáticamente ({pendientes.length})
          </h2>
          <div className="space-y-2">
            {pendientes.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.producto_nombre}</p>
                  <p className="text-xs text-gray-500">{p.valor_anterior} → {p.valor_nuevo} CUP</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => rechazarPendiente(p.id)} className="text-xs text-red-600 hover:underline">Rechazar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parser de texto */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Actualizar precios desde texto</h2>
        <p className="text-xs text-gray-500 mb-3">
          Pega una lista de productos con sus nuevos precios. Formatos aceptados:<br />
          <span className="font-mono bg-gray-100 px-1 rounded">Arroz 150</span> · <span className="font-mono bg-gray-100 px-1 rounded">Aceite - 200 cup</span> · <span className="font-mono bg-gray-100 px-1 rounded">Pierna: 450</span>
        </p>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={6}
          placeholder={'Arroz 150\nAceite de girasol 200\nPierna de cerdo - 450 cup\nLeche condensada: 120'}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono resize-none"
        />
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
              Resultados — {resultados.filter(r => r.aplicar).length} seleccionados para aplicar
            </h2>
            <button onClick={aplicarCambios} disabled={aplicando || resultados.filter(r => r.aplicar).length === 0}
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
                  <input type="checkbox" checked={r.aplicar && r.confianza >= 60} disabled={r.confianza < 60}
                    onChange={() => toggleAplicar(i)} className="w-4 h-4 text-blue-600 rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 truncate">{r.texto_original}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{r.producto_encontrado?.nombre ?? 'No encontrado'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {r.precio_anterior !== null && (
                      <p className="text-xs text-gray-400 line-through">{r.precio_anterior}</p>
                    )}
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
    </div>
  );
}
