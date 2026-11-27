import { Clock, Database, FastForward, FlaskConical, Moon, RotateCcw, WifiOff, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getCurrentHHmm, getTodayKey } from '../services/timeService';
import { ModalDialog } from './ModalDialog';

export function DevToolsPanel() {
  const showDevTools = useAppStore((s) => s.showDevTools);
  const setShowDevTools = useAppStore((s) => s.setShowDevTools);
  const clockOverride = useAppStore((s) => s.clockOverride);
  const updateClockSim = useAppStore((s) => s.updateClockSim);
  const loadDemoDataset = useAppStore((s) => s.loadDemoDataset);
  const resetAllLocalData = useAppStore((s) => s.resetAllLocalData);
  const setShowCurfewModal = useAppStore((s) => s.setShowCurfewModal);
  const pendingSyncCount = useAppStore((s) => s.pendingSyncCount);
  const simulateSyncFlush = useAppStore((s) => s.simulateSyncFlush);

  return (
    <ModalDialog
      open={showDevTools}
      onClose={() => setShowDevTools(false)}
      labelledBy="devtools-title"
      closedBy="any"
    >
      <div className="rounded-3xl bg-white p-5 shadow-xl border border-[#E5E7F3] text-[#131B2E]">
        <div className="flex items-center justify-between border-b border-[#E5E7F3] pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E5EEFF] text-[#2563EB]">
              <FlaskConical className="h-4 w-4" />
            </span>
            <div>
              <h1 id="devtools-title" className="text-sm font-bold">
                Modo Pruebas (PWA Lab)
              </h1>
              <p className="text-[11px] text-[#737686]">
                Fecha virtual: {getTodayKey()} · {getCurrentHHmm()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDevTools(false)}
            className="rounded-xl p-1.5 text-[#737686] hover:bg-[#F2F3FF]"
            aria-label="Cerrar panel de pruebas"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 rounded-2xl bg-[#E5EEFF]/70 px-3 py-2 text-[11px] font-medium text-[#004AC6]">
          En producción (Fase 3+), este panel solo será visible para cuentas con rol{' '}
          <strong>admin</strong>.
        </p>

        <div className="mt-4 space-y-4 text-xs">
          {/* Time simulator */}
          <section className="space-y-2">
            <p className="font-semibold text-[#434655] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#2563EB]" />
              Simulador de Reloj y Días
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  void updateClockSim({ timeHHmm: '22:30' });
                  setShowDevTools(false);
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E7F3] bg-[#131B2E] px-3 py-2 font-medium text-white"
              >
                <Moon className="h-3.5 w-3.5" />
                Simular 10:30 PM
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDevTools(false);
                  setShowCurfewModal(true);
                }}
                className="rounded-xl border border-[#E5E7F3] bg-[#F2F3FF] px-3 py-2 font-medium text-[#131B2E]"
              >
                Abrir Alerta 05.2
              </button>
              <button
                type="button"
                onClick={() => void updateClockSim({ timeHHmm: '17:15' })}
                className="rounded-xl border border-[#E5E7F3] bg-[#E2F7F5] px-3 py-2 font-medium text-[#006A63]"
              >
                Simular Ocio 5:15 PM
              </button>
              <button
                type="button"
                onClick={() => void updateClockSim({ dayOffset: clockOverride.dayOffset + 1 })}
                className="rounded-xl border border-[#E5E7F3] bg-[#F2F3FF] px-3 py-2 font-medium text-[#131B2E]"
              >
                Avanzar +1 día ({clockOverride.dayOffset > 0 ? `+${clockOverride.dayOffset}` : 'hoy'})
              </button>
            </div>
            <button
              type="button"
              onClick={() => void updateClockSim({ dayOffset: 0, timeHHmm: null })}
              className="w-full rounded-xl border border-[#E5E7F3] py-1.5 text-[11px] text-[#434655] hover:bg-[#FAF8FF]"
            >
              Restaurar hora y fecha real
            </button>
          </section>

          {/* Fast Focus & Offline */}
          <section className="space-y-2">
            <p className="font-semibold text-[#434655] flex items-center gap-1.5">
              <FastForward className="h-3.5 w-3.5 text-[#006A63]" />
              Pruebas rápidas de Focus y Red
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  void updateClockSim({
                    fastFocusSeconds: clockOverride.fastFocusSeconds ? null : 10,
                  })
                }
                className={`rounded-xl border px-3 py-2 font-medium ${
                  clockOverride.fastFocusSeconds
                    ? 'border-[#2563EB] bg-[#E5EEFF] text-[#004AC6]'
                    : 'border-[#E5E7F3] bg-white text-[#434655]'
                }`}
              >
                Focus rápido (10s): {clockOverride.fastFocusSeconds ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={() =>
                  void updateClockSim({ simulateOffline: !clockOverride.simulateOffline })
                }
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 font-medium ${
                  clockOverride.simulateOffline
                    ? 'border-[#B15106] bg-[#FFFBEB] text-[#B15106]'
                    : 'border-[#E5E7F3] bg-white text-[#434655]'
                }`}
              >
                <WifiOff className="h-3.5 w-3.5" />
                Offline sim: {clockOverride.simulateOffline ? 'ON' : 'OFF'}
              </button>
            </div>
          </section>

          {/* Database tools */}
          <section className="space-y-2 border-t border-[#E5E7F3] pt-3">
            <p className="font-semibold text-[#434655] flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-[#737686]" />
              Datos IndexedDB y Cola ({pendingSyncCount} pendientes)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void loadDemoDataset()}
                className="rounded-xl bg-[#2563EB] px-3 py-2 font-semibold text-white"
              >
                Cargar datos demo BUAP
              </button>
              <button
                type="button"
                onClick={() => void simulateSyncFlush()}
                className="rounded-xl border border-[#E5E7F3] bg-[#F2F3FF] px-3 py-2 font-medium text-[#131B2E]"
              >
                Limpiar cola sync
              </button>
            </div>
            <button
              type="button"
              onClick={() => void resetAllLocalData()}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#BA1A1A]/30 bg-[#FFDAD6]/50 px-3 py-2 font-semibold text-[#BA1A1A]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar toda la base local
            </button>
          </section>
        </div>
      </div>
    </ModalDialog>
  );
}
