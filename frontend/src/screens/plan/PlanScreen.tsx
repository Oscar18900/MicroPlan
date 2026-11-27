import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Play,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatTime12h, getSpanishDayLabel, getTodayKey } from '../../services/timeService';

export function PlanScreen() {
  const config = useAppStore((s) => s.config);
  const subjects = useAppStore((s) => s.subjects);
  const deliveries = useAppStore((s) => s.deliveries);
  const microTasks = useAppStore((s) => s.microTasks);
  const autoExpandDeliveryId = useAppStore((s) => s.autoExpandDeliveryId);
  const clearAutoExpandDeliveryId = useAppStore((s) => s.clearAutoExpandDeliveryId);
  const setPlanSubView = useAppStore((s) => s.setPlanSubView);
  const toggleMicroTaskComplete = useAppStore((s) => s.toggleMicroTaskComplete);
  const addManualMicroTask = useAppStore((s) => s.addManualMicroTask);
  const deleteDelivery = useAppStore((s) => s.deleteDelivery);
  const openFocusWithTask = useAppStore((s) => s.openFocusWithTask);

  const today = getTodayKey();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [addingForDelivery, setAddingForDelivery] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMins, setNewTaskMins] = useState<number>(0);
  const [newTaskDate, setNewTaskDate] = useState<string>(today);

  useEffect(() => {
    if (selectedSubjectId !== 'all' && !subjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId('all');
    }
  }, [subjects, selectedSubjectId]);

  useEffect(() => {
    if (autoExpandDeliveryId) {
      setExpandedIds((prev) => ({ ...prev, [autoExpandDeliveryId]: true }));
      setAddingForDelivery(autoExpandDeliveryId);
      setNewTaskDate(today);
      clearAutoExpandDeliveryId();
    }
  }, [autoExpandDeliveryId, clearAutoExpandDeliveryId, today]);

  const capacityMins = config?.dailyCapacityMinutes ?? 180;

  // Compute today's load & whether any upcoming day is overloaded
  const todayPendingMins = useMemo(
    () =>
      microTasks
        .filter((m) => m.scheduledDate === today && m.status === 'pending')
        .reduce((acc, m) => acc + m.estimatedMinutes, 0),
    [microTasks, today]
  );

  const overloadedDaysCount = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const t of microTasks) {
      if (t.status === 'pending' && t.scheduledDate >= today) {
        byDate.set(t.scheduledDate, (byDate.get(t.scheduledDate) ?? 0) + t.estimatedMinutes);
      }
    }
    return Array.from(byDate.values()).filter((m) => m > capacityMins).length;
  }, [microTasks, today, capacityMins]);

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const filteredDeliveries = useMemo(() => {
    const list =
      selectedSubjectId === 'all'
        ? deliveries
        : deliveries.filter((d) => d.subjectId === selectedSubjectId);
    return [...list].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [deliveries, selectedSubjectId]);

  const capacityPercent = Math.min(100, Math.round((todayPendingMins / capacityMins) * 100));
  const isTodayOverloaded = todayPendingMins > capacityMins;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const handleAddStep = async (deliveryId: string) => {
    if (!newTaskTitle.trim()) return;
    await addManualMicroTask(deliveryId, newTaskTitle, newTaskMins, newTaskDate || today);
    setNewTaskTitle('');
    setNewTaskDate(today);
    setAddingForDelivery(null);
  };

  return (
    <div className="space-y-4 px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#131B2E]">Plan</h1>
          <p className="text-xs text-[#434655]">Entregas y micro-metas accionables</p>
        </div>
        <button
          type="button"
          onClick={() => setPlanSubView('subjects')}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-[#E5E7F3] bg-white px-3 py-2 text-xs font-bold text-[#131B2E] hover:bg-[#F2F3FF]"
        >
          <BookOpen className="h-3.5 w-3.5 text-[#2563EB]" />
          Materias ({subjects.length})
        </button>
      </div>

      {/* Subject filter chips */}
      {subjects.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedSubjectId('all')}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              selectedSubjectId === 'all'
                ? 'bg-[#2563EB] text-white'
                : 'bg-white border border-[#E5E7F3] text-[#434655]'
            }`}
          >
            Todas ({deliveries.length})
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                selectedSubjectId === sub.id
                  ? 'bg-[#131B2E] text-white'
                  : 'bg-white border border-[#E5E7F3] text-[#434655]'
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: sub.colorHex }}
              />
              {sub.name}
            </button>
          ))}
        </div>
      ) : null}

      {/* Daily Capacity Meter */}
      <section className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#131B2E]">
            Capacidad de hoy: {(todayPendingMins / 60).toFixed(1)}h / {(capacityMins / 60).toFixed(1)}h
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              isTodayOverloaded
                ? 'bg-[#FFDAD6] text-[#BA1A1A]'
                : 'bg-[#E6F7EC] text-[#117E3B]'
            }`}
          >
            {isTodayOverloaded ? 'Sobrecarga' : 'Carga óptima'}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#EAEDFF]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isTodayOverloaded ? 'bg-[#BA1A1A]' : 'bg-[#117E3B]'
            }`}
            style={{ width: `${capacityPercent}%` }}
          />
        </div>
        {overloadedDaysCount > 0 ? (
          <div className="flex items-center justify-between rounded-2xl bg-[#FFFBEB] border border-[#B15106]/20 px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-[#B15106] font-semibold">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Detectamos {overloadedDaysCount} día(s) por encima de tu límite saludable.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPlanSubView('rebalance')}
              className="ml-2 shrink-0 rounded-xl bg-[#B15106] px-2.5 py-1.5 text-[11px] font-bold text-white"
            >
              Rebalancear
            </button>
          </div>
        ) : null}
      </section>

      {/* Primary CTA */}
      <button
        type="button"
        onClick={() => setPlanSubView('new_delivery')}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#004AC6] transition"
      >
        <Plus className="h-4 w-4" />
        Nueva Entrega (Manual o con IA)
      </button>

      {/* Empty State (03.7) OR Deliveries List (03.1) */}
      {filteredDeliveries.length === 0 ? (
        <section className="rounded-3xl border border-[#E5E7F3] bg-white p-7 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E2F7F5] text-[#006A63]">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-extrabold text-[#131B2E]">¡Todo en calma por ahora!</h2>
          <p className="text-xs leading-relaxed text-[#434655]">
            Aún no tienes entregas registradas{selectedSubjectId !== 'all' ? ' en esta materia' : ''}.
            Cuando tengas un ensayo, práctica o examen, agrégalo aquí y te ayudaremos a dividirlo paso a paso.
          </p>
          <button
            type="button"
            onClick={() => setPlanSubView('new_delivery')}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-[#E5EEFF] px-4 py-2.5 text-xs font-bold text-[#004AC6]"
          >
            <Plus className="h-4 w-4" />
            Agregar mi primera entrega
          </button>
        </section>
      ) : (
        <div className="space-y-3">
          {filteredDeliveries.map((del) => {
            const sub = subjectMap.get(del.subjectId);
            const tasks = microTasks
              .filter((t) => t.deliveryId === del.id)
              .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
            const doneCount = tasks.filter((t) => t.status === 'completed').length;
            const expanded = expandedIds[del.id] ?? true;

            return (
              <article
                key={del.id}
                className="rounded-3xl border border-[#E5E7F3] bg-white p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(del.id)}
                    className="flex flex-1 items-start gap-2.5 text-left"
                  >
                    <span
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: sub?.colorHex ?? '#2563EB' }}
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-extrabold text-[#131B2E] leading-snug flex flex-wrap items-center gap-1.5">
                        <span>{del.title}</span>
                        {tasks.length > 0 && doneCount === tasks.length ? (
                          <span className="rounded-full bg-[#E6F7EC] px-2 py-0.5 text-[10px] font-bold text-[#117E3B]">
                            Completada
                          </span>
                        ) : null}
                      </h2>
                      <p className="mt-0.5 text-[11px] font-medium text-[#737686]">
                        {sub?.name ?? 'Materia'} · Límite: {getSpanishDayLabel(del.dueDate)} ·{' '}
                        {doneCount}/{tasks.length} micro-metas
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void deleteDelivery(del.id)}
                      className="rounded-xl p-1.5 text-[#737686] hover:bg-[#FFDAD6]/50 hover:text-[#BA1A1A]"
                      aria-label={`Eliminar entrega ${del.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpand(del.id)}
                      className="rounded-xl p-1.5 text-[#737686] hover:bg-[#F2F3FF]"
                      aria-label={expanded ? 'Contraer entrega' : 'Expandir entrega'}
                    >
                      {expanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {expanded ? (
                  <div className="space-y-2 border-t border-[#E5E7F3] pt-3">
                    {tasks.length === 0 ? (
                      <p className="text-xs text-[#737686] italic">
                        Sin micro-metas aún. Agrega pasos manuales abajo.
                      </p>
                    ) : (
                      tasks.map((task) => {
                        const isDone = task.status === 'completed';
                        return (
                          <div
                            key={task.id}
                            className={`flex items-center gap-2.5 rounded-2xl px-3 py-2.5 transition ${
                              isDone ? 'bg-[#F2F3FF]/60 opacity-75' : 'bg-[#F2F3FF]'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => void toggleMicroTaskComplete(task.id, 'direct')}
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                                isDone
                                  ? 'border-[#117E3B] bg-[#117E3B] text-white'
                                  : 'border-[#737686] bg-white hover:border-[#2563EB]'
                              }`}
                              aria-label={
                                isDone
                                  ? `Desmarcar ${task.title}`
                                  : `Completar directo ${task.title}`
                              }
                            >
                              {isDone ? <Check className="h-3.5 w-3.5" /> : null}
                            </button>

                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-xs font-semibold leading-snug ${
                                  isDone ? 'line-through text-[#737686]' : 'text-[#131B2E]'
                                }`}
                              >
                                {task.title}
                              </p>
                              <p className="mt-0.5 text-[10px] font-medium text-[#737686]">
                                {getSpanishDayLabel(task.scheduledDate)} ·{' '}
                                {task.estimatedMinutes > 0
                                  ? `${task.scheduledSlot ? `${formatTime12h(task.scheduledSlot)} · ` : ''}${task.estimatedMinutes} min`
                                  : 'Sin Pomodoro · Checklist'}
                              </p>
                            </div>

                            {!isDone ? (
                              <button
                                type="button"
                                onClick={() =>
                                  void openFocusWithTask(
                                    task.id,
                                    task.estimatedMinutes >= 45 ? 45 : 25
                                  )
                                }
                                title={
                                  task.estimatedMinutes > 0
                                    ? 'Iniciar en Focus'
                                    : 'Opcional: enfocar esta tarea en Focus'
                                }
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-2xs hover:bg-[#004AC6]"
                                aria-label={`Iniciar ${task.title} en Focus`}
                              >
                                <Play className="h-3.5 w-3.5 fill-current" />
                              </button>
                            ) : null}
                          </div>
                        );
                      })
                    )}

                    {/* Inline add manual micro-task */}
                    {addingForDelivery === del.id ? (
                      <div className="rounded-2xl border border-[#E5E7F3] bg-[#FAF8FF] p-3 space-y-2.5">
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Ej. Leer capítulo 2 o redactar conclusiones..."
                          className="mp-input text-xs"
                        />
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#737686] mr-1">Modo:</span>
                          {(
                            [
                              { mins: 0, label: 'Sin Pomodoro' },
                              { mins: 15, label: '15m' },
                              { mins: 25, label: '25m' },
                              { mins: 50, label: '50m' },
                            ] as const
                          ).map((opt) => (
                            <button
                              key={opt.mins}
                              type="button"
                              onClick={() => setNewTaskMins(opt.mins)}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                                newTaskMins === opt.mins
                                  ? 'bg-[#2563EB] text-white'
                                  : 'bg-white border border-[#E5E7F3] text-[#434655]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="date"
                            min={today}
                            value={newTaskDate}
                            onChange={(e) => setNewTaskDate(e.target.value)}
                            aria-label="Fecha de la micro-meta"
                            className="rounded-lg border border-[#E5E7F3] bg-white px-2 py-1 text-[11px] font-semibold text-[#434655]"
                          />
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setAddingForDelivery(null)}
                              className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#737686]"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleAddStep(del.id)}
                              className="rounded-lg bg-[#2563EB] px-3 py-1 text-[11px] font-bold text-white"
                            >
                              Guardar paso
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setNewTaskDate(today);
                          setAddingForDelivery(del.id);
                        }}
                        className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-[#2563EB] hover:underline"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Agregar micro-meta manual
                      </button>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
