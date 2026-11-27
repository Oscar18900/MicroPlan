import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Coffee,
  Droplets,
  Pause,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Volume2,
  VolumeX,
  Wind,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { requestNotificationPermission } from '../../services/notifications';
import { getTodayKey } from '../../services/timeService';
import type { AmbientSoundType } from '../../types/domain';

function computeRemainingSeconds(
  startedAt: number | null,
  durationSec: number,
  pausedRemainingSec: number | null
): number {
  if (startedAt === null) {
    return pausedRemainingSec ?? durationSec;
  }
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  return Math.max(0, durationSec - elapsed);
}

function formatMMSS(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function FocusScreen() {
  const activeTimer = useAppStore((s) => s.activeTimer);
  const microTasks = useAppStore((s) => s.microTasks);
  const focusSessions = useAppStore((s) => s.focusSessions);
  const config = useAppStore((s) => s.config);
  const clockOverride = useAppStore((s) => s.clockOverride);
  const setFocusDuration = useAppStore((s) => s.setFocusDuration);
  const setFocusShield = useAppStore((s) => s.setFocusShield);
  const setFocusSound = useAppStore((s) => s.setFocusSound);
  const unlinkFocusMicroTask = useAppStore((s) => s.unlinkFocusMicroTask);
  const openFocusWithTask = useAppStore((s) => s.openFocusWithTask);
  const startOrResumeFocus = useAppStore((s) => s.startOrResumeFocus);
  const pauseFocus = useAppStore((s) => s.pauseFocus);
  const resetFocus = useAppStore((s) => s.resetFocus);
  const completeFocusBlock = useAppStore((s) => s.completeFocusBlock);
  const startRegenerativeBreak = useAppStore((s) => s.startRegenerativeBreak);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const [remainingSec, setRemainingSec] = useState<number>(() =>
    activeTimer
      ? computeRemainingSeconds(
          activeTimer.startedAt,
          activeTimer.durationSec,
          activeTimer.pausedRemainingSec
        )
      : 25 * 60
  );

  // Tick timer accurately from startedAt timestamp (survives background/reload)
  useEffect(() => {
    if (!activeTimer) return;
    const sync = () => {
      const rem = computeRemainingSeconds(
        activeTimer.startedAt,
        activeTimer.durationSec,
        activeTimer.pausedRemainingSec
      );
      setRemainingSec(rem);
      if (activeTimer.startedAt !== null && rem <= 0) {
        void completeFocusBlock(false);
      }
    };
    sync();
    if (activeTimer.startedAt === null) return;
    const id = window.setInterval(sync, 250);
    return () => window.clearInterval(id);
  }, [activeTimer, completeFocusBlock]);

  if (!activeTimer) return null;

  const isRunning = activeTimer.startedAt !== null;
  const isBreak = activeTimer.mode === 'break';
  const totalSec = Math.max(1, activeTimer.durationSec);
  const hasStarted = isRunning || remainingSec < totalSec;
  const elapsedSec = totalSec - remainingSec;
  const eligibleForXp =
    clockOverride.fastFocusSeconds !== null || elapsedSec >= totalSec * 0.5;

  const today = getTodayKey();
  const completedTodayCount = focusSessions.filter(
    (s) => s.completed && s.startedAt.slice(0, 10) === today
  ).length;

  const progress = 1 - remainingSec / totalSec;
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  const pendingTasks = microTasks.filter((m) => m.status === 'pending').slice(0, 4);

  // 04.3 Regenerative Break View
  if (isBreak) {
    return (
      <div className="space-y-5 px-4 py-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-[#131B2E]">Pausa</h1>
          <span className="rounded-full bg-[#E2F7F5] px-3 py-1 text-xs font-bold text-[#006A63]">
            Descanso activo
          </span>
        </div>

        <section className="rounded-3xl border border-[#006A63]/20 bg-white p-6 text-center space-y-4 shadow-xs">
          <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={radius} stroke="#E2F7F5" strokeWidth="10" fill="none" />
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke="#006A63"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-display text-4xl font-extrabold tracking-tight text-[#131B2E]">
                {formatMMSS(remainingSec)}
              </span>
              <span className="text-[11px] font-bold tracking-wider text-[#006A63] uppercase">
                Pausa regenerativa
              </span>
            </div>
          </div>

          <p className="text-xs text-[#434655]">
            Tu racha y XP están a salvo. Aprovecha para desconectarte de la pantalla.
          </p>

          <div className="space-y-2 text-left">
            <span className="block text-[10px] font-extrabold tracking-wide text-[#737686] uppercase">
              Sugerencias sin pantalla
            </span>
            {[
              'Estira hombros, cuello y espalda 20 seg',
              'Toma un vaso de agua y descansa la vista',
            ].map((tip) => (
              <div
                key={tip}
                className="flex items-center gap-2 rounded-2xl bg-[#E2F7F5]/60 px-3.5 py-2.5 text-xs font-semibold text-[#006A63]"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{tip}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => void openFocusWithTask(null, 25)}
              className="w-full rounded-2xl bg-[#006A63] py-3.5 text-sm font-bold text-white shadow-sm"
            >
              Iniciar siguiente bloque (25 min) →
            </button>
            <button
              type="button"
              onClick={() => {
                void resetFocus();
                setActiveTab('dashboard', true);
              }}
              className="w-full rounded-2xl border border-[#E5E7F3] bg-white py-2.5 text-xs font-bold text-[#434655]"
            >
              Terminar sesión por hoy
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#131B2E]">Focus</h1>
        <button
          type="button"
          onClick={() => void setFocusShield(!activeTimer.shieldEnabled)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
            activeTimer.shieldEnabled
              ? 'bg-[#E6F7EC] text-[#117E3B]'
              : 'bg-[#F2F3FF] text-[#737686]'
          }`}
        >
          {activeTimer.shieldEnabled ? (
            <Shield className="h-3.5 w-3.5" />
          ) : (
            <ShieldAlert className="h-3.5 w-3.5" />
          )}
          Escudo {activeTimer.shieldEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Duration selector (25m / 45m / 50m only — break triggers after completing a block) */}
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#EAEDFF] p-1">
        {[
          { mins: 25, label: '25m' },
          { mins: 45, label: '45m' },
          { mins: 50, label: '50m' },
        ].map((opt) => {
          const active = activeTimer.plannedMinutes === opt.mins;
          return (
            <button
              key={opt.mins}
              type="button"
              disabled={hasStarted}
              onClick={() => void setFocusDuration(opt.mins)}
              className={`rounded-xl py-2 text-xs font-bold transition disabled:opacity-60 ${
                active ? 'bg-white text-[#2563EB] shadow-2xs' : 'text-[#434655]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Optional / Dismissible Linked Micro-task Chip */}
      {activeTimer.microTaskTitle ? (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#2563EB]/20 bg-[#E5EEFF]/70 px-3.5 py-2.5">
          <div className="min-w-0">
            <span className="block text-[10px] font-bold tracking-wide text-[#004AC6] uppercase">
              Micro-meta vinculada (opcional)
            </span>
            <p className="truncate text-xs font-bold text-[#131B2E]">
              {activeTimer.microTaskTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void unlinkFocusMicroTask()}
            className="rounded-lg p-1 text-[#004AC6] hover:bg-white/70"
            aria-label="Desvincular micro-meta y usar modo libre"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : pendingTasks.length > 0 && !isRunning ? (
        <div className="rounded-2xl border border-[#E5E7F3] bg-white px-3.5 py-2.5 space-y-1.5">
          <p className="text-[11px] font-semibold text-[#737686]">
            Modo libre · O vincula una micro-meta:
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {pendingTasks.map((pt) => (
              <button
                key={pt.id}
                type="button"
                onClick={() =>
                  void openFocusWithTask(
                    pt.id,
                    pt.estimatedMinutes >= 45 ? 45 : 25
                  )
                }
                className="shrink-0 rounded-full bg-[#F2F3FF] px-3 py-1 text-[11px] font-semibold text-[#131B2E] hover:bg-[#E5EEFF]"
              >
                {pt.title.slice(0, 28)}
                {pt.title.length > 28 ? '…' : ''}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Circular Timer Card */}
      <section className="rounded-3xl border border-[#E5E7F3] bg-white p-5 text-center space-y-4 shadow-xs">
        <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={radius} stroke="#EAEDFF" strokeWidth="11" fill="none" />
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="#2563EB"
              strokeWidth="11"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-200"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-display text-4xl font-extrabold tracking-tight text-[#131B2E]">
              {formatMMSS(remainingSec)}
            </span>
            <span className="mt-0.5 text-[11px] font-bold tracking-wider text-[#2563EB] uppercase">
              {isRunning
                ? 'Enfoque activo'
                : hasStarted
                  ? 'En pausa'
                  : 'Listo para iniciar'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {isRunning ? (
            <button
              type="button"
              onClick={() => void pauseFocus()}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#F2F3FF] py-3 text-sm font-bold text-[#131B2E]"
            >
              <Pause className="h-4 w-4" />
              Pausar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                void requestNotificationPermission();
                void startOrResumeFocus(false);
              }}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#2563EB] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#004AC6]"
            >
              <Play className="h-4 w-4 fill-current" />
              {hasStarted ? 'Reanudar' : 'Iniciar'}
            </button>
          )}
          <button
            type="button"
            disabled={!hasStarted}
            onClick={() => void resetFocus()}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#E5E7F3] bg-white py-3 text-sm font-bold text-[#434655] disabled:opacity-45"
          >
            <RotateCcw className="h-4 w-4" />
            Reiniciar
          </button>
        </div>

        {/* Only show "Terminar bloque" once the timer has actually started */}
        {hasStarted ? (
          <button
            type="button"
            onClick={() => void completeFocusBlock(true)}
            className={`flex w-full items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-bold text-white ${
              eligibleForXp ? 'bg-[#131B2E]' : 'bg-[#434655]'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            {eligibleForXp ? 'Terminar bloque (+35 XP)' : 'Terminar antes (sin +35 XP)'}
          </button>
        ) : completedTodayCount > 0 ? (
          <button
            type="button"
            onClick={() => void startRegenerativeBreak()}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#E2F7F5] py-2.5 text-xs font-bold text-[#006A63]"
          >
            <Coffee className="h-3.5 w-3.5" />
            Tomar pausa regenerativa de 5 min
          </button>
        ) : null}
      </section>

      {/* Conscious Friction Shield info card */}
      <section className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-[#131B2E] flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-[#006A63]" />
            Escudo Anti-Distracciones (
            {config?.shieldRigidity === 'strict'
              ? 'Estricto'
              : config?.shieldRigidity === 'soft'
                ? 'Suave'
                : 'Equilibrado'}
            )
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTimer.shieldEnabled
                ? 'bg-[#E6F7EC] text-[#117E3B]'
                : 'bg-[#F2F3FF] text-[#737686]'
            }`}
          >
            {activeTimer.shieldEnabled ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <p className="text-[11px] text-[#434655]">
          Detecta cambios de pestaña dentro de la app o al volver de otras apps durante un bloque
          activo. En versión APK aplicará bloqueo nativo sobre redes sociales.
        </p>
      </section>

      {/* Offline Ambient Sound Selector */}
      <section className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-2.5">
        <span className="block text-xs font-extrabold text-[#131B2E]">
          Sonido ambiente (100% offline)
        </span>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'silence', label: 'Silencio', icon: VolumeX },
              { id: 'white_noise', label: 'Ruido Blanco', icon: Wind },
              { id: 'rain', label: 'Lluvia', icon: Droplets },
            ] as Array<{ id: AmbientSoundType; label: string; icon: typeof Volume2 }>
          ).map((s) => {
            const Icon = s.icon;
            const active = activeTimer.ambientSound === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => void setFocusSound(s.id)}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition ${
                  active
                    ? 'bg-[#E5EEFF] text-[#004AC6] border border-[#2563EB]/30'
                    : 'bg-[#F2F3FF] text-[#434655]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
