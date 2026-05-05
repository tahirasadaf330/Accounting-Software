'use client';

import { cn } from '@/lib/cn';

const PRESETS = [
  { value: 'THIS_WEEK', label: 'This Week' },
  { value: 'LAST_WEEK', label: 'Last Week' },
  { value: 'THIS_MONTH', label: 'This Month' },
  { value: 'LAST_MONTH', label: 'Last Month' },
  { value: 'THIS_YEAR', label: 'This Year' },
  { value: 'CUSTOM', label: 'Custom' },
] as const;

type PresetValue = (typeof PRESETS)[number]['value'];

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Week starts on Monday and ends on Sunday.
function rangeFor(
  preset: PresetValue,
  today: Date = new Date(),
): { start: string; end: string } | null {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  // getDay(): 0=Sun .. 6=Sat. Days to roll back to Monday: 0->6, 1->0, 2->1, ... 6->5.
  const daysSinceMonday = (t.getDay() + 6) % 7;

  switch (preset) {
    case 'THIS_WEEK': {
      const mon = new Date(t);
      mon.setDate(t.getDate() - daysSinceMonday);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { start: ymd(mon), end: ymd(sun) };
    }
    case 'LAST_WEEK': {
      const mon = new Date(t);
      mon.setDate(t.getDate() - daysSinceMonday - 7);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { start: ymd(mon), end: ymd(sun) };
    }
    case 'THIS_MONTH': {
      const first = new Date(t.getFullYear(), t.getMonth(), 1);
      const last = new Date(t.getFullYear(), t.getMonth() + 1, 0);
      return { start: ymd(first), end: ymd(last) };
    }
    case 'LAST_MONTH': {
      const first = new Date(t.getFullYear(), t.getMonth() - 1, 1);
      const last = new Date(t.getFullYear(), t.getMonth(), 0);
      return { start: ymd(first), end: ymd(last) };
    }
    case 'THIS_YEAR': {
      return { start: `${t.getFullYear()}-01-01`, end: `${t.getFullYear()}-12-31` };
    }
    case 'CUSTOM':
    default:
      return null;
  }
}

function detectPreset(start: string, end: string): PresetValue | '' {
  if (!start || !end) return '';
  for (const p of PRESETS) {
    if (p.value === 'CUSTOM') continue;
    const r = rangeFor(p.value);
    if (r && r.start === start && r.end === end) return p.value;
  }
  return 'CUSTOM';
}

interface Props {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  className?: string;
}

export function PeriodQuickPick({ start, end, onChange, className }: Props) {
  const value = detectPreset(start, end);
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        Invoice Period <span className="text-gray-400 font-normal">(optional)</span>
      </label>
      <select
        value={value}
        onChange={(e) => {
          const next = e.target.value as PresetValue | '';
          if (next === '' || next === 'CUSTOM') {
            onChange('', '');
            return;
          }
          const r = rangeFor(next);
          if (r) onChange(r.start, r.end);
        }}
        className={cn(
          'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
          value === '' && 'text-gray-400',
        )}
      >
        <option value="" disabled hidden>Select</option>
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value} className="text-gray-900">
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}
