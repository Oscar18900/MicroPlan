import { AlertCircle, Shield } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ModalDialog } from '../../components/ModalDialog';

export function FocusShieldModal() {
  const showShieldModal = useAppStore((s) => s.showShieldModal);
  const setShowShieldModal = useAppStore((s) => s.setShowShieldModal);
  const activeTimer = useAppStore((s) => s.activeTimer);
  const pauseFocusAndGoHome = useAppStore((s) => s.pauseFocusAndGoHome);
  const discardFocusBlock = useAppStore((s) => s.discardFocusBlock);

  const remainingMin = activeTimer
    ? Math.max(
        1,
        Math.ceil(
          (activeTimer.startedAt
            ? Math.max(0, activeTimer.durationSec - (Date.now() - activeTimer.startedAt) / 1000)
            : activeTimer.pausedRemainingSec ?? activeTimer.durationSec) / 60
        )
      )
    : 20;

  return (
    <ModalDialog
      open={showShieldModal}
      onClose={() => setShowShieldModal(false)}
      labelledBy="shield-modal-title"
      closedBy="closerequest"
    >
      <div className="rounded-3xl border border-[#B15106]/25 bg-white p-6 shadow-xl space-y-4 text-[#131B2E]">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFFBEB] text-[#B15106]">
            <Shield className="h-6 w-6" />
          </span>
          <div>
            <span className="inline-block rounded-full bg-[#FFFBEB] px-2.5 py-0.5 text-[10px] font-bold text-[#B15106]">
              Escudo de Enfoque Activo
            </span>
            <h1 id="shield-modal-title" className="mt-1 text-lg font-extrabold">
              ¿Seguro que quieres salir?
            </h1>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-[#434655]">
          Te faltan aprox. <strong>{remainingMin} min</strong> para completar este bloque. Cambiar de
          contexto o abrir redes ahora interrumpe tu concentración (~15 min en retomarla).
        </p>

        <div className="flex items-start gap-2 rounded-2xl bg-[#E2F7F5] p-3 text-xs font-medium text-[#006A63]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Salir pausa este bloque y no suma +35 XP, pero <strong>NO rompe tu racha</strong> ni
            borra tus respuestas.
          </span>
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            autoFocus
            onClick={() => setShowShieldModal(false)}
            className="w-full rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#004AC6]"
          >
            ← Volver a mi enfoque (Seguir)
          </button>
          <button
            type="button"
            onClick={() => void pauseFocusAndGoHome()}
            className="w-full rounded-2xl border border-[#E5E7F3] bg-[#F2F3FF] py-3 text-xs font-bold text-[#131B2E]"
          >
            Pausar bloque y salir
          </button>
          <button
            type="button"
            onClick={() => void discardFocusBlock()}
            className="w-full py-2 text-center text-xs font-bold text-[#BA1A1A] hover:underline"
          >
            Descartar este bloque
          </button>
        </div>
      </div>
    </ModalDialog>
  );
}
