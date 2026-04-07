'use client';

import { useEffect, useState } from 'react';
import { supabase, Tienda } from '@/lib/supabase';
import Link from 'next/link';
import { Store } from 'lucide-react';

export default function Home() {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTiendas();
  }, []);

  const fetchTiendas = async () => {
    try {
      const { data, error } = await supabase
        .from('tiendas')
        .select('*')
        .eq('activa', true)
        .order('nombre');

      if (error) throw error;
      setTiendas(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 to-gray-100 flex flex-col">
      <div className="container mx-auto px-3 py-3 flex flex-col flex-1">
        {/* Header compacto */}
        <p className="text-center text-sm text-gray-500 mb-3">
          Selecciona una tienda para ver sus productos
        </p>

        {/* Grid de tiendas - 2 columnas en móvil, 3 en desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-6xl mx-auto w-full">
          {tiendas.map((tienda) => (
            <Link
              key={tienda.id}
              href={`/tienda/${tienda.id}`}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group active:scale-95"
            >
              <div className="aspect-video bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                {tienda.logo ? (
                  <img
                    src={tienda.logo}
                    alt={tienda.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="w-12 h-12 text-white" />
                )}
              </div>
              <div className="p-2.5">
                <h2 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {tienda.nombre}
                </h2>
                {tienda.descripcion && (
                  <p className="text-gray-500 text-xs line-clamp-2 mb-1">
                    {tienda.descripcion}
                  </p>
                )}
                {tienda.direccion && (
                  <p className="text-xs text-gray-400 line-clamp-1">
                    📍 {tienda.direccion}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {tiendas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No hay tiendas disponibles en este momento
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
