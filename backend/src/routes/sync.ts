import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { buildUserSnapshot } from '../lib/snapshot';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const SyncSnapshotSchema = z.object({
  user: z.object({
    name: z.string().min(1).max(100),
    career: z.string().max(150),
    semester: z.string().max(40),
    xp: z.number().int().min(0),
    level: z.number().int().min(1),
    currentStreak: z.number().int().min(0),
    bestStreak: z.number().int().min(0),
    lastStreakDate: z.string().nullable(),
    onboardingCompleted: z.boolean(),
  }),
  config: z
    .object({
      sleepGoalHours: z.number(),
      curfewAlertTime: z.string(),
      bedtimeLimitTime: z.string(),
      shieldRigidity: z.enum(['soft', 'balanced', 'strict']),
      emergencyMinutes: z.number().int(),
      emergencyWeeklyQuota: z.number().int(),
      emergencyUsedThisWeek: z.number().int(),
      emergencyWeekStart: z.string(),
      dailyCapacityMinutes: z.number().int(),
      leisureDays: z.array(z.number().int()),
      leisureStart: z.string(),
      leisureEnd: z.string(),
      leisureTags: z.array(z.string()),
    })
    .nullable(),
  subjects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      colorHex: z.string(),
    })
  ),
  classBlocks: z.array(
    z.object({
      id: z.string(),
      subjectId: z.string(),
      dayOfWeek: z.number().int().min(1).max(5),
      startTime: z.string(),
      endTime: z.string(),
      label: z.string(),
    })
  ),
  deliveries: z.array(
    z.object({
      id: z.string(),
      subjectId: z.string(),
      title: z.string(),
      inferredType: z.string(),
      dueDate: z.string(),
      instructionsText: z.string(),
      attachmentMeta: z.record(z.unknown()).optional(),
      createdVia: z.string(),
      status: z.string(),
      completionBonusAwarded: z.boolean().optional(),
      createdAt: z.string(),
    })
  ),
  microTasks: z.array(
    z.object({
      id: z.string(),
      deliveryId: z.string(),
      title: z.string(),
      scheduledDate: z.string(),
      scheduledSlot: z.string().default(''),
      estimatedMinutes: z.number().int().min(0),
      usePomodoro: z.boolean().optional(),
      blocksCount: z.number().int().min(0),
      status: z.string(),
      completedVia: z.string().nullable(),
      completedAt: z.string().nullable(),
      rationale: z.string().optional(),
    })
  ),
  focusSessions: z.array(
    z.object({
      id: z.string(),
      microTaskId: z.string().nullable(),
      plannedMinutes: z.number().int(),
      actualMinutes: z.number().int(),
      completed: z.boolean(),
      exitInterruptionsCount: z.number().int(),
      ambientSound: z.string(),
      startedAt: z.string(),
      endedAt: z.string(),
    })
  ),
  sleepLogs: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      sleptHours: z.number(),
      respectedCurfew: z.boolean(),
      usedEmergency: z.boolean(),
      emergencyMinutesUsed: z.number().int(),
      xpAwarded: z.boolean().optional(),
    })
  ),
  badgeUnlocks: z.array(
    z.object({
      id: z.string(),
      badgeCode: z.string(),
      unlockedAt: z.string(),
    })
  ),
});

router.get('/bootstrap', async (req, res) => {
  const snapshot = await buildUserSnapshot(req.authUser!.userId);
  if (!snapshot) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }
  res.json({ snapshot });
});

router.put('/sync/snapshot', async (req, res) => {
  const parsed = SyncSnapshotSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Formato de sincronización inválido.' });
    return;
  }

  const userId = req.authUser!.userId;
  const payload = parsed.data;

  await prisma.$transaction(async (tx) => {
    // Update mutable user profile & progress fields (never role/email/passwordHash)
    await tx.user.update({
      where: { id: userId },
      data: {
        name: payload.user.name,
        career: payload.user.career,
        semester: payload.user.semester,
        xp: payload.user.xp,
        level: payload.user.level,
        currentStreak: payload.user.currentStreak,
        bestStreak: payload.user.bestStreak,
        lastStreakDate: payload.user.lastStreakDate,
        onboardingCompleted: payload.user.onboardingCompleted,
      },
    });

    if (payload.config) {
      await tx.userWellnessConfig.upsert({
        where: { userId },
        update: {
          sleepGoalHours: payload.config.sleepGoalHours,
          curfewAlertTime: payload.config.curfewAlertTime,
          bedtimeLimitTime: payload.config.bedtimeLimitTime,
          shieldRigidity: payload.config.shieldRigidity,
          emergencyMinutes: payload.config.emergencyMinutes,
          emergencyWeeklyQuota: payload.config.emergencyWeeklyQuota,
          emergencyUsedThisWeek: payload.config.emergencyUsedThisWeek,
          emergencyWeekStart: payload.config.emergencyWeekStart,
          dailyCapacityMinutes: payload.config.dailyCapacityMinutes,
          leisureDaysJson: JSON.stringify(payload.config.leisureDays),
          leisureStart: payload.config.leisureStart,
          leisureEnd: payload.config.leisureEnd,
          leisureTagsJson: JSON.stringify(payload.config.leisureTags),
        },
        create: {
          userId,
          sleepGoalHours: payload.config.sleepGoalHours,
          curfewAlertTime: payload.config.curfewAlertTime,
          bedtimeLimitTime: payload.config.bedtimeLimitTime,
          shieldRigidity: payload.config.shieldRigidity,
          emergencyMinutes: payload.config.emergencyMinutes,
          emergencyWeeklyQuota: payload.config.emergencyWeeklyQuota,
          emergencyUsedThisWeek: payload.config.emergencyUsedThisWeek,
          emergencyWeekStart: payload.config.emergencyWeekStart,
          dailyCapacityMinutes: payload.config.dailyCapacityMinutes,
          leisureDaysJson: JSON.stringify(payload.config.leisureDays),
          leisureStart: payload.config.leisureStart,
          leisureEnd: payload.config.leisureEnd,
          leisureTagsJson: JSON.stringify(payload.config.leisureTags),
        },
      });
    }

    // Replace user-owned collections cleanly inside transaction
    await tx.microTask.deleteMany({ where: { userId } });
    await tx.delivery.deleteMany({ where: { userId } });
    await tx.classBlock.deleteMany({ where: { userId } });
    await tx.subject.deleteMany({ where: { userId } });
    await tx.focusSession.deleteMany({ where: { userId } });
    await tx.sleepLog.deleteMany({ where: { userId } });
    await tx.badgeUnlock.deleteMany({ where: { userId } });

    if (payload.subjects.length > 0) {
      await tx.subject.createMany({
        data: payload.subjects.map((s) => ({ ...s, userId })),
      });
    }

    const validSubjectIds = new Set(payload.subjects.map((s) => s.id));

    const validBlocks = payload.classBlocks.filter((b) => validSubjectIds.has(b.subjectId));
    if (validBlocks.length > 0) {
      await tx.classBlock.createMany({
        data: validBlocks.map((b) => ({ ...b, userId })),
      });
    }

    const validDeliveries = payload.deliveries.filter((d) => validSubjectIds.has(d.subjectId));
    if (validDeliveries.length > 0) {
      await tx.delivery.createMany({
        data: validDeliveries.map((d) => ({
          id: d.id,
          userId,
          subjectId: d.subjectId,
          title: d.title,
          inferredType: d.inferredType,
          dueDate: d.dueDate,
          instructionsText: d.instructionsText,
          attachmentMetaJson: d.attachmentMeta ? JSON.stringify(d.attachmentMeta) : null,
          createdVia: d.createdVia,
          status: d.status,
          completionBonusAwarded: Boolean(d.completionBonusAwarded),
          createdAt: d.createdAt,
        })),
      });
    }

    const validDeliveryIds = new Set(validDeliveries.map((d) => d.id));
    const validTasks = payload.microTasks.filter((t) => validDeliveryIds.has(t.deliveryId));
    if (validTasks.length > 0) {
      await tx.microTask.createMany({
        data: validTasks.map((t) => ({
          id: t.id,
          deliveryId: t.deliveryId,
          userId,
          title: t.title,
          scheduledDate: t.scheduledDate,
          scheduledSlot: t.scheduledSlot,
          estimatedMinutes: t.estimatedMinutes,
          usePomodoro: t.usePomodoro ?? t.estimatedMinutes > 0,
          blocksCount: t.blocksCount,
          status: t.status,
          completedVia: t.completedVia,
          completedAt: t.completedAt,
          rationale: t.rationale ?? null,
        })),
      });
    }

    if (payload.focusSessions.length > 0) {
      await tx.focusSession.createMany({
        data: payload.focusSessions.map((f) => ({ ...f, userId })),
      });
    }

    if (payload.sleepLogs.length > 0) {
      await tx.sleepLog.createMany({
        data: payload.sleepLogs.map((l) => ({
          ...l,
          xpAwarded: Boolean(l.xpAwarded),
          userId,
        })),
      });
    }

    if (payload.badgeUnlocks.length > 0) {
      await tx.badgeUnlock.createMany({
        data: payload.badgeUnlocks.map((b) => ({ ...b, userId })),
      });
    }

    await tx.telemetryEvent.create({
      data: {
        userId,
        eventType: 'sync_snapshot',
        metaJson: JSON.stringify({
          deliveries: validDeliveries.length,
          microTasks: validTasks.length,
          focusSessions: payload.focusSessions.length,
        }),
      },
    });
  });

  const snapshot = await buildUserSnapshot(userId);
  res.json({ ok: true, snapshot });
});

export default router;
