import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateISO } from '../../data/seedData';
import { t } from '../../i18n/translations';
import { WarrantyRecord } from '../../types';
import { formatDateLocale, getDisplayName } from '../../utils/display';

export const WarrantyPage: React.FC = () => {
  const { db, lang, lookupWarranty, registerWarranty, pushToast } = useApp();
  const [activeTab, setActiveTab] = useState<'check' | 'register'>('check');

  const [querySerial, setQuerySerial] = useState('');
  const [searched, setSearched] = useState(false);
  const [foundRecord, setFoundRecord] = useState<WarrantyRecord | undefined>(undefined);

  const [regSerial, setRegSerial] = useState('');
  const [regProductId, setRegProductId] = useState(db.products[0]?.id || '');
  const [regPurchaseDate, setRegPurchaseDate] = useState(formatDateISO(new Date()));
  const [regBranchId, setRegBranchId] = useState(db.branches[0]?.id || '');
  const [regNameEn, setRegNameEn] = useState('');
  const [regNameZh, setRegNameZh] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [justRegistered, setJustRegistered] = useState<WarrantyRecord | null>(null);

  const handleCheck = (serialToUse?: string) => {
    const target = (serialToUse ?? querySerial).trim();
    if (!target) return;
    if (serialToUse) setQuerySerial(serialToUse);
    setFoundRecord(lookupWarranty(target));
    setSearched(true);
  };

  const getProductName = (id: string) => {
    const p = db.products.find((pr) => pr.id === id);
    return p ? (lang === 'en' ? p.nameEn : p.nameZh) : '';
  };

  const getWarrantyStatusInfo = (record: WarrantyRecord) => {
    const today = new Date();
    const expiry = new Date(record.expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return {
        label: t(lang, 'warrantyStatusExpired'),
        color: 'text-red-700 bg-red-50 border-red-200',
        Icon: ShieldAlert,
      };
    }
    if (diffDays <= 30) {
      return {
        label: t(lang, 'warrantyStatusExpiring'),
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        Icon: AlertTriangle,
      };
    }
    return {
      label: t(lang, 'warrantyStatusActive'),
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      Icon: ShieldCheck,
    };
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!regNameEn.trim() && !regNameZh.trim()) || !regMobile.trim()) {
      pushToast({ title: t(lang, 'validationNameMobile'), variant: 'warning' });
      return;
    }
    const created = registerWarranty({
      serialNumber: regSerial,
      productModelId: regProductId,
      purchaseDate: regPurchaseDate,
      branchId: regBranchId,
      customerNameEn: regNameEn.trim() || regNameZh.trim(),
      customerNameZh: regNameZh.trim(),
      customerMobile: regMobile.trim(),
      customerEmail: regEmail.trim() || undefined,
    });
    setJustRegistered(created);
    pushToast({
      title: t(lang, 'warrantyRegisteredSuccess'),
      description: `${created.serialNumber} · ${formatDateLocale(created.expiryDate, lang)}`,
      variant: 'success',
    });
    setRegSerial('');
    setRegNameEn('');
    setRegNameZh('');
    setRegMobile('');
    setRegEmail('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t(lang, 'warrantyTitle')}</h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">{t(lang, 'warrantySubtitle')}</p>
      </div>

      <div className="inline-flex p-1 bg-slate-200/80 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('check')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'check'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t(lang, 'tabCheckWarranty')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('register')}
          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'register'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t(lang, 'tabRegisterWarranty')}
        </button>
      </div>

      {activeTab === 'check' ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCheck();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={querySerial}
                onChange={(e) => setQuerySerial(e.target.value)}
                placeholder={t(lang, 'enterSerialPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t(lang, 'checkNowBtn')}
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{t(lang, 'sampleSerialsLabel')}:</span>
            {db.warranties.slice(0, 5).map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => handleCheck(w.serialNumber)}
                className="font-mono px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                {w.serialNumber}
              </button>
            ))}
          </div>

          {searched && (
            <div className="pt-4 border-t border-slate-200">
              {foundRecord ? (
                (() => {
                  const status = getWarrantyStatusInfo(foundRecord);
                  const branch = db.branches.find((b) => b.id === foundRecord.branchId);
                  return (
                    <div className="border border-slate-200 rounded-xl p-5 space-y-4 bg-slate-50/50">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-mono text-xs text-slate-500">
                            {foundRecord.serialNumber}
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                            {getProductName(foundRecord.productModelId)}
                          </h3>
                          <div className="text-xs text-slate-600 mt-0.5">
                            {getDisplayName(
                              {
                                nameEn: foundRecord.customerNameEn,
                                nameZh: foundRecord.customerNameZh,
                              },
                              lang
                            )}
                          </div>
                        </div>
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${status.color}`}
                        >
                          <status.Icon className="w-4 h-4" />
                          <span>{status.label}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200 text-sm">
                        <div>
                          <span className="text-xs text-slate-500 block">
                            {t(lang, 'purchaseDateLabel')}
                          </span>
                          <span className="font-mono font-medium text-slate-900 tabular-nums">
                            {formatDateLocale(foundRecord.purchaseDate, lang)}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">
                            {t(lang, 'warrantyExpiryLabel')}
                          </span>
                          <span className="font-mono font-semibold text-slate-900 tabular-nums">
                            {formatDateLocale(foundRecord.expiryDate, lang)}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">{t(lang, 'branchLabel')}</span>
                          <span className="font-medium text-slate-900">
                            {branch ? (lang === 'en' ? branch.nameEn : branch.nameZh) : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                  {t(lang, 'warrantyNotFound')}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          {justRegistered && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-emerald-900">{t(lang, 'warrantyRegisteredSuccess')}</p>
                <p className="text-emerald-800 text-xs mt-1 tabular-nums">
                  {getDisplayName(
                    {
                      nameEn: justRegistered.customerNameEn,
                      nameZh: justRegistered.customerNameZh,
                    },
                    lang
                  )}{' '}
                  · <span className="font-mono">{justRegistered.serialNumber}</span> ·{' '}
                  {t(lang, 'warrantyExpiryLabel')}:{' '}
                  <span className="font-mono">{formatDateLocale(justRegistered.expiryDate, lang)}</span>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  {t(lang, 'serialNumberLabel')} *
                </span>
                <input
                  type="text"
                  required
                  value={regSerial}
                  onChange={(e) => setRegSerial(e.target.value)}
                  placeholder={t(lang, 'warrantyRegPlaceholder')}
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  {t(lang, 'productModelLabel')} *
                </span>
                <select
                  value={regProductId}
                  onChange={(e) => setRegProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {db.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {lang === 'en' ? p.nameEn : p.nameZh} ({p.warrantyMonths}{' '}
                      {t(lang, 'warrantyMonthsUnit')})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  {t(lang, 'purchaseDateLabel')} *
                </span>
                <input
                  type="date"
                  required
                  value={regPurchaseDate}
                  onChange={(e) => setRegPurchaseDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">{t(lang, 'branchLabel')} *</span>
                <select
                  value={regBranchId}
                  onChange={(e) => setRegBranchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {db.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {lang === 'en' ? b.nameEn : b.nameZh}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">{t(lang, 'customerName')} *</span>
                <input
                  type="text"
                  required
                  value={regNameEn}
                  onChange={(e) => setRegNameEn(e.target.value)}
                  placeholder={t(lang, 'customerNamePlaceholder')}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  {t(lang, 'customerNameZhOptional')}
                </span>
                <input
                  type="text"
                  value={regNameZh}
                  onChange={(e) => setRegNameZh(e.target.value)}
                  placeholder={t(lang, 'customerNameZhPlaceholder')}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">{t(lang, 'customerMobile')} *</span>
                <input
                  type="tel"
                  required
                  value={regMobile}
                  onChange={(e) => setRegMobile(e.target.value)}
                  placeholder={t(lang, 'mobilePlaceholder')}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">{t(lang, 'emailOptional')}</span>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
              >
                {t(lang, 'registerWarrantyBtn')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
