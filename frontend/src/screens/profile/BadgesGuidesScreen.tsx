import { useMemo } from 'react';
import { ArrowLeft, Award, Flame, Moon, Shield, Sparkles, Sun } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { evaluateBadgesProgress } from '../../services/gamification';

const ICON_MAP: Record<string, typeof Award> = {
  flame: Flame,
  moon: Moon,
  shield: Shield,
  sparkles: Sparkles,
  award: Award,
  sun: Sun,
};

const QUICK_GUIDES = [
  {
    q: '¿Cómo funciona la Microplanificación IA?',
    a: 'Divides entregas grandes en bloques de 25 o 50 minutos según tus horas libres reales, sin resolver nunca la tarea por ti.',
  },
  {
    q: 'Focus libre vs. Focus vinculado',
    a: 'Puedes iniciar el temporizador solo o desde una micro-meta en Plan (▶). Si quieres quitarte la etiqueta, pulsa × en el chip.',
  },
  {
    q: '¿Por qué protegemos tu ocio de día?',
    a: 'Reservar tiempo libre diurno sin culpa reduce la procrastinación vengativa de la hora de dormir en la madrugada.',
  },
  {
    q: 'Modo Emergencia sin culpa',
    a: 'Para exámenes críticos puedes extender tu bloque (+30/+45/+60m, máx. 2/semana), pero siempre protegemos el piso mínimo de 6h de sueño.',
  },
];

export function BadgesGuidesScreen() {
  const user = useAppStore((s) => s.user);
  const sleepLogs = useAppStore((s) => s.sleepLogs);
  const focusSessions = useAppStore((s) => s.focusSessions);
  const deliveries = useAppStore((s) => s.deliveries);
  const badgeUnlocks = useAppStore((s) => s.badgeUnlocks);
  const setProfileSubView = useAppStore((s) => s.setProfileSubView);

  const badges = useMemo(() => {
    if (!user) return [];
    return evaluateBadgesProgress({
      user,
      sleepLogs,
      focusSessions,
      deliveries,
      unlockedBadges: badgeUnlocks,
    });
  }, [user, sleepLogs, focusSessions, deliveries, badgeUnlocks]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-4 px-4 py-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setProfileSubView('main')}
          className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold text-[#434655]"
        >
          <ArrowLeft className="h-4 w-4" />
          Perfil
        </button>
        <h1 className="text-base font-extrabold text-[#131B2E]">Medallas y Guías</h1>
        <span className="rounded-full bg-[#E6F7EC] px-2.5 py-0.5 text-[11px] font-bold text-[#117E3B]">
          {unlockedCount}/6
        </span>
      </div>

      {/* 2x3 Badges Grid */}
      <section className="space-y-2.5">
        <span className="block px-1 text-[11px] font-extrabold tracking-wide text-[#737686] uppercase">
          Logros desbloqueables
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          {badges.map((b) => {
            const Icon = ICON_MAP[b.def.icon] ?? Award;
            return (
              <div
                key={b.def.code}
                className={`rounded-2xl border p-3.5 space-y-2 ${
                  b.unlocked
                    ? 'border-[#117E3B]/25 bg-white shadow-2xs'
                    : 'border-[#E5E7F3] bg-[#F2F3FF]/70 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      b.unlocked
                        ? 'bg-[#E6F7EC] text-[#117E3B]'
                        : 'bg-white text-[#737686]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[11px] font-extrabold text-[#434655]">
                    {b.current}/{b.def.target}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#131B2E]">{b.def.title}</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-[#434655]">
                    {b.def.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Guides < 30s */}
      <section className="space-y-2">
        <span className="block px-1 text-[11px] font-extrabold tracking-wide text-[#737686] uppercase">
          Guías rápidas (&lt; 30 seg)
        </span>
        {QUICK_GUIDES.map((g) => (
          <details
            key={g.q}
            className="rounded-2xl border border-[#E5E7F3] bg-white px-4 py-3 text-xs"
          >
            <summary className="cursor-pointer font-extrabold text-[#131B2E] list-none flex items-center justify-between">
              <span>{g.q}</span>
              <span className="text-[#2563EB]">+</span>
            </summary>
            <p className="mt-2 leading-relaxed text-[#434655]">{g.a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
