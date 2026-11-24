import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateISO } from '../../data/seedData';
import {
  t,
  translateBookingStatus,
  translateBookingType,
  translateCategory,
} from '../../i18n/translations';
import { Booking, BookingStatus, BookingType, ProductCategory } from '../../types';
import {
  formatDateLocale,
  formatMonthYearLocale,
  formatShortDate,
  formatWeekdayShort,
  getDisplayName,
  getPlainDisplayName,
} from '../../utils/display';

type CalendarViewMode = 'day' | 'week' | 'month';

const TYPE_STYLES: Record<BookingType, string> = {
  Demo: 'bg-blue-50 border-blue-300 text-blue-900',
  Installation: 'bg-emerald-50 border-emerald-300 text-emerald-900',
  Repair: 'bg-amber-50 border-amber-300 text-amber-900',
};

const TYPE_DOT_COLORS: Record<BookingType, string> = {
  Demo: 'bg-blue-600',
  Installation: 'bg-emerald-600',
  Repair: 'bg-amber-600',
};

export const BookingCalendarPage: React.FC = () => {
  const { db, lang, createBooking, updateBooking, cancelBooking, pushToast } = useApp();

  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const [typeFilter, setTypeFilter] = useState<BookingType | 'All'>('All');
  const [branchFilter, setBranchFilter] = useState<string>('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const [formType, setFormType] = useState<BookingType>('Demo');
  const [formStatus, setFormStatus] = useState<BookingStatus>('Confirmed');
  const [formCategory, setFormCategory] = useState<ProductCategory>('Smart Lock');
  const [formBranchId, setFormBranchId] = useState(db.branches[0]?.id || '');
  const [formDate, setFormDate] = useState(formatDateISO(new Date()));
  const [formSlot, setFormSlot] = useState(db.timeSlotRules[0]?.startTime || '10:00');
  const [formNameEn, setFormNameEn] = useState('');
  const [formNameZh, setFormNameZh] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTechId, setFormTechId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const filteredBookings = useMemo(
    () =>
      db.bookings.filter((b) => {
        if (typeFilter !== 'All' && b.type !== typeFilter) return false;
        if (branchFilter !== 'All' && b.branchId !== branchFilter) return false;
        return true;
      }),
    [db.bookings, typeFilter, branchFilter]
  );

  const navigateAnchor = (dir: -1 | 1) => {
    const next = new Date(anchorDate);
    if (viewMode === 'day') next.setDate(next.getDate() + dir);
    else if (viewMode === 'week') next.setDate(next.getDate() + dir * 7);
    else next.setMonth(next.getMonth() + dir);
    setAnchorDate(next);
  };

  const weekDates = useMemo(() => {
    const start = new Date(anchorDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [anchorDate]);

  const monthCells = useMemo(() => {
    const year = anchorDate.getFullYear();
    const month = anchorDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [anchorDate]);

  const monthWeekdays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => formatWeekdayShort(new Date(2026, 10, 22 + i), lang));
  }, [lang]);

  const openCreateModal = (dateStr?: string, slot?: string) => {
    setEditingBooking(null);
    setFormType('Demo');
    setFormStatus('Confirmed');
    setFormCategory('Smart Lock');
    setFormBranchId(branchFilter !== 'All' ? branchFilter : db.branches[0]?.id || '');
    setFormDate(dateStr || formatDateISO(anchorDate));
    setFormSlot(slot || db.timeSlotRules[0]?.startTime || '10:00');
    setFormNameEn('');
    setFormNameZh('');
    setFormMobile('');
    setFormAddress('');
    setFormTechId('');
    setFormNotes('');
    setModalOpen(true);
  };

  const openEditModal = (bk: Booking) => {
    setEditingBooking(bk);
    setFormType(bk.type);
    setFormStatus(bk.status);
    setFormCategory(bk.productInterest);
    setFormBranchId(bk.branchId);
    setFormDate(bk.date);
    setFormSlot(bk.timeSlot);
    setFormNameEn(bk.customerNameEn);
    setFormNameZh(bk.customerNameZh);
    setFormMobile(bk.customerMobile);
    setFormAddress((lang === 'en' ? bk.customerAddressEn : bk.customerAddressZh || bk.customerAddressEn) || '');
    setFormTechId(bk.technicianId || '');
    setFormNotes((lang === 'en' ? bk.notesEn : bk.notesZh || bk.notesEn) || '');
    setModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!formNameEn.trim() && !formNameZh.trim()) || !formMobile.trim()) {
      pushToast({ title: t(lang, 'validationNameMobile'), variant: 'warning' });
      return;
    }

    if (editingBooking) {
      updateBooking(editingBooking.id, {
        type: formType,
        status: formStatus,
        productInterest: formCategory,
        branchId: formBranchId,
        date: formDate,
        timeSlot: formSlot,
        customerNameEn: formNameEn.trim() || formNameZh.trim(),
        customerNameZh: formNameZh.trim(),
        customerMobile: formMobile.trim(),
        customerAddressEn: formAddress.trim() || undefined,
        customerAddressZh: formAddress.trim() || undefined,
        technicianId: formTechId || undefined,
        notesEn: formNotes.trim() || undefined,
        notesZh: formNotes.trim() || undefined,
      });
      pushToast({
        title: t(lang, 'calBookingUpdated'),
        description: `${editingBooking.bookingCode} · ${formatDateLocale(formDate, lang)} ${formSlot}`,
        variant: 'success',
      });
    } else {
      const created = createBooking({
        type: formType,
        status: formStatus,
        productInterest: formCategory,
        branchId: formBranchId,
        date: formDate,
        timeSlot: formSlot,
        customerNameEn: formNameEn.trim() || formNameZh.trim(),
        customerNameZh: formNameZh.trim(),
        customerMobile: formMobile.trim(),
        customerAddressEn: formAddress.trim() || undefined,
        customerAddressZh: formAddress.trim() || undefined,
        preferredLanguage: lang,
        technicianId: formTechId || undefined,
        notesEn: formNotes.trim() || undefined,
        notesZh: formNotes.trim() || undefined,
      });
      pushToast({
        title: t(lang, 'calBookingCreated'),
        description: created.bookingCode,
        variant: 'success',
      });
    }
    setModalOpen(false);
  };

  const slotHours = db.timeSlotRules.filter((r) => r.enabled).map((r) => r.startTime);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg gap-1">
            {(['day', 'week', 'month'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  viewMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {mode === 'day'
                  ? t(lang, 'calDay')
                  : mode === 'week'
                  ? t(lang, 'calWeek')
                  : t(lang, 'calMonth')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigateAnchor(-1)}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setAnchorDate(new Date())}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              {t(lang, 'calToday')}
            </button>
            <button
              type="button"
              onClick={() => navigateAnchor(1)}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
            {viewMode === 'month'
              ? formatMonthYearLocale(anchorDate, lang)
              : formatDateLocale(formatDateISO(anchorDate), lang, true)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as BookingType | 'All')}
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg"
          >
            <option value="All">{t(lang, 'calFilterAllTypes')}</option>
            <option value="Demo">{translateBookingType(lang, 'Demo')}</option>
            <option value="Installation">{translateBookingType(lang, 'Installation')}</option>
            <option value="Repair">{translateBookingType(lang, 'Repair')}</option>
          </select>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg"
          >
            <option value="All">{t(lang, 'calFilterAllBranches')}</option>
            {db.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {lang === 'en' ? b.nameEn : b.nameZh}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t(lang, 'calNewBooking')}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 px-1">
        <div className="flex flex-wrap items-center gap-4">
          {(['Demo', 'Installation', 'Repair'] as BookingType[]).map((type) => (
            <span key={type} className="inline-flex items-center gap-1.5 font-medium">
              <span className={`w-2.5 h-2.5 rounded-sm ${TYPE_DOT_COLORS[type]}`} />
              <span>{translateBookingType(lang, type)}</span>
            </span>
          ))}
        </div>
        <span className="text-slate-500">{t(lang, 'calClickSlotHint')}</span>
      </div>

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
          {slotHours.map((slot) => {
            const dayStr = formatDateISO(anchorDate);
            const items = filteredBookings.filter((b) => b.date === dayStr && b.timeSlot === slot);
            return (
              <div key={slot} className="flex flex-col sm:flex-row min-h-[76px]">
                <div className="sm:w-28 px-4 py-3 bg-slate-50 border-b sm:border-b-0 sm:border-r border-slate-200 font-mono text-xs font-semibold text-slate-700 tabular-nums shrink-0">
                  {slot}
                </div>
                <div
                  onClick={() => openCreateModal(dayStr, slot)}
                  className="flex-1 p-3 flex flex-wrap items-center gap-2.5 hover:bg-slate-50/70 cursor-pointer"
                >
                  {items.map((bk) => (
                    <button
                      key={bk.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(bk);
                      }}
                      className={`text-left px-3 py-2 rounded-lg border text-xs transition-shadow hover:shadow-sm cursor-pointer ${
                        TYPE_STYLES[bk.type]
                      } ${bk.status === 'Cancelled' ? 'opacity-50 line-through' : ''}`}
                    >
                      <div className="font-semibold">
                        {translateBookingType(lang, bk.type)} ·{' '}
                        {getDisplayName({ nameEn: bk.customerNameEn, nameZh: bk.customerNameZh }, lang)}
                      </div>
                      <div className="font-mono text-[11px] opacity-80 tabular-nums">
                        {bk.bookingCode} · {translateBookingStatus(lang, bk.status)}
                      </div>
                    </button>
                  ))}
                  {items.length === 0 && (
                    <span className="text-xs text-slate-400">{t(lang, 'calClickToBook')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <div className="min-w-[820px]">
            <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50">
              <div className="p-3 text-xs font-semibold text-slate-500 border-r border-slate-200">
                {t(lang, 'calTimeCol')}
              </div>
              {weekDates.map((d) => {
                const iso = formatDateISO(d);
                const isToday = iso === formatDateISO(new Date());
                return (
                  <div
                    key={iso}
                    className={`p-3 text-center border-r last:border-r-0 border-slate-200 ${
                      isToday ? 'bg-blue-50/70' : ''
                    }`}
                  >
                    <div className="text-[11px] font-medium text-slate-500">
                      {formatWeekdayShort(d, lang)}
                    </div>
                    <div
                      className={`font-mono text-xs font-bold tabular-nums mt-0.5 ${
                        isToday ? 'text-blue-700' : 'text-slate-900'
                      }`}
                    >
                      {formatShortDate(d, lang)}
                    </div>
                  </div>
                );
              })}
            </div>

            {slotHours.map((slot) => (
              <div key={slot} className="grid grid-cols-8 border-b last:border-b-0 border-slate-200">
                <div className="p-3 font-mono text-xs font-semibold text-slate-600 bg-slate-50/60 border-r border-slate-200 tabular-nums">
                  {slot}
                </div>
                {weekDates.map((d) => {
                  const iso = formatDateISO(d);
                  const cellItems = filteredBookings.filter(
                    (b) => b.date === iso && b.timeSlot === slot
                  );
                  return (
                    <div
                      key={`${iso}-${slot}`}
                      onClick={() => openCreateModal(iso, slot)}
                      className="p-1.5 min-h-[72px] border-r last:border-r-0 border-slate-200 hover:bg-slate-50 space-y-1 cursor-pointer"
                    >
                      {cellItems.map((bk) => (
                        <button
                          key={bk.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(bk);
                          }}
                          className={`w-full text-left p-1.5 rounded border text-[11px] leading-tight cursor-pointer ${
                            TYPE_STYLES[bk.type]
                          } ${bk.status === 'Cancelled' ? 'opacity-50 line-through' : ''}`}
                        >
                          <div className="font-semibold truncate">
                            {getPlainDisplayName(
                              { nameEn: bk.customerNameEn, nameZh: bk.customerNameZh },
                              lang
                            )}
                          </div>
                          <div className="opacity-80 truncate">
                            {translateBookingType(lang, bk.type)}
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-600 py-2.5">
            {monthWeekdays.map((wd) => (
              <div key={wd}>{wd}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthCells.map((cell, idx) => {
              if (!cell) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[104px] border-b border-r border-slate-100 bg-slate-50/40"
                  />
                );
              }
              const iso = formatDateISO(cell);
              const items = filteredBookings
                .filter((b) => b.date === iso)
                .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
              const isToday = iso === formatDateISO(new Date());
              return (
                <div
                  key={iso}
                  onClick={() => openCreateModal(iso, slotHours[0])}
                  className="min-h-[104px] p-2 border-b border-r border-slate-200 hover:bg-slate-50/70 space-y-1 cursor-pointer"
                >
                  <div
                    className={`font-mono text-xs font-semibold tabular-nums ${
                      isToday ? 'text-blue-700' : 'text-slate-600'
                    }`}
                  >
                    {cell.getDate()}
                  </div>
                  <div className="space-y-1">
                    {items.slice(0, 3).map((bk) => (
                      <button
                        key={bk.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(bk);
                        }}
                        className={`w-full text-left px-1.5 py-1 rounded border text-[11px] truncate cursor-pointer ${
                          TYPE_STYLES[bk.type]
                        }`}
                      >
                        <span className="font-mono">{bk.timeSlot}</span>{' '}
                        {getPlainDisplayName(
                          { nameEn: bk.customerNameEn, nameZh: bk.customerNameZh },
                          lang
                        )}
                      </button>
                    ))}
                    {items.length > 3 && (
                      <div className="text-[10px] font-medium text-slate-500 pl-1">
                        +{items.length - 3} {t(lang, 'calMoreSuffix')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit / Reschedule Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingBooking ? t(lang, 'calEditBooking') : t(lang, 'calNewBooking')}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">
                    {t(lang, 'calBookingType')}
                  </span>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as BookingType)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="Demo">{translateBookingType(lang, 'Demo')}</option>
                    <option value="Installation">{translateBookingType(lang, 'Installation')}</option>
                    <option value="Repair">{translateBookingType(lang, 'Repair')}</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">{t(lang, 'colStatus')}</span>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as BookingStatus)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    {(['Confirmed', 'In Progress', 'Completed', 'Cancelled'] as BookingStatus[]).map(
                      (st) => (
                        <option key={st} value={st}>
                          {translateBookingStatus(lang, st)}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">
                    {t(lang, 'calDateLabel')}
                  </span>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">
                    {t(lang, 'calTimeSlotLabel')}
                  </span>
                  <select
                    value={formSlot}
                    onChange={(e) => setFormSlot(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  >
                    {db.timeSlotRules.map((r) => (
                      <option key={r.id} value={r.startTime}>
                        {r.startTime} - {r.endTime}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">
                    {t(lang, 'branchLabel')}
                  </span>
                  <select
                    value={formBranchId}
                    onChange={(e) => setFormBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    {db.branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {lang === 'en' ? b.nameEn : b.nameZh}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">
                    {t(lang, 'productModelLabel')}
                  </span>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    {(['Smart Lock', 'Smart Door', 'CCTV & Alarm', 'Video Doorbell'] as ProductCategory[]).map(
                      (c) => (
                        <option key={c} value={c}>
                          {translateCategory(lang, c)}
                        </option>
                      )
                    )}
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
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">
                    {t(lang, 'customerNameZhOptional')}
                  </span>
                  <input
                    type="text"
                    value={formNameZh}
                    onChange={(e) => setFormNameZh(e.target.value)}
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
                  value={formMobile}
                  onChange={(e) => setFormMobile(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>

              {formType !== 'Demo' && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-slate-700">
                      {t(lang, 'assignedTechnician')}
                    </span>
                    <select
                      value={formTechId}
                      onChange={(e) => setFormTechId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    >
                      <option value="">{t(lang, 'unassigned')}</option>
                      {db.technicians.map((tc) => (
                        <option key={tc.id} value={tc.id}>
                          {getPlainDisplayName(tc, lang)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-slate-700">
                      {t(lang, 'addressLabel')}
                    </span>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </label>
                </div>
              )}

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">
                  {t(lang, 'notesOptional')}
                </span>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </label>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {editingBooking ? (
                  <button
                    type="button"
                    onClick={() => {
                      cancelBooking(editingBooking.id);
                      pushToast({ title: t(lang, 'calBookingCancelled'), variant: 'info' });
                      setModalOpen(false);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                  >
                    {t(lang, 'deleteBooking')}
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
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
                    {t(lang, 'saveChanges')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
