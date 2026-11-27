import { Check, Coffee, Plus, Sparkles, X } from 'lucide-react';
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
  const isLinkedDone = linkedTask?.status === 'completed';

  return (
    <ModalDialog
      open={showCompleteModal}
      onClose={() => setShowCompleteModal(false)}
      labelledBy="focus-complete-title"
      closedBy="any"
    >
      <div className="relative rounded-3xl border border-[#E5E7F3] bg-white p-6 text-center shadow-xl space-y-4 text-[#131B2E]">
        <button
          type="button"
          onClick={() => setShowCompleteModal(false)}
          className="absolute top-4 right-4 rounded-xl p-1.5 text-[#737686] hover:bg-[#F2F3FF]"
          aria-label="Cerrar ventana"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E6F7EC] text-[#117E3B]">
          <Sparkles className="h-7 w-7" />
        </div>
        <div>
          <h1 id="focus-complete-title" className="text-xl font-extrabold">
            {lastCompletedXp > 0 ? '¡Bloque completado!' : 'Sesión finalizada'}
          </h1>
          <p className="mt-1 text-sm font-bold text-[#117E3B]">
            {lastCompletedXp > 0
              ? `+${lastCompletedXp} XP · Racha protegida`
              : 'Guardado en historial (cerrado antes del 50%)'}
          </p>
          <p className="mt-1 text-xs text-[#434655]">
            Elige si prefieres descansar 5 min, extender otro bloque o terminar por ahora.
          </p>
        </div>

        {linkedTask ? (
          <div className="rounded-2xl bg-[#F2F3FF] p-3.5 text-left space-y-2.5">
            <span className="block text-[10px] font-bold tracking-wide text-[#737686] uppercase">
              Micro-meta vinculada
            </span>
            <p className="text-xs font-bold text-[#131B2E]">{linkedTask.title}</p>
            {isLinkedDone ? (
              <div className="flex items-center justify-center gap-1.5 rounded-xl bg-[#E6F7EC] py-2 text-xs font-bold text-[#117E3B]">
                <Check className="h-4 w-4" />
                Micro-meta completada
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void toggleMicroTaskComplete(linkedTask.id, 'focus')}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#117E3B] py-2.5 text-xs font-bold text-white"
              >
                <Check className="h-4 w-4" />
                Marcar micro-meta completada
              </button>
            )}
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
          <button
            type="button"
            onClick={() => setShowCompleteModal(false)}
            className="w-full py-2 text-center text-xs font-bold text-[#737686] hover:text-[#131B2E]"
          >
            Terminar por ahora (Cerrar)
          </button>
        </div>
      </div>
    </ModalDialog>
  );
}
