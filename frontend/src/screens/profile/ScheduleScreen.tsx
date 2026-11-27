import { useMemo, useState } from 'react';
import { ArrowLeft, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { AddClassModal } from '../../components/AddClassModal';
import { DAY_NAMES_FULL, formatTime12h, timeToMinutes } from '../../services/timeService';
import type { ClassBlock } from '../../types/domain';

const DAYS: Array<{ dow: 1 | 2 | 3 | 4 | 5; short: string }> = [
  { dow: 1, short: 'LUN' },
  { dow: 2, short: 'MAR' },
  { dow: 3, short: 'MIÉ' },
  { dow: 4, short: 'JUE' },
  { dow: 5, short: 'VIE' },
];

const GRID_START_HOUR = 7;
const GRID_END_HOUR = 21;
const HOUR_HEIGHT_PX = 36;
const TOTAL_GRID_HEIGHT = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT_PX;

interface ScheduleScreenProps {
  backLabel?: string;
  onBack?: () => void;
}

export function ScheduleScreen({
  backLabel = 'Perfil',
  onBack,
}: ScheduleScreenProps) {
  const subjects = useAppStore((s) => s.subjects);
  const classBlocks = useAppStore((s) => s.classBlocks);
  const config = useAppStore((s) => s.config);
  const setProfileSubView = useAppStore((s) => s.setProfileSubView);
  const deleteClassBlock = useAppStore((s) => s.deleteClassBlock);

  const [selectedBlock, setSelectedBlock] = useState<ClassBlock | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setProfileSubView('main');
    }
  };

  const weeklyHours = useMemo(
    () =>
      classBlocks.reduce(
        (sum, b) => sum + Math.max(0, timeToMinutes(b.endTime) - timeToMinutes(b.startTime)) / 60,
        0
      ),
    [classBlocks]
  );

  // Leisure band vertical metrics on grid
  const leisureTopPx = config
    ? Math.max(0, ((timeToMinutes(config.leisureStart) - GRID_START_HOUR * 60) / 60) * HOUR_HEIGHT_PX)
    : 0;
  const leisureHeightPx = config
    ? Math.max(
        18,
        ((timeToMinutes(config.leisureEnd) - timeToMinutes(config.leisureStart)) / 60) *
          HOUR_HEIGHT_PX
      )
    : 0;

  return (
    <div className="space-y-4 px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold text-[#434655] hover:bg-[#EAEDFF]"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </button>
        <h1 className="text-base font-extrabold text-[#131B2E]">Horario Semanal</h1>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1 rounded-full bg-[#2563EB] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#004AC6]"
        >
          <Plus className="h-3.5 w-3.5" />
          Clase
        </button>
      </div>

      {/* Proportional Hourly Timetable (07:00 - 21:00) */}
      <section className="rounded-3xl border border-[#E5E7F3] bg-white p-3 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-[#434655]">
            {weeklyHours.toFixed(1)} hrs de clase/semana · Sin empalmes
          </span>
          <span className="text-[10px] font-semibold text-[#737686]">Toca un bloque para quitar</span>
        </div>

        {/* Day header row */}
        <div className="grid grid-cols-[36px_repeat(5,1fr)] gap-1">
          <div />
          {DAYS.map((d) => (
            <div
              key={d.dow}
              className="rounded-lg bg-[#F2F3FF] py-1 text-center text-[10px] font-extrabold text-[#434655]"
            >
              {d.short}
            </div>
          ))}
        </div>

        {/* Hourly grid body */}
        <div
          className="relative grid grid-cols-[36px_repeat(5,1fr)] gap-1 overflow-hidden"
          style={{ height: `${TOTAL_GRID_HEIGHT}px` }}
        >
          {/* Left time axis */}
          <div className="relative">
            {Array.from(
              { length: GRID_END_HOUR - GRID_START_HOUR + 1 },
              (_, i) => GRID_START_HOUR + i
            ).map((hr) => (
              <div
                key={hr}
                className={`absolute right-1 text-[9px] font-semibold text-[#737686] ${
                  hr === GRID_START_HOUR ? 'translate-y-0.5' : '-translate-y-1/2'
                }`}
                style={{ top: `${(hr - GRID_START_HOUR) * HOUR_HEIGHT_PX}px` }}
              >
                {hr < GRID_END_HOUR ? `${String(hr).padStart(2, '0')}:00` : ''}
              </div>
            ))}
          </div>

          {/* 5 Day Columns */}
          {DAYS.map((d) => {
            const dayBlocks = classBlocks.filter((b) => b.dayOfWeek === d.dow);
            const hasLeisure = config?.leisureDays.includes(d.dow);

            return (
              <div
                key={d.dow}
                className="relative rounded-xl bg-[#FAF8FF] border border-[#E5E7F3]/70"
              >
                {/* Hourly grid lines */}
                {Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => i).map(
                  (i) => (
                    <div
                      key={i}
                      className="pointer-events-none absolute inset-x-0 border-t border-[#E5E7F3]/60"
                      style={{ top: `${i * HOUR_HEIGHT_PX}px` }}
                    />
                  )
                )}

                {/* Protected Leisure Band */}
                {hasLeisure &&
                config &&
                timeToMinutes(config.leisureEnd) > GRID_START_HOUR * 60 &&
                timeToMinutes(config.leisureStart) < GRID_END_HOUR * 60 ? (
                  <div
                    className="pointer-events-none absolute inset-x-0.5 rounded-lg border border-[#006A63]/30 bg-[#E2F7F5]/80 px-1 flex items-center justify-center"
                    style={{
                      top: `${leisureTopPx}px`,
                      height: `${leisureHeightPx}px`,
                    }}
                  >
                    <span className="truncate text-[8px] font-extrabold text-[#006A63]">
                      Ocio
                    </span>
                  </div>
                ) : null}

                {/* Class Blocks positioned proportionally */}
                {dayBlocks.map((b) => {
                  const sub = subjectMap.get(b.subjectId);
                  const startMins = Math.max(
                    GRID_START_HOUR * 60,
                    timeToMinutes(b.startTime)
                  );
                  const endMins = Math.min(GRID_END_HOUR * 60, timeToMinutes(b.endTime));
                  const topPx = ((startMins - GRID_START_HOUR * 60) / 60) * HOUR_HEIGHT_PX;
                  const heightPx = Math.max(
                    22,
                    ((endMins - startMins) / 60) * HOUR_HEIGHT_PX - 2
                  );
                  const isSelected = selectedBlock?.id === b.id;

                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBlock(isSelected ? null : b)}
                      className={`absolute inset-x-0.5 rounded-lg px-1 py-0.5 text-left text-white shadow-2xs transition overflow-hidden ${
                        isSelected ? 'ring-2 ring-[#131B2E] z-10' : ''
                      }`}
                      style={{
                        top: `${topPx + 1}px`,
                        height: `${heightPx}px`,
                        backgroundColor: sub?.colorHex ?? '#2563EB',
                      }}
                      title={`${b.label} (${b.startTime}–${b.endTime})`}
                    >
                      <p className="truncate text-[9px] font-extrabold leading-tight">
                        {b.label}
                      </p>
                      {heightPx >= 30 ? (
                        <p className="truncate text-[8px] opacity-90">
                          {b.startTime}–{b.endTime}
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Selected Block Action Bar */}
        {selectedBlock ? (
          <div className="flex items-center justify-between rounded-2xl border border-[#E5E7F3] bg-[#F2F3FF] px-3 py-2.5 text-xs">
            <div>
              <p className="font-extrabold text-[#131B2E]">{selectedBlock.label}</p>
              <p className="text-[11px] text-[#434655]">
                {DAY_NAMES_FULL[selectedBlock.dayOfWeek]} · {selectedBlock.startTime} –{' '}
                {selectedBlock.endTime}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={async () => {
                  await deleteClassBlock(selectedBlock.id);
                  setSelectedBlock(null);
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-[#FFDAD6] px-2.5 py-1.5 text-[11px] font-bold text-[#BA1A1A]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </button>
              <button
                type="button"
                onClick={() => setSelectedBlock(null)}
                className="rounded-lg p-1 text-[#737686]"
                aria-label="Cerrar selección"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        {/* Leisure legend */}
        {config ? (
          <div className="flex items-center justify-between rounded-2xl bg-[#E2F7F5] px-3 py-2 text-xs font-bold text-[#006A63]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Ocio Protegido Lun–Vie
            </span>
            <span>
              {formatTime12h(config.leisureStart)} – {formatTime12h(config.leisureEnd)}
            </span>
          </div>
        ) : null}
      </section>

      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#004AC6]"
      >
        <Plus className="h-4 w-4" />
        Agregar horario de clase
      </button>

      <AddClassModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
