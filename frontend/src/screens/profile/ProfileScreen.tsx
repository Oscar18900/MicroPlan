import { useMemo } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  LogOut,
  Moon,
  Shield,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { computeLevelFromXp, evaluateBadgesProgress } from '../../services/gamification';
import type { EmergencyMinutes, ShieldRigidity } from '../../types/domain';

export function ProfileScreen() {
  const user = useAppStore((s) => s.user);
  const config = useAppStore((s) => s.config);
  const subjects = useAppStore((s) => s.subjects);
  const classBlocks = useAppStore((s) => s.classBlocks);
  const sleepLogs = useAppStore((s) => s.sleepLogs);
  const focusSessions = useAppStore((s) => s.focusSessions);
  const deliveries = useAppStore((s) => s.deliveries);
  const badgeUnlocks = useAppStore((s) => s.badgeUnlocks);
  const setProfileSubView = useAppStore((s) => s.setProfileSubView);
  const updateWellnessConfig = useAppStore((s) => s.updateWellnessConfig);
  const logout = useAppStore((s) => s.logout);

  const badgeProgress = useMemo(() => {
    if (!user) return [];
    return evaluateBadgesProgress({
      user,
      sleepLogs,
      focusSessions,
      deliveries,
      unlockedBadges: badgeUnlocks,
    });
  }, [user, sleepLogs, focusSessions, deliveries, badgeUnlocks]);

  if (!user || !config) return null;

  const levelInfo = computeLevelFromXp(user.xp);
  const unlockedCount = badgeProgress.filter((b) => b.unlocked).length;
  const weeklyClassHours = classBlocks.reduce((sum, b) => {
    const [sh, sm] = b.startTime.split(':').map(Number);
    const [eh, em] = b.endTime.split(':').map(Number);
    return sum + Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
  }, 0);

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="space-y-4 px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#131B2E]">Perfil</h1>
        <span className="rounded-full bg-[#E5EEFF] px-3 py-1 text-xs font-bold text-[#004AC6]">
          Nivel {levelInfo.level}
        </span>
      </div>

      {/* Identity Card */}
      <section className="flex items-center gap-3.5 rounded-3xl border border-[#E5E7F3] bg-white p-4 shadow-2xs">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2563EB] text-base font-extrabold text-white">
          {initials || 'MP'}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-extrabold text-[#131B2E]">{user.name}</h2>
          <p className="truncate text-xs text-[#434655]">
            {user.career || 'Estudiante Universitario'} · {user.semester}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-[#2563EB]">
            {user.xp} XP · Racha actual: {user.currentStreak}d
          </p>
        </div>
      </section>

      {/* Badges Summary */}
      <section className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-[#131B2E] flex items-center gap-1.5">
            <Award className="h-4 w-4 text-[#2563EB]" />
            Medallas ({unlockedCount}/6)
          </span>
          <button
            type="button"
            onClick={() => setProfileSubView('badges')}
            className="text-xs font-bold text-[#2563EB] hover:underline"
          >
            Ver todas →
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {badgeProgress.slice(0, 3).map((b) => (
            <span
              key={b.def.code}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                b.unlocked
                  ? 'bg-[#E6F7EC] text-[#117E3B]'
                  : 'bg-[#F2F3FF] text-[#737686]'
              }`}
            >
              {b.unlocked ? '✓ ' : ''}
              {b.def.title}
            </span>
          ))}
        </div>
      </section>

      {/* Weekly Schedule & Subjects Prominent Card (06.2) */}
      <section className="rounded-3xl border border-[#2563EB]/20 bg-white p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#E5EEFF] text-[#2563EB]">
              <Calendar className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-[#131B2E]">
                Horario Semanal y Materias
              </h2>
              <p className="text-[11px] text-[#434655]">
                {weeklyClassHours.toFixed(0)} hrs de clase/sem · {subjects.length} materias
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setProfileSubView('schedule')}
          className="w-full rounded-2xl bg-[#2563EB] py-3 text-xs font-bold text-white shadow-2xs hover:bg-[#004AC6]"
        >
          Abrir Horario Semanal →
        </button>
      </section>

      {/* Sleep Hygiene, Rigidity & Emergency Mode Settings */}
      <section className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-4">
        <h2 className="text-sm font-extrabold text-[#131B2E] flex items-center gap-1.5">
          <Moon className="h-4 w-4 text-[#006A63]" />
          Higiene de Sueño y Rigidez
        </h2>

        {/* Sleep Goal */}
        <div>
          <span className="mb-1.5 block text-[11px] font-bold text-[#434655]">
            Meta diaria de sueño
          </span>
          <div className="grid grid-cols-3 gap-2">
            {([7.0, 7.5, 8.0] as const).map((hrs) => (
              <button
                key={hrs}
                type="button"
                onClick={() => void updateWellnessConfig({ sleepGoalHours: hrs })}
                className={`rounded-xl py-2 text-xs font-bold transition ${
                  config.sleepGoalHours === hrs
                    ? 'bg-[#006A63] text-white'
                    : 'bg-[#F2F3FF] text-[#434655]'
                }`}
              >
                {hrs.toFixed(1)}h
              </button>
            ))}
          </div>
        </div>

        {/* Curfew & Bedtime */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="prof-curfew" className="mb-1 block text-[11px] font-bold text-[#434655]">
              Alerta nocturna
            </label>
            <input
              id="prof-curfew"
              type="time"
              value={config.curfewAlertTime}
              onChange={(e) => void updateWellnessConfig({ curfewAlertTime: e.target.value })}
              className="mp-input text-xs font-bold"
            />
          </div>
          <div>
            <label htmlFor="prof-bedtime" className="mb-1 block text-[11px] font-bold text-[#434655]">
              Límite dormir
            </label>
            <input
              id="prof-bedtime"
              type="time"
              value={config.bedtimeLimitTime}
              onChange={(e) => void updateWellnessConfig({ bedtimeLimitTime: e.target.value })}
              className="mp-input text-xs font-bold"
            />
          </div>
        </div>

        {/* Rigidity */}
        <div>
          <span className="mb-1.5 block text-[11px] font-bold text-[#434655] flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-[#2563EB]" />
            Rigidez del Escudo y Toque de Queda
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'soft', label: 'Suave' },
                { id: 'balanced', label: 'Equilibrado' },
                { id: 'strict', label: 'Estricto' },
              ] as Array<{ id: ShieldRigidity; label: string }>
            ).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => void updateWellnessConfig({ shieldRigidity: r.id })}
                className={`rounded-xl py-2 text-xs font-bold transition ${
                  config.shieldRigidity === r.id
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#F2F3FF] text-[#434655]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Configurable Emergency Mode */}
        <div className="border-t border-[#E5E7F3] pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#434655]">
              Modo Emergencia (Exámenes · máx. {config.emergencyWeeklyQuota}/sem)
            </span>
            <span className="text-[11px] font-extrabold text-[#B15106]">
              Usos: {config.emergencyUsedThisWeek}/{config.emergencyWeeklyQuota}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([30, 45, 60] as EmergencyMinutes[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => void updateWellnessConfig({ emergencyMinutes: m })}
                className={`rounded-xl py-2 text-xs font-bold transition ${
                  config.emergencyMinutes === m
                    ? 'bg-[#131B2E] text-white'
                    : 'bg-[#F2F3FF] text-[#434655]'
                }`}
              >
                +{m}m
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#737686]">
            Respeta siempre el piso mínimo absoluto de 6.0 horas de sueño antes de tu primera clase.
          </p>
        </div>
      </section>

      {/* Quick Guides Link (06.3) */}
      <button
        type="button"
        onClick={() => setProfileSubView('badges')}
        className="flex w-full items-center justify-between rounded-2xl border border-[#E5E7F3] bg-white px-4 py-3.5 text-xs font-bold text-[#131B2E]"
      >
        <span className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#006A63]" />
          Guías rápidas de Microplan (&lt; 30s)
        </span>
        <ChevronRight className="h-4 w-4 text-[#737686]" />
      </button>

      {/* Logout */}
      <button
        type="button"
        onClick={() => void logout()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#BA1A1A]/25 bg-white py-3 text-xs font-bold text-[#BA1A1A] hover:bg-[#FFDAD6]/30"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión local
      </button>
    </div>
  );
}
