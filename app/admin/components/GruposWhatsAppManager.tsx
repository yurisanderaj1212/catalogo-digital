'use client';

import { useState } from 'react';
import { GrupoWhatsApp } from '@/lib/supabase';
import { validarEnlaceWhatsApp, validarNombreGrupo } from '@/lib/validators';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';

interface GruposWhatsAppManagerProps {
  grupos: GrupoWhatsApp[];
  onChange: (grupos: GrupoWhatsApp[]) => void;
}

export default function GruposWhatsAppManager({ grupos, onChange }: GruposWhatsAppManagerProps) {
  const [editando, setEditando] = useState<string | null>(null);
  const [formulario, setFormulario] = useState({ nombre: '', enlace: '' });
  const [error, setError] = useState('');

  const gruposActivos = grupos.filter(g => g.activo);

  const limpiarFormulario = () => {
    setFormulario({ nombre: '', enlace: '' });
    setEditando(null);
    setError('');
  };

  const validarFormulario = (): boolean => {
    if (!validarNombreGrupo(formulario.nombre)) {
      setError('El nombre del grupo no puede estar vacío');
      return false;
    }

    if (!validarEnlaceWhatsApp(formulario.enlace)) {
      setError('El enlace debe tener el formato: https://chat.whatsapp.com/...');
      return false;
    }

    if (gruposActivos.length >= 10 && !editando) {
      setError('Máximo 10 grupos por tienda');
      return false;
    }

    return true;
  };

  const agregarGrupo = () => {
    if (!validarFormulario()) return;

    const nuevoGrupo: GrupoWhatsApp = {
      id: `temp-${Date.now()}`, // ID temporal, se generará en el servidor
      tienda_id: '', // Se asignará al guardar la tienda
      nombre: formulario.nombre.trim(),
      enlace: formulario.enlace.trim(),
      orden: gruposActivos.length,
      activo: true,
      fecha_creacion: new Date().toISOString(),
    };

    onChange([...grupos, nuevoGrupo]);
    limpiarFormulario();
  };

  const editarGrupo = (grupo: GrupoWhatsApp) => {
    setFormulario({ nombre: grupo.nombre, enlace: grupo.enlace });
    setEditando(grupo.id);
    setError('');
  };

  const guardarEdicion = () => {
    if (!validarFormulario()) return;

    const gruposActualizados = grupos.map(g =>
      g.id === editando
        ? { ...g, nombre: formulario.nombre.trim(), enlace: formulario.enlace.trim() }
        : g
    );

    onChange(gruposActualizados);
    limpiarFormulario();
  };

  const eliminarGrupo = (id: string) => {
    const gruposActualizados = grupos.map(g =>
      g.id === id ? { ...g, activo: false } : g
    );
    onChange(gruposActualizados);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Grupos de WhatsApp</h3>
        <span className="text-xs text-gray-500">{gruposActivos.length}/10 grupos</span>
      </div>

      {/* Lista de grupos existentes */}
      {gruposActivos.length > 0 && (
        <div className="space-y-2">
          {gruposActivos.map((grupo, index) => (
            <div
              key={grupo.id}
              className="bg-gray-50 rounded-lg p-3 border border-gray-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {grupo.nombre}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {grupo.enlace}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => editarGrupo(grupo)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarGrupo(grupo.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario para agregar/editar */}
      <div className="border border-gray-300 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">
            {editando ? 'Editar Grupo' : 'Agregar Grupo'}
          </h4>
          {editando && (
            <button
              type="button"
              onClick={limpiarFormulario}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-800">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Nombre del grupo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formulario.nombre}
            onChange={(e) => {
              setFormulario({ ...formulario, nombre: e.target.value });
              setError('');
            }}
            placeholder="Ej: Grupo #1 - Ofertas"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Enlace de invitación <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={formulario.enlace}
            onChange={(e) => {
              setFormulario({ ...formulario, enlace: e.target.value });
              setError('');
            }}
            placeholder="https://chat.whatsapp.com/..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Copia el enlace de invitación desde WhatsApp
          </p>
        </div>

        <button
          type="button"
          onClick={editando ? guardarEdicion : agregarGrupo}
          className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          {editando ? (
            <>
              <Edit2 className="w-4 h-4" />
              Guardar Cambios
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Agregar Grupo
            </>
          )}
        </button>
      </div>

      {gruposActivos.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No hay grupos configurados. Agrega el primer grupo arriba.
        </p>
      )}
    </div>
  );
}
