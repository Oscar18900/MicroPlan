import { Check, Coffee, Plus, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ModalDialog } from '../../components/ModalDialog';

export function FocusCompleteModal() {
  const showCompleteModal = useAppStore((s) => s.showCompleteModal);
  const setShowCompleteModal = useAppStore((s) => s.setShowCompleteModal);
  const lastCompletedXp = useAppStore((s) => s.lastCompletedXp);
  const lastCompletedTaskId = useAppStore((s) => s.lastCompletedTaskId);
  const microTasks = useAppStore((s) => s.microTasks);
  const toggleMicroTaskComplete = useAppStore((s) => s.toggleMicroTaskComplete);
  const startRegenerativeBreak = useAppStore((s) => s.startRegenerativeBreak);
  const extendFocusPlus25 = useAppStore((s) => s.extendFocusPlus25);

  const linkedTask = lastCompletedTaskId
    ? microTasks.find((m) => m.id === lastCompletedTaskId)
    : null;

  return (
    <ModalDialog
      open={showCompleteModal}
      onClose={() => setShowCompleteModal(false)}
      labelledBy="focus-complete-title"
      closedBy="any"
    >
      <div className="rounded-3xl border border-[#E5E7F3] bg-white p-6 text-center shadow-xl space-y-4 text-[#131B2E]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E6F7EC] text-[#117E3B]">
          <Sparkles className="h-7 w-7" />
        </div>
        <div>
          <h1 id="focus-complete-title" className="text-xl font-extrabold">
            ¡Bloque completado!
          </h1>
          <p className="mt-1 text-sm font-bold text-[#117E3B]">
            +{lastCompletedXp} XP · Racha protegida
          </p>
          <p className="mt-1 text-xs text-[#434655]">
            Excelente ritmo. Tómate 5 minutos para descansar antes de continuar.
          </p>
        </div>

        {linkedTask && linkedTask.status !== 'completed' ? (
          <div className="rounded-2xl bg-[#F2F3FF] p-3.5 text-left space-y-2.5">
            <span className="block text-[10px] font-bold tracking-wide text-[#737686] uppercase">
              Micro-meta vinculada
            </span>
            <p className="text-xs font-bold text-[#131B2E]">{linkedTask.title}</p>
            <button
              type="button"
              onClick={async () => {
                await toggleMicroTaskComplete(linkedTask.id, 'focus');
                setShowCompleteModal(false);
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#117E3B] py-2.5 text-xs font-bold text-white"
            >
              <Check className="h-4 w-4" />
              Marcar micro-meta completada
            </button>
          </div>
        ) : null}

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void startRegenerativeBreak()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#006A63] py-3 text-sm font-bold text-white"
          >
            <Coffee className="h-4 w-4" />
            Descanso de 5 min (Recomendado)
          </button>
          <button
            type="button"
            onClick={() => void extendFocusPlus25()}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#E5E7F3] bg-white py-2.5 text-xs font-bold text-[#2563EB]"
          >
            <Plus className="h-3.5 w-3.5" />
            Extender otro bloque (+25 min)
          </button>
        </div>
      </div>
    </ModalDialog>
  );
}
