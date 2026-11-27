import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ModalDialog } from './ModalDialog';
import {
  DAY_NAMES_FULL,
  findClassOverlap,
  formatTime12h,
  timeToMinutes,
} from '../services/timeService';

const DAYS: Array<{ dow: 1 | 2 | 3 | 4 | 5; letter: string; name: string }> = [
  { dow: 1, letter: 'L', name: 'Lunes' },
  { dow: 2, letter: 'M', name: 'Martes' },
  { dow: 3, letter: 'X', name: 'Miércoles' },
  { dow: 4, letter: 'J', name: 'Jueves' },
  { dow: 5, letter: 'V', name: 'Viernes' },
];

const SUBJECT_COLORS = ['#2563EB', '#7C3AED', '#0D9488', '#D97706', '#E11D48'];

interface AddClassModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'existing' | 'new';
  initialSubjectId?: string;
  onSaved?: (subjectId: string) => void;
}

/**
 * Shared modal to create a subject and/or add non-overlapping weekly class blocks.
 */
export function AddClassModal({
  open,
  onClose,
  initialMode,
  initialSubjectId,
  onSaved,
}: AddClassModalProps) {
  const subjects = useAppStore((s) => s.subjects);
  const classBlocks = useAppStore((s) => s.classBlocks);
  const config = useAppStore((s) => s.config);
  const addSubject = useAppStore((s) => s.addSubject);
  const addClassBlocks = useAppStore((s) => s.addClassBlocks);

  const [subjectMode, setSubjectMode] = useState<'existing' | 'new'>(
    initialMode ?? (subjects.length > 0 ? 'existing' : 'new')
  );
  const [subjectId, setSubjectId] = useState(initialSubjectId || subjects[0]?.id || '');
  const [inlineSubName, setInlineSubName] = useState('');
  const [inlineSubColor, setInlineSubColor] = useState(SUBJECT_COLORS[0]);
  const [selectedDays, setSelectedDays] = useState<Array<1 | 2 | 3 | 4 | 5>>([1, 3]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [label, setLabel] = useState('');
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setSubmitErr(null);
      setInlineSubName('');
      setLabel('');
      setInlineSubColor(SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length]);
      const mode = subjects.length === 0 ? 'new' : (initialMode ?? 'existing');
      setSubjectMode(mode);
      if (initialSubjectId) {
        setSubjectId(initialSubjectId);
      } else if (subjects[0]?.id) {
        setSubjectId(subjects[0].id);
      }
    }
    wasOpenRef.current = open;
  }, [open, initialMode, initialSubjectId, subjects]);

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const toggleDay = (dow: 1 | 2 | 3 | 4 | 5) => {
    setSubmitErr(null);
    setSelectedDays((prev) =>
      prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow].sort()
    );
  };

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
    onSaved?.(resolvedSubjectId);
    onClose();
  };

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
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
            onClick={onClose}
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
                onChange={(e) => {
                  setSubmitErr(null);
                  setInlineSubName(e.target.value);
                }}
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
            onClick={onClose}
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
  );
}
