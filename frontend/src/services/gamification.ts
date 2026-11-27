import type {
  BadgeCode,
  BadgeUnlock,
  ClassBlock,
  Delivery,
  FocusSession,
  MicroTask,
  SleepLog,
  User,
  UserWellnessConfig,
} from '../types/domain';
import { addDaysYYYYMMDD, getJsDayOfWeek1to7, timeToMinutes } from './timeService';

export const XP_PER_LEVEL = 350;

export const XP_REWARDS = {
  FOCUS_BLOCK: 35,
  DIRECT_MICROTASK: 15,
  SLEEP_HYGIENE: 20,
  DELIVERY_COMPLETED: 25,
} as const;

export interface BadgeDefinition {
  code: BadgeCode;
  title: string;
  description: string;
  target: number;
  icon: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    code: 'racha_5',
    title: 'Racha 5 Días',
    description: '5 días consecutivos cumpliendo tu plan y descanso.',
    target: 5,
    icon: 'flame',
  },
  {
    code: 'sueno_7h',
    title: 'Sueño 7h+',
    description: '5 noches registrando >= 7h de sueño o desconexión a tiempo.',
    target: 5,
    icon: 'moon',
  },
  {
    code: 'escudo_zen',
    title: 'Escudo Zen',
    description: '10 bloques completados en Focus sin salir de la app.',
    target: 10,
    icon: 'shield',
  },
  {
    code: 'planificador_ia',
    title: 'Planificador IA',
    description: '3 entregas desglosadas y confirmadas con el agente IA.',
    target: 3,
    icon: 'sparkles',
  },
  {
    code: 'racha_14',
    title: 'Racha 14 Días',
    description: '14 días consecutivos de constancia saludable.',
    target: 14,
    icon: 'award',
  },
  {
    code: 'semestre_zen',
    title: 'Semestre Zen',
    description: '28 días protegiendo tu ocio diurno y sin trasnochos.',
    target: 28,
    icon: 'sun',
  },
];

export function computeLevelFromXp(xp: number): {
  level: number;
  title: string;
  currentLevelXp: number;
  xpToNextLevel: number;
  progressPercent: number;
} {
  const safeXp = Math.max(0, xp);
  const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
  const currentLevelXp = safeXp % XP_PER_LEVEL;
  const xpToNextLevel = XP_PER_LEVEL - currentLevelXp;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / XP_PER_LEVEL) * 100));

  const titles = [
    'Iniciante',
    'Organizado',
    'Enfocado',
    'Constante',
    'Estratega',
    'Equilibrado',
    'Maestro Zen',
  ];
  const title = titles[Math.min(level - 1, titles.length - 1)];

  return { level, title, currentLevelXp, xpToNextLevel, progressPercent };
}

/**
 * Computes maximum available emergency extension while guaranteeing >= 6.0h of sleep
 * before the first class block next day (or default 07:30 wake-up if free day).
 */
export function computeSafeEmergencyCap(
  tomorrowKey: string,
  config: UserWellnessConfig,
  classBlocks: ClassBlock[]
): {
  canUseEmergency: boolean;
  allowedMinutes: number;
  firstClassTime: string;
  bedtimeHardFloorTime: string;
  reason?: string;
} {
  if (config.emergencyUsedThisWeek >= config.emergencyWeeklyQuota) {
    return {
      canUseEmergency: false,
      allowedMinutes: 0,
      firstClassTime: '08:00',
      bedtimeHardFloorTime: config.bedtimeLimitTime,
      reason: `Ya usaste tus ${config.emergencyWeeklyQuota} emergencias de esta semana.`,
    };
  }

  const dow = getJsDayOfWeek1to7(tomorrowKey);
  const tomorrowClasses = classBlocks
    .filter((b) => b.dayOfWeek === dow)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const firstClassTime = tomorrowClasses.length > 0 ? tomorrowClasses[0].startTime : '08:00';
  const firstClassMins = timeToMinutes(firstClassTime);
  // Assume ~45m morning prep before first class, and absolute 6.0h (360m) sleep floor
  const wakeUpMins = firstClassMins - 45;
  const latestSleepMinsFromMidnight = wakeUpMins - 360; // negative means before midnight (e.g. -60 = 23:00)
  const hardFloorMins = 1440 + latestSleepMinsFromMidnight; // e.g. 1440 - 45 = 1395 (23:15)

  const curfewMins = timeToMinutes(config.curfewAlertTime);
  const availableFromCurfew = Math.max(0, hardFloorMins - curfewMins);
  const allowedMinutes = Math.min(config.emergencyMinutes, availableFromCurfew);

  const floorH = Math.floor((hardFloorMins % 1440) / 60);
  const floorM = hardFloorMins % 60;
  const bedtimeHardFloorTime = `${String(floorH).padStart(2, '0')}:${String(floorM).padStart(2, '0')}`;

  if (allowedMinutes < 15) {
    return {
      canUseEmergency: false,
      allowedMinutes: 0,
      firstClassTime,
      bedtimeHardFloorTime,
      reason: `Mañana inicias a las ${firstClassTime}. Para proteger el piso mínimo de 6h de sueño no hay margen extra.`,
    };
  }

  return {
    canUseEmergency: true,
    allowedMinutes,
    firstClassTime,
    bedtimeHardFloorTime,
  };
}

export interface BadgeProgressItem {
  def: BadgeDefinition;
  current: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export function evaluateBadgesProgress(params: {
  user: User;
  sleepLogs: SleepLog[];
  focusSessions: FocusSession[];
  deliveries: Delivery[];
  unlockedBadges: BadgeUnlock[];
}): BadgeProgressItem[] {
  const { user, sleepLogs, focusSessions, deliveries, unlockedBadges } = params;
  const unlockMap = new Map(unlockedBadges.map((b) => [b.badgeCode, b.unlockedAt]));

  const streakMetric = Math.max(user.bestStreak, user.currentStreak);
  const sleep7hCount = sleepLogs.filter((l) => l.sleptHours >= 7 || l.respectedCurfew).length;
  const zenFocusCount = focusSessions.filter(
    (s) => s.completed && s.exitInterruptionsCount === 0
  ).length;
  const aiDeliveriesCount = deliveries.filter((d) => d.createdVia === 'ai').length;
  const zenDaysCount = sleepLogs.filter(
    (l) => l.sleptHours >= 7 && !l.usedEmergency
  ).length;

  const metrics: Record<BadgeCode, number> = {
    racha_5: streakMetric,
    sueno_7h: sleep7hCount,
    escudo_zen: zenFocusCount,
    planificador_ia: aiDeliveriesCount,
    racha_14: streakMetric,
    semestre_zen: zenDaysCount,
  };

  return BADGE_DEFINITIONS.map((def) => {
    const current = metrics[def.code];
    const unlockedAt = unlockMap.get(def.code);
    return {
      def,
      current: Math.min(current, def.target),
      unlocked: Boolean(unlockedAt) || current >= def.target,
      unlockedAt,
    };
  });
}

/**
 * Computes non-punitive streak update for a closed day or positive check-in.
 */
export function evaluateDailyStreakProgress(params: {
  user: User;
  todayKey: string;
  microTasks: MicroTask[];
  focusSessions: FocusSession[];
  respectedSleep: boolean;
}): { nextStreak: number; bestStreak: number; lastStreakDate: string } {
  const { user, todayKey, microTasks, focusSessions, respectedSleep } = params;

  if (!respectedSleep) {
    return {
      nextStreak: 0,
      bestStreak: user.bestStreak,
      lastStreakDate: todayKey,
    };
  }

  const todayTasks = microTasks.filter((t) => t.scheduledDate === todayKey);
  const completedToday = todayTasks.some((t) => t.status === 'completed');
  const focusToday = focusSessions.some(
    (s) => s.completed && s.startedAt.slice(0, 10) === todayKey
  );
  const noPendingToday = todayTasks.filter((t) => t.status === 'pending').length === 0;

  const hasAcademicAdvanceOrClearDay = completedToday || focusToday || noPendingToday;

  if (!hasAcademicAdvanceOrClearDay) {
    return {
      nextStreak: user.currentStreak,
      bestStreak: user.bestStreak,
      lastStreakDate: user.lastStreakDate ?? todayKey,
    };
  }

  if (user.lastStreakDate === todayKey) {
    return {
      nextStreak: Math.max(1, user.currentStreak),
      bestStreak: Math.max(user.bestStreak, user.currentStreak, 1),
      lastStreakDate: todayKey,
    };
  }

  const yesterdayKey = addDaysYYYYMMDD(todayKey, -1);
  const baseStreak = user.lastStreakDate === yesterdayKey ? user.currentStreak : 0;
  const nextStreak = baseStreak + 1;
  return {
    nextStreak,
    bestStreak: Math.max(user.bestStreak, nextStreak),
    lastStreakDate: todayKey,
  };
}
