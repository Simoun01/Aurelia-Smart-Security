import React, { useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  Menu,
  Settings,
  Smartphone,
  Ticket,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { t, translateRole } from '../../i18n/translations';
import { StaffPage } from '../../types';
import { getDisplayName } from '../../utils/display';

interface StaffLayoutProps {
  children: React.ReactNode;
}

export const StaffLayout: React.FC<StaffLayoutProps> = ({ children }) => {
  const { db, lang, role, setRole, staffPage, setStaffPage, setCustomerPage, activeTechnicianId } =
    useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activePerson =
    role === 'admin' || role === 'front_desk'
      ? db.staffUsers.find((u) => u.role === role)
      : role === 'technician'
      ? db.technicians.find((tc) => tc.id === activeTechnicianId)
      : null;

  const allNavItems: {
    id: StaffPage;
    label: string;
    Icon: React.FC<{ className?: string }>;
    roles: ('admin' | 'front_desk' | 'technician')[];
  }[] = [
    {
      id: 'dashboard',
      label: t(lang, 'staffDashboard'),
      Icon: LayoutDashboard,
      roles: ['admin', 'front_desk'],
    },
    {
      id: 'calendar',
      label: t(lang, 'staffCalendar'),
      Icon: CalendarDays,
      roles: ['admin', 'front_desk', 'technician'],
    },
    {
      id: 'tickets',
      label: t(lang, 'staffTickets'),
      Icon: Ticket,
      roles: ['admin', 'front_desk', 'technician'],
    },
    {
      id: 'technician',
      label: t(lang, 'staffTechView'),
      Icon: Smartphone,
      roles: ['admin', 'front_desk', 'technician'],
    },
    {
      id: 'installations',
      label: t(lang, 'staffInstallations'),
      Icon: CheckSquare,
      roles: ['admin', 'front_desk', 'technician'],
    },
    {
      id: 'settings',
      label: t(lang, 'staffSettings'),
      Icon: Settings,
      roles: ['admin', 'front_desk'],
    },
  ];

  const visibleNav = allNavItems.filter((item) =>
    role === 'customer' ? false : item.roles.includes(role)
  );

  const currentNavLabel =
    allNavItems.find((item) => item.id === staffPage)?.label || t(lang, 'staffDashboard');

  const handleSelectPage = (page: StaffPage) => {
    setStaffPage(page);
    setSidebarOpen(false);
  };

  const handleBackToCustomer = () => {
    setRole('customer');
    setCustomerPage('book-demo');
  };

  const SidebarContent = (
    <div className="h-full flex flex-col justify-between bg-[#eef2f6] border-r border-slate-200 p-4">
      <div className="space-y-6">
        <div className="px-2 pt-1">
          <div className="text-base font-bold text-slate-900 tracking-tight">
            {t(lang, 'brandName')}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {t(lang, 'staffPortalTitle')} · {translateRole(lang, role)}
          </div>
        </div>

        <nav className="space-y-1">
          {visibleNav.map(({ id, label, Icon }) => {
            const active = staffPage === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSelectPage(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-white text-blue-800 shadow-sm border border-slate-200/80 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-700' : 'text-slate-500'}`} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-200 space-y-2">
        {activePerson && (
          <div className="px-3 py-2 rounded-lg bg-white/70 border border-slate-200/80 text-xs">
            <div className="text-slate-400">{translateRole(lang, role)}</div>
            <div className="font-semibold text-slate-900 mt-0.5 truncate">
              {getDisplayName(activePerson, lang)}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleBackToCustomer}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white/70 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>{t(lang, 'backToCustomer')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#f4f7fa] text-slate-900">
      <aside className="hidden lg:block w-64 shrink-0">{SidebarContent}</aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 w-64 max-w-[80vw] h-full shadow-xl">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-lg text-slate-500 hover:bg-white cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-slate-400 hidden sm:inline">{t(lang, 'staffPortalTitle')}</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-semibold text-slate-900 truncate">{currentNavLabel}</span>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-medium whitespace-nowrap shrink-0">
            {activePerson ? getDisplayName(activePerson, lang) : translateRole(lang, role)}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
