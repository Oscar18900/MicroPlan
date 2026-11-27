import { useMemo } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { computeRebalancePlan } from '../../services/localAiPlanner';
import { getSpanishDayLabel } from '../../services/timeService';

export function RebalanceScreen() {
  const config = useAppStore((s) => s.config);
  const subjects = useAppStore((s) => s.subjects);
  const classBlocks = useAppStore((s) => s.classBlocks);
  const deliveries = useAppStore((s) => s.deliveries);
  const microTasks = useAppStore((s) => s.microTasks);
  const setPlanSubView = useAppStore((s) => s.setPlanSubView);
  const applyRebalanceMoves = useAppStore((s) => s.applyRebalanceMoves);

  const plan = useMemo(() => {
    if (!config) return null;
    return computeRebalancePlan({
      microTasks,
      deliveries,
      subjects,
      config,
      classBlocks,
    });
  }, [microTasks, deliveries, subjects, config, classBlocks]);

  if (!plan || !config) return null;

  return (
    <div className="space-y-4 px-4 py-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPlanSubView('list')}
          className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold text-[#434655]"
        >
          <ArrowLeft className="h-4 w-4" />
          Plan
        </button>
        <h1 className="text-base font-extrabold text-[#131B2E]">Rebalanceo IA</h1>
        <span className="rounded-full bg-[#FFFBEB] px-2.5 py-0.5 text-[11px] font-bold text-[#B15106]">
          Sobrecarga
        </span>
      </div>

      {/* Warning banner */}
      <section className="rounded-3xl border border-[#B15106]/25 bg-[#FFFBEB] p-4 space-y-1.5">
        <div className="flex items-center gap-2 text-sm font-extrabold text-[#B15106]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {plan.overloadedDays.length > 0
            ? 'Detectamos sobrecarga en tu agenda'
            : 'Tu agenda ya está equilibrada'}
        </div>
        <p className="text-xs text-[#434655]">
          {plan.canRebalance
            ? `Podemos redistribuir ${plan.moves.length} bloque(s) a días más ligeros para respetar tu límite de ${(config.dailyCapacityMinutes / 60).toFixed(1)}h/día y proteger tu descanso.`
            : 'No encontramos movimientos automáticos dentro de tus fechas límite actuales.'}
        </p>
      </section>

      {/* Before vs After comparison */}
      {plan.affectedDays.length > 0 ? (
        <section className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-3">
          <span className="block text-[11px] font-extrabold tracking-wide text-[#737686] uppercase">
            Comparativa Antes vs. Después
          </span>
          {plan.affectedDays.map((day) => (
            <div key={day.date} className="rounded-2xl bg-[#F2F3FF] p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#131B2E]">
                <span>{day.label}</span>
                <span>
                  <span className="text-[#BA1A1A] line-through mr-1.5">
                    {(day.beforeMinutes / 60).toFixed(1)}h
                  </span>
                  <span className="text-[#117E3B]">
                    → {(day.afterMinutes / 60).toFixed(1)}h
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#117E3B]"
                  style={{
                    width: `${Math.min(100, Math.round((day.afterMinutes / config.dailyCapacityMinutes) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {/* Moves list */}
      {plan.moves.length > 0 ? (
        <section className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-2.5">
          <span className="block text-[11px] font-extrabold tracking-wide text-[#737686] uppercase">
            Bloques que se moverán
          </span>
          {plan.moves.map((m) => (
            <div key={m.microTaskId} className="rounded-2xl bg-[#FAF8FF] border border-[#E5E7F3] p-3">
              <p className="text-xs font-bold text-[#131B2E]">{m.title}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#2563EB]">
                <span>{getSpanishDayLabel(m.fromDate)}</span>
                <ArrowRight className="h-3 w-3" />
                <span>
                  {getSpanishDayLabel(m.toDate)} ({m.toSlot}) · {m.estimatedMinutes} min
                </span>
              </p>
            </div>
          ))}
        </section>
      ) : null}

      <div className="space-y-2">
        {plan.canRebalance ? (
          <button
            type="button"
            onClick={() => void applyRebalanceMoves(plan.moves)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#004AC6]"
          >
            <Check className="h-4 w-4" />
            Aplicar rebalanceo
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setPlanSubView('list')}
          className="w-full rounded-2xl border border-[#E5E7F3] bg-white py-3 text-xs font-bold text-[#434655]"
        >
          Mantener como está
        </button>
      </div>
    </div>
  );
}
