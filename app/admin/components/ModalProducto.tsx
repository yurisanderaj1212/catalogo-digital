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
  const [tiendasSeleccionadas, setTiendasSeleccionadas] = useState<string[]>([]); // Array de IDs de tiendas
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    moneda: 'CUP' as 'CUP' | 'USD' | 'EUR',
    categoria_id: '',
    disponible: true,
    activo: true,
    tipo_venta: 'unidad_sola' as 'unidad_caja' | 'unidad_sola' | 'carnico' | 'paquete',
    unidades_por_caja: '' as string,
    unidad_peso: '' as 'kg' | 'lb' | 'ambos' | '',
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
        moneda: producto.moneda || 'CUP',
        categoria_id: producto.categoria_id || '',
        disponible: producto.disponible,
        activo: producto.activo,
        tipo_venta: producto.tipo_venta || 'unidad_sola',
        unidades_por_caja: producto.unidades_por_caja?.toString() || '',
        unidad_peso: producto.unidad_peso || '',
      });
      fetchImagenes(producto.id);
      fetchTiendasProducto(producto.id);
    }
  }, [producto]);

  // Las categorías son globales: se muestran todas sin filtrar por tienda

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

  const fetchTiendasProducto = async (productoId: string) => {
    try {
      const { data } = await supabase
        .from('productos_tiendas')
        .select('tienda_id')
        .eq('producto_id', productoId);
      
      if (data) {
        setTiendasSeleccionadas(data.map(pt => pt.tienda_id));
      }
    } catch (error) {
      console.error('Error al cargar tiendas del producto:', error);
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
      // Subir a Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'productos_preset');
      formData.append('folder', 'productos');
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error al subir imagen a Cloudinary');
      }

      const data = await response.json();
      
      // Agregar URL optimizada a la lista de imágenes
      setImagenes([...imagenes, data.secure_url]);
      
      // Resetear input
      e.target.value = '';
    } catch (error: any) {
      console.error('Error al subir imagen:', error);
      alert(error.message || 'Error al subir la imagen. Verifica tu conexión.');
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

    // Validar que se haya seleccionado al menos una tienda
    if (tiendasSeleccionadas.length === 0) {
      setError('Debes seleccionar al menos una tienda');
      return;
    }

    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        precio: parseFloat(formData.precio),
        tienda_id: tiendasSeleccionadas[0],
        unidades_por_caja: formData.unidades_por_caja !== '' ? parseInt(formData.unidades_por_caja) : null,
        unidad_peso: formData.unidad_peso !== '' ? formData.unidad_peso : null,
      };

      let productoId = producto?.id;

      if (producto) {
        // Actualizar producto existente
        const { error } = await supabase
          .from('productos')
          .update(dataToSave)
          .eq('id', producto.id);
        if (error) throw error;
      } else {
        // Crear nuevo producto
        const { data, error } = await supabase
          .from('productos')
          .insert([dataToSave])
          .select()
          .single();
        if (error) throw error;
        productoId = data.id;
      }

      // Guardar relaciones con tiendas
      if (productoId) {
        // Eliminar relaciones anteriores
        await supabase
          .from('productos_tiendas')
          .delete()
          .eq('producto_id', productoId);

        // Insertar nuevas relaciones
        const relacionesData = tiendasSeleccionadas.map(tiendaId => ({
          producto_id: productoId,
          tienda_id: tiendaId,
        }));
        
        const { error: relacionesError } = await supabase
          .from('productos_tiendas')
          .insert(relacionesData);
        
        if (relacionesError) throw relacionesError;

        // Guardar imágenes
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
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="0.00"
                />
                <select
                  value={formData.moneda}
                  onChange={(e) => setFormData({ ...formData, moneda: e.target.value as 'CUP' | 'USD' | 'EUR' })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                >
                  <option value="CUP">CUP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiendas donde se vende <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
                {tiendas.map((tienda) => (
                  <label key={tienda.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={tiendasSeleccionadas.includes(tienda.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTiendasSeleccionadas([...tiendasSeleccionadas, tienda.id]);
                        } else {
                          setTiendasSeleccionadas(tiendasSeleccionadas.filter(id => id !== tienda.id));
                          // Limpiar categoría si se desmarca la última tienda
                          if (tiendasSeleccionadas.length === 1) {
                            setFormData({ ...formData, categoria_id: '' });
                          }
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">{tienda.nombre}</span>
                  </label>
                ))}
              </div>
              {tiendasSeleccionadas.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Selecciona al menos una tienda</p>
              )}
            </div>
          </div>

          {/* Tipo de venta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de venta</label>
            <div className="grid grid-cols-2 gap-2">
              {(['unidad_sola', 'unidad_caja', 'carnico', 'paquete'] as const).map((tipo) => (
                <label key={tipo} className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${formData.tipo_venta === tipo ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                  <input type="radio" name="tipo_venta" value={tipo} checked={formData.tipo_venta === tipo}
                    onChange={() => setFormData({ ...formData, tipo_venta: tipo, unidades_por_caja: '', unidad_peso: '' })}
                    className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {tipo === 'unidad_sola' ? 'Unidad sola' : tipo === 'unidad_caja' ? 'Unidad + caja' : tipo === 'carnico' ? 'Cárnico' : 'Paquete'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Campos condicionales según tipo_venta */}
          {(formData.tipo_venta === 'unidad_caja' || formData.tipo_venta === 'paquete') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.tipo_venta === 'paquete' ? 'Unidades por paquete' : 'Unidades por caja'}
              </label>
              <input type="number" min="1" value={formData.unidades_por_caja}
                onChange={(e) => setFormData({ ...formData, unidades_por_caja: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 50" />
              {formData.tipo_venta === 'unidad_caja' && formData.precio && formData.unidades_por_caja && (
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  Precio caja: ${(parseFloat(formData.precio) * parseInt(formData.unidades_por_caja)).toLocaleString('es-CU')} {formData.moneda}
                </p>
              )}
            </div>
          )}

          {formData.tipo_venta === 'carnico' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unidad de peso</label>
              <div className="flex gap-3">
                {(['kg', 'lb', 'ambos'] as const).map((u) => (
                  <label key={u} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg cursor-pointer transition-colors ${formData.unidad_peso === u ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <input type="radio" name="unidad_peso" value={u} checked={formData.unidad_peso === u}
                      onChange={() => setFormData({ ...formData, unidad_peso: u })}
                      className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">{u}</span>
                  </label>
                ))}
              </div>
              {formData.precio && (
                <div className="mt-2 space-y-0.5">
                  {(formData.unidad_peso === 'kg' || formData.unidad_peso === 'ambos') && (
                    <p className="text-xs text-blue-600 font-medium">Precio/kg: ${parseFloat(formData.precio).toLocaleString('es-CU')} {formData.moneda}</p>
                  )}
                  {(formData.unidad_peso === 'lb' || formData.unidad_peso === 'ambos') && (
                    <p className="text-xs text-green-600 font-medium">Precio/lb: ${(parseFloat(formData.precio) / 2.205).toFixed(0)} {formData.moneda}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>            <select
              value={formData.categoria_id}
              onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={tiendasSeleccionadas.length === 0}
            >
              <option value="">Sin categoría</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
            {tiendasSeleccionadas.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">Selecciona al menos una tienda primero</p>
            )}
          </div>

          {/* Imágenes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes</label>
            
            {/* Lista de imágenes */}
            {imagenes.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {imagenes.map((img, index) => (
                  <div key={index} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg">
                    <img src={img} alt="" className="w-10 h-10 object-cover rounded" />
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
            <div className="flex gap-2 mb-2">
              <label
                htmlFor="file-upload"
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-center ${
                  tipoSubida === 'pc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${subiendoImagen ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {subiendoImagen ? '⏳ Subiendo...' : '📁 Subir desde PC'}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={subirImagenDesdePC}
                disabled={subiendoImagen}
                className="hidden"
                id="file-upload"
              />
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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
