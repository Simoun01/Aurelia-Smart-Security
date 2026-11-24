import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MessageSquarePlus, Search, Send, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { t, translatePriority, translateTicketStatus } from '../../i18n/translations';
import { ServiceTicket, TicketPriority, TicketStatus } from '../../types';
import {
  formatDateTimeLocale,
  getDisplayName,
  getPlainDisplayName,
  matchesPersonQuery,
} from '../../utils/display';
import { ResilientImage } from '../shared/ResilientImage';
import { SignaturePad } from '../shared/SignaturePad';

const ALL_STATUSES: TicketStatus[] = [
  'New',
  'Assigned',
  'In Progress',
  'Waiting for Parts',
  'Resolved',
  'Closed',
];

const ALL_PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

const STATUS_BADGE: Record<TicketStatus, string> = {
  New: 'text-blue-800 bg-blue-50 border-blue-200',
  Assigned: 'text-sky-800 bg-sky-50 border-sky-200',
  'In Progress': 'text-indigo-800 bg-indigo-50 border-indigo-200',
  'Waiting for Parts': 'text-amber-800 bg-amber-50 border-amber-200',
  Resolved: 'text-emerald-800 bg-emerald-50 border-emerald-200',
  Closed: 'text-slate-700 bg-slate-100 border-slate-300',
};

const PRIORITY_TEXT: Record<TicketPriority, string> = {
  Low: 'text-slate-600',
  Medium: 'text-blue-700',
  High: 'text-amber-700 font-semibold',
  Urgent: 'text-red-700 font-bold',
};

export const ServiceTicketsPage: React.FC = () => {
  const {
    db,
    lang,
    ticketFilterPreset,
    setTicketFilterPreset,
    updateTicket,
    addTicketNote,
    pushToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All'>(ticketFilterPreset);
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'All'>('All');
  const [techFilter, setTechFilter] = useState<string>('All');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const [noteInput, setNoteInput] = useState('');
  const [resolutionDraft, setResolutionDraft] = useState('');

  useEffect(() => {
    setStatusFilter(ticketFilterPreset);
  }, [ticketFilterPreset]);

  const getProductName = (id: string) => {
    const prod = db.products.find((p) => p.id === id);
    return prod ? (lang === 'en' ? prod.nameEn : prod.nameZh) : '';
  };

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return db.tickets.filter((tk) => {
      if (statusFilter !== 'All' && tk.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && tk.priority !== priorityFilter) return false;
      if (techFilter === 'unassigned' && tk.assignedTechnicianId) return false;
      if (techFilter !== 'All' && techFilter !== 'unassigned' && tk.assignedTechnicianId !== techFilter)
        return false;
      if (q) {
        const prod = db.products.find((p) => p.id === tk.productModelId);
        const tech = db.technicians.find((tc) => tc.id === tk.assignedTechnicianId);
        const matchesCustomer = matchesPersonQuery(
          { nameEn: tk.customerNameEn, nameZh: tk.customerNameZh },
          q
        );
        const matchesTech = tech ? matchesPersonQuery(tech, q) : false;
        const hay = `${tk.ticketNumber} ${tk.customerMobile} ${prod?.nameEn || ''} ${prod?.nameZh || ''} ${tk.addressEn} ${tk.addressZh || ''}`.toLowerCase();
        if (!matchesCustomer && !matchesTech && !hay.includes(q)) return false;
      }
      return true;
    });
  }, [db.tickets, db.products, db.technicians, statusFilter, priorityFilter, techFilter, search]);

  const selectedTicket: ServiceTicket | undefined = useMemo(
    () => db.tickets.find((tk) => tk.id === selectedTicketId),
    [db.tickets, selectedTicketId]
  );

  useEffect(() => {
    if (selectedTicket) {
      const currentRes =
        lang === 'en'
          ? selectedTicket.resolutionNotesEn || ''
          : selectedTicket.resolutionNotesZh || selectedTicket.resolutionNotesEn || '';
      setResolutionDraft(currentRes);
    }
  }, [selectedTicket?.id, lang]);

  const getIssueLabel = (key: string) => {
    const found = db.issueTypes.find((i) => i.key === key);
    return found ? (lang === 'en' ? found.labelEn : found.labelZh) : key;
  };

  if (selectedTicket) {
    const productName = getProductName(selectedTicket.productModelId);
    const descriptionText =
      lang === 'en'
        ? selectedTicket.descriptionEn
        : selectedTicket.descriptionZh || selectedTicket.descriptionEn;
    const addressText =
      lang === 'en'
        ? selectedTicket.addressEn
        : selectedTicket.addressZh || selectedTicket.addressEn;

    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setSelectedTicketId(null)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t(lang, 'backToTickets')}</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="font-mono text-xs text-slate-500 tabular-nums">
                    {selectedTicket.ticketNumber} · {formatDateTimeLocale(selectedTicket.createdAt, lang)}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">{productName}</h2>
                  <p className="text-sm text-blue-700 font-medium mt-0.5">
                    {getIssueLabel(selectedTicket.issueType)}
                  </p>
                </div>

                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded border ${
                    STATUS_BADGE[selectedTicket.status]
                  }`}
                >
                  {translateTicketStatus(lang, selectedTicket.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">{t(lang, 'colCustomer')}</span>
                  <span className="font-semibold text-slate-900">
                    {getDisplayName(
                      { nameEn: selectedTicket.customerNameEn, nameZh: selectedTicket.customerNameZh },
                      lang
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">{t(lang, 'customerMobile')}</span>
                  <span className="font-mono text-slate-900 tabular-nums">
                    {selectedTicket.customerMobile}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs text-slate-500 block">{t(lang, 'addressLabel')}</span>
                  <span className="text-slate-800">{addressText}</span>
                </div>
                {selectedTicket.serialNumber && (
                  <div>
                    <span className="text-xs text-slate-500 block">
                      {t(lang, 'serialNumberLabel')}
                    </span>
                    <span className="font-mono text-xs text-slate-800 tabular-nums">
                      {selectedTicket.serialNumber}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-semibold text-slate-500 block">
                  {t(lang, 'issueDescLabel')}
                </span>
                <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                  {descriptionText}
                </p>
              </div>

              {selectedTicket.photoUrl && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500 block">
                    {t(lang, 'customerPhotoLabel')}
                  </span>
                  <ResilientImage
                    src={selectedTicket.photoUrl}
                    alt={selectedTicket.ticketNumber}
                    className="max-h-64 w-auto rounded-xl border border-slate-200 object-cover"
                  />
                </div>
              )}

              {selectedTicket.completionPhotoUrl && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-emerald-700 block">
                    {t(lang, 'completionPhotoAttached')}
                  </span>
                  <ResilientImage
                    src={selectedTicket.completionPhotoUrl}
                    alt={selectedTicket.ticketNumber}
                    className="max-h-64 w-auto rounded-xl border border-emerald-200 object-cover"
                  />
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {t(lang, 'resolutionNotesLabel')}
                </label>
                <textarea
                  rows={3}
                  value={resolutionDraft}
                  onChange={(e) => setResolutionDraft(e.target.value)}
                  placeholder={t(lang, 'resolutionNotesPlaceholder')}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      updateTicket(
                        selectedTicket.id,
                        lang === 'en'
                          ? { resolutionNotesEn: resolutionDraft }
                          : { resolutionNotesZh: resolutionDraft }
                      );
                      pushToast({ title: t(lang, 'resolutionSaved'), variant: 'success' });
                    }}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg cursor-pointer"
                  >
                    {t(lang, 'saveChanges')}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="block text-xs font-semibold text-slate-700">
                  {t(lang, 'signatureForLabel')}{' '}
                  {getDisplayName(
                    { nameEn: selectedTicket.customerNameEn, nameZh: selectedTicket.customerNameZh },
                    lang
                  )}
                </span>
                <SignaturePad
                  value={selectedTicket.customerSignature}
                  clearLabel={t(lang, 'clearSignature')}
                  saveLabel={t(lang, 'saveSignature')}
                  savedLabel={t(lang, 'signatureSaved')}
                  onSave={(sig) => {
                    updateTicket(selectedTicket.id, { customerSignature: sig });
                    if (sig) {
                      pushToast({ title: t(lang, 'signatureSaved'), variant: 'success' });
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-700" />
                <span>{t(lang, 'dispatchAndStatus')}</span>
              </h3>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-600">{t(lang, 'colStatus')}</span>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => {
                    updateTicket(selectedTicket.id, { status: e.target.value as TicketStatus });
                    pushToast({
                      title: `${selectedTicket.ticketNumber} → ${translateTicketStatus(
                        lang,
                        e.target.value as TicketStatus
                      )}`,
                      variant: 'info',
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {translateTicketStatus(lang, st)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-600">{t(lang, 'colPriority')}</span>
                <select
                  value={selectedTicket.priority}
                  onChange={(e) =>
                    updateTicket(selectedTicket.id, { priority: e.target.value as TicketPriority })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {ALL_PRIORITIES.map((pr) => (
                    <option key={pr} value={pr}>
                      {translatePriority(lang, pr)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-600">
                  {t(lang, 'assignedTechnician')}
                </span>
                <select
                  value={selectedTicket.assignedTechnicianId || ''}
                  onChange={(e) => {
                    const techId = e.target.value || undefined;
                    updateTicket(selectedTicket.id, {
                      assignedTechnicianId: techId,
                      status:
                        techId && selectedTicket.status === 'New'
                          ? 'Assigned'
                          : selectedTicket.status,
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">{t(lang, 'unassigned')}</option>
                  {db.technicians.map((tc) => (
                    <option key={tc.id} value={tc.id}>
                      {getPlainDisplayName(tc, lang)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-blue-700" />
                <span>{t(lang, 'internalNotesTimeline')}</span>
              </h3>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {selectedTicket.internalNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">{t(lang, 'noInternalNotes')}</p>
                ) : (
                  selectedTicket.internalNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-800">
                          {getDisplayName(
                            { nameEn: note.authorNameEn, nameZh: note.authorNameZh },
                            lang
                          )}
                        </span>
                        <span className="font-mono tabular-nums shrink-0">
                          {formatDateTimeLocale(note.createdAt, lang)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {lang === 'en' ? note.textEn : note.textZh || note.textEn}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!noteInput.trim()) return;
                  addTicketNote(selectedTicket.id, noteInput);
                  setNoteInput('');
                }}
                className="flex gap-2 pt-2 border-t border-slate-100"
              >
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder={t(lang, 'addInternalNote')}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t(lang, 'addNoteBtn')}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(lang, 'ticketsSearchPlaceholder')}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                const next = e.target.value as TicketStatus | 'All';
                setStatusFilter(next);
                setTicketFilterPreset(next);
              }}
              className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg"
            >
              <option value="All">{t(lang, 'filterAllStatuses')}</option>
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {translateTicketStatus(lang, st)}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'All')}
              className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg"
            >
              <option value="All">{t(lang, 'filterAllPriorities')}</option>
              {ALL_PRIORITIES.map((pr) => (
                <option key={pr} value={pr}>
                  {translatePriority(lang, pr)}
                </option>
              ))}
            </select>

            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg"
            >
              <option value="All">{t(lang, 'filterAllTechs')}</option>
              <option value="unassigned">{t(lang, 'unassigned')}</option>
              {db.technicians.map((tc) => (
                <option key={tc.id} value={tc.id}>
                  {getPlainDisplayName(tc, lang)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-slate-600">{t(lang, 'noTicketsMatch')}</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
                setTicketFilterPreset('All');
                setPriorityFilter('All');
                setTechFilter('All');
              }}
              className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
            >
              {t(lang, 'clearFilters')}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-4">{t(lang, 'colTicket')}</th>
                  <th className="py-3 px-4">{t(lang, 'colCustomer')}</th>
                  <th className="py-3 px-4">{t(lang, 'colProductIssue')}</th>
                  <th className="py-3 px-4">{t(lang, 'colPriority')}</th>
                  <th className="py-3 px-4">{t(lang, 'colStatus')}</th>
                  <th className="py-3 px-4">{t(lang, 'colTech')}</th>
                  <th className="py-3 px-4 text-right">{t(lang, 'colUpdated')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((tk) => {
                  const tech = db.technicians.find((tc) => tc.id === tk.assignedTechnicianId);
                  return (
                    <tr
                      key={tk.id}
                      onClick={() => setSelectedTicketId(tk.id)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-700 tabular-nums whitespace-nowrap">
                        {tk.ticketNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {getDisplayName(
                            { nameEn: tk.customerNameEn, nameZh: tk.customerNameZh },
                            lang
                          )}
                        </div>
                        <div className="font-mono text-xs text-slate-500 tabular-nums">
                          {tk.customerMobile}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {getProductName(tk.productModelId)}
                        </div>
                        <div className="text-xs text-slate-500">{getIssueLabel(tk.issueType)}</div>
                      </td>
                      <td className={`py-3 px-4 text-xs whitespace-nowrap ${PRIORITY_TEXT[tk.priority]}`}>
                        {translatePriority(lang, tk.priority)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border ${
                            STATUS_BADGE[tk.status]
                          }`}
                        >
                          {translateTicketStatus(lang, tk.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                        {tech ? getDisplayName(tech, lang) : t(lang, 'unassigned')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {formatDateTimeLocale(tk.updatedAt, lang)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
