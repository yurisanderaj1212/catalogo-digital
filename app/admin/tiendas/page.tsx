'use client';

import { useEffect, useState } from 'react';
import { supabase, Tienda } from '@/lib/supabase';
import { Plus, Edit, Trash2, MapPin, Phone, Store as StoreIcon } from 'lucide-react';
import ModalTienda from '../components/ModalTienda';

export default function TiendasPage() {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tiendaEditar, setTiendaEditar] = useState<Tienda | null>(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    fetchTiendas();
  }, []);

  const fetchTiendas = async () => {
    try {
      const { data, error } = await supabase
        .from('tiendas')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setTiendas(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const tiendasFiltradas = tiendas.filter((tienda) =>
    tienda.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const toggleActiva = async (id: string, activa: boolean) => {
    try {
      const { error } = await supabase
        .from('tiendas')
        .update({ activa: !activa })
        .eq('id', id);

      if (error) throw error;
      fetchTiendas();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar la tienda');
    }
  };

  const eliminarTienda = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar la tienda "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tiendas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTiendas();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la tienda');
    }
  };

  const abrirModalNuevo = () => {
    setTiendaEditar(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (tienda: Tienda) => {
    setTiendaEditar(tienda);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setTiendaEditar(null);
  };

  const abrirMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Tiendas</h1>
          <p className="text-gray-600">Administra las tiendas del catálogo</p>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Tienda</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar tiendas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {tiendasFiltradas.length > 0 ? (
        <div className="space-y-4">
          {tiendasFiltradas.map((tienda) => (
            <div
              key={tienda.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icono/Logo */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    {tienda.logo ? (
                      <img
                        src={tienda.logo}
                        alt={tienda.nombre}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <StoreIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  {/* Información principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {tienda.nombre}
                        </h3>
                        {tienda.descripcion && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {tienda.descripcion}
                          </p>
                        )}
                      </div>
                      <span
                        className={`ml-4 px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                          tienda.activa
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {tienda.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>

                    {/* Detalles */}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mb-4">
                      {tienda.direccion && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span>{tienda.direccion}</span>
                        </div>
                      )}
                      {tienda.telefono && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4 shrink-0" />
                          <span>{tienda.telefono}</span>
                        </div>
                      )}
                      {tienda.latitud && tienda.longitud && (
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="w-4 h-4 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                          </svg>
                          <span>
                            {tienda.latitud}, {tienda.longitud}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirModalEditar(tienda)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => eliminarTienda(tienda.id, tienda.nombre)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar</span>
                      </button>
                      {tienda.latitud && tienda.longitud && (
                        <button
                          onClick={() => abrirMaps(tienda.latitud!, tienda.longitud!)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded transition-colors"
                        >
                          <MapPin className="w-4 h-4" />
                          <span>Ver en Maps</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <StoreIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">
            {busqueda ? 'No se encontraron tiendas' : 'No hay tiendas registradas'}
          </p>
          {!busqueda && (
            <button
              onClick={abrirModalNuevo}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Crear primera tienda
            </button>
          )}
        </div>
      )}

      {modalAbierto && (
        <ModalTienda
          tienda={tiendaEditar}
          onClose={cerrarModal}
          onSuccess={fetchTiendas}
        />
      )}
    </div>
  );
}
