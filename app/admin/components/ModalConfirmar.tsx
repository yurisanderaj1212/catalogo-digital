'use client';

import { AlertTriangle, X } from 'lucide-react';

interface ModalConfirmarProps {
  titulo: string;
  mensaje: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  loading?: boolean;
}

export default function ModalConfirmar({
  titulo,
  mensaje,
  onConfirmar,
  onCancelar,
  loading = false,
}: ModalConfirmarProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancelar}>
      <div
        className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{titulo}</h3>
              <p className="text-sm text-gray-600">{mensaje}</p>
            </div>
            <button
              onClick={onCancelar}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancelar}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
