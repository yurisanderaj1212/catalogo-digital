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
    <main className="h-screen bg-linear-to-br from-blue-50 to-gray-100 flex flex-col px-3 py-2">
      {/* Título */}
      <div className="text-center mb-2">
        <h1 className="text-xl font-bold text-gray-900">Bienvenidos a Perez Lazos</h1>
        <p className="text-xs text-gray-500 mt-0.5">Selecciona una tienda para ver sus productos</p>
      </div>

      {/* Tarjetas ocupando el espacio restante */}
      <div className="flex flex-col gap-2 flex-1 max-w-lg mx-auto w-full min-h-0">
        {tiendas.map((tienda) => (
          <Link
            key={tienda.id}
            href={`/tienda/${tienda.id}`}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group active:scale-95 flex flex-1 min-h-0"
          >
            <div className="w-24 shrink-0 bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              {tienda.logo ? (
                <img
                  src={tienda.logo}
                  alt={tienda.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-10 h-10 text-white" />
              )}
            </div>
            <div className="px-3 py-2 flex flex-col justify-center flex-1 min-w-0">
              <h2 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {tienda.nombre}
              </h2>
              {tienda.descripcion && (
                <p className="text-gray-500 text-xs mt-0.5">
                  {tienda.descripcion}
                </p>
              )}
              {tienda.direccion && (
                <p className="text-xs text-gray-400 mt-0.5">
                  📍 {tienda.direccion}
                </p>
              )}
            </div>
            <div className="flex items-center pr-3 text-blue-400 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {tiendas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay tiendas disponibles en este momento</p>
        </div>
      )}
    </main>
  );
}
