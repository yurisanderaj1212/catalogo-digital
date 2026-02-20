'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, Package, Tag, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    tiendas: 0,
    productos: 0,
    categorias: 0,
    productosActivos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [tiendas, productos, categorias, productosActivos] = await Promise.all([
        supabase.from('tiendas').select('id', { count: 'exact', head: true }),
        supabase.from('productos').select('id', { count: 'exact', head: true }),
        supabase.from('categorias').select('id', { count: 'exact', head: true }),
        supabase.from('productos').select('id', { count: 'exact', head: true }).eq('activo', true).eq('disponible', true),
      ]);

      setStats({
        tiendas: tiendas.count || 0,
        productos: productos.count || 0,
        categorias: categorias.count || 0,
        productosActivos: productosActivos.count || 0,
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Tiendas',
      value: stats.tiendas,
      icon: Store,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Productos',
      value: stats.productos,
      icon: Package,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Categorías',
      value: stats.categorias,
      icon: Tag,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Productos Activos',
      value: stats.productosActivos,
      icon: TrendingUp,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Resumen general del catálogo</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className={`${card.bgColor} p-2 md:p-3 rounded-lg`}>
                <card.icon className={`w-5 h-5 md:w-6 md:h-6 ${card.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
            <h3 className="text-gray-600 text-xs md:text-sm font-medium mb-1">{card.title}</h3>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Accesos Rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <a
            href="/admin/dashboard/tiendas"
            className="flex items-center gap-2 md:gap-3 p-3 md:p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <Store className="w-4 h-4 md:w-5 md:h-5 text-blue-600 shrink-0" />
            <span className="font-medium text-gray-900 text-xs md:text-base">Gestionar Tiendas</span>
          </a>
          <a
            href="/admin/dashboard/productos"
            className="flex items-center gap-2 md:gap-3 p-3 md:p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
          >
            <Package className="w-4 h-4 md:w-5 md:h-5 text-green-600 shrink-0" />
            <span className="font-medium text-gray-900 text-xs md:text-base">Gestionar Productos</span>
          </a>
          <a
            href="/admin/dashboard/categorias"
            className="flex items-center gap-2 md:gap-3 p-3 md:p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
          >
            <Tag className="w-4 h-4 md:w-5 md:h-5 text-purple-600 shrink-0" />
            <span className="font-medium text-gray-900 text-xs md:text-base">Gestionar Categorías</span>
          </a>
        </div>
      </div>
    </div>
  );
}
