import { Clock, ShieldAlert, Sun } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatTime12h } from '../../services/timeService';
import { ModalDialog } from '../../components/ModalDialog';

export function LeisureConflictModal() {
  const leisureConflict = useAppStore((s) => s.leisureConflict);
  const setLeisureConflict = useAppStore((s) => s.setLeisureConflict);
  const startOrResumeFocus = useAppStore((s) => s.startOrResumeFocus);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  if (!leisureConflict) {
    return (
      <ModalDialog
        open={false}
        onClose={() => setLeisureConflict(null)}
        labelledBy="leisure-conflict-title"
      >
        <div />
      </ModalDialog>
    );
  }

  const isStrict = leisureConflict.rigidity === 'strict';
  const canFitAdjusted =
    leisureConflict.type === 'overlaps_leisure' && leisureConflict.minutesUntilLeisure >= 10;

  return (
    <ModalDialog
      open={Boolean(leisureConflict)}
      onClose={() => setLeisureConflict(null)}
      labelledBy="leisure-conflict-title"
      closedBy="any"
    >
      <div className="rounded-3xl border border-[#006A63]/25 bg-white p-6 shadow-xl space-y-4 text-[#131B2E]">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E2F7F5] text-[#006A63]">
            <Sun className="h-6 w-6" />
          </span>
          <div>
            <span className="inline-block rounded-full bg-[#E2F7F5] px-2.5 py-0.5 text-[10px] font-bold text-[#006A63]">
              Ocio Diurno Protegido
            </span>
            <h1 id="leisure-conflict-title" className="mt-1 text-lg font-extrabold leading-snug">
              {leisureConflict.type === 'during_leisure'
                ? 'Estás en tu bloque de descanso'
                : 'Este bloque invadiría tu ocio'}
            </h1>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-[#434655]">
          {leisureConflict.type === 'during_leisure' ? (
            <>
              Tu tiempo libre protegido es de{' '}
              <strong>
                {formatTime12h(leisureConflict.leisureStart)} a{' '}
                {formatTime12h(leisureConflict.leisureEnd)}
              </strong>
              . Descansar de día con culpa cero evita desvelos nocturnos.
            </>
          ) : (
            <>
              Tu Ocio Protegido inicia a las{' '}
              <strong>{formatTime12h(leisureConflict.leisureStart)}</strong> (en{' '}
              <strong>{leisureConflict.minutesUntilLeisure} min</strong>). Un bloque completo se
              empalmaría con tu descanso.
            </>
          )}
        </p>

        {isStrict ? (
          <div className="flex items-start gap-2 rounded-2xl bg-[#FFFBEB] p-3 text-xs font-medium text-[#B15106]">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Tu rigidez está en <strong>Estricto</strong>: protege este bloque sin excepciones.
              Puedes ajustarla en Perfil si es una emergencia real.
            </span>
          </div>
        ) : null}

        <div className="space-y-2 pt-1">
          <button
            type="button"
            autoFocus
            onClick={() => setLeisureConflict(null)}
            className="w-full rounded-2xl bg-[#006A63] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#00554F]"
          >
            Respetar mi ocio (Cancelar)
          </button>

          {canFitAdjusted ? (
            <button
              type="button"
              onClick={() =>
                void startOrResumeFocus(true, leisureConflict.minutesUntilLeisure)
              }
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#E5EEFF] py-3 text-xs font-bold text-[#004AC6]"
            >
              <Clock className="h-4 w-4" />
              Ajustar bloque a {leisureConflict.minutesUntilLeisure} min (antes del ocio)
            </button>
          ) : null}

          {!isStrict ? (
            <button
              type="button"
              onClick={() => void startOrResumeFocus(true)}
              className="w-full rounded-2xl border border-[#E5E7F3] bg-white py-2.5 text-xs font-bold text-[#434655] hover:bg-[#F2F3FF]"
            >
              Estudiar de todas formas (solo hoy)
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setLeisureConflict(null);
                setActiveTab('profile', true);
              }}
              className="w-full rounded-2xl border border-[#E5E7F3] bg-white py-2.5 text-xs font-bold text-[#2563EB]"
            >
              Ir a Perfil para ajustar rigidez
            </button>
          )}
        </div>
      </div>
    </ModalDialog>
  );
}
