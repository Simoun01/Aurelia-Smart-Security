import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ASSET_IMAGES, formatDateISO } from '../../data/seedData';
import { t, translateCategory, translateTier } from '../../i18n/translations';
import { Booking, Language, ProductCategory } from '../../types';
import {
  formatDateLocale,
  formatMonthYearLocale,
  formatWeekdayShort,
  getDisplayName,
} from '../../utils/display';
import { ResilientImage } from '../shared/ResilientImage';

const CATEGORIES: ProductCategory[] = [
  'Smart Lock',
  'Smart Door',
  'CCTV & Alarm',
  'Video Doorbell',
];

export const BookDemoPage: React.FC = () => {
  const { db, lang, createBooking, pushToast } = useApp();

  const activeBranches = db.branches.filter((b) => b.active);
  const activeProducts = db.products.filter((p) => p.active);
  const activeSlotRules = db.timeSlotRules.filter((r) => r.enabled);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Smart Lock');
  const [selectedProductId, setSelectedProductId] = useState<string>(
    activeProducts.find((p) => p.category === 'Smart Lock' && p.tier === 'Mid-Range')?.id ||
      activeProducts[0]?.id ||
      ''
  );
  const [selectedBranchId, setSelectedBranchId] = useState<string>(activeBranches[0]?.id || '');

  const todayStr = formatDateISO(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const [customerNameEn, setCustomerNameEn] = useState('');
  const [customerNameZh, setCustomerNameZh] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(lang);
  const [notes, setNotes] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [copied, setCopied] = useState(false);

  const categoryProducts = useMemo(
    () => activeProducts.filter((p) => p.category === selectedCategory),
    [activeProducts, selectedCategory]
  );

  const handleSelectCategory = (cat: ProductCategory) => {
    setSelectedCategory(cat);
    const match = activeProducts.find((p) => p.category === cat);
    if (match) setSelectedProductId(match.id);
  };

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [calendarMonth]);

  const weekdayHeaders = useMemo(() => {
    // 2026-11-22 is Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2026, 10, 22 + i);
      return formatWeekdayShort(d, lang);
    });
  }, [lang]);

  const slotAvailability = useMemo(() => {
    return activeSlotRules.map((rule) => {
      const bookedCount = db.bookings.filter(
        (b) =>
          b.branchId === selectedBranchId &&
          b.date === selectedDate &&
          b.timeSlot === rule.startTime &&
          b.type === 'Demo' &&
          b.status !== 'Cancelled'
      ).length;
      const remaining = Math.max(0, rule.maxConcurrentDemos - bookedCount);
      return {
        rule,
        remaining,
        isFull: remaining === 0,
      };
    });
  }, [activeSlotRules, db.bookings, selectedBranchId, selectedDate]);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      pushToast({ title: t(lang, 'validationSlotRequired'), variant: 'warning' });
      return;
    }
    if ((!customerNameEn.trim() && !customerNameZh.trim()) || !customerMobile.trim()) {
      pushToast({ title: t(lang, 'validationNameMobile'), variant: 'warning' });
      return;
    }

    const booking = createBooking({
      type: 'Demo',
      productInterest: selectedCategory,
      productModelId: selectedProductId,
      branchId: selectedBranchId,
      date: selectedDate,
      timeSlot: selectedSlot,
      customerNameEn: customerNameEn.trim() || customerNameZh.trim(),
      customerNameZh: customerNameZh.trim(),
      customerMobile: customerMobile.trim(),
      preferredLanguage,
      notesEn: notes.trim() || undefined,
      notesZh: notes.trim() || undefined,
    });
    setConfirmedBooking(booking);
    pushToast({
      title: t(lang, 'bookingConfirmedTitle'),
      description: `${booking.bookingCode} · ${formatDateLocale(booking.date, lang)} ${booking.timeSlot}`,
      variant: 'success',
    });
  };

  const handleResetWizard = () => {
    setConfirmedBooking(null);
    setStep(1);
    setSelectedSlot('');
    setCustomerNameEn('');
    setCustomerNameZh('');
    setCustomerMobile('');
    setNotes('');
  };

  const handleCopyCode = () => {
    if (!confirmedBooking) return;
    navigator.clipboard?.writeText(confirmedBooking.bookingCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const selectedBranch = db.branches.find((b) => b.id === selectedBranchId);
  const selectedProduct = db.products.find((p) => p.id === selectedProductId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      {/* Split Hero Showcase */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-wide text-blue-700">
              {t(lang, 'heroKicker')}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
              {t(lang, 'heroTitle')}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              {t(lang, 'heroSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div>
              <div className="font-mono text-xl font-semibold text-slate-900 tabular-nums">
                {activeBranches.length}
              </div>
              <div className="text-xs text-slate-500">{t(lang, 'statShowroomsLabel')}</div>
            </div>
            <div>
              <div className="font-mono text-xl font-semibold text-slate-900 tabular-nums">3</div>
              <div className="text-xs text-slate-500">{t(lang, 'statLockTiersLabel')}</div>
            </div>
            <div>
              <div className="font-mono text-xl font-semibold text-slate-900 tabular-nums">
                {t(lang, 'statConsultValue')}
              </div>
              <div className="text-xs text-slate-500">{t(lang, 'statConsultLabel')}</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 min-h-[260px] lg:min-h-[360px] bg-slate-100">
          <ResilientImage
            src={ASSET_IMAGES.hero}
            alt={t(lang, 'brandName')}
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Booking Wizard */}
      <section id="booking-wizard" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        {confirmedBooking ? (
          <div className="max-w-2xl mx-auto py-6 text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-blue-700">{t(lang, 'brandName')}</div>
              <h2 className="text-2xl font-bold text-slate-900">{t(lang, 'bookingConfirmedTitle')}</h2>
              <p className="text-sm text-slate-600">{t(lang, 'bookingConfirmedSub')}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <div className="text-xs text-slate-500">{t(lang, 'bookingCodeLabel')}</div>
                <div className="font-mono text-2xl font-bold text-slate-900 tracking-tight tabular-nums mt-0.5">
                  {confirmedBooking.bookingCode}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t(lang, 'copied') : t(lang, 'copyCode')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left bg-white border border-slate-200 rounded-xl p-5 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">{t(lang, 'step1Title')}</span>
                <span className="font-medium text-slate-900">
                  {translateCategory(lang, confirmedBooking.productInterest)}
                  {selectedProduct
                    ? ` · ${lang === 'en' ? selectedProduct.nameEn : selectedProduct.nameZh}`
                    : ''}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">{t(lang, 'step2Title')}</span>
                <span className="font-medium text-slate-900">
                  {selectedBranch ? (lang === 'en' ? selectedBranch.nameEn : selectedBranch.nameZh) : ''}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">{t(lang, 'step3Title')}</span>
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  {formatDateLocale(confirmedBooking.date, lang, true)} · {confirmedBooking.timeSlot}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">{t(lang, 'colCustomer')}</span>
                <span className="font-medium text-slate-900">
                  {getDisplayName(
                    {
                      nameEn: confirmedBooking.customerNameEn,
                      nameZh: confirmedBooking.customerNameZh,
                    },
                    lang
                  )}{' '}
                  · <span className="font-mono text-xs">{confirmedBooking.customerMobile}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetWizard}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
            >
              {t(lang, 'bookAnother')}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Step Progress Indicator */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-200 pb-6">
              {[
                { num: 1 as const, label: t(lang, 'step1Title') },
                { num: 2 as const, label: t(lang, 'step2Title') },
                { num: 3 as const, label: t(lang, 'step3Title') },
                { num: 4 as const, label: t(lang, 'step4Title') },
              ].map((item) => {
                const isCurrent = step === item.num;
                const isDone = step > item.num;
                return (
                  <button
                    key={item.num}
                    type="button"
                    disabled={item.num > step}
                    onClick={() => item.num <= step && setStep(item.num)}
                    className={`text-left px-3.5 py-2.5 rounded-xl border transition-colors ${
                      isCurrent
                        ? 'border-blue-700 bg-blue-50/70 text-blue-900'
                        : isDone
                        ? 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 cursor-pointer'
                        : 'border-slate-200 bg-white text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold gap-2">
                      <span className="truncate">{item.label}</span>
                      {isDone && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Step 1: Product Interest & Lock Tiers */}
            {step === 1 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">{t(lang, 'step1Title')}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {CATEGORIES.map((cat) => {
                      const active = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleSelectCategory(cat)}
                          className={`group text-left rounded-xl border overflow-hidden transition-all cursor-pointer ${
                            active
                              ? 'border-blue-700 ring-2 ring-blue-700/15 bg-blue-50/30'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                            <ResilientImage
                              src={ASSET_IMAGES[cat]}
                              alt={translateCategory(lang, cat)}
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                            />
                          </div>
                          <div className="p-4 flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm text-slate-900">
                              {translateCategory(lang, cat)}
                            </span>
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                active ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300'
                              }`}
                            >
                              {active && <Check className="w-2.5 h-2.5" />}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Product / Lock Tier Selection */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {selectedCategory === 'Smart Lock'
                      ? t(lang, 'lockTierHeading')
                      : t(lang, 'productModelLabel')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {categoryProducts.map((prod) => {
                      const active = selectedProductId === prod.id;
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => setSelectedProductId(prod.id)}
                          className={`text-left p-5 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-3 ${
                            active
                              ? 'border-blue-700 bg-blue-50/40'
                              : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                              <span className="font-semibold text-blue-700">
                                {prod.tier
                                  ? translateTier(lang, prod.tier)
                                  : translateCategory(lang, prod.category)}
                              </span>
                              <span className="font-mono tabular-nums">
                                {prod.warrantyMonths} {t(lang, 'warrantyMonthsUnit')}
                              </span>
                            </div>
                            <div className="font-semibold text-base text-slate-900">
                              {lang === 'en' ? prod.nameEn : prod.nameZh}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {lang === 'en' ? prod.highlightsEn : prod.highlightsZh}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                            <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                              ${prod.price}
                            </span>
                            <span className="text-xs font-medium text-blue-700">
                              {active ? t(lang, 'selectedLabel') : t(lang, 'selectLabel')}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>{t(lang, 'btnNext')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Showroom Branch */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900">{t(lang, 'step2Title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {activeBranches.map((br) => {
                    const active = selectedBranchId === br.id;
                    return (
                      <button
                        key={br.id}
                        type="button"
                        onClick={() => {
                          setSelectedBranchId(br.id);
                          setSelectedSlot('');
                        }}
                        className={`text-left p-5 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-4 ${
                          active
                            ? 'border-blue-700 bg-blue-50/40 ring-2 ring-blue-700/15'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-base text-slate-900">
                              {lang === 'en' ? br.nameEn : br.nameZh}
                            </h3>
                            {active && <Check className="w-4 h-4 text-blue-700 shrink-0 mt-1" />}
                          </div>
                          <p className="text-xs text-slate-600 flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>{lang === 'en' ? br.addressEn : br.addressZh}</span>
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                          <div className="flex items-center gap-1.5 font-mono tabular-nums">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{br.hours}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono tabular-nums">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{br.phone}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{t(lang, 'btnBack')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                  >
                    <span>{t(lang, 'btnNext')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Calendar + Available Time Slots */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900">{t(lang, 'step3Title')}</h2>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 border border-slate-200 rounded-xl p-5 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-blue-700" />
                        <span>{formatMonthYearLocale(calendarMonth, lang)}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setCalendarMonth(
                              new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                            )
                          }
                          className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-600 cursor-pointer"
                          aria-label="Previous month"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCalendarMonth(
                              new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                            )
                          }
                          className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-600 cursor-pointer"
                          aria-label="Next month"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-slate-500 mb-2">
                      {weekdayHeaders.map((wd) => (
                        <div key={wd} className="py-1">
                          {wd}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {calendarDays.map((cell, idx) => {
                        if (!cell) return <div key={`empty-${idx}`} />;
                        const iso = formatDateISO(cell);
                        const isPast = iso < todayStr;
                        const isSelected = iso === selectedDate;
                        return (
                          <button
                            key={iso}
                            type="button"
                            disabled={isPast}
                            onClick={() => {
                              setSelectedDate(iso);
                              setSelectedSlot('');
                            }}
                            className={`h-10 rounded-lg font-mono text-sm tabular-nums transition-colors ${
                              isPast
                                ? 'text-slate-300 cursor-not-allowed'
                                : isSelected
                                ? 'bg-blue-700 text-white font-semibold cursor-pointer'
                                : 'bg-white border border-slate-200 text-slate-800 hover:border-blue-400 cursor-pointer'
                            }`}
                          >
                            {cell.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Available Time Slots */}
                  <div className="lg:col-span-5 border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {selectedBranch ? (lang === 'en' ? selectedBranch.nameEn : selectedBranch.nameZh) : ''}
                      </span>
                      <span className="font-mono text-xs text-slate-500 tabular-nums">
                        {formatDateLocale(selectedDate, lang, true)}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {slotAvailability.map(({ rule, remaining, isFull }) => {
                        const active = selectedSlot === rule.startTime;
                        return (
                          <button
                            key={rule.id}
                            type="button"
                            disabled={isFull}
                            onClick={() => setSelectedSlot(rule.startTime)}
                            className={`w-full px-4 py-3 rounded-xl border flex items-center justify-between transition-colors ${
                              isFull
                                ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                                : active
                                ? 'border-blue-700 bg-blue-50 text-blue-900 cursor-pointer'
                                : 'border-slate-200 hover:border-blue-400 text-slate-800 cursor-pointer'
                            }`}
                          >
                            <span className="font-mono text-sm font-semibold tabular-nums">
                              {rule.startTime} – {rule.endTime}
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                isFull ? 'text-red-600' : active ? 'text-blue-700' : 'text-emerald-700'
                              }`}
                            >
                              {isFull ? t(lang, 'slotFull') : `${remaining} ${t(lang, 'slotsAvailable')}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{t(lang, 'btnBack')}</span>
                  </button>
                  <button
                    type="button"
                    disabled={!selectedSlot}
                    onClick={() => setStep(4)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-40 rounded-lg cursor-pointer"
                  >
                    <span>{t(lang, 'btnNext')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Contact Details & Language */}
            {step === 4 && (
              <form onSubmit={handleConfirm} className="space-y-6 max-w-2xl">
                <h2 className="text-xl font-bold text-slate-900">{t(lang, 'step4Title')}</h2>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-slate-900">
                    {translateCategory(lang, selectedCategory)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedBranch ? (lang === 'en' ? selectedBranch.nameEn : selectedBranch.nameZh) : ''}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {formatDateLocale(selectedDate, lang, true)} {selectedSlot}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

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

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700 block">
                    {t(lang, 'preferredLanguage')}
                  </span>
                  <div className="inline-flex p-1 bg-slate-100 rounded-lg gap-1">
                    {(['en', 'zh'] as Language[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPreferredLanguage(opt)}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          preferredLanguage === opt
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {opt === 'en' ? t(lang, 'langOptionEn') : t(lang, 'langOptionZh')}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700">{t(lang, 'notesOptional')}</span>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t(lang, 'notesPlaceholder')}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </label>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{t(lang, 'btnBack')}</span>
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t(lang, 'btnConfirmBooking')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
