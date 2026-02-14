'use client';

import { useEffect, useState } from 'react';
import { supabase, Categoria, Tienda } from '@/lib/supabase';
import { Plus, Edit, Trash2, Tag, Store, Filter } from 'lucide-react';
import ModalConfirmar from '../../components/ModalConfirmar';

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<(Categoria & { tienda?: Tienda })[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loading, setLoading] = useState(true);
  const [tiendaFiltro, setTiendaFiltro] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoriaEditar, setCategoriaEditar] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tienda_id: '',
    activa: true,
  });
  const [modalEliminar, setModalEliminar] = useState(false);
  const [categoriaEliminar, setCategoriaEliminar] = useState<{ id: string; nombre: string } | null>(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriasRes, tiendasRes] = await Promise.all([
        supabase.from('categorias').select('*').order('nombre'),
        supabase.from('tiendas').select('*').order('nombre'),
      ]);

      if (categoriasRes.data && tiendasRes.data) {
        const categoriasConTienda = categoriasRes.data.map((cat) => ({
          ...cat,
          tienda: tiendasRes.data.find((t) => t.id === cat.tienda_id),
        }));
        setCategorias(categoriasConTienda);
        setTiendas(tiendasRes.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNuevo = () => {
    setCategoriaEditar(null);
    setFormData({ nombre: '', tienda_id: '', activa: true });
    setModalAbierto(true);
  };

  const abrirModalEditar = (categoria: Categoria) => {
    setCategoriaEditar(categoria);
    setFormData({
      nombre: categoria.nombre,
      tienda_id: categoria.tienda_id,
      activa: categoria.activa,
    });
    setModalAbierto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (categoriaEditar) {
        await supabase.from('categorias').update(formData).eq('id', categoriaEditar.id);
      } else {
        await supabase.from('categorias').insert([formData]);
      }
      setModalAbierto(false);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la categoría');
    }
  };

  const eliminarCategoria = async (id: string, nombre: string) => {
    setCategoriaEliminar({ id, nombre });
    setModalEliminar(true);
  };

  const confirmarEliminar = async () => {
    if (!categoriaEliminar) return;
    
    setEliminando(true);
    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', categoriaEliminar.id);

      if (error) throw error;
      
      setModalEliminar(false);
      setCategoriaEliminar(null);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la categoría');
    } finally {
      setEliminando(false);
    }
  };

  const cancelarEliminar = () => {
    setModalEliminar(false);
    setCategoriaEliminar(null);
  };

  const toggleActiva = async (id: string, activa: boolean) => {
    try {
      await supabase.from('categorias').update({ activa: !activa }).eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const categoriasFiltradas = categorias.filter((categoria) => {
    const matchTienda = !tiendaFiltro || categoria.tienda_id === tiendaFiltro;
    return matchTienda;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Categorías</h1>
          <p className="text-sm text-gray-600">Organiza tus productos por categorías</p>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* Filtro por tienda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
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
      </div>

      {categoriasFiltradas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriasFiltradas.map((categoria) => (
            <div
              key={categoria.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <Tag className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">{categoria.nombre}</h3>
                </div>
                <button
                  onClick={() => toggleActiva(categoria.id, categoria.activa)}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    categoria.activa
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {categoria.activa ? 'Activa' : 'Inactiva'}
                </button>
              </div>

              {categoria.tienda && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Store className="w-4 h-4" />
                  <span>{categoria.tienda.nombre}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => abrirModalEditar(categoria)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => eliminarCategoria(categoria.id, categoria.nombre)}
                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">
            {tiendaFiltro ? 'No se encontraron categorías para esta tienda' : 'No hay categorías registradas'}
          </p>
          {!tiendaFiltro && (
            <button
              onClick={abrirModalNuevo}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear primera categoría
            </button>
          )}
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setModalAbierto(false)}>
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">
                {categoriaEditar ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tienda <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tienda_id}
                  onChange={(e) => setFormData({ ...formData, tienda_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecciona una tienda</option>
                  {tiendas.map((tienda) => (
                    <option key={tienda.id} value={tienda.id}>
                      {tienda.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activa"
                  checked={formData.activa}
                  onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="activa" className="text-sm font-medium text-gray-700">
                  Categoría activa
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalEliminar && categoriaEliminar && (
        <ModalConfirmar
          titulo="Eliminar Categoría"
          mensaje={`¿Estás seguro de que deseas eliminar la categoría "${categoriaEliminar.nombre}"? Los productos asociados quedarán sin categoría.`}
          onConfirmar={confirmarEliminar}
          onCancelar={cancelarEliminar}
          loading={eliminando}
        />
      )}
    </div>
  );
}
