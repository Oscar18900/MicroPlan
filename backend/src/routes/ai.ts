import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { extractAttachmentText } from '../services/fileExtractor';
import { runGroqBreakdown, runGroqRebalance } from '../services/aiAgent';

const router = Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB max
});

router.post('/breakdown', upload.single('attachment'), async (req, res) => {
  try {
    const userId = req.authUser!.userId;
    const {
      subjectName = 'Materia',
      title = '',
      dueDate = new Date().toISOString().slice(0, 10),
      instructionsText = '',
      todayKey = new Date().toISOString().slice(0, 10),
    } = req.body as Record<string, string>;

    if (!title.trim()) {
      res.status(400).json({ error: 'El título de la entrega es obligatorio.' });
      return;
    }

    const [config, classBlocks, microTasks] = await Promise.all([
      prisma.userWellnessConfig.findUnique({ where: { userId } }),
      prisma.classBlock.findMany({ where: { userId } }),
      prisma.microTask.findMany({ where: { userId, status: 'pending' } }),
    ]);

    const extractedFile = req.file ? await extractAttachmentText(req.file) : undefined;

    const dayNames = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
    const scheduleSummary = classBlocks
      .map((b) => `${dayNames[b.dayOfWeek] || b.dayOfWeek} ${b.startTime}-${b.endTime} (${b.label})`)
      .join(', ');

    const loadByDate = new Map<string, number>();
    for (const t of microTasks) {
      loadByDate.set(t.scheduledDate, (loadByDate.get(t.scheduledDate) ?? 0) + t.estimatedMinutes);
    }
    const existingLoadSummary = Array.from(loadByDate.entries())
      .map(([d, mins]) => `${d}: ${mins}m`)
      .join(', ');

    const proposal = await runGroqBreakdown({
      todayKey,
      subjectName,
      title: title.trim(),
      dueDate,
      instructionsText: instructionsText.trim(),
      extractedFile,
      scheduleSummary,
      leisureStart: config?.leisureStart ?? '17:00',
      leisureEnd: config?.leisureEnd ?? '18:00',
      curfewAlertTime: config?.curfewAlertTime ?? '22:30',
      dailyCapacityMinutes: config?.dailyCapacityMinutes ?? 180,
      existingLoadSummary,
    });

    await prisma.telemetryEvent.create({
      data: {
        userId,
        eventType: 'ai_breakdown',
        metaJson: JSON.stringify({
          provider: proposal.provider,
          model: proposal.modelUsed,
          hasFile: Boolean(req.file),
          steps: proposal.microTasks.length,
        }),
      },
    });

    res.json({ proposal });
  } catch (err) {
    console.error('AI breakdown error:', err);
    res.status(502).json({
      error: 'El agente Groq no respondió a tiempo. Puedes usar el modo local sin conexión.',
    });
  }
});

router.post('/rebalance', async (req, res) => {
  try {
    const userId = req.authUser!.userId;
    const todayKey =
      (req.body as { todayKey?: string })?.todayKey || new Date().toISOString().slice(0, 10);

    const [config, deliveries, microTasks] = await Promise.all([
      prisma.userWellnessConfig.findUnique({ where: { userId } }),
      prisma.delivery.findMany({ where: { userId } }),
      prisma.microTask.findMany({ where: { userId, status: 'pending' } }),
    ]);

    const deliveryDueMap = new Map(deliveries.map((d) => [d.id, d.dueDate]));
    const pendingTasks = microTasks
      .filter((t) => t.scheduledDate >= todayKey && t.estimatedMinutes > 0)
      .map((t) => ({
        id: t.id,
        title: t.title,
        scheduledDate: t.scheduledDate,
        dueDate: deliveryDueMap.get(t.deliveryId) ?? todayKey,
        estimatedMinutes: t.estimatedMinutes,
      }));

    const result = await runGroqRebalance({
      todayKey,
      dailyCapacityMinutes: config?.dailyCapacityMinutes ?? 180,
      pendingTasks,
      leisureStart: config?.leisureStart ?? '17:00',
      leisureEnd: config?.leisureEnd ?? '18:00',
      curfewAlertTime: config?.curfewAlertTime ?? '22:30',
    });

    res.json(result);
  } catch (err) {
    console.error('AI rebalance error:', err);
    res.status(502).json({ error: 'No se pudo calcular rebalanceo con Groq.' });
  }
});

export default router;
