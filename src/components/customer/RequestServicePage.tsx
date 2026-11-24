import React, { useState } from 'react';
import { CheckCircle2, ImagePlus, Trash2, Wrench } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { t } from '../../i18n/translations';
import { ServiceTicket } from '../../types';
import { getDisplayName } from '../../utils/display';

export const RequestServicePage: React.FC = () => {
  const { db, lang, createTicket, pushToast } = useApp();

  const [customerNameEn, setCustomerNameEn] = useState('');
  const [customerNameZh, setCustomerNameZh] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [address, setAddress] = useState('');
  const [productModelId, setProductModelId] = useState(db.products[0]?.id || '');
  const [serialNumber, setSerialNumber] = useState('');
  const [issueType, setIssueType] = useState(db.issueTypes[0]?.key || 'won_t_unlock');
  const [branchId, setBranchId] = useState(db.branches[0]?.id || '');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [createdTicket, setCreatedTicket] = useState<ServiceTicket | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      pushToast({
        title: t(lang, 'photoSizeError'),
        variant: 'warning',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!customerNameEn.trim() && !customerNameZh.trim()) || !customerMobile.trim()) {
      pushToast({ title: t(lang, 'validationNameMobile'), variant: 'warning' });
      return;
    }
    const ticket = createTicket({
      customerNameEn: customerNameEn.trim() || customerNameZh.trim(),
      customerNameZh: customerNameZh.trim(),
      customerMobile: customerMobile.trim(),
      addressEn: address.trim(),
      addressZh: address.trim(),
      productModelId,
      serialNumber: serialNumber.trim() || undefined,
      issueType,
      descriptionEn: description.trim(),
      descriptionZh: description.trim(),
      photoUrl: photoUrl || undefined,
      branchId,
    });
    setCreatedTicket(ticket);
    pushToast({
      title: t(lang, 'ticketCreatedTitle'),
      description: ticket.ticketNumber,
      variant: 'success',
    });
  };

  const handleReset = () => {
    setCreatedTicket(null);
    setCustomerNameEn('');
    setCustomerNameZh('');
    setCustomerMobile('');
    setAddress('');
    setSerialNumber('');
    setDescription('');
    setPhotoUrl('');
  };

  const getProductName = (id: string) => {
    const p = db.products.find((pr) => pr.id === id);
    return p ? (lang === 'en' ? p.nameEn : p.nameZh) : '';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t(lang, 'serviceTitle')}</h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">{t(lang, 'serviceSubtitle')}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        {createdTicket ? (
          <div className="max-w-xl mx-auto py-6 text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-blue-700">{t(lang, 'brandName')}</div>
              <h2 className="text-2xl font-bold text-slate-900">{t(lang, 'ticketCreatedTitle')}</h2>
              <p className="text-sm text-slate-600">{t(lang, 'ticketCreatedSub')}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">{t(lang, 'ticketNumberLabel')}</div>
              <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums mt-1">
                {createdTicket.ticketNumber}
              </div>
            </div>

            <div className="text-left bg-white border border-slate-200 rounded-xl p-5 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">{t(lang, 'colCustomer')}</span>
                <span className="font-medium text-slate-900">
                  {getDisplayName(
                    { nameEn: createdTicket.customerNameEn, nameZh: createdTicket.customerNameZh },
                    lang
                  )}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">{t(lang, 'productModelLabel')}</span>
                <span className="font-medium text-slate-900">
                  {getProductName(createdTicket.productModelId)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">{t(lang, 'issueTypeLabel')}</span>
                <span className="font-medium text-slate-900">
                  {(() => {
                    const iss = db.issueTypes.find((i) => i.key === createdTicket.issueType);
                    return iss ? (lang === 'en' ? iss.labelEn : iss.labelZh) : createdTicket.issueType;
                  })()}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">{t(lang, 'addressLabel')}</span>
                <span className="font-medium text-slate-900 text-right">
                  {lang === 'en'
                    ? createdTicket.addressEn
                    : createdTicket.addressZh || createdTicket.addressEn}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
            >
              {t(lang, 'submitAnotherTicket')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">{t(lang, 'customerName')} *</span>
                <input
                  type="text"
                  required
                  value={customerNameEn}
                  onChange={(e) => setCustomerNameEn(e.target.value)}
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
                  value={customerNameZh}
                  onChange={(e) => setCustomerNameZh(e.target.value)}
                  placeholder={t(lang, 'customerNameZhPlaceholder')}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">{t(lang, 'customerMobile')} *</span>
                <input
                  type="tel"
                  required
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  placeholder={t(lang, 'mobilePlaceholder')}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">{t(lang, 'addressLabel')} *</span>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t(lang, 'addressPlaceholder')}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">{t(lang, 'productModelLabel')} *</span>
                <select
                  value={productModelId}
                  onChange={(e) => setProductModelId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {db.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {lang === 'en' ? p.nameEn : p.nameZh}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">{t(lang, 'issueTypeLabel')} *</span>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {db.issueTypes.map((iss) => (
                    <option key={iss.id} value={iss.key}>
                      {lang === 'en' ? iss.labelEn : iss.labelZh}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">{t(lang, 'branchLabel')}</span>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
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

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">{t(lang, 'serialNumberOptional')}</span>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder={t(lang, 'serialPlaceholder')}
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">{t(lang, 'issueDescLabel')} *</span>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t(lang, 'issueDescPlaceholder')}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </label>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">
                {t(lang, 'photoUploadLabel')}
              </span>
              {photoUrl ? (
                <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <img
                    src={photoUrl}
                    alt={t(lang, 'customerPhotoLabel')}
                    className="max-h-48 w-auto object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="mt-2 mx-3 mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t(lang, 'removePhoto')}</span>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 bg-slate-50/70 hover:bg-blue-50/30 transition-colors cursor-pointer">
                  <ImagePlus className="w-6 h-6 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">{t(lang, 'photoUploadHint')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="sr-only"
                  />
                </label>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
              >
                <Wrench className="w-4 h-4" />
                <span>{t(lang, 'submitTicketBtn')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
