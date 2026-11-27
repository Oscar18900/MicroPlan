import { useState } from 'react';
import { AlertTriangle, Moon, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { computeSafeEmergencyCap } from '../../services/gamification';
import { addDaysYYYYMMDD, formatTime12h, getTodayKey } from '../../services/timeService';
import { ModalDialog } from '../../components/ModalDialog';

export function CurfewAlertModal() {
  const showCurfewModal = useAppStore((s) => s.showCurfewModal);
  const setShowCurfewModal = useAppStore((s) => s.setShowCurfewModal);
  const config = useAppStore((s) => s.config);
  const classBlocks = useAppStore((s) => s.classBlocks);
  const microTasks = useAppStore((s) => s.microTasks);
  const rescheduleTodayAndSleep = useAppStore((s) => s.rescheduleTodayAndSleep);
  const activateEmergencyMode = useAppStore((s) => s.activateEmergencyMode);

  const [emergencyErr, setEmergencyErr] = useState<string | null>(null);

  if (!config) return null;

  const today = getTodayKey();
  const tomorrow = addDaysYYYYMMDD(today, 1);
  const pendingToday = microTasks.filter(
    (m) => m.scheduledDate === today && m.status === 'pending'
  );
  const emergencyCap = computeSafeEmergencyCap(tomorrow, config, classBlocks);

  const handleEmergency = async () => {
    setEmergencyErr(null);
    const res = await activateEmergencyMode();
    if (!res.ok) setEmergencyErr(res.error ?? 'No se pudo activar.');
  };

  return (
    <ModalDialog
      open={showCurfewModal}
      onClose={() => setShowCurfewModal(false)}
      labelledBy="curfew-modal-title"
      closedBy="any"
    >
      <div className="rounded-3xl bg-[#131B2E] p-6 text-white shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-[#89F5EA]">
            <Moon className="h-3.5 w-3.5" />
            {formatTime12h(config.curfewAlertTime)} · TOQUE DE QUEDA
          </span>
          <button
            type="button"
            onClick={() => setShowCurfewModal(false)}
            className="rounded-xl p-1 text-white/70 hover:bg-white/10"
            aria-label="Cerrar alerta nocturna"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <h1 id="curfew-modal-title" className="text-xl font-extrabold leading-snug">
            Hora de desconectar para dormir {config.sleepGoalHours}h
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-white/75">
            Estudiar de madrugada reduce la retención y afecta tu día. Tu progreso de hoy ya está a
            salvo.
          </p>
        </div>

        {/* Pending block summary */}
        <div className="rounded-2xl bg-white/8 p-3.5 space-y-1.5">
          <span className="block text-[10px] font-bold tracking-wide text-white/60 uppercase">
            Saldo pendiente de hoy ({pendingToday.length} bloque{pendingToday.length === 1 ? '' : 's'})
          </span>
          {pendingToday.length > 0 ? (
            <>
              <p className="text-xs font-bold text-white">{pendingToday[0].title}</p>
              <p className="text-[11px] text-[#89F5EA] flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Se reprogramará automáticamente para mañana sin castigo.
              </p>
            </>
          ) : (
            <p className="text-xs font-semibold text-[#89F5EA]">
              ¡Día completado! No tienes bloques pendientes hoy.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void rescheduleTodayAndSleep()}
          className="w-full rounded-2xl bg-[#006A63] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#007D75]"
        >
          Reprogramar y Dormir (Mantiene racha)
        </button>

        {/* Configurable Emergency Mode Section */}
        <div className="rounded-2xl border border-[#FFB86B]/30 bg-[#FFFBEB]/10 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#FFD59E]">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" />
              ¿Tienes examen o entrega crítica mañana?
            </span>
            <span>
              {config.emergencyUsedThisWeek}/{config.emergencyWeeklyQuota} sem
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-white/75">
            Límite configurado: <strong>+{config.emergencyMinutes} min</strong>. Protege el piso
            mínimo de 6h de sueño (primera clase mañana: {emergencyCap.firstClassTime}, cierre límite:{' '}
            {emergencyCap.bedtimeHardFloorTime}).
          </p>
          {emergencyErr ? (
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#FFB4AB]">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {emergencyErr}
            </p>
          ) : null}
          <button
            type="button"
            disabled={!emergencyCap.canUseEmergency}
            onClick={() => void handleEmergency()}
            className="w-full rounded-xl border border-[#FFB86B]/40 bg-[#B15106]/30 py-2.5 text-xs font-bold text-[#FFD59E] disabled:opacity-45"
          >
            {emergencyCap.canUseEmergency
              ? `Activar Modo Emergencia (+${emergencyCap.allowedMinutes}m)`
              : emergencyCap.reason ?? 'Emergencia no disponible'}
          </button>
        </div>
      </div>
    </ModalDialog>
  );
}
