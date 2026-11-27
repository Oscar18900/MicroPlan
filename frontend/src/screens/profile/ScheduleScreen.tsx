import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ModalDialog } from '../../components/ModalDialog';
import {
  DAY_NAMES_FULL,
  findClassOverlap,
  formatTime12h,
  timeToMinutes,
} from '../../services/timeService';
import type { ClassBlock } from '../../types/domain';

const DAYS: Array<{ dow: 1 | 2 | 3 | 4 | 5; short: string; letter: string; name: string }> = [
  { dow: 1, short: 'LUN', letter: 'L', name: 'Lunes' },
  { dow: 2, short: 'MAR', letter: 'M', name: 'Martes' },
  { dow: 3, short: 'MIÉ', letter: 'X', name: 'Miércoles' },
  { dow: 4, short: 'JUE', letter: 'J', name: 'Jueves' },
  { dow: 5, short: 'VIE', letter: 'V', name: 'Viernes' },
];

const SUBJECT_COLORS = ['#2563EB', '#7C3AED', '#0D9488', '#D97706', '#E11D48'];

const GRID_START_HOUR = 7;
const GRID_END_HOUR = 21;
const HOUR_HEIGHT_PX = 36;
const TOTAL_GRID_HEIGHT = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT_PX;

interface ScheduleScreenProps {
  backLabel?: string;
  onBack?: () => void;
  initialTab?: 'schedule' | 'subjects';
}

export function ScheduleScreen({
  backLabel = 'Perfil',
  onBack,
  initialTab = 'schedule',
}: ScheduleScreenProps) {
  const subjects = useAppStore((s) => s.subjects);
  const classBlocks = useAppStore((s) => s.classBlocks);
  const deliveries = useAppStore((s) => s.deliveries);
  const config = useAppStore((s) => s.config);
  const setProfileSubView = useAppStore((s) => s.setProfileSubView);
  const addSubject = useAppStore((s) => s.addSubject);
  const deleteSubject = useAppStore((s) => s.deleteSubject);
  const addClassBlocks = useAppStore((s) => s.addClassBlocks);
  const deleteClassBlock = useAppStore((s) => s.deleteClassBlock);

  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'subjects'>(initialTab);
  const [selectedBlock, setSelectedBlock] = useState<ClassBlock | null>(null);

  // Unified "+ Clase" Modal state (supports picking existing subject OR creating new one inline)
  const [showAddModal, setShowAddModal] = useState(false);
  const [subjectMode, setSubjectMode] = useState<'existing' | 'new'>(
    subjects.length > 0 ? 'existing' : 'new'
  );
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [inlineSubName, setInlineSubName] = useState('');
  const [inlineSubColor, setInlineSubColor] = useState(SUBJECT_COLORS[0]);
  const [selectedDays, setSelectedDays] = useState<Array<1 | 2 | 3 | 4 | 5>>([1, 3]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [label, setLabel] = useState('');
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  // Inline new subject form inside "Materias" tab
  const [newSubName, setNewSubName] = useState('');
  const [newSubColor, setNewSubColor] = useState(SUBJECT_COLORS[0]);

  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!subjectId && subjects[0]?.id) {
      setSubjectId(subjects[0].id);
      setSubjectMode('existing');
    } else if (subjects.length === 0) {
      setSubjectMode('new');
    }
  }, [subjects, subjectId]);

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setProfileSubView('main');
    }
  };

  const openModalForSubject = (preselectSubjectId?: string) => {
    setSubmitErr(null);
    if (preselectSubjectId) {
      setSubjectMode('existing');
      setSubjectId(preselectSubjectId);
    } else {
      setSubjectMode(subjects.length > 0 ? 'existing' : 'new');
      if (subjects[0]?.id && !subjectId) setSubjectId(subjects[0].id);
    }
    setShowAddModal(true);
  };

  const toggleDay = (dow: 1 | 2 | 3 | 4 | 5) => {
    setSubmitErr(null);
    setSelectedDays((prev) =>
      prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow].sort()
    );
  };

  // Live overlap & time validation inside the modal
  const liveValidationError = useMemo(() => {
    if (selectedDays.length === 0) {
      return 'Selecciona al menos un día de la semana.';
    }
    const sMins = timeToMinutes(startTime);
    const eMins = timeToMinutes(endTime);
    if (eMins <= sMins) {
      return 'La hora de fin debe ser posterior a la hora de inicio.';
    }
    if (eMins - sMins < 30) {
      return 'Cada bloque debe durar al menos 30 minutos.';
    }
    for (const day of selectedDays) {
      const overlap = findClassOverlap({ dayOfWeek: day, startTime, endTime }, classBlocks);
      if (overlap) {
        return `Empalme el ${DAY_NAMES_FULL[day]}: choca con "${overlap.label}" (${overlap.startTime}–${overlap.endTime}).`;
      }
    }
    return null;
  }, [selectedDays, startTime, endTime, classBlocks]);

  const leisureOverlapWarning = useMemo(() => {
    if (!config) return null;
    const sMins = timeToMinutes(startTime);
    const eMins = timeToMinutes(endTime);
    const lStart = timeToMinutes(config.leisureStart);
    const lEnd = timeToMinutes(config.leisureEnd);
    const hitsDay = selectedDays.some((d) => config.leisureDays.includes(d));
    if (hitsDay && sMins < lEnd && eMins > lStart) {
      return `Nota: este horario cruza con tu Ocio Protegido (${formatTime12h(config.leisureStart)}–${formatTime12h(config.leisureEnd)}). Puedes mover tu ocio luego en Perfil.`;
    }
    return null;
  }, [config, selectedDays, startTime, endTime]);

  const handleSaveBlocks = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitErr(null);
    if (liveValidationError) {
      setSubmitErr(liveValidationError);
      return;
    }

    let resolvedSubjectId = subjectId;
    let resolvedSubjectName = subjectMap.get(subjectId)?.name ?? 'Clase';

    if (subjectMode === 'new' || subjects.length === 0) {
      if (!inlineSubName.trim()) {
        setSubmitErr('Escribe el nombre de la nueva materia.');
        return;
      }
      const created = await addSubject(inlineSubName.trim(), inlineSubColor);
      if (!created) return;
      resolvedSubjectId = created.id;
      resolvedSubjectName = created.name;
      setSubjectId(created.id);
      setInlineSubName('');
      setSubjectMode('existing');
    } else if (!resolvedSubjectId) {
      resolvedSubjectId = subjects[0]?.id ?? '';
      resolvedSubjectName = subjects[0]?.name ?? 'Clase';
    }

    if (!resolvedSubjectId) return;

    const payload = selectedDays.map((dayOfWeek) => ({
      subjectId: resolvedSubjectId,
      dayOfWeek,
      startTime,
      endTime,
      label: label.trim() || resolvedSubjectName,
    }));

    const res = await addClassBlocks(payload);
    if (!res.ok) {
      setSubmitErr(res.error ?? 'No se pudo guardar el horario.');
      return;
    }

    setLabel('');
    setShowAddModal(false);
  };

  const handleAddSubjectOnly = async (e: FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    await addSubject(newSubName, newSubColor);
    setNewSubName('');
    setNewSubColor(SUBJECT_COLORS[(subjects.length + 1) % SUBJECT_COLORS.length]);
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
        <h1 className="text-base font-extrabold text-[#131B2E]">Horario y Materias</h1>
        <button
          type="button"
          onClick={() => openModalForSubject()}
          className="inline-flex items-center gap-1 rounded-full bg-[#2563EB] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#004AC6]"
        >
          <Plus className="h-3.5 w-3.5" />
          Clase
        </button>
      </div>

      {/* Unified Module Tabs */}
      <div className="grid grid-cols-2 rounded-2xl bg-[#EAEDFF] p-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'schedule'}
          onClick={() => setActiveSubTab('schedule')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
            activeSubTab === 'schedule' ? 'bg-white text-[#131B2E] shadow-2xs' : 'text-[#434655]'
          }`}
        >
          <Calendar className="h-3.5 w-3.5 text-[#2563EB]" />
          Horario ({classBlocks.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'subjects'}
          onClick={() => setActiveSubTab('subjects')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
            activeSubTab === 'subjects' ? 'bg-white text-[#131B2E] shadow-2xs' : 'text-[#434655]'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5 text-[#7C3AED]" />
          Materias ({subjects.length})
        </button>
      </div>

      {activeSubTab === 'schedule' ? (
        <>
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
            onClick={() => openModalForSubject()}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#004AC6]"
          >
            <Plus className="h-4 w-4" />
            Agregar horario de clase
          </button>
        </>
      ) : (
        /* Tab 2: Unified Subjects + their Class Blocks + Create New Subject */
        <div className="space-y-4">
          <section className="space-y-2.5">
            {subjects.length === 0 ? (
              <div className="rounded-3xl border border-[#E5E7F3] bg-white p-5 text-center text-xs text-[#737686]">
                Aún no tienes materias registradas. Agrega tu primera materia abajo o pulsa{' '}
                <strong>+ Clase</strong> arriba.
              </div>
            ) : (
              subjects.map((sub) => {
                const blocks = classBlocks
                  .filter((b) => b.subjectId === sub.id)
                  .sort((a, b) =>
                    a.dayOfWeek === b.dayOfWeek
                      ? a.startTime.localeCompare(b.startTime)
                      : a.dayOfWeek - b.dayOfWeek
                  );
                const activeDeliveries = deliveries.filter(
                  (d) => d.subjectId === sub.id && d.status === 'active'
                ).length;

                return (
                  <article
                    key={sub.id}
                    className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full"
                          style={{ backgroundColor: sub.colorHex }}
                        />
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-extrabold text-[#131B2E]">
                            {sub.name}
                          </h2>
                          <p className="text-[11px] text-[#737686]">
                            {blocks.length} bloque(s) de clase · {activeDeliveries} entregas activas
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openModalForSubject(sub.id)}
                          className="inline-flex items-center gap-1 rounded-xl bg-[#E5EEFF] px-2.5 py-1.5 text-[11px] font-bold text-[#004AC6]"
                        >
                          <Plus className="h-3 w-3" />
                          Horario
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteSubject(sub.id)}
                          className="rounded-xl p-1.5 text-[#737686] hover:text-[#BA1A1A]"
                          aria-label={`Eliminar materia ${sub.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {blocks.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {blocks.map((b) => (
                          <span
                            key={b.id}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#F2F3FF] px-2.5 py-1 text-[11px] font-semibold text-[#131B2E]"
                          >
                            <Clock className="h-3 w-3 text-[#2563EB]" />
                            {DAY_NAMES_FULL[b.dayOfWeek].slice(0, 3)} {b.startTime}–{b.endTime}
                            <button
                              type="button"
                              onClick={() => void deleteClassBlock(b.id)}
                              className="rounded-full p-0.5 text-[#737686] hover:text-[#BA1A1A]"
                              aria-label={`Quitar horario ${DAY_NAMES_FULL[b.dayOfWeek]} ${b.startTime}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#737686]">
                        Sin horario fijo aún. Toca <strong>+ Horario</strong> para asignarlo.
                      </p>
                    )}
                  </article>
                );
              })
            )}
          </section>

          {/* Always-accessible New Subject Form */}
          <form
            onSubmit={(e) => void handleAddSubjectOnly(e)}
            className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-3"
          >
            <span className="block text-[11px] font-extrabold tracking-wide text-[#737686] uppercase">
              Agregar nueva materia
            </span>
            <input
              type="text"
              required
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              placeholder="Ej. Inteligencia Artificial"
              className="mp-input text-sm"
            />
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-[#737686]">Color:</span>
              {SUBJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewSubColor(c)}
                  className={`h-6 w-6 rounded-full transition ${
                    newSubColor === c ? 'ring-2 ring-offset-2 ring-[#131B2E]' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#2563EB] py-3 text-xs font-bold text-white"
            >
              <Plus className="h-4 w-4" />
              Guardar materia
            </button>
          </form>
        </div>
      )}

      {/* Unified "+ Agregar clase" Modal with Inline Subject Creation, Multi-Day & Overlap Block */}
      <ModalDialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        labelledBy="add-class-title"
        closedBy="any"
      >
        <form
          onSubmit={(e) => void handleSaveBlocks(e)}
          className="rounded-3xl border border-[#E5E7F3] bg-white p-5 shadow-xl space-y-3.5 text-[#131B2E]"
        >
          <div className="flex items-center justify-between">
            <h1 id="add-class-title" className="text-base font-extrabold">
              Agregar clase al horario
            </h1>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="rounded-xl p-1 text-[#737686] hover:bg-[#F2F3FF]"
              aria-label="Cerrar modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Subject selector OR inline creation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#434655]">Materia</span>
              {subjects.length > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    setSubjectMode((m) => (m === 'existing' ? 'new' : 'existing'))
                  }
                  className="text-[11px] font-bold text-[#2563EB] hover:underline"
                >
                  {subjectMode === 'existing' ? '+ Crear materia nueva' : 'Elegir existente'}
                </button>
              ) : null}
            </div>

            {subjectMode === 'existing' && subjects.length > 0 ? (
              <select
                aria-label="Materia"
                value={subjectId || subjects[0]?.id}
                onChange={(e) => setSubjectId(e.target.value)}
                className="mp-input text-xs font-semibold"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-2 rounded-2xl bg-[#FAF8FF] border border-[#E5E7F3] p-3">
                <input
                  type="text"
                  value={inlineSubName}
                  onChange={(e) => setInlineSubName(e.target.value)}
                  placeholder="Nombre de nueva materia..."
                  className="mp-input text-xs"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#737686]">Color:</span>
                  {SUBJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setInlineSubColor(c)}
                      className={`h-5 w-5 rounded-full transition ${
                        inlineSubColor === c ? 'ring-2 ring-offset-1 ring-[#131B2E]' : ''
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`Color materia ${c}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Multi-day selection */}
          <div className="space-y-1.5">
            <span className="block text-xs font-bold text-[#434655]">
              Días de clase (puedes elegir varios)
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {DAYS.map((d) => {
                const active = selectedDays.includes(d.dow);
                return (
                  <button
                    key={d.dow}
                    type="button"
                    onClick={() => toggleDay(d.dow)}
                    className={`rounded-xl py-2 text-xs font-extrabold transition ${
                      active
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-[#F2F3FF] text-[#434655] hover:bg-[#EAEDFF]'
                    }`}
                  >
                    {d.letter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start / End Time */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="cls-start" className="mb-1 block text-xs font-bold text-[#434655]">
                Inicio
              </label>
              <input
                id="cls-start"
                type="time"
                value={startTime}
                onChange={(e) => {
                  setSubmitErr(null);
                  setStartTime(e.target.value);
                }}
                className="mp-input text-xs font-semibold"
              />
            </div>
            <div>
              <label htmlFor="cls-end" className="mb-1 block text-xs font-bold text-[#434655]">
                Fin
              </label>
              <input
                id="cls-end"
                type="time"
                value={endTime}
                onChange={(e) => {
                  setSubmitErr(null);
                  setEndTime(e.target.value);
                }}
                className="mp-input text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cls-label" className="mb-1 block text-xs font-bold text-[#434655]">
              Etiqueta corta (opcional)
            </label>
            <input
              id="cls-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej. Lab Sistemas / Aula 104"
              className="mp-input text-xs"
            />
          </div>

          {/* Real-time Overlap / Validation Error */}
          {submitErr || liveValidationError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-2xl border border-[#BA1A1A]/25 bg-[#FFDAD6]/60 px-3 py-2 text-xs font-semibold text-[#BA1A1A]"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitErr || liveValidationError}</span>
            </div>
          ) : null}

          {!liveValidationError && leisureOverlapWarning ? (
            <div className="flex items-start gap-2 rounded-2xl border border-[#B15106]/25 bg-[#FFFBEB] px-3 py-2 text-[11px] font-medium text-[#B15106]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{leisureOverlapWarning}</span>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="rounded-xl border border-[#E5E7F3] py-2.5 text-xs font-bold text-[#434655]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={Boolean(liveValidationError)}
              className="rounded-xl bg-[#2563EB] py-2.5 text-xs font-bold text-white disabled:opacity-45"
            >
              Guardar clase
            </button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
