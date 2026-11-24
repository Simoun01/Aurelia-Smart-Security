import React, { useState } from 'react';
import { CheckCircle2, Plus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateISO } from '../../data/seedData';
import { t, translateInstallationStatus } from '../../i18n/translations';
import { InstallationChecklist } from '../../types';
import {
  formatDateLocale,
  getDisplayName,
  getPlainDisplayName,
} from '../../utils/display';

export const InstallationJobsPage: React.FC = () => {
  const { db, lang, createInstallationJob, toggleInstallationStep, pushToast } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [saleRef, setSaleRef] = useState('');
  const [productModelId, setProductModelId] = useState(db.products[0]?.id || '');
  const [customerNameEn, setCustomerNameEn] = useState('');
  const [customerNameZh, setCustomerNameZh] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [address, setAddress] = useState('');
  const [branchId, setBranchId] = useState(db.branches[0]?.id || '');
  const [preferredDate, setPreferredDate] = useState(formatDateISO(new Date()));
  const [timeSlot, setTimeSlot] = useState(db.timeSlotRules[0]?.startTime || '10:00');
  const [assignedTechnicianId, setAssignedTechnicianId] = useState(db.technicians[0]?.id || '');
  const [notes, setNotes] = useState('');

  const getProductName = (id: string) => {
    const p = db.products.find((pr) => pr.id === id);
    return p ? (lang === 'en' ? p.nameEn : p.nameZh) : '';
  };

  const checklistItems: { key: keyof InstallationChecklist; label: string }[] = [
    { key: 'siteCheck', label: t(lang, 'stepSiteCheck') },
    { key: 'mounting', label: t(lang, 'stepMounting') },
    { key: 'programming', label: t(lang, 'stepProgramming') },
    { key: 'customerDemo', label: t(lang, 'stepCustomerDemo') },
    { key: 'signOff', label: t(lang, 'stepSignOff') },
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!customerNameEn.trim() && !customerNameZh.trim()) || !customerMobile.trim()) {
      pushToast({ title: t(lang, 'validationNameMobile'), variant: 'warning' });
      return;
    }
    const created = createInstallationJob({
      saleReference: saleRef.trim() || `INV-2026-${Math.floor(8900 + Math.random() * 900)}`,
      productModelId,
      customerNameEn: customerNameEn.trim() || customerNameZh.trim(),
      customerNameZh: customerNameZh.trim(),
      customerMobile: customerMobile.trim(),
      addressEn: address.trim(),
      addressZh: address.trim(),
      branchId,
      preferredDate,
      timeSlot,
      assignedTechnicianId,
      notesEn: notes.trim() || undefined,
      notesZh: notes.trim() || undefined,
    });
    pushToast({
      title: t(lang, 'installJobScheduledToast'),
      description: `${created.jobCode} · ${formatDateLocale(created.preferredDate, lang)}`,
      variant: 'success',
    });
    setModalOpen(false);
    setSaleRef('');
    setCustomerNameEn('');
    setCustomerNameZh('');
    setCustomerMobile('');
    setAddress('');
    setNotes('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t(lang, 'installTitle')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{t(lang, 'installSubtitle')}</p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t(lang, 'newInstallFromSale')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {db.installationJobs.map((job) => {
          const tech = db.technicians.find((tc) => tc.id === job.assignedTechnicianId);
          const doneCount = Object.values(job.checklist).filter(Boolean).length;
          const pct = Math.round((doneCount / 5) * 100);
          const addr = lang === 'en' ? job.addressEn : job.addressZh || job.addressEn;
          return (
            <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-blue-700 tabular-nums">
                      {job.jobCode}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{job.saleReference}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {formatDateLocale(job.preferredDate, lang)} {job.timeSlot}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-1">
                    {getProductName(job.productModelId)}
                  </h2>
                  <p className="text-xs text-slate-700 mt-0.5">
                    {getDisplayName(
                      { nameEn: job.customerNameEn, nameZh: job.customerNameZh },
                      lang
                    )}{' '}
                    · <span className="font-mono">{job.customerMobile}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{addr}</p>
                </div>

                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded border whitespace-nowrap ${
                    job.status === 'Completed'
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                      : job.status === 'In Progress'
                      ? 'text-blue-800 bg-blue-50 border-blue-200'
                      : 'text-slate-700 bg-slate-100 border-slate-200'
                  }`}
                >
                  {translateInstallationStatus(lang, job.status)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  {t(lang, 'assignedTechnician')}:{' '}
                  <strong className="text-slate-900">
                    {tech ? getDisplayName(tech, lang) : t(lang, 'unassigned')}
                  </strong>
                </span>
                <span className="font-mono font-semibold text-slate-800 tabular-nums">
                  {doneCount}/5 ({pct}%)
                </span>
              </div>

              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 transition-all" style={{ width: `${pct}%` }} />
              </div>

              <div className="space-y-1.5">
                {checklistItems.map((step) => {
                  const checked = job.checklist[step.key];
                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => toggleInstallationStep(job.id, step.key)}
                      className={`w-full px-3 py-2 rounded-lg border text-left text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                        checked
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          checked ? 'text-emerald-600' : 'text-slate-300'
                        }`}
                      />
                      <span>{step.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">{t(lang, 'newInstallFromSale')}</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">
                    {t(lang, 'saleRefLabel')}
                  </span>
                  <input
                    type="text"
                    value={saleRef}
                    onChange={(e) => setSaleRef(e.target.value)}
                    placeholder="INV-2026-8901"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">
                    {t(lang, 'productModelLabel')}
                  </span>
                  <select
                    value={productModelId}
                    onChange={(e) => setProductModelId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    {db.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {lang === 'en' ? p.nameEn : p.nameZh}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">
                    {t(lang, 'customerName')} *
                  </span>
                  <input
                    type="text"
                    required
                    value={customerNameEn}
                    onChange={(e) => setCustomerNameEn(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">
                    {t(lang, 'customerNameZhOptional')}
                  </span>
                  <input
                    type="text"
                    value={customerNameZh}
                    onChange={(e) => setCustomerNameZh(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">
                  {t(lang, 'customerMobile')} *
                </span>
                <input
                  type="tel"
                  required
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">
                  {t(lang, 'addressLabel')} *
                </span>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">
                    {t(lang, 'preferredDateLabel')}
                  </span>
                  <input
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">
                    {t(lang, 'calTimeSlotLabel')}
                  </span>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  >
                    {db.timeSlotRules.map((r) => (
                      <option key={r.id} value={r.startTime}>
                        {r.startTime}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">
                    {t(lang, 'assignedTechnician')}
                  </span>
                  <select
                    value={assignedTechnicianId}
                    onChange={(e) => setAssignedTechnicianId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    {db.technicians.map((tc) => (
                      <option key={tc.id} value={tc.id}>
                        {getPlainDisplayName(tc, lang)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">
                    {t(lang, 'branchLabel')}
                  </span>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    {db.branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {lang === 'en' ? b.nameEn : b.nameZh}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">
                  {t(lang, 'notesOptional')}
                </span>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  {t(lang, 'cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                >
                  {t(lang, 'createInstallBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
