'use client';

import { useEffect, useState } from 'react';
import { supabase, Producto, Tienda, Categoria } from '@/lib/supabase';
import { Plus, Edit, Trash2, Package, Search, Filter } from 'lucide-react';
import ModalConfirmar from '../../components/ModalConfirmar';
import ModalProducto from '../../components/ModalProducto';

interface ProductoExtendido extends Producto {
  tienda?: Tienda;
  categoria?: Categoria;
  imagenes?: any[];
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<ProductoExtendido[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [tiendaFiltro, setTiendaFiltro] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [modalEliminar, setModalEliminar] = useState(false);
  const [productoEliminar, setProductoEliminar] = useState<{ id: string; nombre: string } | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [modalProducto, setModalProducto] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Resetear filtro de categoría cuando cambia la tienda
  useEffect(() => {
    setCategoriaFiltro('');
  }, [tiendaFiltro]);

  const fetchData = async () => {
    try {
      const [productosRes, tiendasRes, categoriasRes] = await Promise.all([
        supabase.from('productos').select('*').order('nombre'),
        supabase.from('tiendas').select('*'),
        supabase.from('categorias').select('*'),
      ]);

      if (productosRes.data && tiendasRes.data && categoriasRes.data) {
        // OPTIMIZACIÓN: Cargar TODAS las imágenes en una sola consulta (batch)
        const productosIds = productosRes.data.map(p => p.id);
        const { data: todasImagenes } = await supabase
          .from('imagenes_producto')
          .select('*')
          .in('producto_id', productosIds)
          .order('orden');

        // Crear un mapa de imágenes por producto (solo la primera)
        const imagenesPorProducto = (todasImagenes || []).reduce((acc, img) => {
          if (!acc[img.producto_id]) {
            acc[img.producto_id] = [img]; // Solo guardar la primera imagen
          }
          return acc;
        }, {} as Record<string, any[]>);

        // Combinar datos sin hacer consultas adicionales
        const productosConRelaciones = productosRes.data.map((prod) => ({
          ...prod,
          tienda: tiendasRes.data.find((t) => t.id === prod.tienda_id),
          categoria: categoriasRes.data.find((c) => c.id === prod.categoria_id),
          imagenes: imagenesPorProducto[prod.id] || [],
        }));

        setProductos(productosConRelaciones);
        setTiendas(tiendasRes.data);
        setCategorias(categoriasRes.data);
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
    const matchCategoria = !categoriaFiltro || producto.categoria_id === categoriaFiltro;
    return matchBusqueda && matchTienda && matchCategoria;
  });

  // Filtrar categorías según la tienda seleccionada
  const categoriasFiltradas = tiendaFiltro
    ? categorias.filter((cat) => cat.tienda_id === tiendaFiltro)
    : categorias;

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
    setProductoEliminar({ id, nombre });
    setModalEliminar(true);
  };

  const confirmarEliminar = async () => {
    if (!productoEliminar) return;
    
    setEliminando(true);
    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', productoEliminar.id);

      if (error) throw error;
      
      setModalEliminar(false);
      setProductoEliminar(null);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el producto');
    } finally {
      setEliminando(false);
    }
  };

  const cancelarEliminar = () => {
    setModalEliminar(false);
    setProductoEliminar(null);
  };

  const abrirModalNuevo = () => {
    setProductoEditar(null);
    setModalProducto(true);
  };

  const abrirModalEditar = (producto: Producto) => {
    setProductoEditar(producto);
    setModalProducto(true);
  };

  const cerrarModalProducto = () => {
    setModalProducto(false);
    setProductoEditar(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Productos</h1>
          <p className="text-sm text-gray-600">Gestiona el catálogo de productos</p>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={tiendaFiltro}
              onChange={(e) => setTiendaFiltro(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las tiendas</option>
              {tiendas.map((tienda) => (
                <option key={tienda.id} value={tienda.id}>
                  {tienda.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las categorías</option>
              {categoriasFiltradas.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
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
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="w-12 h-12" />
                  </div>
                )}
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

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={() => toggleActivo(producto.id, producto.activo)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      producto.activo
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {producto.activo ? '✓ Activo' : '✗ Inactivo'}
                  </button>
                  <button
                    onClick={() => toggleDisponible(producto.id, producto.disponible)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      producto.disponible
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    {producto.disponible ? '✓ Disponible' : '✗ No disponible'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => abrirModalEditar(producto)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => eliminarProducto(producto.id, producto.nombre)}
                    className="px-2 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
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
            {busqueda || tiendaFiltro || categoriaFiltro ? 'No se encontraron productos' : 'No hay productos registrados'}
          </p>
          {!busqueda && !tiendaFiltro && !categoriaFiltro && (
            <button
              onClick={abrirModalNuevo}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Crear primer producto
            </button>
          )}
        </div>
      )}

      {modalProducto && (
        <ModalProducto
          producto={productoEditar}
          onClose={cerrarModalProducto}
          onSuccess={fetchData}
        />
      )}

      {modalEliminar && productoEliminar && (
        <ModalConfirmar
          titulo="Eliminar Producto"
          mensaje={`¿Estás seguro de que deseas eliminar el producto "${productoEliminar.nombre}"? Esta acción no se puede deshacer y se eliminarán todas las imágenes asociadas.`}
          onConfirmar={confirmarEliminar}
          onCancelar={cancelarEliminar}
          loading={eliminando}
        />
      )}
    </div>
  );
}
