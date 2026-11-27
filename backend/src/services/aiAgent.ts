import Groq from 'groq-sdk';
import { z } from 'zod';
import type { ExtractedAttachmentText } from './fileExtractor';

const ProposalMicroTaskSchema = z.object({
  title: z.string().min(4).max(140),
  dayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  suggestedTimeSlot: z.string().regex(/^\d{2}:\d{2}$/),
  estimatedMinutes: z.union([z.literal(25), z.literal(50)]),
  rationale: z.string().min(4).max(220),
});

const GroqBreakdownSchema = z.object({
  inferredType: z.enum(['practice', 'essay', 'exam', 'presentation', 'project']),
  microTasks: z.array(ProposalMicroTaskSchema).min(2).max(7),
  warnings: z.array(z.string()).default([]),
});

const GroqRebalanceSchema = z.object({
  moves: z.array(
    z.object({
      microTaskId: z.string(),
      toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      toSlot: z.string().regex(/^\d{2}:\d{2}$/),
    })
  ),
});

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing.');
  }
  return new Groq({ apiKey });
}

function clampDate(dateStr: string, minDate: string, maxDate: string): string {
  if (dateStr < minDate) return minDate;
  if (dateStr > maxDate) return maxDate;
  return dateStr;
}

function sanitizeSlot(slot: string, curfewHHmm: string, leisureStart: string, leisureEnd: string): string {
  if (slot >= leisureStart && slot < leisureEnd) {
    return leisureEnd;
  }
  if (slot >= curfewHHmm) {
    return '19:30';
  }
  return slot;
}

export interface AgentBreakdownRequest {
  todayKey: string;
  subjectName: string;
  title: string;
  dueDate: string;
  instructionsText: string;
  extractedFile?: ExtractedAttachmentText;
  scheduleSummary: string;
  leisureStart: string;
  leisureEnd: string;
  curfewAlertTime: string;
  dailyCapacityMinutes: number;
  existingLoadSummary: string;
}

export async function runGroqBreakdown(input: AgentBreakdownRequest) {
  const client = getGroqClient();
  const primaryModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const fallbackModel = process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b';

  const systemPrompt = `Eres el Agente Ético de Microplanificación Académica de MicroPlan (BUAP).
REGLA ÉTICA INQUEBRANTABLE:
- PROHIBIDO resolver la tarea, redactar ensayos, escribir código entregable o contestar cuestionarios.
- Tu ÚNICA función es descomponer la entrega universitaria en 3 a 6 micro-metas ACCIONABLES y específicas de 25 o 50 minutos, para vencer el bloqueo inicial del estudiante.
- Respeta estrictamente el horario de clases, el bloque de Ocio Protegido (${input.leisureStart}–${input.leisureEnd}), la capacidad diaria (${input.dailyCapacityMinutes} min/día) y la hora límite antes del toque de queda (${input.curfewAlertTime}).
- Nunca agendes trabajo después de ${input.curfewAlertTime} ni dentro del Ocio Protegido (${input.leisureStart}–${input.leisureEnd}).
- Devuelve ÚNICAMENTE un objeto JSON válido con este formato exacto:
{
  "inferredType": "practice" | "essay" | "exam" | "presentation" | "project",
  "microTasks": [
    {
      "title": "Paso accionable concreto en español",
      "dayDate": "YYYY-MM-DD",
      "suggestedTimeSlot": "HH:mm",
      "estimatedMinutes": 25 | 50,
      "rationale": "Por qué este paso ayuda sin abrumar"
    }
  ],
  "warnings": ["Solo si la fecha límite es muy próxima y supera la capacidad diaria"]
}`;

  const combinedInstructions = [
    input.instructionsText ? `Instrucciones pegadas:\n${input.instructionsText.slice(0, 3500)}` : '',
    input.extractedFile?.extractedText
      ? `Texto extraído del archivo (${input.extractedFile.fileName} via ${input.extractedFile.extractionMethod}):\n${input.extractedFile.extractedText.slice(0, 4000)}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const userPrompt = `Fecha actual: ${input.todayKey}
Materia: ${input.subjectName}
Título de la entrega: ${input.title}
Fecha límite: ${input.dueDate < input.todayKey ? input.todayKey : input.dueDate}
Horario de clases ocupado: ${input.scheduleSummary || 'Sin clases fijas cargadas'}
Ocio Protegido (prohibido agendar tareas): ${input.leisureStart} a ${input.leisureEnd}
Toque de queda nocturno: ${input.curfewAlertTime}
Carga ya agendada por día: ${input.existingLoadSummary || '0 min'}

${combinedInstructions || 'No se adjuntaron instrucciones adicionales; infiere los pasos estándar de planificación para esta entrega.'}`;

  const modelsToTry = [primaryModel, fallbackModel];
  let lastError: unknown;

  for (const model of modelsToTry) {
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.25,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from Groq');
      const parsedJson = JSON.parse(content);
      const validated = GroqBreakdownSchema.parse(parsedJson);

      const safeMaxDate = input.dueDate >= input.todayKey ? input.dueDate : input.todayKey;
      const microTasks = validated.microTasks.map((m, idx) => ({
        tempId: `groq_${Date.now().toString(36)}_${idx}`,
        title: m.title.trim(),
        dayDate: clampDate(m.dayDate, input.todayKey, safeMaxDate),
        suggestedTimeSlot: sanitizeSlot(
          m.suggestedTimeSlot,
          input.curfewAlertTime,
          input.leisureStart,
          input.leisureEnd
        ),
        estimatedMinutes: m.estimatedMinutes,
        blocksCount: m.estimatedMinutes === 50 ? 2 : 1,
        rationale: m.rationale.trim(),
      }));

      const totalEstimatedMinutes = microTasks.reduce((sum, m) => sum + m.estimatedMinutes, 0);
      const totalBlocks = microTasks.reduce((sum, m) => sum + m.blocksCount, 0);

      const traceParts: string[] = [`Agente Groq (${model})`];
      if (input.extractedFile) {
        traceParts.push(
          `Archivo: ${input.extractedFile.fileName} (${input.extractedFile.extractionMethod})`
        );
      }
      if (input.instructionsText) {
        traceParts.push(`Indicaciones (${input.instructionsText.length} chars)`);
      }

      return {
        inferredType: validated.inferredType,
        totalEstimatedMinutes,
        totalBlocks,
        microTasks,
        warnings: validated.warnings,
        respectsConstraints: true,
        traceabilitySummary: traceParts.join(' · '),
        provider: 'groq' as const,
        modelUsed: model,
      };
    } catch (err) {
      lastError = err;
      console.warn(`Groq model ${model} failed, trying next if available:`, err);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Groq breakdown failed');
}

export async function runGroqRebalance(input: {
  todayKey: string;
  dailyCapacityMinutes: number;
  pendingTasks: Array<{
    id: string;
    title: string;
    scheduledDate: string;
    dueDate: string;
    estimatedMinutes: number;
  }>;
  leisureStart: string;
  leisureEnd: string;
  curfewAlertTime: string;
}) {
  const client = getGroqClient();
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Eres el optimizador de carga de MicroPlan. Mueve micro-metas desde días que superan ${input.dailyCapacityMinutes} minutos hacia días más ligeros entre ${input.todayKey} y la fecha límite (dueDate) de cada tarea, evitando ${input.leisureStart}-${input.leisureEnd} y después de ${input.curfewAlertTime}. Devuelve JSON: {"moves":[{"microTaskId":"...","toDate":"YYYY-MM-DD","toSlot":"HH:mm"}]}`,
      },
      {
        role: 'user',
        content: JSON.stringify(input.pendingTasks),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty rebalance response');
  return GroqRebalanceSchema.parse(JSON.parse(content));
}
