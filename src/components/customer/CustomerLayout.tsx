import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { t } from '../../i18n/translations';
import { CustomerPage } from '../../types';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  const { lang, customerPage, setCustomerPage, setRole, setStaffPage } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: CustomerPage; label: string }[] = [
    { id: 'book-demo', label: t(lang, 'navBookDemo') },
    { id: 'request-service', label: t(lang, 'navTechService') },
    { id: 'warranty', label: t(lang, 'navWarranty') },
  ];

  const handleNavigate = (page: CustomerPage) => {
    setCustomerPage(page);
    setMobileMenuOpen(false);
  };

  const handleOpenStaff = () => {
    setRole('front_desk');
    setStaffPage('dashboard');
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fa] text-slate-900">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => handleNavigate('book-demo')}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t(lang, 'brandName')}
          </button>

          {/* Zone 2: Concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navItems.map((item) => {
              const active = customerPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-blue-700 text-slate-900 font-semibold'
                      : 'border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleOpenStaff}
              className="py-1 border-b-2 border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t(lang, 'navStaffDesk')}
            </button>
          </nav>

          {/* Zone 3: 1 Primary CTA + Mobile Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                handleNavigate('book-demo');
                const el = document.getElementById('booking-wizard');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t(lang, 'ctaBookDemo')}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                  customerPage === item.id
                    ? 'bg-blue-50 text-blue-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleOpenStaff}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              {t(lang, 'navStaffDesk')}
            </button>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700">{t(lang, 'brandName')}</span>
            <span aria-hidden="true">·</span>
            <span>{t(lang, 'footerTagline')}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavigate('book-demo')}
              className="hover:text-slate-900 cursor-pointer"
            >
              {t(lang, 'navBookDemo')}
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('request-service')}
              className="hover:text-slate-900 cursor-pointer"
            >
              {t(lang, 'navTechService')}
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('warranty')}
              className="hover:text-slate-900 cursor-pointer"
            >
              {t(lang, 'navWarranty')}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
