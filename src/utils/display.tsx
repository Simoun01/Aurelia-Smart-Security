import React from 'react';
import { Language, PersonName } from '../types';

export function getDisplayName(
  person: Partial<PersonName> | null | undefined,
  lang: Language,
  secondaryClassName = 'text-slate-400 font-normal text-[0.85em] ml-1.5'
): React.ReactNode {
  if (!person) return '';
  const en = (person.nameEn || '').trim();
  const zh = (person.nameZh || '').trim();

  if (lang === 'en') {
    return en || zh;
  }

  if (zh && en) {
    return (
      <>
        <span>{zh}</span>
        <span className={secondaryClassName}>{en}</span>
      </>
    );
  }
  return zh || en;
}

export function getPlainDisplayName(
  person: Partial<PersonName> | null | undefined,
  lang: Language
): string {
  if (!person) return '';
  const en = (person.nameEn || '').trim();
  const zh = (person.nameZh || '').trim();

  if (lang === 'en') {
    return en || zh;
  }
  if (zh && en) {
    return `${zh} ${en}`;
  }
  return zh || en;
}

export function matchesPersonQuery(
  person: Partial<PersonName> | null | undefined,
  query: string
): boolean {
  if (!person) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    (person.nameEn || '').toLowerCase().includes(q) ||
    (person.nameZh || '').toLowerCase().includes(q)
  );
}

export function parseLocalDate(isoDate: string): Date | null {
  if (!isoDate) return null;
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function formatDateLocale(isoDate: string, lang: Language, withWeekday = false): string {
  const dt = parseLocalDate(isoDate);
  if (!dt) return isoDate;
  if (lang === 'zh') {
    const base = new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dt);
    if (!withWeekday) return base;
    const wk = new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(dt);
    return `${base} ${wk}`;
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withWeekday ? { weekday: 'short' } : {}),
  }).format(dt);
}

export function formatDateTimeLocale(stamp: string, lang: Language): string {
  if (!stamp) return '';
  const [datePart, timePart] = stamp.split(' ');
  const dt = parseLocalDate(datePart);
  if (!dt) return stamp;
  const dateLabel = formatDateLocale(datePart, lang, lang === 'zh');
  return timePart ? `${dateLabel} ${timePart}` : dateLabel;
}

export function formatMonthYearLocale(date: Date, lang: Language): string {
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
  }).format(date);
}

export function formatWeekdayShort(date: Date, lang: Language): string {
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    weekday: 'short',
  }).format(date);
}

export function formatShortDate(date: Date, lang: Language): string {
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'numeric',
    day: 'numeric',
  }).format(date);
}
