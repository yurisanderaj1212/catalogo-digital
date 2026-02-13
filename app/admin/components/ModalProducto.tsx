'use client';

import { useState, useEffect } from 'react';
import { supabase, Producto, Tienda, Categoria } from '@/lib/supabase';
import { X, Plus, Trash2 } from 'lucide-react';

interface ModalProductoProps {
  producto: Producto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalProducto({ producto, onClose, onSuccess }: ModalProductoProps) {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState<Categoria[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    tienda_id: '',
    categoria_id: '',
    disponible: true,
    activo: true,
  });
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [nuevaImagen, setNuevaImagen] = useState('');
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [tipoSubida, setTipoSubida] = useState<'pc' | 'url'>('pc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTiendasYCategorias();
  }, []);

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio: producto.precio?.toString() || '',
        tienda_id: producto.tienda_id || '',
        categoria_id: producto.categoria_id || '',
        disponible: producto.disponible,
        activo: producto.activo,
      });
      fetchImagenes(producto.id);
    }
  }, [producto]);

  useEffect(() => {
    if (formData.tienda_id) {
      const catsFiltradas = categorias.filter(c => c.tienda_id === formData.tienda_id);
      setCategoriasFiltradas(catsFiltradas);
    } else {
      setCategoriasFiltradas([]);
    }
  }, [formData.tienda_id, categorias]);

  const fetchTiendasYCategorias = async () => {
    try {
      const [tiendasRes, categoriasRes] = await Promise.all([
        supabase.from('tiendas').select('*').eq('activa', true).order('nombre'),
        supabase.from('categorias').select('*').eq('activa', true).order('nombre'),
      ]);
      setTiendas(tiendasRes.data || []);
      setCategorias(categoriasRes.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchImagenes = async (productoId: string) => {
    try {
      const { data } = await supabase
        .from('imagenes_producto')
        .select('url_imagen')
        .eq('producto_id', productoId)
        .order('orden');
      setImagenes(data?.map(img => img.url_imagen) || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const agregarImagen = () => {
    if (nuevaImagen.trim()) {
      setImagenes([...imagenes, nuevaImagen.trim()]);
      setNuevaImagen('');
    }
  };

  const subirImagenDesdePC = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    setSubiendoImagen(true);
    try {
      // Crear nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `productos/${fileName}`;

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from('imagenes')
        .upload(filePath, file);

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('imagenes')
        .getPublicUrl(filePath);

      // Agregar URL a la lista de imágenes
      setImagenes([...imagenes, publicUrl]);
      
      // Resetear input
      e.target.value = '';
    } catch (error: any) {
      console.error('Error al subir imagen:', error);
      alert(error.message || 'Error al subir la imagen');
    } finally {
      setSubiendoImagen(false);
    }
  };

  const eliminarImagen = (index: number) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        precio: parseFloat(formData.precio),
      };

      let productoId = producto?.id;

      if (producto) {
        const { error } = await supabase
          .from('productos')
          .update(dataToSave)
          .eq('id', producto.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('productos')
          .insert([dataToSave])
          .select()
          .single();
        if (error) throw error;
        productoId = data.id;
      }

      // Guardar imágenes
      if (productoId) {
        await supabase.from('imagenes_producto').delete().eq('producto_id', productoId);
        
        if (imagenes.length > 0) {
          const imagenesData = imagenes.map((url, index) => ({
            producto_id: productoId,
            url_imagen: url,
            orden: index,
          }));
          await supabase.from('imagenes_producto').insert(imagenesData);
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio (CUP) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, tienda_id: e.target.value, categoria_id: '' })}
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={formData.categoria_id}
              onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!formData.tienda_id}
            >
              <option value="">Sin categoría</option>
              {categoriasFiltradas.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
            {!formData.tienda_id && (
              <p className="text-xs text-gray-500 mt-1">Selecciona una tienda primero</p>
            )}
          </div>

          {/* Imágenes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes</label>
            
            {/* Lista de imágenes */}
            {imagenes.length > 0 && (
              <div className="space-y-2 mb-3">
                {imagenes.map((img, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <img src={img} alt="" className="w-12 h-12 object-cover rounded" />
                    <span className="flex-1 text-sm text-gray-600 truncate">{img}</span>
                    <button
                      type="button"
                      onClick={() => eliminarImagen(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pestañas para tipo de subida */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setTipoSubida('pc')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  tipoSubida === 'pc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📁 Subir desde PC
              </button>
              <button
                type="button"
                onClick={() => setTipoSubida('url')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  tipoSubida === 'url'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔗 Agregar URL
              </button>
            </div>

            {/* Subir desde PC */}
            {tipoSubida === 'pc' && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={subirImagenDesdePC}
                  disabled={subiendoImagen}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer ${subiendoImagen ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {subiendoImagen ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-sm text-gray-600">Subiendo imagen...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                        <Plus className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        Haz clic para seleccionar una imagen
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            )}

            {/* Agregar por URL */}
            {tipoSubida === 'url' && (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={nuevaImagen}
                  onChange={(e) => setNuevaImagen(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={agregarImagen}
                  disabled={!nuevaImagen.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                Producto activo
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="disponible"
                checked={formData.disponible}
                onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
                className="w-4 h-4 text-green-600 rounded"
              />
              <label htmlFor="disponible" className="text-sm font-medium text-gray-700">
                Disponible
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
