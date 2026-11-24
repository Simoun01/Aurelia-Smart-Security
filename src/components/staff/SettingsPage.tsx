import React, { useState } from 'react';
import { Lock, Pencil, Plus, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ASSET_IMAGES } from '../../data/seedData';
import {
  t,
  translateCategory,
  translatePriority,
  translateRole,
  translateTier,
} from '../../i18n/translations';
import { LockTier, ProductCategory, TicketPriority } from '../../types';
import { getDisplayName } from '../../utils/display';

type SettingsTab = 'branches' | 'slots' | 'technicians' | 'staffUsers' | 'products' | 'issues';

export const SettingsPage: React.FC = () => {
  const {
    db,
    lang,
    role,
    addBranch,
    updateBranch,
    addTimeSlotRule,
    updateTimeSlotRule,
    addTechnician,
    updateTechnician,
    addStaffUser,
    updateStaffUser,
    addProduct,
    updateProduct,
    addIssueType,
    resetDemoData,
    pushToast,
  } = useApp();

  const isAdmin = role === 'admin';
  const [tab, setTab] = useState<SettingsTab>('branches');

  // New Branch form
  const [brNameEn, setBrNameEn] = useState('');
  const [brNameZh, setBrNameZh] = useState('');
  const [brAddressEn, setBrAddressEn] = useState('');
  const [brPhone, setBrPhone] = useState('');

  // New Slot form
  const [slotStart, setSlotStart] = useState('19:30');
  const [slotEnd, setSlotEnd] = useState('20:30');
  const [slotMax, setSlotMax] = useState(2);

  // New Tech form + inline edit
  const [techNameEn, setTechNameEn] = useState('');
  const [techNameZh, setTechNameZh] = useState('');
  const [techPhone, setTechPhone] = useState('');
  const [techBranch, setTechBranch] = useState(db.branches[0]?.id || '');
  const [editingTechId, setEditingTechId] = useState<string | null>(null);
  const [editTechEn, setEditTechEn] = useState('');
  const [editTechZh, setEditTechZh] = useState('');

  // Staff User form + inline edit
  const [staffNameEn, setStaffNameEn] = useState('');
  const [staffNameZh, setStaffNameZh] = useState('');
  const [staffRole, setStaffRole] = useState<'admin' | 'front_desk'>('front_desk');
  const [staffEmail, setStaffEmail] = useState('');
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffEn, setEditStaffEn] = useState('');
  const [editStaffZh, setEditStaffZh] = useState('');

  // New Product form
  const [prodNameEn, setProdNameEn] = useState('');
  const [prodNameZh, setProdNameZh] = useState('');
  const [prodCat, setProdCat] = useState<ProductCategory>('Smart Lock');
  const [prodTier, setProdTier] = useState<LockTier>('Mid-Range');
  const [prodPrice, setProdPrice] = useState(499);

  // New Issue Type form
  const [issLabelEn, setIssLabelEn] = useState('');
  const [issLabelZh, setIssLabelZh] = useState('');
  const [issPriority, setIssPriority] = useState<TicketPriority>('Medium');

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'branches', label: t(lang, 'settingsBranches') },
    { id: 'slots', label: t(lang, 'settingsSlotRules') },
    { id: 'technicians', label: t(lang, 'settingsTechnicians') },
    { id: 'staffUsers', label: t(lang, 'settingsStaffUsers') },
    { id: 'products', label: t(lang, 'settingsProducts') },
    { id: 'issues', label: t(lang, 'settingsIssueTypes') },
  ];

  return (
    <div className="space-y-5">
      {!isAdmin && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs font-medium text-amber-900">
          <Lock className="w-4 h-4 shrink-0" />
          <span>{t(lang, 'readOnlySettingsNotice')}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap p-1 bg-slate-200/80 rounded-xl gap-1">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                tab === tb.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={resetDemoData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t(lang, 'resetData')}</span>
        </button>
      </div>

      {/* Branches */}
      {tab === 'branches' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="divide-y divide-slate-100">
            {db.branches.map((br) => (
              <div
                key={br.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-900">
                    {lang === 'en' ? br.nameEn : br.nameZh} ·{' '}
                    <span className="text-slate-400 font-normal">
                      {lang === 'en' ? br.nameZh : br.nameEn}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {lang === 'en' ? br.addressEn : br.addressZh} ·{' '}
                    <span className="font-mono">{br.hours}</span> ·{' '}
                    <span className="font-mono">{br.phone}</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => updateBranch(br.id, { active: !br.active })}
                  className={`px-3 py-1 text-xs font-semibold rounded border ${
                    br.active
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                      : 'text-slate-600 bg-slate-100 border-slate-200'
                  } ${isAdmin ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                >
                  {br.active ? t(lang, 'active') : t(lang, 'inactive')}
                </button>
              </div>
            ))}
          </div>

          {isAdmin && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!brNameEn.trim()) return;
                addBranch({
                  nameEn: brNameEn.trim(),
                  nameZh: brNameZh.trim() || brNameEn.trim(),
                  addressEn: brAddressEn.trim() || 'Showroom Address',
                  addressZh: brAddressEn.trim() || '展厅地址',
                  phone: brPhone.trim() || '+63 2 8000 0000',
                  hours: '10:00 - 20:00',
                  demoBays: 2,
                  active: true,
                });
                setBrNameEn('');
                setBrNameZh('');
                setBrAddressEn('');
                setBrPhone('');
                pushToast({ title: t(lang, 'branchAddedToast'), variant: 'success' });
              }}
              className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-3"
            >
              <input
                type="text"
                required
                value={brNameEn}
                onChange={(e) => setBrNameEn(e.target.value)}
                placeholder={t(lang, 'branchNameEnPlaceholder')}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={brNameZh}
                onChange={(e) => setBrNameZh(e.target.value)}
                placeholder={t(lang, 'branchNameZhPlaceholder')}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={brAddressEn}
                onChange={(e) => setBrAddressEn(e.target.value)}
                placeholder={t(lang, 'addressLabel')}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={brPhone}
                onChange={(e) => setBrPhone(e.target.value)}
                placeholder="+63 2 8123 4567"
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t(lang, 'addBranch')}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Time-Slot Rules */}
      {tab === 'slots' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="divide-y divide-slate-100">
            {db.timeSlotRules.map((rule) => (
              <div
                key={rule.id}
                className="py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                    {rule.startTime} – {rule.endTime}
                  </span>
                  <span className="text-xs text-slate-500">
                    {t(lang, 'maxConcurrentDemosLabel')}{' '}
                    <strong className="font-mono text-slate-800">{rule.maxConcurrentDemos}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => updateTimeSlotRule(rule.id, { enabled: !rule.enabled })}
                  className={`px-3 py-1 text-xs font-semibold rounded border ${
                    rule.enabled
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                      : 'text-slate-600 bg-slate-100 border-slate-200'
                  } ${isAdmin ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                >
                  {rule.enabled ? t(lang, 'active') : t(lang, 'inactive')}
                </button>
              </div>
            ))}
          </div>

          {isAdmin && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addTimeSlotRule({
                  startTime: slotStart,
                  endTime: slotEnd,
                  maxConcurrentDemos: slotMax,
                  enabled: true,
                });
                pushToast({ title: t(lang, 'slotAddedToast'), variant: 'success' });
              }}
              className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3"
            >
              <input
                type="time"
                value={slotStart}
                onChange={(e) => setSlotStart(e.target.value)}
                className="px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
              <input
                type="time"
                value={slotEnd}
                onChange={(e) => setSlotEnd(e.target.value)}
                className="px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
              <input
                type="number"
                min={1}
                max={6}
                value={slotMax}
                onChange={(e) => setSlotMax(Number(e.target.value) || 1)}
                className="px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t(lang, 'addSlotRule')}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Technicians */}
      {tab === 'technicians' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="divide-y divide-slate-100">
            {db.technicians.map((tc) => {
              const br = db.branches.find((b) => b.id === tc.branchId);
              const isEditing = editingTechId === tc.id;
              return (
                <div
                  key={tc.id}
                  className="py-3.5 flex flex-wrap items-center justify-between gap-3"
                >
                  {isEditing ? (
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editTechEn}
                        onChange={(e) => setEditTechEn(e.target.value)}
                        placeholder={t(lang, 'techNameEnPlaceholder')}
                        className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={editTechZh}
                        onChange={(e) => setEditTechZh(e.target.value)}
                        placeholder={t(lang, 'techNameZhPlaceholder')}
                        className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateTechnician(tc.id, {
                            nameEn: editTechEn.trim() || tc.nameEn,
                            nameZh: editTechZh.trim(),
                          });
                          setEditingTechId(null);
                          pushToast({ title: t(lang, 'techUpdatedToast'), variant: 'success' });
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-lg cursor-pointer"
                      >
                        {t(lang, 'doneLabel')}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold text-sm text-slate-900">
                        {getDisplayName(tc, lang)}
                        {lang === 'en' && tc.nameZh && (
                          <span className="text-slate-400 font-normal ml-1.5">· {tc.nameZh}</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        <span className="font-mono">{tc.phone}</span> ·{' '}
                        {br ? (lang === 'en' ? br.nameEn : br.nameZh) : ''} ·{' '}
                        {tc.specialties.map((s) => translateCategory(lang, s)).join(' · ')}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {isAdmin && !isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTechId(tc.id);
                          setEditTechEn(tc.nameEn);
                          setEditTechZh(tc.nameZh);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>{t(lang, 'editLabel')}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => updateTechnician(tc.id, { active: !tc.active })}
                      className={`px-3 py-1 text-xs font-semibold rounded border ${
                        tc.active
                          ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                          : 'text-slate-600 bg-slate-100 border-slate-200'
                      } ${isAdmin ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                    >
                      {tc.active ? t(lang, 'active') : t(lang, 'inactive')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {isAdmin && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!techNameEn.trim()) return;
                addTechnician({
                  nameEn: techNameEn.trim(),
                  nameZh: techNameZh.trim(),
                  phone: techPhone.trim() || '+63 917 000 0000',
                  branchId: techBranch,
                  specialties: ['Smart Lock'],
                  active: true,
                });
                setTechNameEn('');
                setTechNameZh('');
                setTechPhone('');
                pushToast({ title: t(lang, 'techAddedToast'), variant: 'success' });
              }}
              className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-3"
            >
              <input
                type="text"
                required
                value={techNameEn}
                onChange={(e) => setTechNameEn(e.target.value)}
                placeholder={t(lang, 'techNameEnPlaceholder')}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={techNameZh}
                onChange={(e) => setTechNameZh(e.target.value)}
                placeholder={t(lang, 'techNameZhPlaceholder')}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="tel"
                value={techPhone}
                onChange={(e) => setTechPhone(e.target.value)}
                placeholder="+63 917 876 5432"
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <select
                value={techBranch}
                onChange={(e) => setTechBranch(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                {db.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {lang === 'en' ? b.nameEn : b.nameZh}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t(lang, 'addTechnician')}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Staff Accounts (Admin & Front Desk) */}
      {tab === 'staffUsers' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="divide-y divide-slate-100">
            {db.staffUsers.map((su) => {
              const isEditing = editingStaffId === su.id;
              return (
                <div
                  key={su.id}
                  className="py-3.5 flex flex-wrap items-center justify-between gap-3"
                >
                  {isEditing ? (
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editStaffEn}
                        onChange={(e) => setEditStaffEn(e.target.value)}
                        placeholder={t(lang, 'techNameEnPlaceholder')}
                        className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={editStaffZh}
                        onChange={(e) => setEditStaffZh(e.target.value)}
                        placeholder={t(lang, 'techNameZhPlaceholder')}
                        className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateStaffUser(su.id, {
                            nameEn: editStaffEn.trim() || su.nameEn,
                            nameZh: editStaffZh.trim(),
                          });
                          setEditingStaffId(null);
                          pushToast({ title: t(lang, 'staffUpdatedToast'), variant: 'success' });
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-lg cursor-pointer"
                      >
                        {t(lang, 'doneLabel')}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold text-sm text-slate-900">
                        {getDisplayName(su, lang)}
                        {lang === 'en' && su.nameZh && (
                          <span className="text-slate-400 font-normal ml-1.5">· {su.nameZh}</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {translateRole(lang, su.role)} ·{' '}
                        <span className="font-mono">{su.email}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {isAdmin && !isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStaffId(su.id);
                          setEditStaffEn(su.nameEn);
                          setEditStaffZh(su.nameZh);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>{t(lang, 'editLabel')}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => updateStaffUser(su.id, { active: !su.active })}
                      className={`px-3 py-1 text-xs font-semibold rounded border ${
                        su.active
                          ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                          : 'text-slate-600 bg-slate-100 border-slate-200'
                      } ${isAdmin ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                    >
                      {su.active ? t(lang, 'active') : t(lang, 'inactive')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {isAdmin && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!staffNameEn.trim()) return;
                addStaffUser({
                  nameEn: staffNameEn.trim(),
                  nameZh: staffNameZh.trim(),
                  role: staffRole,
                  email: staffEmail.trim() || 'staff@aurelia-security.com',
                  branchId: db.branches[0]?.id || 'br-central',
                  active: true,
                });
                setStaffNameEn('');
                setStaffNameZh('');
                setStaffEmail('');
                pushToast({ title: t(lang, 'staffAddedToast'), variant: 'success' });
              }}
              className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-3"
            >
              <input
                type="text"
                required
                value={staffNameEn}
                onChange={(e) => setStaffNameEn(e.target.value)}
                placeholder={t(lang, 'techNameEnPlaceholder')}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={staffNameZh}
                onChange={(e) => setStaffNameZh(e.target.value)}
                placeholder={t(lang, 'techNameZhPlaceholder')}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value as 'admin' | 'front_desk')}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                <option value="front_desk">{translateRole(lang, 'front_desk')}</option>
                <option value="admin">{translateRole(lang, 'admin')}</option>
              </select>
              <input
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="email@aurelia-security.com"
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t(lang, 'addStaffUser')}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Product Models & Lock Tiers */}
      {tab === 'products' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="divide-y divide-slate-100">
            {db.products.map((prod) => (
              <div
                key={prod.id}
                className="py-3.5 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-900">
                    {lang === 'en' ? prod.nameEn : prod.nameZh} ·{' '}
                    <span className="text-slate-400 font-normal">
                      {lang === 'en' ? prod.nameZh : prod.nameEn}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {translateCategory(lang, prod.category)}
                    {prod.tier ? ` · ${translateTier(lang, prod.tier)}` : ''} ·{' '}
                    <span className="font-mono font-semibold text-slate-800">${prod.price}</span> ·{' '}
                    <span className="font-mono">
                      {prod.warrantyMonths} {t(lang, 'warrantyMonthsUnit')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => updateProduct(prod.id, { active: !prod.active })}
                  className={`px-3 py-1 text-xs font-semibold rounded border ${
                    prod.active
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                      : 'text-slate-600 bg-slate-100 border-slate-200'
                  } ${isAdmin ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                >
                  {prod.active ? t(lang, 'active') : t(lang, 'inactive')}
                </button>
              </div>
            ))}
          </div>

          {isAdmin && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!prodNameEn.trim()) return;
                addProduct({
                  nameEn: prodNameEn.trim(),
                  nameZh: prodNameZh.trim() || prodNameEn.trim(),
                  category: prodCat,
                  tier: prodCat === 'Smart Lock' ? prodTier : undefined,
                  price: prodPrice,
                  warrantyMonths: 24,
                  highlightsEn: 'Certified Aurelia security hardware',
                  highlightsZh: '奥瑞利亚原厂认证安防硬件',
                  imageUrl: ASSET_IMAGES[prodCat],
                  active: true,
                });
                setProdNameEn('');
                setProdNameZh('');
                pushToast({ title: t(lang, 'productAddedToast'), variant: 'success' });
              }}
              className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-3"
            >
              <input
                type="text"
                required
                value={prodNameEn}
                onChange={(e) => setProdNameEn(e.target.value)}
                placeholder={t(lang, 'modelNameEnPlaceholder')}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={prodNameZh}
                onChange={(e) => setProdNameZh(e.target.value)}
                placeholder={t(lang, 'modelNameZhPlaceholder')}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <select
                value={prodCat}
                onChange={(e) => setProdCat(e.target.value as ProductCategory)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                {(['Smart Lock', 'Smart Door', 'CCTV & Alarm', 'Video Doorbell'] as ProductCategory[]).map(
                  (c) => (
                    <option key={c} value={c}>
                      {translateCategory(lang, c)}
                    </option>
                  )
                )}
              </select>
              <select
                value={prodTier}
                disabled={prodCat !== 'Smart Lock'}
                onChange={(e) => setProdTier(e.target.value as LockTier)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg disabled:opacity-40"
              >
                <option value="Entry">{translateTier(lang, 'Entry')}</option>
                <option value="Mid-Range">{translateTier(lang, 'Mid-Range')}</option>
                <option value="Flagship">{translateTier(lang, 'Flagship')}</option>
              </select>
              <input
                type="number"
                min={50}
                value={prodPrice}
                onChange={(e) => setProdPrice(Number(e.target.value) || 299)}
                className="px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t(lang, 'addProduct')}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Issue Types */}
      {tab === 'issues' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="divide-y divide-slate-100">
            {db.issueTypes.map((iss) => (
              <div
                key={iss.id}
                className="py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <span className="font-semibold text-sm text-slate-900">
                    {lang === 'en' ? iss.labelEn : iss.labelZh}
                  </span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="text-sm text-slate-500">
                    {lang === 'en' ? iss.labelZh : iss.labelEn}
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-600">
                  {t(lang, 'colPriority')}: {translatePriority(lang, iss.defaultPriority)}
                </span>
              </div>
            ))}
          </div>

          {isAdmin && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!issLabelEn.trim()) return;
                addIssueType({
                  key: issLabelEn.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                  labelEn: issLabelEn.trim(),
                  labelZh: issLabelZh.trim() || issLabelEn.trim(),
                  defaultPriority: issPriority,
                });
                setIssLabelEn('');
                setIssLabelZh('');
                pushToast({ title: t(lang, 'issueAddedToast'), variant: 'success' });
              }}
              className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3"
            >
              <input
                type="text"
                required
                value={issLabelEn}
                onChange={(e) => setIssLabelEn(e.target.value)}
                placeholder={t(lang, 'issueEnPlaceholder')}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={issLabelZh}
                onChange={(e) => setIssLabelZh(e.target.value)}
                placeholder={t(lang, 'issueZhPlaceholder')}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <select
                value={issPriority}
                onChange={(e) => setIssPriority(e.target.value as TicketPriority)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                {(['Low', 'Medium', 'High', 'Urgent'] as TicketPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {translatePriority(lang, p)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t(lang, 'addIssueType')}</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
