'use client';

import { useEffect, useState } from 'react';
import { supabase, Categoria, Tienda } from '@/lib/supabase';
import { Plus, Edit, Trash2, Tag, Store, BellOff } from 'lucide-react';

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<(Categoria & { tienda?: Tienda })[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoriaEditar, setCategoriaEditar] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tienda_id: '',
    activa: true,
    excluir_publicacion: false,
  });

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
        const tiendasData = tiendasRes.data;
        const categoriasConTienda = categoriasRes.data.map((cat) => ({
          ...cat,
          tienda: tiendasData.find((t) => t.id === cat.tienda_id),
        }));
        setCategorias(categoriasConTienda);
        setTiendas(tiendasData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNuevo = () => {
    setCategoriaEditar(null);
    setFormData({ nombre: '', tienda_id: '', activa: true, excluir_publicacion: false });
    setModalAbierto(true);
  };

  const abrirModalEditar = (categoria: Categoria) => {
    setCategoriaEditar(categoria);
    setFormData({
      nombre: categoria.nombre,
      tienda_id: categoria.tienda_id,
      activa: categoria.activa,
      excluir_publicacion: categoria.excluir_publicacion ?? false,
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
    if (!confirm(`¿Eliminar la categoría "${nombre}"?`)) return;
    try {
      await supabase.from('categorias').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la categoría');
    }
  };

  const toggleActiva = async (id: string, activa: boolean) => {
    try {
      await supabase.from('categorias').update({ activa: !activa }).eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleExcluirPublicacion = async (id: string, excluir: boolean) => {
    try {
      await supabase.from('categorias').update({ excluir_publicacion: !excluir }).eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Categorías</h1>
          <p className="text-gray-600">Organiza tus productos por categorías</p>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* Aviso si hay categorías excluidas */}
      {categorias.some(c => c.excluir_publicacion) && (
        <div className="flex items-start gap-3 mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <BellOff className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <p>
            <strong>{categorias.filter(c => c.excluir_publicacion).map(c => c.nombre).join(', ')}</strong>
            {' '}— excluida{categorias.filter(c => c.excluir_publicacion).length > 1 ? 's' : ''} del ciclo de publicación del bot.
            Los productos de {categorias.filter(c => c.excluir_publicacion).length > 1 ? 'estas categorías siguen' : 'esta categoría sigue'} visibles en el catálogo.
          </p>
        </div>
      )}

      {categorias.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorias.map((categoria) => (
            <div
              key={categoria.id}
              className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow ${
                categoria.excluir_publicacion ? 'border-amber-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <Tag className="w-5 h-5 text-purple-600 shrink-0" />
                  <h3 className="font-semibold text-gray-900">{categoria.nombre}</h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
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
              </div>

              {categoria.tienda && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Store className="w-4 h-4" />
                  <span>{categoria.tienda.nombre}</span>
                </div>
              )}

              {/* Badge de exclusión de publicación */}
              {categoria.excluir_publicacion && (
                <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg">
                  <BellOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-xs text-amber-700 font-medium">Excluida de publicaciones WA</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => toggleExcluirPublicacion(categoria.id, categoria.excluir_publicacion ?? false)}
                  className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs transition-colors ${
                    categoria.excluir_publicacion
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                  title={categoria.excluir_publicacion ? 'Incluir en publicaciones' : 'Excluir de publicaciones'}
                >
                  <BellOff className="w-3.5 h-3.5" />
                  {categoria.excluir_publicacion ? 'Incluir' : 'Excluir'}
                </button>
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
          <p className="text-gray-600 text-lg mb-4">No hay categorías registradas</p>
          <button
            onClick={abrirModalNuevo}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Crear primera categoría
          </button>
        </div>
      )}

      {/* Modal crear/editar */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setModalAbierto(false)}>
          <div className="bg-white rounded-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
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

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <input
                  type="checkbox"
                  id="excluir_publicacion"
                  checked={formData.excluir_publicacion}
                  onChange={(e) => setFormData({ ...formData, excluir_publicacion: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded mt-0.5"
                />
                <div>
                  <label htmlFor="excluir_publicacion" className="text-sm font-medium text-amber-800 cursor-pointer">
                    Excluir del ciclo de publicación
                  </label>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Los productos de esta categoría no se publicarán en WhatsApp pero seguirán visibles en el catálogo.
                  </p>
                </div>
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
    </div>
  );
}
