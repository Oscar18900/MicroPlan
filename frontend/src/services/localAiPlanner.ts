import type {
  AiBreakdownResponse,
  AiProposalMicroTask,
  AttachmentMeta,
  ClassBlock,
  InferredDeliveryType,
  MicroTask,
  RebalanceDaySummary,
  RebalanceMove,
  RebalancePlan,
  Subject,
  UserWellnessConfig,
} from '../types/domain';
import {
  addDaysYYYYMMDD,
  getJsDayOfWeek1to7,
  getSpanishDayLabel,
  getTodayKey,
  minutesToHHmm,
  timeToMinutes,
} from './timeService';

export interface BreakdownInput {
  subjectName: string;
  title: string;
  dueDate: string;
  instructionsText: string;
  attachmentMeta?: AttachmentMeta;
  attachmentFile?: File;
  config: UserWellnessConfig;
  classBlocks: ClassBlock[];
  existingMicroTasks: MicroTask[];
}

export function inferDeliveryType(title: string, instructions: string): InferredDeliveryType {
  const combined = `${title} ${instructions}`.toLowerCase();
  if (/examen|parcial|evaluaci[oó]n|quiz|cuestionario|temario/.test(combined)) return 'exam';
  if (/exposici[oó]n|presentaci[oó]n|diapositivas|pitch|slides/.test(combined)) return 'presentation';
  if (/ensayo|rese[nñ]a|art[ií]culo|marco te[oó]rico|redacci[oó]n|bibliograf/.test(combined)) return 'essay';
  if (/proyecto|arquitectura|sistema|backend|frontend|api|app|servidor/.test(combined)) return 'project';
  return 'practice';
}

function buildStepsForTask(
  type: InferredDeliveryType,
  title: string,
  instructions: string,
  hasAttachment: boolean
): Array<{ title: string; minutes: 25 | 50; rationale: string }> {
  const cleanTitle = title.trim() || 'la entrega';
  const rawLines = instructions
    .split(/\n|[.;]/)
    .map((l) => l.trim().replace(/^[-*\d.)\s]+/, ''))
    .filter((l) => l.length >= 12 && l.length <= 80);

  // Extract up to 2 concrete clues from user instructions without ever solving the work
  const clueA = rawLines[0] ? rawLines[0].slice(0, 48) : null;
  const clueB = rawLines[1] ? rawLines[1].slice(0, 48) : null;

  switch (type) {
    case 'essay':
      return [
        {
          title: `Definir postura, índice y 3 fuentes clave para ${cleanTitle.slice(0, 28)}`,
          minutes: 25,
          rationale: 'Rompe la parálisis inicial delimitando la estructura antes de redactar.',
        },
        {
          title: clueA
            ? `Esquematizar y redactar sección: ${clueA}`
            : `Redactar introducción y primer bloque argumental`,
          minutes: 50,
          rationale: 'Bloque profundo de 50 min para avanzar el cuerpo principal sin distracciones.',
        },
        {
          title: clueB
            ? `Desarrollar apartado: ${clueB}`
            : `Completar desarrollo central con citas y ejemplos`,
          minutes: 50,
          rationale: 'Mantiene continuidad con espacio para contrastar argumentos.',
        },
        {
          title: `Revisar rúbrica, citas APA y formato final de entrega`,
          minutes: 25,
          rationale: 'Cierre ligero de verificación para asegurar cumplimiento sin desvelos.',
        },
      ];
    case 'exam':
      return [
        {
          title: `Mapear temario y detectar 2 temas de mayor peso`,
          minutes: 25,
          rationale: 'Prioriza los tópicos críticos para no estudiar a ciegas.',
        },
        {
          title: clueA
            ? `Repasar conceptos y notas de: ${clueA}`
            : `Elaborar resumen activo y tarjetas de conceptos clave`,
          minutes: 50,
          rationale: 'Estudio activo en bloque protegido.',
        },
        {
          title: `Resolver ejercicios tipo examen con cronómetro`,
          minutes: 50,
          rationale: 'Practica recuperación bajo condiciones reales sin saturar la noche previa.',
        },
        {
          title: `Repaso rápido de errores frecuentes y descanso`,
          minutes: 25,
          rationale: 'Consolidación breve antes de respetar la hora de sueño.',
        },
      ];
    case 'presentation':
      return [
        {
          title: `Definir guion narrativo y puntos clave de la exposición`,
          minutes: 25,
          rationale: 'Estructura el mensaje antes de abrir el editor de diapositivas.',
        },
        {
          title: clueA
            ? `Diseñar láminas y visuales sobre: ${clueA}`
            : `Armar diapositivas visuales con poco texto y diagramas`,
          minutes: 50,
          rationale: 'Concentra el armado visual en un bloque enfocado.',
        },
        {
          title: `Ensayar exposición cronometrada y ajustar tiempos`,
          minutes: 25,
          rationale: 'Asegura fluidez y confianza sin improvisar de madrugada.',
        },
      ];
    case 'project':
      return [
        {
          title: clueA
            ? `Definir alcance técnico y base: ${clueA}`
            : `Definir arquitectura, entregables y checklist de requisitos`,
          minutes: 25,
          rationale: 'Convierte la rúbrica en un mapa claro de avance.',
        },
        {
          title: `Implementar núcleo funcional principal del proyecto`,
          minutes: 50,
          rationale: 'Bloque profundo para la parte de mayor peso técnico.',
        },
        {
          title: clueB
            ? `Integrar y validar: ${clueB}`
            : `Conectar componentes y ejecutar pruebas de casos límite`,
          minutes: 50,
          rationale: 'Evita dejar integración y errores para el último día.',
        },
        {
          title: `Documentar evidencias, capturas y empaquetar entrega`,
          minutes: 25,
          rationale: 'Cierre ordenado respetando el toque de queda.',
        },
      ];
    default: // practice
      return [
        {
          title: hasAttachment
            ? `Extraer requisitos de ${cleanTitle.slice(0, 32)} y preparar entorno`
            : `Revisar indicaciones y plantear primeros casos de ${cleanTitle.slice(0, 26)}`,
          minutes: 25,
          rationale: 'Arranque rápido de baja fricción.',
        },
        {
          title: clueA
            ? `Resolver bloque principal: ${clueA}`
            : `Desarrollar ejercicios/módulos centrales de la práctica`,
          minutes: 50,
          rationale: 'Avance sólido dentro de tu capacidad diaria saludable.',
        },
        {
          title: `Validar resultados, formato y exportar entregable final`,
          minutes: 25,
          rationale: 'Verificación final con margen antes de la fecha límite.',
        },
      ];
  }
}

export function findFreeSlotForDay(
  dateKey: string,
  durationMin: number,
  config: UserWellnessConfig,
  classBlocks: ClassBlock[],
  takenSlotsByDate: Map<string, Array<{ start: number; end: number }>>
): string {
  const dow = getJsDayOfWeek1to7(dateKey);
  const busy: Array<{ start: number; end: number }> = [];

  if (dow >= 1 && dow <= 5) {
    for (const cb of classBlocks.filter((c) => c.dayOfWeek === dow)) {
      busy.push({ start: timeToMinutes(cb.startTime), end: timeToMinutes(cb.endTime) });
    }
  }

  if (config.leisureDays.includes(dow)) {
    busy.push({
      start: timeToMinutes(config.leisureStart),
      end: timeToMinutes(config.leisureEnd),
    });
  }

  for (const t of takenSlotsByDate.get(dateKey) ?? []) {
    busy.push(t);
  }

  const curfewMin = timeToMinutes(config.curfewAlertTime);
  const candidates = [9 * 60, 11 * 60, 15 * 60, 16 * 60, 18 * 60 + 15, 19 * 60 + 30, 20 * 60 + 30];

  for (const start of candidates) {
    const end = start + durationMin;
    if (end > curfewMin - 15) continue;
    const overlaps = busy.some((b) => start < b.end && end > b.start);
    if (!overlaps) {
      const existing = takenSlotsByDate.get(dateKey) ?? [];
      existing.push({ start, end });
      takenSlotsByDate.set(dateKey, existing);
      return minutesToHHmm(start);
    }
  }

  return '19:00';
}

export function generateLocalBreakdown(input: BreakdownInput): AiBreakdownResponse {
  const todayKey = getTodayKey();
  const inferredType = inferDeliveryType(input.title, input.instructionsText);
  const steps = buildStepsForTask(
    inferredType,
    input.title,
    input.instructionsText,
    Boolean(input.attachmentMeta)
  );

  // Build available day sequence from today up to dueDate (inclusive)
  const availableDays: string[] = [];
  let cursor = todayKey;
  for (let i = 0; i < 14; i++) {
    availableDays.push(cursor);
    if (cursor >= input.dueDate) break;
    cursor = addDaysYYYYMMDD(cursor, 1);
  }
  if (availableDays.length === 0) availableDays.push(todayKey);

  // Track existing minutes per day
  const loadByDate = new Map<string, number>();
  const takenSlotsByDate = new Map<string, Array<{ start: number; end: number }>>();

  for (const mt of input.existingMicroTasks) {
    if (mt.status === 'pending') {
      loadByDate.set(mt.scheduledDate, (loadByDate.get(mt.scheduledDate) ?? 0) + mt.estimatedMinutes);
      const start = timeToMinutes(mt.scheduledSlot || '16:00');
      const arr = takenSlotsByDate.get(mt.scheduledDate) ?? [];
      arr.push({ start, end: start + mt.estimatedMinutes });
      takenSlotsByDate.set(mt.scheduledDate, arr);
    }
  }

  const microTasks: AiProposalMicroTask[] = [];
  const warnings: string[] = [];

  for (const step of steps) {
    // Pick day with lowest current load that doesn't exceed dailyCapacityMinutes if possible
    let chosenDay = availableDays[0];
    let bestScore = Infinity;

    for (const day of availableDays) {
      const currentLoad = loadByDate.get(day) ?? 0;
      const wouldExceed = currentLoad + step.minutes > input.config.dailyCapacityMinutes ? 1000 : 0;
      const score = currentLoad + wouldExceed;
      if (score < bestScore) {
        bestScore = score;
        chosenDay = day;
      }
    }

    const slot = findFreeSlotForDay(
      chosenDay,
      step.minutes,
      input.config,
      input.classBlocks,
      takenSlotsByDate
    );

    loadByDate.set(chosenDay, (loadByDate.get(chosenDay) ?? 0) + step.minutes);

    microTasks.push({
      tempId: `prop_${Math.random().toString(36).slice(2, 9)}`,
      title: step.title,
      dayDate: chosenDay,
      suggestedTimeSlot: slot,
      estimatedMinutes: step.minutes,
      blocksCount: step.minutes === 50 ? 2 : 1,
      rationale: step.rationale,
    });
  }

  // Sort chronologically
  microTasks.sort((a, b) =>
    a.dayDate === b.dayDate
      ? a.suggestedTimeSlot.localeCompare(b.suggestedTimeSlot)
      : a.dayDate.localeCompare(b.dayDate)
  );

  // Check if any day ended up overloaded
  const overloaded = Array.from(loadByDate.entries()).filter(
    ([, mins]) => mins > input.config.dailyCapacityMinutes
  );
  if (overloaded.length > 0) {
    warnings.push(
      `Fecha límite ajustada: ${overloaded.length} día(s) superan tu límite saludable de ${(input.config.dailyCapacityMinutes / 60).toFixed(1)}h. Puedes usar Rebalancear en Plan.`
    );
  }

  const totalEstimatedMinutes = microTasks.reduce((acc, m) => acc + m.estimatedMinutes, 0);
  const totalBlocks = microTasks.reduce((acc, m) => acc + m.blocksCount, 0);

  const traceabilityParts: string[] = [];
  if (input.attachmentMeta) {
    traceabilityParts.push(
      `Archivo adjunto: ${input.attachmentMeta.fileName} (${Math.max(1, Math.round(input.attachmentMeta.fileSizeBytes / 1024))} KB)`
    );
  }
  if (input.instructionsText.trim()) {
    traceabilityParts.push(`Indicaciones analizadas (${input.instructionsText.trim().length} caracteres)`);
  }
  if (traceabilityParts.length === 0) {
    traceabilityParts.push(`Inferido por título y materia (${input.subjectName})`);
  }

  return {
    inferredType,
    totalEstimatedMinutes,
    totalBlocks,
    microTasks,
    warnings,
    respectsConstraints: true,
    traceabilitySummary: traceabilityParts.join(' · '),
  };
}

export function computeRebalancePlan(params: {
  microTasks: MicroTask[];
  deliveries: Array<{ id: string; dueDate: string; subjectId: string }>;
  subjects: Subject[];
  config: UserWellnessConfig;
  classBlocks: ClassBlock[];
}): RebalancePlan {
  const { microTasks, deliveries, subjects, config, classBlocks } = params;
  const today = getTodayKey();
  const deliveryMap = new Map(deliveries.map((d) => [d.id, d]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const pending = microTasks.filter((t) => t.status === 'pending' && t.scheduledDate >= today);
  const loadMap = new Map<string, number>();
  const tasksByDay = new Map<string, MicroTask[]>();
  const takenSlots = new Map<string, Array<{ start: number; end: number }>>();

  for (const t of pending) {
    loadMap.set(t.scheduledDate, (loadMap.get(t.scheduledDate) ?? 0) + t.estimatedMinutes);
    const list = tasksByDay.get(t.scheduledDate) ?? [];
    list.push(t);
    tasksByDay.set(t.scheduledDate, list);
    const start = timeToMinutes(t.scheduledSlot || '16:00');
    const slots = takenSlots.get(t.scheduledDate) ?? [];
    slots.push({ start, end: start + t.estimatedMinutes });
    takenSlots.set(t.scheduledDate, slots);
  }

  const overloadedDates = Array.from(loadMap.entries())
    .filter(([, mins]) => mins > config.dailyCapacityMinutes)
    .map(([d]) => d)
    .sort();

  const afterLoadMap = new Map(loadMap);
  const moves: RebalanceMove[] = [];

  for (const badDate of overloadedDates) {
    const dayTasks = [...(tasksByDay.get(badDate) ?? [])].sort(
      (a, b) => a.estimatedMinutes - b.estimatedMinutes
    );

    for (const task of dayTasks) {
      if ((afterLoadMap.get(badDate) ?? 0) <= config.dailyCapacityMinutes) break;
      const del = deliveryMap.get(task.deliveryId);
      const maxDate = del?.dueDate && del.dueDate >= today ? del.dueDate : addDaysYYYYMMDD(today, 6);

      // Search candidate days from today up to maxDate with capacity remaining
      let targetDate: string | null = null;
      let cursor = today;
      for (let i = 0; i < 10; i++) {
        if (cursor > maxDate) break;
        if (
          cursor !== badDate &&
          (afterLoadMap.get(cursor) ?? 0) + task.estimatedMinutes <= config.dailyCapacityMinutes
        ) {
          targetDate = cursor;
          break;
        }
        cursor = addDaysYYYYMMDD(cursor, 1);
      }

      if (targetDate) {
        const toSlot = findFreeSlotForDay(
          targetDate,
          task.estimatedMinutes,
          config,
          classBlocks,
          takenSlots
        );
        afterLoadMap.set(badDate, (afterLoadMap.get(badDate) ?? 0) - task.estimatedMinutes);
        afterLoadMap.set(targetDate, (afterLoadMap.get(targetDate) ?? 0) + task.estimatedMinutes);
        const subj = del ? subjectMap.get(del.subjectId) : undefined;
        moves.push({
          microTaskId: task.id,
          title: task.title,
          subjectName: subj?.name ?? 'Materia',
          fromDate: badDate,
          toDate: targetDate,
          toSlot,
          estimatedMinutes: task.estimatedMinutes,
        });
      }
    }
  }

  const touchedDates = new Set<string>([
    ...overloadedDates,
    ...moves.map((m) => m.toDate),
  ]);

  const affectedDays: RebalanceDaySummary[] = Array.from(touchedDates)
    .sort()
    .map((date) => ({
      date,
      label: getSpanishDayLabel(date),
      beforeMinutes: loadMap.get(date) ?? 0,
      afterMinutes: afterLoadMap.get(date) ?? 0,
    }));

  const overloadedDays = affectedDays.filter(
    (d) => d.beforeMinutes > config.dailyCapacityMinutes
  );

  return {
    overloadedDays,
    affectedDays,
    moves,
    canRebalance: moves.length > 0,
  };
}
