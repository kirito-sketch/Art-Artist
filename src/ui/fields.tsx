/*
 * Structured inputs (V30). Dates are picked from a calendar, never typed; money accepts digits only.
 * Values are stored in a clean form (ISO date "2026-11-09", digits "60000") and shown in the product's
 * language ("9 Nov", "₹60,000").
 */
import { CalendarDays } from 'lucide-react';
import type { KeyboardEvent, MouseEvent } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const parts = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
};

/** "2026-11-09" → "9 Nov" (with the year only when it is not this year). */
export function fmtDay(iso: string): string {
  if (!iso) return '';
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS[m - 1]}${y !== new Date().getFullYear() ? ` ${y}` : ''}`;
}

/** A start and optional end as the product writes it: "9 – 21 Nov", "9 Nov – 2 Dec", or "9 Nov". */
export function fmtRange(start: string, end?: string): string {
  if (!start) return '';
  if (!end) return fmtDay(start);
  const a = parts(start);
  const b = parts(end);
  if (a.y === b.y && a.m === b.m) return `${a.d} – ${fmtDay(end)}`;
  return `${fmtDay(start)} – ${fmtDay(end)}`;
}

/** Reads the product's day format back ("18 Oct", "9 – 21 Nov", "18 Oct – 30 Nov") into ISO dates. Anything else: empty. */
export function parseDays(text: string): { start: string; end: string } {
  const now = new Date();
  const iso = (d: number, mon: string) => {
    const m = MONTHS.indexOf(mon.slice(0, 3));
    if (m < 0 || !d) return '';
    // No year in the text: the next occurrence of that day, from this month on.
    const y = m < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };
  const range = /^(\d{1,2})\s*([A-Za-z]{3})?\s*[–-]\s*(\d{1,2})\s+([A-Za-z]{3})/.exec(text.trim());
  if (range) return { start: iso(+range[1], range[2] ?? range[4]), end: iso(+range[3], range[4]) };
  const one = /^(\d{1,2})\s+([A-Za-z]{3})/.exec(text.trim());
  return one ? { start: iso(+one[1], one[2]), end: '' } : { start: '', end: '' };
}

/**
 * A date picked from the calendar. The visible part shows the chosen day (or the placeholder); a
 * native date input lies over it, so a tap opens the platform calendar. Typing is blocked: only a
 * real date can be chosen.
 */
export function DateField({ value, onChange, label, placeholder = 'Choose a date', min = todayIso(), className = '', clearable }: { value: string; onChange: (iso: string) => void; label: string; placeholder?: string; min?: string; className?: string; clearable?: boolean }) {
  const open = (e: MouseEvent<HTMLInputElement>) => {
    try {
      e.currentTarget.showPicker?.();
    } catch {
      /* older browsers open the picker on their own */
    }
  };
  const block = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' || e.key === 'Escape') return;
    e.preventDefault();
    if (e.key === 'Enter' || e.key === ' ') {
      try {
        e.currentTarget.showPicker?.();
      } catch {
        /* ignore */
      }
    }
    if (clearable && (e.key === 'Backspace' || e.key === 'Delete')) onChange('');
  };
  return (
    <span className={`date-field ${value ? 'has-value' : ''} ${className}`}>
      <span className="date-field-text" aria-hidden>
        {value ? fmtDay(value) : placeholder}
        <CalendarDays size={16} />
      </span>
      <input type="date" className="date-field-input" value={value} min={min} aria-label={label} onClick={open} onKeyDown={block} onChange={(e) => onChange(e.target.value)} />
    </span>
  );
}

/** Indian grouping: 1500000 → "15,00,000". */
export const fmtMoney = (digits: string) => (digits ? Number(digits).toLocaleString('en-IN') : '');

/** Money: digits only (paste and letters are stripped), shown grouped, with a ₹ in front. Value is the digits. */
export function MoneyField({ value, onChange, label, placeholder, className = '', prefix = true }: { value: string; onChange: (digits: string) => void; label: string; placeholder?: string; className?: string; prefix?: boolean }) {
  return (
    <span className={`money-field ${className}`}>
      {prefix && <span className="money-field-prefix" aria-hidden>₹</span>}
      <input
        className="money-field-input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        aria-label={label}
        placeholder={placeholder}
        value={fmtMoney(value)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9))}
      />
    </span>
  );
}

/** How a paid amount is counted. */
export const PAY_UNITS = [
  ['day', '/ day'],
  ['flat', 'flat'],
  ['week', '/ week'],
  ['month', '/ month'],
] as const;
export type PayUnit = (typeof PAY_UNITS)[number][0];

/** "₹15,000 / day", "₹15,000–20,000 / day", "₹60,000 flat". Empty when no amount was given. */
export function fmtPay(min: string, max: string, unit: PayUnit): string {
  if (!min && !max) return '';
  const lo = min || max;
  const hi = min && max && Number(max) > Number(min) ? max : '';
  const suffix = PAY_UNITS.find(([k]) => k === unit)?.[1] ?? '';
  return `₹${fmtMoney(lo)}${hi ? `–${fmtMoney(hi)}` : ''} ${suffix}`.trim();
}
