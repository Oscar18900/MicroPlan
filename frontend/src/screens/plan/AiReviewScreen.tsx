import { useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, FileText, Plus, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { aiPlannerAdapter } from '../../services/adapter';
import type { AiProposalMicroTask } from '../../types/domain';

export function AiReviewScreen() {
  const pendingAiDraft = useAppStore((s) => s.pendingAiDraft);
  const config = useAppStore((s) => s.config);
  const classBlocks = useAppStore((s) => s.classBlocks);
  const microTasks = useAppStore((s) => s.microTasks);
  const setPendingAiDraft = useAppStore((s) => s.setPendingAiDraft);
  const setPlanSubView = useAppStore((s) => s.setPlanSubView);
  const confirmAiDelivery = useAppStore((s) => s.confirmAiDelivery);

  const [items, setItems] = useState<AiProposalMicroTask[]>(
    pendingAiDraft?.proposal.microTasks ?? []
  );

  if (!pendingAiDraft) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-sm font-bold text-[#131B2E]">No hay borrador pendiente.</p>
        <button
          type="button"
          onClick={() => setPlanSubView('new_delivery')}
          className="rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white"
        >
          Crear entrega
        </button>
      </div>
    );
  }

  const updateItem = (tempId: string, patch: Partial<AiProposalMicroTask>) => {
    setItems((prev) => prev.map((it) => (it.tempId === tempId ? { ...it, ...patch } : it)));
  };

  const removeItem = (tempId: string) => {
    setItems((prev) => prev.filter((it) => it.tempId !== tempId));
  };

  const addCustomStep = () => {
    setItems((prev) => [
      ...prev,
      {
        tempId: `custom_${Date.now().toString(36)}`,
        title: 'Nuevo paso personalizado',
        dayDate: pendingAiDraft.dueDate,
        suggestedTimeSlot: '16:00',
        estimatedMinutes: 25,
        blocksCount: 1,
        rationale: 'Agregado manualmente por ti.',
      },
    ]);
  };

  const handleRegenerate = async () => {
    if (!config) return;
    const regenerated = await aiPlannerAdapter.breakdownDelivery({
      subjectName: pendingAiDraft.subjectName,
      title: pendingAiDraft.title,
      dueDate: pendingAiDraft.dueDate,
      instructionsText: pendingAiDraft.instructionsText,
      attachmentMeta: pendingAiDraft.attachmentMeta,
      config,
      classBlocks,
      existingMicroTasks: microTasks,
    });
    setItems(regenerated.microTasks);
    setPendingAiDraft({ ...pendingAiDraft, proposal: regenerated });
  };

  const handleConfirm = async () => {
    if (items.length === 0) return;
    await confirmAiDelivery({
      ...pendingAiDraft,
      proposal: { ...pendingAiDraft.proposal, microTasks: items },
    });
  };

  const totalMins = items.reduce((sum, i) => sum + i.estimatedMinutes, 0);

  return (
    <div className="space-y-4 px-4 py-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPlanSubView('new_delivery')}
          className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold text-[#434655]"
        >
          <ArrowLeft className="h-4 w-4" />
          Ajustar
        </button>
        <h1 className="text-base font-extrabold text-[#131B2E]">Vista Previa IA</h1>
        <span className="rounded-full bg-[#E5EEFF] px-2.5 py-0.5 text-[11px] font-bold text-[#004AC6]">
          {items.length} pasos · {totalMins}m
        </span>
      </div>

      {/* Traceability & Constraint Respect Card */}
      <section className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-2.5">
        <h2 className="text-sm font-extrabold text-[#131B2E]">{pendingAiDraft.title}</h2>
        <p className="text-xs text-[#434655]">
          {pendingAiDraft.subjectName} · Límite {pendingAiDraft.dueDate}
        </p>
        <div className="flex items-center gap-2 rounded-2xl bg-[#F2F3FF] px-3 py-2 text-[11px] font-semibold text-[#131B2E]">
          <FileText className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />
          <span>{pendingAiDraft.proposal.traceabilitySummary}</span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-[#E6F7EC] px-3 py-2 text-[11px] font-semibold text-[#117E3B]">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span>Respeta tus clases, tu Ocio Protegido y tu descanso antes de {config?.curfewAlertTime}.</span>
        </div>
        {pendingAiDraft.proposal.warnings.map((w) => (
          <div
            key={w}
            className="flex items-start gap-2 rounded-2xl bg-[#FFFBEB] px-3 py-2 text-[11px] font-semibold text-[#B15106]"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{w}</span>
          </div>
        ))}
      </section>

      {/* Editable Micro-tasks List */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-extrabold tracking-wide text-[#737686] uppercase">
            Desglose sugerido (toca para editar)
          </span>
          <button
            type="button"
            onClick={addCustomStep}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB]"
          >
            <Plus className="h-3.5 w-3.5" />
            Añadir paso
          </button>
        </div>

        {items.map((item) => (
          <div
            key={item.tempId}
            className="rounded-2xl border border-[#E5E7F3] bg-white p-3.5 space-y-2.5"
          >
            <div className="flex items-start gap-2">
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateItem(item.tempId, { title: e.target.value })}
                aria-label="Título de micro-meta"
                className="flex-1 rounded-xl border border-[#E5E7F3] bg-[#FAF8FF] px-2.5 py-1.5 text-xs font-bold text-[#131B2E]"
              />
              <button
                type="button"
                onClick={() => removeItem(item.tempId)}
                className="rounded-lg p-1.5 text-[#737686] hover:text-[#BA1A1A]"
                aria-label="Eliminar paso"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={item.dayDate}
                  onChange={(e) => updateItem(item.tempId, { dayDate: e.target.value })}
                  aria-label="Fecha sugerida"
                  className="rounded-lg border border-[#E5E7F3] px-2 py-1 text-[11px] font-semibold text-[#434655]"
                />
                <input
                  type="time"
                  value={item.suggestedTimeSlot}
                  onChange={(e) =>
                    updateItem(item.tempId, { suggestedTimeSlot: e.target.value })
                  }
                  aria-label="Hora sugerida"
                  className="rounded-lg border border-[#E5E7F3] px-2 py-1 text-[11px] font-semibold text-[#434655]"
                />
              </div>
              <div className="flex gap-1">
                {([25, 50] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updateItem(item.tempId, { estimatedMinutes: m })}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      item.estimatedMinutes === m
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-[#F2F3FF] text-[#434655]'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          type="button"
          onClick={() => void handleRegenerate()}
          className="col-span-1 flex items-center justify-center gap-1 rounded-2xl border border-[#E5E7F3] bg-white py-3 text-xs font-bold text-[#434655]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerar
        </button>
        <button
          type="button"
          disabled={items.length === 0}
          onClick={() => void handleConfirm()}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-2xl bg-[#2563EB] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#004AC6] disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          Confirmar y agregar
        </button>
      </div>
    </div>
  );
}
