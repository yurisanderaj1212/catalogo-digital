'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Users, Plus, Trash2, Shield, ShieldOff, AlertCircle, CheckCircle } from 'lucide-react';

interface Admin {
  id: string;
  user_id: string;
  email: string;
  nombre: string | null;
  activo: boolean;
  es_super_admin: boolean;
  fecha_creacion: string;
}

export default function AdministradoresPage() {
  const { adminInfo, user } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAgregar, setModalAgregar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [adminEliminar, setAdminEliminar] = useState<Admin | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Formulario
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formEsSuperAdmin, setFormEsSuperAdmin] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('error', 'Error al cargar administradores');
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 5000);
  };

  const handleAgregarAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcesando(true);

    try {
      // Paso 1: Crear usuario en Supabase Auth (usando API route)
      const responseAuth = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formEmail,
          password: formPassword,
        }),
      });

      const authData = await responseAuth.json();

      if (!responseAuth.ok || authData.error) {
        throw new Error(authData.error || 'Error al crear usuario');
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // Paso 2: Agregar a tabla admins
      const { error: adminError } = await supabase
        .from('admins')
        .insert({
          user_id: authData.user.id,
          email: formEmail,
          nombre: formNombre || null,
          activo: true,
          es_super_admin: formEsSuperAdmin,
          creado_por: user?.id || null,  // Usar user.id del contexto
        });

      if (adminError) {
        // Si falla, intentar eliminar el usuario de auth
        await fetch('/api/admin/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: authData.user.id }),
        });
        throw new Error(`Error al agregar admin: ${adminError.message}`);
      }

      mostrarMensaje('success', 'Administrador agregado exitosamente');
      setModalAgregar(false);
      limpiarFormulario();
      fetchAdmins();
    } catch (error: any) {
      console.error('Error:', error);
      mostrarMensaje('error', error.message || 'Error al agregar administrador');
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminarAdmin = async () => {
    if (!adminEliminar) return;
    setProcesando(true);

    try {
      // Paso 1: Eliminar de tabla admins
      const { error: adminError } = await supabase
        .from('admins')
        .delete()
        .eq('id', adminEliminar.id);

      if (adminError) throw adminError;

      // Paso 2: Eliminar usuario de auth (usando API route)
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: adminEliminar.user_id }),
      });

      if (!response.ok) {
        console.error('Error al eliminar de auth');
        // No lanzar error, ya se eliminó de la tabla admins
      }

      mostrarMensaje('success', 'Administrador eliminado exitosamente');
      setModalEliminar(false);
      setAdminEliminar(null);
      fetchAdmins();
    } catch (error: any) {
      console.error('Error:', error);
      mostrarMensaje('error', error.message || 'Error al eliminar administrador');
    } finally {
      setProcesando(false);
    }
  };

  const handleToggleActivo = async (admin: Admin) => {
    try {
      const { error } = await supabase
        .from('admins')
        .update({ activo: !admin.activo })
        .eq('id', admin.id);

      if (error) throw error;

      mostrarMensaje('success', `Admin ${!admin.activo ? 'activado' : 'desactivado'} exitosamente`);
      fetchAdmins();
    } catch (error: any) {
      console.error('Error:', error);
      mostrarMensaje('error', 'Error al cambiar estado del admin');
    }
  };

  const limpiarFormulario = () => {
    setFormEmail('');
    setFormPassword('');
    setFormNombre('');
    setFormEsSuperAdmin(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Solo super admins pueden ver esta página
  if (!adminInfo?.es_super_admin) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600">Solo super administradores pueden gestionar admins</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7" />
            Administradores
          </h1>
          <p className="text-gray-600 mt-1">Gestiona los usuarios con acceso al panel admin</p>
        </div>
        <button
          onClick={() => setModalAgregar(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Agregar Admin
        </button>
      </div>

      {/* Mensaje de feedback */}
      {mensaje && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            mensaje.tipo === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {mensaje.tipo === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${mensaje.tipo === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {mensaje.texto}
          </p>
        </div>
      )}

      {/* Lista de admins */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Administrador
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Creación
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{admin.nombre || 'Sin nombre'}</div>
                    <div className="text-sm text-gray-500">{admin.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {admin.es_super_admin ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <Shield className="w-3 h-3" />
                      Super Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <ShieldOff className="w-3 h-3" />
                      Admin
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActivo(admin)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      admin.activo
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    {admin.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(admin.fecha_creacion).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setAdminEliminar(admin);
                      setModalEliminar(true);
                    }}
                    disabled={admin.user_id === user?.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={admin.user_id === user?.id ? 'No puedes eliminarte a ti mismo' : 'Eliminar'}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {admins.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay administradores registrados</p>
          </div>
        )}
      </div>

      {/* Modal Agregar Admin */}
      {modalAgregar && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl pointer-events-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Agregar Administrador</h2>
            
            <form onSubmit={handleAgregarAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre (opcional)
                </label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre del administrador"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="superadmin"
                  checked={formEsSuperAdmin}
                  onChange={(e) => setFormEsSuperAdmin(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="superadmin" className="text-sm text-gray-700">
                  Super Administrador (puede gestionar otros admins)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalAgregar(false);
                    limpiarFormulario();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={procesando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={procesando}
                >
                  {procesando ? 'Agregando...' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar Admin */}
      {modalEliminar && adminEliminar && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl pointer-events-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Eliminar Administrador</h2>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que deseas eliminar a este administrador?
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900">{adminEliminar.nombre || 'Sin nombre'}</p>
                <p className="text-sm text-gray-600">{adminEliminar.email}</p>
              </div>
              <p className="text-sm text-red-600 mt-4">
                Esta acción no se puede deshacer. El usuario perderá acceso al panel admin.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalEliminar(false);
                  setAdminEliminar(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={procesando}
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarAdmin}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={procesando}
              >
                {procesando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
