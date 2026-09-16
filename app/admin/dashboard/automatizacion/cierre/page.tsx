'use client';

import { useEffect, useState } from 'react';
import { supabase, Tienda } from '@/lib/supabase';
import { LogOut, Save, CheckCircle } from 'lucide-react';

interface TiendaConCierre extends Pick<Tienda, 'id' | 'nombre' | 'mensaje_cierre'> {
  texto: string;
  guardando: boolean;
  guardado: boolean;
  error: string;
}

export default function CierrePage() {
  const [tiendas, setTiendas] = useState<TiendaConCierre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTiendas = async () => {
      const { data } = await supabase
        .from('tiendas')
        .select('id, nombre, mensaje_cierre')
        .order('nombre');

      setTiendas(
        (data || []).map((t) => ({
          ...t,
          texto: t.mensaje_cierre || '',
          guardando: false,
          guardado: false,
          error: '',
        }))
      );
      setLoading(false);
    };

    fetchTiendas();
  }, []);

  const handleChange = (id: string, valor: string) => {
    setTiendas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, texto: valor, guardado: false, error: '' } : t))
    );
  };

  const handleGuardar = async (id: string) => {
    setTiendas((prev) => prev.map((t) => (t.id === id ? { ...t, guardando: true, error: '' } : t)));

    const tienda = tiendas.find((t) => t.id === id);
    if (!tienda) return;

    const { error } = await supabase
      .from('tiendas')
      .update({ mensaje_cierre: tienda.texto || null })
      .eq('id', id);

    if (error) {
      setTiendas((prev) =>
        prev.map((t) => (t.id === id ? { ...t, guardando: false, error: 'Error al guardar' } : t))
      );
      return;
    }

    setTiendas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, guardando: false, guardado: true } : t))
    );

    setTimeout(() => {
      setTiendas((prev) => prev.map((t) => (t.id === id ? { ...t, guardado: false } : t)));
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="mb-2">
        <p className="text-sm text-gray-500">
          Este mensaje se envía automáticamente como último mensaje de cada ciclo de publicación en WhatsApp, después de todos los productos. Ideal para incluir dirección, horarios, ubicación y datos de contacto. Soporta emojis y saltos de línea.
        </p>
      </div>

      {tiendas.map((tienda) => (
        <div key={tienda.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <LogOut className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900">{tienda.nombre}</h3>
          </div>

          <textarea
            value={tienda.texto}
            onChange={(e) => handleChange(tienda.id, e.target.value)}
            rows={10}
            placeholder={`Ej:\nVENTAS ${tienda.nombre.toUpperCase()} ‼\n\nDirección: Calle #123 entre A y B. Municipio X.\n\nUbicación:\nhttps://maps.app.goo.gl/...\n\nNuestro Catálogo Digital AQUÍ 👇\nhttps://catalogo.perezlazos.com/\n\nHORARIO: 9AM-5PM\nDE LUNES A SÁBADO`}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono"
          />

          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-400">
              {tienda.texto.length} caracteres
            </p>
            <div className="flex items-center gap-2">
              {tienda.error && (
                <span className="text-xs text-red-600">{tienda.error}</span>
              )}
              {tienda.guardado && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-3.5 h-3.5" /> Guardado
                </span>
              )}
              <button
                onClick={() => handleGuardar(tienda.id)}
                disabled={tienda.guardando}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {tienda.guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      ))}

      {tiendas.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-10">No hay tiendas registradas</p>
      )}
    </div>
  );
}
