import { prisma } from './prisma';

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function currentWeekStartMonday(): string {
  const dt = new Date();
  const day = dt.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return dt.toISOString().slice(0, 10);
}

export async function buildUserSnapshot(userId: string) {
  const [
    user,
    configRow,
    subjects,
    classBlocks,
    deliveries,
    microTasks,
    focusSessions,
    sleepLogs,
    badgeUnlocks,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.userWellnessConfig.findUnique({ where: { userId } }),
    prisma.subject.findMany({ where: { userId } }),
    prisma.classBlock.findMany({ where: { userId } }),
    prisma.delivery.findMany({ where: { userId } }),
    prisma.microTask.findMany({ where: { userId } }),
    prisma.focusSession.findMany({ where: { userId } }),
    prisma.sleepLog.findMany({ where: { userId } }),
    prisma.badgeUnlock.findMany({ where: { userId } }),
  ]);

  if (!user) return null;

  const weekStart = currentWeekStartMonday();
  const ensuredConfig =
    configRow ??
    (await prisma.userWellnessConfig.create({
      data: {
        userId: user.id,
        sleepGoalHours: 7.5,
        curfewAlertTime: '22:30',
        bedtimeLimitTime: '23:00',
        shieldRigidity: 'balanced',
        emergencyMinutes: 45,
        emergencyWeeklyQuota: 2,
        emergencyUsedThisWeek: 0,
        emergencyWeekStart: weekStart,
        dailyCapacityMinutes: 180,
        leisureDaysJson: JSON.stringify([1, 2, 3, 4, 5]),
        leisureStart: '17:00',
        leisureEnd: '18:00',
        leisureTagsJson: JSON.stringify(['Paseo', 'Gym', 'Videojuegos']),
      },
    }));

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      authProvider: user.authProvider === 'google' ? 'google' : 'local',
      role: user.role === 'admin' ? 'admin' : 'student',
      career: user.career,
      semester: user.semester,
      xp: user.xp,
      level: user.level,
      currentStreak: user.currentStreak,
      bestStreak: user.bestStreak,
      lastStreakDate: user.lastStreakDate,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt.toISOString(),
    },
    config: {
      userId: ensuredConfig.userId,
      sleepGoalHours: ensuredConfig.sleepGoalHours as 7.0 | 7.5 | 8.0,
      curfewAlertTime: ensuredConfig.curfewAlertTime,
      bedtimeLimitTime: ensuredConfig.bedtimeLimitTime,
      shieldRigidity: ensuredConfig.shieldRigidity as 'soft' | 'balanced' | 'strict',
      emergencyMinutes: ensuredConfig.emergencyMinutes as 30 | 45 | 60,
      emergencyWeeklyQuota: ensuredConfig.emergencyWeeklyQuota,
      emergencyUsedThisWeek: ensuredConfig.emergencyUsedThisWeek,
      emergencyWeekStart: ensuredConfig.emergencyWeekStart,
      dailyCapacityMinutes: ensuredConfig.dailyCapacityMinutes,
      leisureDays: safeJsonParse<number[]>(ensuredConfig.leisureDaysJson, [1, 2, 3, 4, 5]),
      leisureStart: ensuredConfig.leisureStart,
      leisureEnd: ensuredConfig.leisureEnd,
      leisureTags: safeJsonParse<string[]>(ensuredConfig.leisureTagsJson, [
        'Paseo',
        'Gym',
        'Videojuegos',
      ]),
    },
    subjects,
    classBlocks,
    deliveries: deliveries.map((d) => ({
      id: d.id,
      userId: d.userId,
      subjectId: d.subjectId,
      title: d.title,
      inferredType: d.inferredType,
      dueDate: d.dueDate,
      instructionsText: d.instructionsText,
      attachmentMeta: safeJsonParse(d.attachmentMetaJson, undefined),
      createdVia: d.createdVia,
      status: d.status,
      completionBonusAwarded: d.completionBonusAwarded,
      createdAt: d.createdAt,
    })),
    microTasks,
    focusSessions,
    sleepLogs,
    badgeUnlocks,
  };
}
