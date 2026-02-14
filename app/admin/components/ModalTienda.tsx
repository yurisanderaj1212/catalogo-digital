'use client';

import { useState, useEffect } from 'react';
import { supabase, Tienda, GrupoWhatsApp } from '@/lib/supabase';
import { validarHorarios, validarDiasLaborales } from '@/lib/validators';
import { X, Clock } from 'lucide-react';
import GruposWhatsAppManager from './GruposWhatsAppManager';

interface ModalTiendaProps {
  tienda: Tienda | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalTienda({ tienda, onClose, onSuccess }: ModalTiendaProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    logo: '',
    direccion: '',
    telefono: '',
    whatsapp: '',
    latitud: '',
    longitud: '',
    activa: true,
    hora_apertura: '',
    hora_cierre: '',
    dias_laborales: [] as string[],
  });
  const [grupos, setGrupos] = useState<GrupoWhatsApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tienda) {
      setFormData({
        nombre: tienda.nombre || '',
        descripcion: tienda.descripcion || '',
        logo: tienda.logo || '',
        direccion: tienda.direccion || '',
        telefono: tienda.telefono || '',
        whatsapp: tienda.whatsapp || '',
        latitud: tienda.latitud?.toString() || '',
        longitud: tienda.longitud?.toString() || '',
        activa: tienda.activa,
        hora_apertura: tienda.hora_apertura || '',
        hora_cierre: tienda.hora_cierre || '',
        dias_laborales: tienda.dias_laborales || [],
      });
      
      // Cargar grupos existentes
      fetchGrupos(tienda.id);
    }
  }, [tienda]);

  const fetchGrupos = async (tiendaId: string) => {
    try {
      const { data, error } = await supabase
        .from('grupos_whatsapp')
        .select('*')
        .eq('tienda_id', tiendaId)
        .order('orden');

      if (error) throw error;
      setGrupos(data || []);
    } catch (err) {
      console.error('Error al cargar grupos:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validar horarios si están configurados
      if (formData.hora_apertura && formData.hora_cierre) {
        if (!validarHorarios(formData.hora_apertura, formData.hora_cierre)) {
          setError('La hora de apertura debe ser anterior a la hora de cierre');
          setLoading(false);
          return;
        }
      }

      // Validar días laborales si hay horarios
      if ((formData.hora_apertura || formData.hora_cierre) && formData.dias_laborales.length === 0) {
        setError('Debes seleccionar al menos un día laboral');
        setLoading(false);
        return;
      }

      const dataToSave = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        logo: formData.logo || null,
        direccion: formData.direccion || null,
        telefono: formData.telefono || null,
        whatsapp: formData.whatsapp || null,
        latitud: formData.latitud ? parseFloat(formData.latitud) : null,
        longitud: formData.longitud ? parseFloat(formData.longitud) : null,
        activa: formData.activa,
        hora_apertura: formData.hora_apertura || null,
        hora_cierre: formData.hora_cierre || null,
        dias_laborales: formData.dias_laborales.length > 0 ? formData.dias_laborales : null,
      };

      let tiendaId: string;

      if (tienda) {
        // Actualizar tienda existente
        const { error } = await supabase
          .from('tiendas')
          .update(dataToSave)
          .eq('id', tienda.id);
        if (error) throw error;
        tiendaId = tienda.id;
      } else {
        // Crear nueva tienda
        const { data, error } = await supabase
          .from('tiendas')
          .insert([dataToSave])
          .select()
          .single();
        if (error) throw error;
        tiendaId = data.id;
      }

      // Guardar grupos de WhatsApp
      await guardarGrupos(tiendaId);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la tienda');
    } finally {
      setLoading(false);
    }
  };

  const guardarGrupos = async (tiendaId: string) => {
    try {
      // Eliminar grupos que fueron marcados como inactivos
      const gruposInactivos = grupos.filter(g => !g.activo && !g.id.startsWith('temp-'));
      
      for (const grupo of gruposInactivos) {
        const { error } = await supabase
          .from('grupos_whatsapp')
          .update({ activo: false })
          .eq('id', grupo.id);
        if (error) throw error;
      }

      // Actualizar o insertar grupos activos
      const gruposActivos = grupos.filter(g => g.activo);
      
      for (let i = 0; i < gruposActivos.length; i++) {
        const grupo = gruposActivos[i];
        const grupoData = {
          tienda_id: tiendaId,
          nombre: grupo.nombre,
          enlace: grupo.enlace,
          orden: i,
          activo: true,
        };

        if (grupo.id.startsWith('temp-')) {
          // Insertar nuevo grupo
          const { error } = await supabase
            .from('grupos_whatsapp')
            .insert([grupoData]);
          if (error) throw error;
        } else {
          // Actualizar grupo existente
          const { error } = await supabase
            .from('grupos_whatsapp')
            .update(grupoData)
            .eq('id', grupo.id);
          if (error) throw error;
        }
      }
    } catch (err) {
      console.error('Error al guardar grupos:', err);
      throw err;
    }
  };

  const toggleDiaLaboral = (dia: string) => {
    setFormData(prev => ({
      ...prev,
      dias_laborales: prev.dias_laborales.includes(dia)
        ? prev.dias_laborales.filter(d => d !== dia)
        : [...prev.dias_laborales, dia]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {tienda ? 'Editar Tienda' : 'Nueva Tienda'}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+53 5555 5555"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+53 5555 5555"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
              <input
                type="number"
                step="any"
                value={formData.latitud}
                onChange={(e) => setFormData({ ...formData, latitud: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="23.1136"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
              <input
                type="number"
                step="any"
                value={formData.longitud}
                onChange={(e) => setFormData({ ...formData, longitud: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="-82.3666"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo (URL)</label>
            <input
              type="url"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://ejemplo.com/logo.png"
            />
          </div>

          {/* Sección de Horarios */}
          <div className="border-t pt-4 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-600" />
              <h3 className="text-base font-semibold text-gray-900">Horarios de Operación</h3>
            </div>
            
            <div className="space-y-4 bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de Apertura
                  </label>
                  <input
                    type="time"
                    value={formData.hora_apertura}
                    onChange={(e) => setFormData({ ...formData, hora_apertura: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de Cierre
                  </label>
                  <input
                    type="time"
                    value={formData.hora_cierre}
                    onChange={(e) => setFormData({ ...formData, hora_cierre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días Laborales
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dia) => (
                    <label
                      key={dia}
                      className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.dias_laborales.includes(dia)}
                        onChange={() => toggleDiaLaboral(dia)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm capitalize">{dia}</span>
                    </label>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Los horarios son opcionales. Si no los configuras, no se mostrarán en el catálogo.
              </p>
            </div>
          </div>

          {/* Sección de Grupos de WhatsApp */}
          <div className="border-t pt-4 mt-6">
            <GruposWhatsAppManager grupos={grupos} onChange={setGrupos} />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activa"
              checked={formData.activa}
              onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="activa" className="text-sm font-medium text-gray-700">
              Tienda activa
            </label>
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
