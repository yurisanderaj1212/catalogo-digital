'use client';

import { useEffect, useState } from 'react';
import { supabase, Producto, Tienda, Categoria } from '@/lib/supabase';
import { Plus, Edit, Trash2, Package, Search, Filter } from 'lucide-react';

interface ProductoExtendido extends Producto {
  tienda?: Tienda;
  categoria?: Categoria;
  imagenes?: any[];
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<ProductoExtendido[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [tiendaFiltro, setTiendaFiltro] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productosRes, tiendasRes, categoriasRes] = await Promise.all([
        supabase.from('productos').select('*').order('nombre'),
        supabase.from('tiendas').select('*'),
        supabase.from('categorias').select('*'),
      ]);

      if (productosRes.data && tiendasRes.data && categoriasRes.data) {
        const productosConRelaciones = await Promise.all(
          productosRes.data.map(async (prod) => {
            const { data: imagenes } = await supabase
              .from('imagenes_producto')
              .select('*')
              .eq('producto_id', prod.id)
              .order('orden')
              .limit(1);

            return {
              ...prod,
              tienda: tiendasRes.data.find((t) => t.id === prod.tienda_id),
              categoria: categoriasRes.data.find((c) => c.id === prod.categoria_id),
              imagenes: imagenes || [],
            };
          })
        );

        setProductos(productosConRelaciones);
        setTiendas(tiendasRes.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = productos.filter((producto) => {
    const matchBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchTienda = !tiendaFiltro || producto.tienda_id === tiendaFiltro;
    return matchBusqueda && matchTienda;
  });

  const toggleActivo = async (id: string, activo: boolean) => {
    try {
      await supabase.from('productos').update({ activo: !activo }).eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleDisponible = async (id: string, disponible: boolean) => {
    try {
      await supabase.from('productos').update({ disponible: !disponible }).eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const eliminarProducto = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar el producto "${nombre}"?`)) return;
    try {
      await supabase.from('productos').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el producto');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Productos</h1>
          <p className="text-gray-600">Gestiona el catálogo de productos</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={tiendaFiltro}
              onChange={(e) => setTiendaFiltro(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las tiendas</option>
              {tiendas.map((tienda) => (
                <option key={tienda.id} value={tienda.id}>
                  {tienda.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {productosFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {productosFiltrados.map((producto) => (
            <div
              key={producto.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-gray-100 relative">
                {producto.imagenes && producto.imagenes.length > 0 ? (
                  <img
                    src={producto.imagenes[0].url_imagen}
                    alt={producto.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => toggleActivo(producto.id, producto.activo)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      producto.activo
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}
                  >
                    {producto.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              </div>

              <div className="p-3">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
                  {producto.nombre}
                </h3>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-blue-600">
                    ${producto.precio.toLocaleString('es-CU')}
                  </span>
                  <span className="text-xs text-gray-500">CUP</span>
                </div>

                {producto.categoria && (
                  <p className="text-xs text-gray-500 mb-1">{producto.categoria.nombre}</p>
                )}
                {producto.tienda && (
                  <p className="text-xs text-gray-500 mb-2">{producto.tienda.nombre}</p>
                )}

                <button
                  onClick={() => toggleDisponible(producto.id, producto.disponible)}
                  className={`w-full mb-2 px-3 py-1.5 rounded text-xs font-medium ${
                    producto.disponible
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  {producto.disponible ? '✓ Disponible' : '✗ No disponible'}
                </button>

                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100">
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => eliminarProducto(producto.id, producto.nombre)}
                    className="px-2 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">
            {busqueda || tiendaFiltro ? 'No se encontraron productos' : 'No hay productos registrados'}
          </p>
          {!busqueda && !tiendaFiltro && (
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Crear primer producto
            </button>
          )}
        </div>
      )}
    </div>
  );
}
