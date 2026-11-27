import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAdmin, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/summary', async (_req, res) => {
  const [users, deliveries, microTasks, focusSessions, sleepLogs, aiEvents] =
    await Promise.all([
      prisma.user.findMany({ select: { id: true, onboardingCompleted: true, currentStreak: true } }),
      prisma.delivery.findMany({ select: { createdVia: true } }),
      prisma.microTask.findMany({ select: { status: true } }),
      prisma.focusSession.findMany({ select: { completed: true, exitInterruptionsCount: true, actualMinutes: true } }),
      prisma.sleepLog.findMany({ select: { sleptHours: true, respectedCurfew: true } }),
      prisma.telemetryEvent.count({ where: { eventType: 'ai_breakdown' } }),
    ]);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.onboardingCompleted).length;
  const completedTasks = microTasks.filter((t) => t.status === 'completed').length;
  const microTaskCompletionRatePct =
    microTasks.length > 0 ? Math.round((completedTasks / microTasks.length) * 100) : 0;

  const avgSleepHours =
    sleepLogs.length > 0
      ? Number(
          (sleepLogs.reduce((s, l) => s + l.sleptHours, 0) / sleepLogs.length).toFixed(2)
        )
      : 0;

  const curfewRespectedCount = sleepLogs.filter((l) => l.respectedCurfew).length;
  const curfewRespectPct =
    sleepLogs.length > 0 ? Math.round((curfewRespectedCount / sleepLogs.length) * 100) : 0;

  const completedFocus = focusSessions.filter((f) => f.completed);
  const zeroDistractionBlocks = completedFocus.filter(
    (f) => f.exitInterruptionsCount === 0
  ).length;

  res.json({
    totalUsers,
    activeUsers,
    totalDeliveries: deliveries.length,
    aiBreakdownsCount: aiEvents,
    microTaskCompletionRatePct,
    avgSleepHours,
    curfewRespectPct,
    completedFocusBlocks: completedFocus.length,
    zeroDistractionBlocks,
  });
});

export default router;
