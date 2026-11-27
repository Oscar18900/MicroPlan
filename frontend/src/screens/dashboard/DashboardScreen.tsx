import { ArrowRight, Check, Flame, Moon, Play, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { computeLevelFromXp } from '../../services/gamification';
import {
  addDaysYYYYMMDD,
  formatTime12h,
  getTodayKey,
  getWeekStartMonday,
} from '../../services/timeService';

const WEEK_INITIALS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function DashboardScreen() {
  const user = useAppStore((s) => s.user);
  const config = useAppStore((s) => s.config);
  const subjects = useAppStore((s) => s.subjects);
  const deliveries = useAppStore((s) => s.deliveries);
  const microTasks = useAppStore((s) => s.microTasks);
  const focusSessions = useAppStore((s) => s.focusSessions);
  const sleepLogs = useAppStore((s) => s.sleepLogs);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setPlanSubView = useAppStore((s) => s.setPlanSubView);
  const openFocusWithTask = useAppStore((s) => s.openFocusWithTask);

  if (!user || !config) return null;

  const today = getTodayKey();
  const levelInfo = computeLevelFromXp(user.xp);

  // Today's metrics calculated from real IndexedDB data
  const todayTasks = microTasks.filter((t) => t.scheduledDate === today);
  const pendingToday = todayTasks.filter((t) => t.status === 'pending');
  const todayPlannedMinutes = todayTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const todayFocusMinutes = focusSessions
    .filter((s) => s.completed && s.startedAt.slice(0, 10) === today)
    .reduce((sum, s) => sum + s.actualMinutes, 0);

  // Next single hero step
  const nextStep =
    pendingToday.sort((a, b) => a.scheduledSlot.localeCompare(b.scheduledSlot))[0] ??
    microTasks
      .filter((t) => t.status === 'pending' && t.scheduledDate > today)
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0] ??
    null;

  const nextDelivery = nextStep ? deliveries.find((d) => d.id === nextStep.deliveryId) : null;
  const nextSubject = nextDelivery ? subjects.find((s) => s.id === nextDelivery.subjectId) : null;

  // Weekly streak dots (Mon -> Sun)
  const weekStart = getWeekStartMonday(today);
  const weekDays = WEEK_INITIALS.map((label, idx) => {
    const dateKey = addDaysYYYYMMDD(weekStart, idx);
    const hasSleep = sleepLogs.some((l) => l.date === dateKey && l.respectedCurfew);
    const hasTask = microTasks.some(
      (t) => t.status === 'completed' && t.completedAt?.slice(0, 10) === dateKey
    );
    const done = hasSleep || hasTask;
    const isToday = dateKey === today;
    return { label, dateKey, done, isToday };
  });

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="space-y-4 px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#131B2E]">Inicio</h1>
          <p className="text-xs text-[#434655]">
            Hola, {user.name.split(' ')[0]} · Paso a paso sin saturarte
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E5EEFF] text-sm font-extrabold text-[#004AC6]"
          aria-label="Ir a perfil"
        >
          {initials || 'MP'}
        </button>
      </div>

      {/* Level & XP Card */}
      <section className="rounded-3xl border border-[#E5E7F3] bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E5EEFF] text-[#2563EB]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-[#131B2E]">
                Nivel {levelInfo.level} · {levelInfo.title}
              </p>
              <p className="text-[11px] text-[#737686]">
                Faltan {levelInfo.xpToNextLevel} XP para Nivel {levelInfo.level + 1}
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-[#2563EB]">
            {user.xp.toLocaleString('es-MX')} XP
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#EAEDFF]">
          <div
            className="h-full rounded-full bg-[#2563EB] transition-all duration-300"
            style={{ width: `${levelInfo.progressPercent}%` }}
          />
        </div>
      </section>

      {/* Streak + 3 KPIs Card */}
      <section className="rounded-3xl border border-[#E5E7F3] bg-white p-4 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E6F7EC] text-[#117E3B]">
              <Flame className="h-4 w-4" />
            </span>
            <div>
              <p className="text-lg font-extrabold leading-tight text-[#131B2E]">
                {user.currentStreak} {user.currentStreak === 1 ? 'día seguido' : 'días seguidos'}
              </p>
              <p className="text-[11px] text-[#737686]">Constancia saludable (no punitiva)</p>
            </div>
          </div>
          <span className="rounded-full bg-[#E6F7EC] px-2.5 py-1 text-[11px] font-bold text-[#117E3B]">
            Mejor: {user.bestStreak}d
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weekDays.map((d) => (
            <div key={d.dateKey} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-[#737686]">{d.label}</span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  d.done
                    ? 'bg-[#117E3B] text-white'
                    : d.isToday
                      ? 'border-2 border-[#2563EB] bg-[#E5EEFF] text-[#004AC6]'
                      : 'bg-[#F2F3FF] text-[#737686]'
                }`}
              >
                {d.done ? <Check className="h-3.5 w-3.5" /> : d.label}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-[#E5E7F3] pt-3 text-center">
          <div className="rounded-2xl bg-[#FAF8FF] p-2">
            <p className="text-[10px] font-medium text-[#737686]">Carga hoy</p>
            <p className="mt-0.5 text-sm font-extrabold text-[#131B2E]">
              {(todayPlannedMinutes / 60).toFixed(1)}h / {(config.dailyCapacityMinutes / 60).toFixed(1)}h
            </p>
          </div>
          <div className="rounded-2xl bg-[#FAF8FF] p-2">
            <p className="text-[10px] font-medium text-[#737686]">Enfoque hoy</p>
            <p className="mt-0.5 text-sm font-extrabold text-[#2563EB]">{todayFocusMinutes} min</p>
          </div>
          <div className="rounded-2xl bg-[#FAF8FF] p-2">
            <p className="text-[10px] font-medium text-[#737686]">Desconexión</p>
            <p className="mt-0.5 text-sm font-extrabold text-[#006A63]">
              {formatTime12h(config.curfewAlertTime)}
            </p>
          </div>
        </div>
      </section>

      {/* Single Hero "Siguiente Paso" Card (never duplicates full task list) */}
      <section className="rounded-3xl border border-[#2563EB]/20 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-[#E5EEFF] px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-[#004AC6] uppercase">
            Siguiente paso
          </span>
          {nextStep ? (
            <span className="text-xs font-semibold text-[#434655]">
              {nextStep.scheduledDate === today ? 'Hoy' : nextStep.scheduledDate} ·{' '}
              {nextStep.estimatedMinutes > 0
                ? `${nextStep.scheduledSlot ? `${formatTime12h(nextStep.scheduledSlot)} · ` : ''}${nextStep.estimatedMinutes} min`
                : 'Sin Pomodoro'}
            </span>
          ) : null}
        </div>

        {nextStep ? (
          <div className="mt-3 space-y-3">
            <div>
              <h2 className="text-base font-extrabold text-[#131B2E] leading-snug">
                {nextStep.title}
              </h2>
              {nextSubject ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#434655]">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: nextSubject.colorHex }}
                  />
                  {nextSubject.name} · {nextDelivery?.title}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() =>
                void openFocusWithTask(
                  nextStep.id,
                  nextStep.estimatedMinutes >= 45 ? 45 : 25
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#004AC6] transition"
            >
              <Play className="h-4 w-4 fill-current" />
              Iniciar en Focus ({nextStep.estimatedMinutes >= 45 ? 45 : 25} min)
            </button>
            <button
              type="button"
              onClick={() => {
                setPlanSubView('list');
                setActiveTab('plan');
              }}
              className="flex w-full items-center justify-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
            >
              Ver todas las entregas y micro-metas en Plan
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-3 text-center py-2">
            <p className="text-sm font-bold text-[#131B2E]">
              Sin micro-metas pendientes ahora
            </p>
            <p className="text-xs text-[#434655]">
              Agrega una nueva entrega en Plan (con IA o manual) o inicia un bloque de Focus libre.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPlanSubView('new_delivery');
                  setActiveTab('plan');
                }}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#2563EB] py-2.5 text-xs font-bold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Nueva Entrega
              </button>
              <button
                type="button"
                onClick={() => void openFocusWithTask(null, 25)}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#E5E7F3] bg-[#F2F3FF] py-2.5 text-xs font-bold text-[#131B2E]"
              >
                <Play className="h-3.5 w-3.5" />
                Focus libre
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Protected Leisure Compact Card */}
      <section className="flex items-center justify-between rounded-3xl border border-[#006A63]/20 bg-[#E2F7F5]/75 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#006A63] text-white">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-extrabold text-[#006A63]">
              Ocio Protegido hoy: {formatTime12h(config.leisureStart)} –{' '}
              {formatTime12h(config.leisureEnd)}
            </p>
            <p className="text-[11px] text-[#131B2E]/80 flex items-center gap-1">
              <Moon className="h-3 w-3" />
              Bloque libre de tareas para evitar desvelos
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('wellness')}
          className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#006A63] shadow-2xs"
        >
          Wellness →
        </button>
      </section>
    </div>
  );
}
