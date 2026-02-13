'use client';

import { useEffect, useState } from 'react';
import { supabase, Tienda } from '@/lib/supabase';
import { Plus, Edit, Trash2, MapPin, Phone, MessageCircle } from 'lucide-react';
import ModalTienda from '../../components/ModalTienda';
import ModalConfirmar from '../../components/ModalConfirmar';

export default function TiendasPage() {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tiendaEditar, setTiendaEditar] = useState<Tienda | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [modalEliminar, setModalEliminar] = useState(false);
  const [tiendaEliminar, setTiendaEliminar] = useState<{ id: string; nombre: string } | null>(null);
  const [eliminando, setEliminando] = useState(false);

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

  const eliminarTienda = async (id: string, nombre: string) => {
    setTiendaEliminar({ id, nombre });
    setModalEliminar(true);
  };

  const confirmarEliminar = async () => {
    if (!tiendaEliminar) return;
    
    setEliminando(true);
    try {
      const { error } = await supabase
        .from('tiendas')
        .delete()
        .eq('id', tiendaEliminar.id);

      if (error) throw error;
      
      setModalEliminar(false);
      setTiendaEliminar(null);
      fetchTiendas();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la tienda');
    } finally {
      setEliminando(false);
    }
  };

  const cancelarEliminar = () => {
    setModalEliminar(false);
    setTiendaEliminar(null);
  };

  const abrirModalNuevo = () => {
    setTiendaEditar(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (tienda: Tienda) => {
    setTiendaEditar(tienda);
    setModalAbierto(true);
  };

  const abrirMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Gestión de Tiendas</h1>
          <p className="text-sm text-gray-600">Administra las tiendas del catálogo</p>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Tienda</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
          <input
            type="text"
            placeholder="Buscar tiendas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de tiendas */}
      {tiendasFiltradas.length > 0 ? (
        <div className="space-y-3">
          {tiendasFiltradas.map((tienda) => (
            <div
              key={tienda.id}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex gap-4">
                {/* Icono */}
                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                  {tienda.logo ? (
                    <img
                      src={tienda.logo}
                      alt={tienda.nombre}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-0.5">
                        {tienda.nombre}
                      </h3>
                      {tienda.descripcion && (
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {tienda.descripcion}
                        </p>
                      )}
                    </div>
                    <span
                      className={`ml-4 px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                        tienda.activa
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {tienda.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  {/* Detalles */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mb-3">
                    {tienda.direccion && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="line-clamp-1">{tienda.direccion}</span>
                      </div>
                    )}
                    {tienda.telefono && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{tienda.telefono}</span>
                      </div>
                    )}
                    {tienda.latitud && tienda.longitud && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        <span>{tienda.latitud}, {tienda.longitud}</span>
                      </div>
                    )}
                  </div>

                  {/* Botones */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirModalEditar(tienda)}
                      className="flex items-center gap-1 px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => eliminarTienda(tienda.id, tienda.nombre)}
                      className="flex items-center gap-1 px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                    {tienda.latitud && tienda.longitud && (
                      <button
                        onClick={() => abrirMaps(tienda.latitud!, tienda.longitud!)}
                        className="flex items-center gap-1 px-3 py-1 text-xs text-teal-600 hover:bg-teal-50 rounded transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Ver en Maps</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-600 mb-4">
            {busqueda ? 'No se encontraron tiendas' : 'No hay tiendas registradas'}
          </p>
          {!busqueda && (
            <button
              onClick={abrirModalNuevo}
              className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
            >
              Crear primera tienda
            </button>
          )}
        </div>
      )}

      {modalAbierto && (
        <ModalTienda
          tienda={tiendaEditar}
          onClose={() => setModalAbierto(false)}
          onSuccess={fetchTiendas}
        />
      )}

      {modalEliminar && tiendaEliminar && (
        <ModalConfirmar
          titulo="Eliminar Tienda"
          mensaje={`¿Estás seguro de que deseas eliminar la tienda "${tiendaEliminar.nombre}"? Esta acción no se puede deshacer y se eliminarán todos los productos asociados.`}
          onConfirmar={confirmarEliminar}
          onCancelar={cancelarEliminar}
          loading={eliminando}
        />
      )}
    </div>
  );
}
