'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Smartphone, Settings, DollarSign, History } from 'lucide-react';

const tabs = [
  { icon: LayoutDashboard, label: 'Dashboard',      href: '/admin/dashboard/automatizacion' },
  { icon: Smartphone,      label: 'Sesiones',       href: '/admin/dashboard/automatizacion/sesiones' },
  { icon: Settings,        label: 'Configuración',  href: '/admin/dashboard/automatizacion/configuracion' },
  { icon: DollarSign,      label: 'Precios',        href: '/admin/dashboard/automatizacion/precios' },
  { icon: History,         label: 'Historial',      href: '/admin/dashboard/automatizacion/historial' },
];

export default function AutomatizacionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Automatización WhatsApp</h1>
        <p className="text-sm text-gray-500">Gestiona el envío automático de productos a grupos</p>
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.href === '/admin/dashboard/automatizacion'
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
