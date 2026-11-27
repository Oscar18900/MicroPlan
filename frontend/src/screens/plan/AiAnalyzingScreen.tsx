import { useEffect, useState } from 'react';
import { Check, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function AiAnalyzingScreen() {
  const pendingAiDraft = useAppStore((s) => s.pendingAiDraft);
  const setPlanSubView = useAppStore((s) => s.setPlanSubView);
  const [stage, setStage] = useState(1);
  const [minDelayDone, setMinDelayDone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(2), 420);
    const t2 = setTimeout(() => setStage(3), 860);
    const t3 = setTimeout(() => setMinDelayDone(true), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  useEffect(() => {
    if (minDelayDone && pendingAiDraft) {
      setPlanSubView('review_ai');
    }
  }, [minDelayDone, pendingAiDraft, setPlanSubView]);

  return (
    <div className="space-y-5 px-4 py-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPlanSubView('new_delivery')}
          className="text-xs font-bold text-[#737686]"
        >
          Cancelar
        </button>
        <span className="text-xs font-extrabold text-[#131B2E]">Microplanificando...</span>
        <span className="rounded-full bg-[#E5EEFF] px-2 py-0.5 text-[11px] font-bold text-[#2563EB]">
          IA
        </span>
      </div>

      <section className="rounded-3xl border border-[#E5E7F3] bg-white p-6 text-center space-y-5 shadow-xs">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#E5EEFF] text-[#2563EB]">
          <Sparkles className="h-8 w-8 animate-pulse" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-[#131B2E]">Analizando tus indicaciones</h1>
          <p className="mt-1 text-xs text-[#434655]">
            {pendingAiDraft?.attachmentMeta
              ? `Leyendo ${pendingAiDraft.attachmentMeta.fileName} para estimar bloques reales...`
              : 'Calculando micro-metas realistas sin saturar tu agenda.'}
          </p>
        </div>

        <div className="space-y-2.5 text-left">
          {[
            { id: 1, label: 'Extrayendo entregables de la rúbrica' },
            { id: 2, label: 'Dividiendo en micro-bloques de 25–50 min' },
            { id: 3, label: 'Acomodando en huecos libres (respetando ocio y 10:30 PM)' },
          ].map((item) => {
            const done = stage > item.id;
            const active = stage === item.id;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-xs font-semibold ${
                  done
                    ? 'bg-[#E6F7EC] text-[#117E3B]'
                    : active
                      ? 'bg-[#E5EEFF] text-[#004AC6]'
                      : 'bg-[#F2F3FF] text-[#737686]'
                }`}
              >
                {done ? (
                  <Check className="h-4 w-4 shrink-0" />
                ) : active ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded-full border border-current opacity-40" />
                )}
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-[#E2F7F5] px-3 py-2.5 text-left text-[11px] font-medium text-[#006A63]">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Recuerda: la IA organiza los tiempos; el aprendizaje sigue siendo tuyo.</span>
        </div>

        <button
          type="button"
          disabled={!pendingAiDraft}
          onClick={() => setPlanSubView('review_ai')}
          className="w-full rounded-2xl bg-[#2563EB] py-3 text-xs font-bold text-white disabled:opacity-50"
        >
          {pendingAiDraft ? 'Ver propuesta generada →' : 'Esperando respuesta del agente...'}
        </button>
      </section>
    </div>
  );
}
