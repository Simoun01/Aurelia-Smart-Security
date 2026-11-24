import React from 'react';
import { Globe, RotateCcw, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { t, translateRole } from '../../i18n/translations';
import { UserRole } from '../../types';
import { getDisplayName } from '../../utils/display';

const ROLES: UserRole[] = ['customer', 'admin', 'front_desk', 'technician'];

export const WorkspaceBar: React.FC = () => {
  const { db, role, setRole, lang, setLang, activeTechnicianId, resetDemoData } = useApp();

  const activePerson =
    role === 'admin' || role === 'front_desk'
      ? db.staffUsers.find((u) => u.role === role)
      : role === 'technician'
      ? db.technicians.find((tc) => tc.id === activeTechnicianId)
      : null;

  return (
    <div className="bg-slate-900 text-slate-200 border-b border-slate-800 px-4 sm:px-6 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-x-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
            {t(lang, 'roleLabel')}
          </span>
          <div className="flex items-center gap-1 p-0.5 bg-slate-800 rounded-lg">
            {ROLES.map((r) => {
              const active = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  {translateRole(lang, r)}
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-slate-700 text-xs text-slate-300 whitespace-nowrap shrink-0">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">{t(lang, 'signedInAs')}:</span>
            <span className="font-medium text-white">
              {activePerson
                ? getDisplayName(activePerson, lang, 'text-slate-400 font-normal text-[0.85em] ml-1')
                : t(lang, 'guestCustomer')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            aria-label="Toggle language"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>{lang === 'en' ? t(lang, 'langToggleEn') : t(lang, 'langToggleZh')}</span>
          </button>

          <button
            type="button"
            onClick={resetDemoData}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t(lang, 'resetData')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
