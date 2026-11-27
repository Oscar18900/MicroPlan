import { Moon, ShieldCheck, Sun } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import {
  addDaysYYYYMMDD,
  formatTime12h,
  getJsDayOfWeek1to7,
  getTodayKey,
  getWeekStartMonday,
  timeToMinutes,
} from '../../services/timeService';

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function WellnessScreen() {
  const config = useAppStore((s) => s.config);
  const sleepLogs = useAppStore((s) => s.sleepLogs);
  const classBlocks = useAppStore((s) => s.classBlocks);
  const focusSessions = useAppStore((s) => s.focusSessions);
  const recordSleepCheckin = useAppStore((s) => s.recordSleepCheckin);
  const setShowCurfewModal = useAppStore((s) => s.setShowCurfewModal);

  if (!config) return null;

  const today = getTodayKey();
  const weekStart = getWeekStartMonday(today);
  const todaySleep = sleepLogs.find((s) => s.date === today);

  const weekData = DAY_LABELS.map((label, idx) => {
    const dateKey = addDaysYYYYMMDD(weekStart, idx);
    const log = sleepLogs.find((s) => s.date === dateKey);
    return {
      label,
      dateKey,
      hours: log?.sleptHours ?? 0,
      isToday: dateKey === today,
    };
  });

  const loggedDays = weekData.filter((d) => d.hours > 0);
  const avgSleep =
    loggedDays.length > 0
      ? (loggedDays.reduce((s, d) => s + d.hours, 0) / loggedDays.length).toFixed(1)
      : config.sleepGoalHours.toFixed(1);

  // Today's macro energy balance (Classes, Study, Leisure, Sleep)
  const dow = getJsDayOfWeek1to7(today);
  const classHoursToday =
    classBlocks
      .filter((c) => c.dayOfWeek === dow)
      .reduce((sum, c) => sum + Math.max(0, timeToMinutes(c.endTime) - timeToMinutes(c.startTime)), 0) /
    60;
  const studyHoursToday =
    focusSessions
      .filter((s) => s.completed && s.startedAt.slice(0, 10) === today)
      .reduce((sum, s) => sum + s.actualMinutes, 0) / 60;
  const leisureHoursToday =
    Math.max(0, timeToMinutes(config.leisureEnd) - timeToMinutes(config.leisureStart)) / 60;
  const sleepHoursToday = todaySleep?.sleptHours ?? config.sleepGoalHours;
  const totalBalance = Math.max(1, classHoursToday + studyHoursToday + leisureHoursToday + sleepHoursToday);

  return (
    <div className="space-y-4 px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#131B2E]">Wellness</h1>
          <p className="text-xs text-[#434655]">Descanso protegido y equilibrio diario</p>
        </div>
        <span className="rounded-full bg-[#E2F7F5] px-3 py-1 text-xs font-bold text-[#006A63]">
          Sueño {config.sleepGoalHours}h+ Activo
        </span>
      </div>

      {/* Weekly Sleep Chart */}
      <section className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-[#131B2E]">Higiene de Sueño Semanal</h2>
            <p className="text-xs text-[#434655]">
              Promedio: <strong>{avgSleep}h</strong> ({loggedDays.length} día(s) registrados)
            </p>
          </div>
          <span className="rounded-full bg-[#E6F7EC] px-2.5 py-0.5 text-[11px] font-bold text-[#117E3B]">
            Meta {config.sleepGoalHours}h
          </span>
        </div>

        <div className="relative pt-4">
          {/* Dashed Goal Line */}
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[#006A63]/50"
            style={{ top: `${Math.max(12, 110 - (config.sleepGoalHours / 9) * 90)}px` }}
          />
          <div className="grid grid-cols-7 gap-2 items-end h-28">
            {weekData.map((d) => {
              const heightPx = d.hours > 0 ? Math.min(96, Math.round((d.hours / 9) * 90)) : 8;
              const metGoal = d.hours >= config.sleepGoalHours;
              return (
                <div key={d.dateKey} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#434655]">
                    {d.hours > 0 ? `${d.hours}h` : '—'}
                  </span>
                  <div
                    className={`w-full max-w-[26px] rounded-t-xl transition-all ${
                      d.hours === 0
                        ? 'bg-[#EAEDFF]'
                        : metGoal
                          ? 'bg-[#006A63]'
                          : 'bg-[#B15106]'
                    }`}
                    style={{ height: `${heightPx}px` }}
                  />
                  <span
                    className={`text-[11px] font-bold ${
                      d.isToday ? 'text-[#2563EB]' : 'text-[#737686]'
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-[11px] text-[#737686]">
          Meta diaria: {config.sleepGoalHours} hrs · Hora de desconexión:{' '}
          {formatTime12h(config.curfewAlertTime)}
        </p>
      </section>

      {/* Shielded Daytime Leisure Card */}
      <section className="rounded-3xl border border-[#006A63]/20 bg-[#E2F7F5]/65 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#006A63] text-white">
              <Sun className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-[#131B2E]">Ocio Diurno Blindado</h2>
              <p className="text-xs font-semibold text-[#006A63]">
                Hoy · {formatTime12h(config.leisureStart)} – {formatTime12h(config.leisureEnd)}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#006A63]">
            Inmune
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {config.leisureTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#131B2E]"
            >
              {tag}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowCurfewModal(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#131B2E] py-2.5 text-xs font-bold text-white"
        >
          <Moon className="h-3.5 w-3.5" />
          Probar Alerta Nocturna ({formatTime12h(config.curfewAlertTime)}) →
        </button>
      </section>

      {/* Today's Macro Energy Balance */}
      <section className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-3">
        <div>
          <h2 className="text-sm font-extrabold text-[#131B2E]">Balance de Energía de Hoy</h2>
          <p className="text-[11px] text-[#737686]">Distribución real de tu día sin sobrecarga</p>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#EAEDFF]">
          <div
            className="bg-[#2563EB]"
            style={{ width: `${(classHoursToday / totalBalance) * 100}%` }}
            title="Clases"
          />
          <div
            className="bg-[#7C3AED]"
            style={{ width: `${(studyHoursToday / totalBalance) * 100}%` }}
            title="Estudio"
          />
          <div
            className="bg-[#006A63]"
            style={{ width: `${(leisureHoursToday / totalBalance) * 100}%` }}
            title="Ocio"
          />
          <div
            className="bg-[#131B2E]"
            style={{ width: `${(sleepHoursToday / totalBalance) * 100}%` }}
            title="Sueño"
          />
        </div>
        <div className="grid grid-cols-4 gap-1 text-[11px] font-semibold text-[#434655]">
          <span className="flex items-center gap-1">
            <i className="h-2 w-2 rounded-full bg-[#2563EB]" /> Clases {classHoursToday.toFixed(1)}h
          </span>
          <span className="flex items-center gap-1">
            <i className="h-2 w-2 rounded-full bg-[#7C3AED]" /> Focus {studyHoursToday.toFixed(1)}h
          </span>
          <span className="flex items-center gap-1">
            <i className="h-2 w-2 rounded-full bg-[#006A63]" /> Ocio {leisureHoursToday.toFixed(1)}h
          </span>
          <span className="flex items-center gap-1">
            <i className="h-2 w-2 rounded-full bg-[#131B2E]" /> Sueño {sleepHoursToday.toFixed(1)}h
          </span>
        </div>
      </section>

      {/* Morning Sleep Check-in */}
      <section className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold text-[#131B2E]">¿Cuánto dormiste anoche?</h2>
          <span className="text-[11px] font-bold text-[#117E3B]">+20 XP (&gt;= 7h)</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[6, 7, 7.5, 8].map((hrs) => {
            const active = todaySleep?.sleptHours === hrs;
            return (
              <button
                key={hrs}
                type="button"
                onClick={() => void recordSleepCheckin(hrs)}
                className={`rounded-xl py-2.5 text-xs font-bold transition ${
                  active
                    ? 'bg-[#006A63] text-white'
                    : 'bg-[#F2F3FF] text-[#434655] hover:bg-[#EAEDFF]'
                }`}
              >
                {active ? `✓ ${hrs}h` : `${hrs}h`}
              </button>
            );
          })}
        </div>
        <p className="flex items-center gap-1.5 text-[11px] text-[#737686]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#006A63]" />
          Registrar al menos 7h diarias consolida tu racha saludable.
        </p>
      </section>
    </div>
  );
}
