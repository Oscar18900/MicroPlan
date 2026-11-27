import { db } from '../db/database';
import type {
  BadgeUnlock,
  ClassBlock,
  Delivery,
  FocusSession,
  MicroTask,
  SleepLog,
  Subject,
  UserWellnessConfig,
} from '../types/domain';
import { addDaysYYYYMMDD, getTodayKey, getWeekStartMonday } from '../services/timeService';

/**
 * Optional BUAP student demo dataset.
 * ONLY loaded when the user explicitly clicks "Cargar datos demo BUAP" in DevTools
 * or chooses the demo in Onboarding 4/4 — NEVER pre-loaded automatically for new users.
 */
export async function loadBuapDemoDataset(userId: string): Promise<void> {
  const today = getTodayKey();
  const tomorrow = addDaysYYYYMMDD(today, 1);
  const in3Days = addDaysYYYYMMDD(today, 3);
  const in5Days = addDaysYYYYMMDD(today, 5);
  const weekStart = getWeekStartMonday(today);

  // Clear existing user domain data before seeding demo
  await Promise.all([
    db.subjects.where('userId').equals(userId).delete(),
    db.classBlocks.where('userId').equals(userId).delete(),
    db.deliveries.where('userId').equals(userId).delete(),
    db.microTasks.where('userId').equals(userId).delete(),
    db.focusSessions.where('userId').equals(userId).delete(),
    db.sleepLogs.where('userId').equals(userId).delete(),
    db.badgeUnlocks.where('userId').equals(userId).delete(),
  ]);

  const subjects: Subject[] = [
    { id: `sub_${userId}_1`, userId, name: 'Sistemas Distribuidos', colorHex: '#2563EB' },
    { id: `sub_${userId}_2`, userId, name: 'Seminario de Investigación', colorHex: '#7C3AED' },
    { id: `sub_${userId}_3`, userId, name: 'Neurobiología II', colorHex: '#0D9488' },
    { id: `sub_${userId}_4`, userId, name: 'Proyectos de I+D (BUAP)', colorHex: '#D97706' },
  ];

  const classBlocks: ClassBlock[] = [
    { id: `cb_${userId}_1`, userId, subjectId: subjects[0].id, dayOfWeek: 1, startTime: '09:00', endTime: '11:00', label: 'Sistemas Distribuidos' },
    { id: `cb_${userId}_2`, userId, subjectId: subjects[0].id, dayOfWeek: 3, startTime: '09:00', endTime: '11:00', label: 'Lab Distribuidos' },
    { id: `cb_${userId}_3`, userId, subjectId: subjects[1].id, dayOfWeek: 2, startTime: '10:00', endTime: '12:00', label: 'Seminario' },
    { id: `cb_${userId}_4`, userId, subjectId: subjects[1].id, dayOfWeek: 4, startTime: '10:00', endTime: '12:00', label: 'Seminario' },
    { id: `cb_${userId}_5`, userId, subjectId: subjects[2].id, dayOfWeek: 1, startTime: '12:00', endTime: '14:00', label: 'Neurobiología II' },
    { id: `cb_${userId}_6`, userId, subjectId: subjects[3].id, dayOfWeek: 5, startTime: '09:00', endTime: '11:00', label: 'I+D Equipo 6' },
  ];

  const deliveries: Delivery[] = [
    {
      id: `del_${userId}_1`,
      userId,
      subjectId: subjects[1].id,
      title: 'Ensayo de Metodologías Ágiles',
      inferredType: 'essay',
      dueDate: in3Days,
      instructionsText: 'Redactar marco teórico con mínimo 4 fuentes académicas y análisis comparativo Scrum vs Kanban.',
      createdVia: 'ai',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: `del_${userId}_2`,
      userId,
      subjectId: subjects[0].id,
      title: 'Práctica REST + Base de Datos',
      inferredType: 'practice',
      dueDate: in5Days,
      instructionsText: 'Diseñar esquema relacional, implementar 3 endpoints CRUD y exportar evidencia de pruebas.',
      createdVia: 'ai',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];

  const microTasks: MicroTask[] = [
    {
      id: `mt_${userId}_1`,
      deliveryId: deliveries[0].id,
      userId,
      title: 'Definir objetivos y formato de citas APA',
      scheduledDate: today,
      scheduledSlot: '15:30',
      estimatedMinutes: 25,
      blocksCount: 1,
      status: 'completed',
      completedVia: 'focus',
      completedAt: new Date().toISOString(),
      rationale: 'Arranque rápido para vencer el bloqueo inicial.',
    },
    {
      id: `mt_${userId}_2`,
      deliveryId: deliveries[0].id,
      userId,
      title: 'Redactar borrador del marco teórico',
      scheduledDate: today,
      scheduledSlot: '16:15',
      estimatedMinutes: 25,
      blocksCount: 1,
      status: 'pending',
      completedVia: null,
      completedAt: null,
      rationale: 'Un bloque antes de tu Ocio Protegido de las 17:00.',
    },
    {
      id: `mt_${userId}_3`,
      deliveryId: deliveries[0].id,
      userId,
      title: 'Completar comparativa Scrum vs Kanban y cierre',
      scheduledDate: tomorrow,
      scheduledSlot: '15:00',
      estimatedMinutes: 50,
      blocksCount: 2,
      status: 'pending',
      completedVia: null,
      completedAt: null,
    },
    {
      id: `mt_${userId}_4`,
      deliveryId: deliveries[1].id,
      userId,
      title: 'Definir esquema SQL y 3 endpoints principales',
      scheduledDate: tomorrow,
      scheduledSlot: '16:00',
      estimatedMinutes: 50,
      blocksCount: 2,
      status: 'pending',
      completedVia: null,
      completedAt: null,
    },
    {
      id: `mt_${userId}_5`,
      deliveryId: deliveries[1].id,
      userId,
      title: 'Implementar endpoints y pruebas de integración',
      scheduledDate: tomorrow,
      scheduledSlot: '18:30',
      estimatedMinutes: 50,
      blocksCount: 2,
      status: 'pending',
      completedVia: null,
      completedAt: null,
    },
    {
      id: `mt_${userId}_6`,
      deliveryId: deliveries[1].id,
      userId,
      title: 'Validar respuestas JSON y exportar capturas',
      scheduledDate: tomorrow,
      scheduledSlot: '19:30',
      estimatedMinutes: 50,
      blocksCount: 2,
      status: 'pending',
      completedVia: null,
      completedAt: null,
    },
  ];

  const sleepLogs: SleepLog[] = [
    { id: `sl_${userId}_1`, userId, date: addDaysYYYYMMDD(today, -4), sleptHours: 7.5, respectedCurfew: true, usedEmergency: false, emergencyMinutesUsed: 0, xpAwarded: true },
    { id: `sl_${userId}_2`, userId, date: addDaysYYYYMMDD(today, -3), sleptHours: 7.5, respectedCurfew: true, usedEmergency: false, emergencyMinutesUsed: 0, xpAwarded: true },
    { id: `sl_${userId}_3`, userId, date: addDaysYYYYMMDD(today, -2), sleptHours: 8.0, respectedCurfew: true, usedEmergency: false, emergencyMinutesUsed: 0, xpAwarded: true },
    { id: `sl_${userId}_4`, userId, date: addDaysYYYYMMDD(today, -1), sleptHours: 7.0, respectedCurfew: true, usedEmergency: false, emergencyMinutesUsed: 0, xpAwarded: true },
  ];

  const focusSessions: FocusSession[] = [
    {
      id: `fs_${userId}_1`,
      userId,
      microTaskId: microTasks[0].id,
      plannedMinutes: 25,
      actualMinutes: 25,
      completed: true,
      exitInterruptionsCount: 0,
      ambientSound: 'white_noise',
      startedAt: `${today}T15:30:00.000Z`,
      endedAt: `${today}T15:55:00.000Z`,
    },
  ];

  const badgeUnlocks: BadgeUnlock[] = [
    { id: `bg_${userId}_1`, userId, badgeCode: 'racha_5', unlockedAt: new Date().toISOString() },
  ];

  const config: UserWellnessConfig = {
    userId,
    sleepGoalHours: 7.5,
    curfewAlertTime: '22:30',
    bedtimeLimitTime: '23:00',
    shieldRigidity: 'balanced',
    emergencyMinutes: 45,
    emergencyWeeklyQuota: 2,
    emergencyUsedThisWeek: 0,
    emergencyWeekStart: weekStart,
    dailyCapacityMinutes: 180,
    leisureDays: [1, 2, 3, 4, 5],
    leisureStart: '17:00',
    leisureEnd: '18:00',
    leisureTags: ['Paseo', 'Gym', 'Videojuegos'],
  };

  await db.transaction(
    'rw',
    [
      db.users,
      db.wellnessConfigs,
      db.subjects,
      db.classBlocks,
      db.deliveries,
      db.microTasks,
      db.focusSessions,
      db.sleepLogs,
      db.badgeUnlocks,
    ],
    async () => {
      await db.wellnessConfigs.put(config);
      await db.subjects.bulkPut(subjects);
      await db.classBlocks.bulkPut(classBlocks);
      await db.deliveries.bulkPut(deliveries);
      await db.microTasks.bulkPut(microTasks);
      await db.focusSessions.bulkPut(focusSessions);
      await db.sleepLogs.bulkPut(sleepLogs);
      await db.badgeUnlocks.bulkPut(badgeUnlocks);
      await db.users.update(userId, {
        career: 'Ing. en Ciencias de la Computación',
        semester: '7°+',
        xp: 1245,
        level: 4,
        currentStreak: 5,
        bestStreak: 5,
        lastStreakDate: addDaysYYYYMMDD(today, -1),
        onboardingCompleted: true,
      });
    }
  );
}
