import React, { useMemo } from 'react';
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Ticket,
  Wrench,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateISO, offsetDateISO } from '../../data/seedData';
import {
  t,
  translateBookingStatus,
  translateBookingType,
  translateTicketStatus,
} from '../../i18n/translations';
import { TicketStatus } from '../../types';
import { formatDateLocale, getDisplayName } from '../../utils/display';

const STATUS_ORDER: TicketStatus[] = [
  'New',
  'Assigned',
  'In Progress',
  'Waiting for Parts',
  'Resolved',
  'Closed',
];

const STATUS_BAR_COLORS: Record<TicketStatus, string> = {
  New: 'bg-blue-600',
  Assigned: 'bg-sky-500',
  'In Progress': 'bg-indigo-600',
  'Waiting for Parts': 'bg-amber-500',
  Resolved: 'bg-emerald-600',
  Closed: 'bg-slate-400',
};

export const DashboardPage: React.FC = () => {
  const { db, lang, setStaffPage, setTicketFilterPreset } = useApp();

  const today = formatDateISO(new Date());
  const weekEnd = offsetDateISO(7);
  const warrantyThreshold = offsetDateISO(30);

  const todaysDemosCount = useMemo(
    () =>
      db.bookings.filter(
        (b) => b.date === today && b.type === 'Demo' && b.status !== 'Cancelled'
      ).length,
    [db.bookings, today]
  );

  const openTicketsCount = useMemo(
    () => db.tickets.filter((tk) => tk.status !== 'Resolved' && tk.status !== 'Closed').length,
    [db.tickets]
  );

  const installsThisWeekCount = useMemo(
    () =>
      db.bookings.filter(
        (b) =>
          b.type === 'Installation' &&
          b.status !== 'Cancelled' &&
          b.date >= today &&
          b.date <= weekEnd
      ).length,
    [db.bookings, today, weekEnd]
  );

  const expiringWarranties = useMemo(
    () =>
      db.warranties.filter((w) => w.expiryDate >= today && w.expiryDate <= warrantyThreshold),
    [db.warranties, today, warrantyThreshold]
  );

  const todaysSchedule = useMemo(
    () =>
      db.bookings
        .filter((b) => b.date === today && b.status !== 'Cancelled')
        .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot)),
    [db.bookings, today]
  );

  const ticketDistribution = useMemo(() => {
    const counts: Record<TicketStatus, number> = {
      New: 0,
      Assigned: 0,
      'In Progress': 0,
      'Waiting for Parts': 0,
      Resolved: 0,
      Closed: 0,
    };
    db.tickets.forEach((tk) => {
      counts[tk.status] += 1;
    });
    const maxCount = Math.max(1, ...Object.values(counts));
    return STATUS_ORDER.map((status) => ({
      status,
      count: counts[status],
      pct: Math.round((counts[status] / maxCount) * 100),
    }));
  }, [db.tickets]);

  const kpis = [
    {
      label: t(lang, 'kpiTodaysDemos'),
      value: todaysDemosCount,
      Icon: Calendar,
      accent: 'text-blue-700',
      onClick: () => setStaffPage('calendar'),
    },
    {
      label: t(lang, 'kpiOpenTickets'),
      value: openTicketsCount,
      Icon: Ticket,
      accent: 'text-amber-700',
      onClick: () => {
        setTicketFilterPreset('All');
        setStaffPage('tickets');
      },
    },
    {
      label: t(lang, 'kpiInstallationsWeek'),
      value: installsThisWeekCount,
      Icon: Wrench,
      accent: 'text-emerald-700',
      onClick: () => setStaffPage('installations'),
    },
    {
      label: t(lang, 'kpiWarrantiesExpiring'),
      value: expiringWarranties.length,
      Icon: ShieldAlert,
      accent: 'text-red-700',
      onClick: () => {
        const el = document.getElementById('expiring-warranties');
        el?.scrollIntoView({ behavior: 'smooth' });
      },
    },
  ];

  const getTypeStyles = (type: string) => {
    if (type === 'Demo') return 'text-blue-800 bg-blue-50 border-blue-200';
    if (type === 'Installation') return 'text-emerald-800 bg-emerald-50 border-emerald-200';
    return 'text-amber-800 bg-amber-50 border-amber-200';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={kpi.onClick}
            className="text-left bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-5 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
              <kpi.Icon className={`w-4 h-4 ${kpi.accent}`} />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="font-mono text-3xl font-bold text-slate-900 tabular-nums">
                {kpi.value}
              </span>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-700" />
              <span>{t(lang, 'todaysScheduleTitle')}</span>
            </h2>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {formatDateLocale(today, lang, true)}
            </span>
          </div>

          {todaysSchedule.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">{t(lang, 'noScheduleToday')}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {todaysSchedule.map((item) => {
                const branch = db.branches.find((b) => b.id === item.branchId);
                const tech = db.technicians.find((tc) => tc.id === item.technicianId);
                const addr =
                  lang === 'en'
                    ? item.customerAddressEn
                    : item.customerAddressZh || item.customerAddressEn;
                return (
                  <div
                    key={item.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums shrink-0 pt-0.5">
                        {item.timeSlot}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getTypeStyles(
                              item.type
                            )}`}
                          >
                            {translateBookingType(lang, item.type)}
                          </span>
                          <span className="font-semibold text-sm text-slate-900">
                            {getDisplayName(
                              { nameEn: item.customerNameEn, nameZh: item.customerNameZh },
                              lang
                            )}
                          </span>
                          <span className="font-mono text-xs text-slate-400 tabular-nums">
                            {item.bookingCode}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2">
                          <span>{branch ? (lang === 'en' ? branch.nameEn : branch.nameZh) : ''}</span>
                          {tech && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{getDisplayName(tech, lang)}</span>
                            </>
                          )}
                          {addr && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate max-w-xs">{addr}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-medium text-slate-600 shrink-0">
                      {translateBookingStatus(lang, item.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">{t(lang, 'ticketStatusChartTitle')}</h2>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {db.tickets.length} {t(lang, 'totalLabel')}
            </span>
          </div>

          <div className="space-y-3.5">
            {ticketDistribution.map(({ status, count, pct }) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setTicketFilterPreset(status);
                  setStaffPage('tickets');
                }}
                className="w-full text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700 group-hover:text-blue-700 transition-colors">
                    {translateTicketStatus(lang, status)}
                  </span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {count}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-md overflow-hidden">
                  <div
                    className={`h-full rounded-md transition-all ${STATUS_BAR_COLORS[status]}`}
                    style={{ width: `${Math.max(pct, count > 0 ? 6 : 0)}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section
        id="expiring-warranties"
        className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            {t(lang, 'expiringWarrantiesListTitle')}
          </h2>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {expiringWarranties.length}
          </span>
        </div>

        {expiringWarranties.length === 0 ? (
          <div className="py-4 text-sm text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t(lang, 'noExpiringWarranties')}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="pb-2.5 font-semibold pr-4">{t(lang, 'serialNumberLabel')}</th>
                  <th className="pb-2.5 font-semibold pr-4">{t(lang, 'productModelLabel')}</th>
                  <th className="pb-2.5 font-semibold pr-4">{t(lang, 'colCustomer')}</th>
                  <th className="pb-2.5 font-semibold text-right">{t(lang, 'warrantyExpiryLabel')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expiringWarranties.map((w) => {
                  const prod = db.products.find((p) => p.id === w.productModelId);
                  return (
                    <tr key={w.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 pr-4 font-mono text-xs font-medium text-slate-900 tabular-nums">
                        {w.serialNumber}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-700">
                        {prod ? (lang === 'en' ? prod.nameEn : prod.nameZh) : ''}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-700">
                        {getDisplayName(
                          { nameEn: w.customerNameEn, nameZh: w.customerNameZh },
                          lang
                        )}{' '}
                        · <span className="font-mono text-xs">{w.customerMobile}</span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs font-semibold text-amber-700 tabular-nums">
                        {formatDateLocale(w.expiryDate, lang)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
