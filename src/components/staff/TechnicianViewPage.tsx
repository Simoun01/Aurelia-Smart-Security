import React, { useMemo } from 'react';
import { Camera, CheckCircle2, MapPin, Navigation, Phone, Wrench } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateISO } from '../../data/seedData';
import {
  t,
  translateInstallationStatus,
  translateTicketStatus,
} from '../../i18n/translations';
import { InstallationChecklist } from '../../types';
import {
  formatDateLocale,
  getDisplayName,
  getPlainDisplayName,
} from '../../utils/display';
import { ResilientImage } from '../shared/ResilientImage';

export const TechnicianViewPage: React.FC = () => {
  const {
    db,
    lang,
    activeTechnicianId,
    setActiveTechnicianId,
    updateTicket,
    updateInstallationJob,
    toggleInstallationStep,
    pushToast,
  } = useApp();

  const today = formatDateISO(new Date());

  const getProductName = (id: string) => {
    const p = db.products.find((pr) => pr.id === id);
    return p ? (lang === 'en' ? p.nameEn : p.nameZh) : '';
  };

  const todaysInstalls = useMemo(
    () =>
      db.installationJobs.filter(
        (j) => j.assignedTechnicianId === activeTechnicianId && j.preferredDate === today
      ),
    [db.installationJobs, activeTechnicianId, today]
  );

  const todaysTickets = useMemo(
    () =>
      db.tickets.filter(
        (tk) =>
          tk.assignedTechnicianId === activeTechnicianId &&
          (tk.scheduledDate === today ||
            tk.status === 'Assigned' ||
            tk.status === 'In Progress')
      ),
    [db.tickets, activeTechnicianId, today]
  );

  const completedCount =
    todaysInstalls.filter((j) => j.status === 'Completed').length +
    todaysTickets.filter((tk) => tk.status === 'Resolved' || tk.status === 'Closed').length;

  const totalJobs = todaysInstalls.length + todaysTickets.length;

  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: 'install' | 'ticket',
    id: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (kind === 'install') {
          updateInstallationJob(id, { completionPhotoUrl: reader.result });
        } else {
          updateTicket(id, { completionPhotoUrl: reader.result });
        }
        pushToast({ title: t(lang, 'completionPhotoAttached'), variant: 'success' });
      }
    };
    reader.readAsDataURL(file);
  };

  const mapUrl = (address: string) =>
    `https://maps.google.com/?q=${encodeURIComponent(address)}`;

  const checklistSteps: { key: keyof InstallationChecklist; label: string }[] = [
    { key: 'siteCheck', label: t(lang, 'stepSiteCheck') },
    { key: 'mounting', label: t(lang, 'stepMounting') },
    { key: 'programming', label: t(lang, 'stepProgramming') },
    { key: 'customerDemo', label: t(lang, 'stepCustomerDemo') },
    { key: 'signOff', label: t(lang, 'stepSignOff') },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">{t(lang, 'techViewTitle')}</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
            {formatDateLocale(today, lang, true)}
          </p>
        </div>

        <label className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
            {t(lang, 'techViewingAs')}:
          </span>
          <select
            value={activeTechnicianId}
            onChange={(e) => setActiveTechnicianId(e.target.value)}
            className="min-h-[44px] px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl"
          >
            {db.technicians.map((tc) => (
              <option key={tc.id} value={tc.id}>
                {getPlainDisplayName(tc, lang)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="text-xs text-slate-500">{t(lang, 'techTodaysJobs')}</div>
          <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {totalJobs}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="text-xs text-slate-500">{t(lang, 'techCompletedToday')}</div>
          <div className="font-mono text-2xl font-bold text-emerald-700 tabular-nums mt-1">
            {completedCount}
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200 rounded-2xl p-4">
          <div className="text-xs text-slate-500">{t(lang, 'techPendingAction')}</div>
          <div className="font-mono text-2xl font-bold text-blue-700 tabular-nums mt-1">
            {Math.max(0, totalJobs - completedCount)}
          </div>
        </div>
      </div>

      {totalJobs === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">
          {t(lang, 'noJobsTodayTech')}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {todaysInstalls.map((job) => {
            const addr = lang === 'en' ? job.addressEn : job.addressZh || job.addressEn;
            return (
              <article
                key={job.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        {t(lang, 'techLabelInstall')}
                      </span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {job.jobCode} · {job.timeSlot}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-1.5">
                      {getDisplayName(
                        { nameEn: job.customerNameEn, nameZh: job.customerNameZh },
                        lang
                      )}
                    </h2>
                    <p className="text-xs font-medium text-blue-700">
                      {getProductName(job.productModelId)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 font-mono tabular-nums">
                    {Object.values(job.checklist).filter(Boolean).length}/5
                  </span>
                </div>

                <div className="text-sm text-slate-700 flex items-start gap-2 bg-slate-50 rounded-xl p-3">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{addr}</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={`tel:${job.customerMobile}`}
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    <Phone className="w-4 h-4 text-blue-700" />
                    <span>{t(lang, 'callCustomer')}</span>
                  </a>
                  <a
                    href={mapUrl(job.addressEn)}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    <Navigation className="w-4 h-4 text-blue-700" />
                    <span>{t(lang, 'openMaps')}</span>
                  </a>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  {checklistSteps.map((st) => {
                    const checked = job.checklist[st.key];
                    return (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => toggleInstallationStep(job.id, st.key)}
                        className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-left text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                          checked
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            checked ? 'text-emerald-600' : 'text-slate-300'
                          }`}
                        />
                        <span>{st.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-3 gap-2">
                    {(['Scheduled', 'In Progress', 'Completed'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          updateInstallationJob(job.id, { status: st });
                          pushToast({
                            title: `${job.jobCode} → ${translateInstallationStatus(lang, st)}`,
                            variant: 'info',
                          });
                        }}
                        className={`min-h-[44px] px-2 text-xs font-semibold rounded-xl border cursor-pointer ${
                          job.status === st
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {translateInstallationStatus(lang, st)}
                      </button>
                    ))}
                  </div>

                  {job.completionPhotoUrl && (
                    <ResilientImage
                      src={job.completionPhotoUrl}
                      alt={job.jobCode}
                      className="w-full h-36 object-cover rounded-xl border border-slate-200"
                    />
                  )}

                  <label className="min-h-[44px] w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <span>{t(lang, 'uploadCompletionPhoto')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 'install', job.id)}
                      className="sr-only"
                    />
                  </label>
                </div>
              </article>
            );
          })}

          {todaysTickets.map((tk) => {
            const addr = lang === 'en' ? tk.addressEn : tk.addressZh || tk.addressEn;
            const desc = lang === 'en' ? tk.descriptionEn : tk.descriptionZh || tk.descriptionEn;
            return (
              <article
                key={tk.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        {t(lang, 'techLabelRepair')}
                      </span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {tk.ticketNumber} {tk.scheduledSlot ? `· ${tk.scheduledSlot}` : ''}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-1.5">
                      {getDisplayName(
                        { nameEn: tk.customerNameEn, nameZh: tk.customerNameZh },
                        lang
                      )}
                    </h2>
                    <p className="text-xs font-medium text-blue-700">
                      {getProductName(tk.productModelId)}
                    </p>
                  </div>
                  <Wrench className="w-4 h-4 text-slate-400 shrink-0" />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>

                <div className="text-sm text-slate-700 flex items-start gap-2 bg-slate-50 rounded-xl p-3">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{addr}</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={`tel:${tk.customerMobile}`}
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    <Phone className="w-4 h-4 text-blue-700" />
                    <span>{t(lang, 'callCustomer')}</span>
                  </a>
                  <a
                    href={mapUrl(tk.addressEn)}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    <Navigation className="w-4 h-4 text-blue-700" />
                    <span>{t(lang, 'openMaps')}</span>
                  </a>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-3 gap-2">
                    {(['In Progress', 'Waiting for Parts', 'Resolved'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          updateTicket(tk.id, { status: st });
                          pushToast({
                            title: `${tk.ticketNumber} → ${translateTicketStatus(lang, st)}`,
                            variant: 'info',
                          });
                        }}
                        className={`min-h-[44px] px-2 text-xs font-semibold rounded-xl border cursor-pointer ${
                          tk.status === st
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {translateTicketStatus(lang, st)}
                      </button>
                    ))}
                  </div>

                  {tk.completionPhotoUrl && (
                    <ResilientImage
                      src={tk.completionPhotoUrl}
                      alt={tk.ticketNumber}
                      className="w-full h-36 object-cover rounded-xl border border-slate-200"
                    />
                  )}

                  <label className="min-h-[44px] w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <span>{t(lang, 'uploadCompletionPhoto')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 'ticket', tk.id)}
                      className="sr-only"
                    />
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
