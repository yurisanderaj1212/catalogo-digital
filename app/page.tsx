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
    <main className="min-h-screen bg-linear-to-br from-blue-50 to-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Catálogo Digital
          </h1>
          <p className="text-lg text-gray-600">
            Selecciona una tienda para ver sus productos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tiendas.map((tienda) => (
            <Link
              key={tienda.id}
              href={`/tienda/${tienda.id}`}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="aspect-video bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                {tienda.logo ? (
                  <img
                    src={tienda.logo}
                    alt={tienda.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="w-20 h-20 text-white" />
                )}
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {tienda.nombre}
                </h2>
                {tienda.descripcion && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {tienda.descripcion}
                  </p>
                )}
                {tienda.direccion && (
                  <p className="text-sm text-gray-500">
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
