// Centralized clock supporting real time and DevTools simulation overrides
export interface ClockOverride {
  dayOffset: number;
  timeHHmm: string | null; // e.g. "22:30" or "17:00"
  fastFocusSeconds: number | null; // e.g. 10 to finish Focus in 10s during testing
  simulateOffline: boolean;
}

let currentOverride: ClockOverride = {
  dayOffset: 0,
  timeHHmm: null,
  fastFocusSeconds: null,
  simulateOffline: false,
};

export function setClockOverride(partial: Partial<ClockOverride>): ClockOverride {
  currentOverride = { ...currentOverride, ...partial };
  return currentOverride;
}

export function getClockOverride(): ClockOverride {
  return currentOverride;
}

export function getNowDate(): Date {
  const now = new Date();
  if (currentOverride.dayOffset !== 0) {
    now.setDate(now.getDate() + currentOverride.dayOffset);
  }
  if (currentOverride.timeHHmm) {
    const [hh, mm] = currentOverride.timeHHmm.split(':').map(Number);
    if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
      now.setHours(hh, mm, 0, 0);
    }
  }
  return now;
}

export function formatDateYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayKey(): string {
  return formatDateYYYYMMDD(getNowDate());
}

export function addDaysYYYYMMDD(baseYYYYMMDD: string, days: number): string {
  const [y, m, d] = baseYYYYMMDD.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return formatDateYYYYMMDD(dt);
}

export function getCurrentHHmm(): string {
  const d = getNowDate();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToHHmm(mins: number): string {
  const normalized = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTime12h(hhmm: string): string {
  const [hRaw, m] = hhmm.split(':').map(Number);
  const suffix = hRaw >= 12 ? 'PM' : 'AM';
  const h12 = hRaw % 12 === 0 ? 12 : hRaw % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function getSpanishDayLabel(yyyyMmDd: string): string {
  const today = getTodayKey();
  if (yyyyMmDd === today) return 'Hoy';
  if (yyyyMmDd === addDaysYYYYMMDD(today, 1)) return 'Mañana';
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function getWeekStartMonday(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.getDay(); // 0=Sun, 1=Mon
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return formatDateYYYYMMDD(dt);
}

import type { ClassBlock, LeisureConflictInfo, UserWellnessConfig } from '../types/domain';

export const DAY_NAMES_FULL: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
};

export function findClassOverlap(
  candidate: { dayOfWeek: number; startTime: string; endTime: string },
  existingBlocks: ClassBlock[],
  excludeBlockId?: string
): ClassBlock | null {
  const cStart = timeToMinutes(candidate.startTime);
  const cEnd = timeToMinutes(candidate.endTime);
  if (cEnd <= cStart) return null;

  for (const b of existingBlocks) {
    if (excludeBlockId && b.id === excludeBlockId) continue;
    if (b.dayOfWeek !== candidate.dayOfWeek) continue;
    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);
    if (cStart < bEnd && cEnd > bStart) {
      return b;
    }
  }
  return null;
}

export function getJsDayOfWeek1to7(yyyyMmDd: string): number {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 ? 7 : day; // 1=Mon..7=Sun
}

/**
 * Checks if starting a Pomodoro block now conflicts with today's Protected Leisure window.
 */
export function evaluateLeisureConflict(
  plannedMinutes: number,
  config: UserWellnessConfig | null
): LeisureConflictInfo | null {
  if (!config) return null;
  const todayDow = getJsDayOfWeek1to7(getTodayKey());
  if (!config.leisureDays.includes(todayDow)) return null;

  const nowMins = timeToMinutes(getCurrentHHmm());
  const startMins = timeToMinutes(config.leisureStart);
  const endMins = timeToMinutes(config.leisureEnd);
  if (endMins <= startMins) return null;

  if (nowMins >= startMins && nowMins < endMins) {
    return {
      type: 'during_leisure',
      leisureStart: config.leisureStart,
      leisureEnd: config.leisureEnd,
      minutesUntilLeisure: 0,
      rigidity: config.shieldRigidity,
    };
  }

  if (nowMins < startMins && nowMins + plannedMinutes > startMins) {
    return {
      type: 'overlaps_leisure',
      leisureStart: config.leisureStart,
      leisureEnd: config.leisureEnd,
      minutesUntilLeisure: startMins - nowMins,
      rigidity: config.shieldRigidity,
    };
  }

  return null;
}
