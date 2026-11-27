import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ModalDialog } from '../../components/ModalDialog';
import { formatTime12h, timeToMinutes } from '../../services/timeService';

const DAYS: Array<{ dow: 1 | 2 | 3 | 4 | 5; short: string; name: string }> = [
  { dow: 1, short: 'LUN', name: 'Lunes' },
  { dow: 2, short: 'MAR', name: 'Martes' },
  { dow: 3, short: 'MIÉ', name: 'Miércoles' },
  { dow: 4, short: 'JUE', name: 'Jueves' },
  { dow: 5, short: 'VIE', name: 'Viernes' },
];

export function ScheduleScreen() {
  const subjects = useAppStore((s) => s.subjects);
  const classBlocks = useAppStore((s) => s.classBlocks);
  const config = useAppStore((s) => s.config);
  const setProfileSubView = useAppStore((s) => s.setProfileSubView);
  const addClassBlock = useAppStore((s) => s.addClassBlock);
  const deleteClassBlock = useAppStore((s) => s.deleteClassBlock);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);

  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [dayOfWeek, setDayOfWeek] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [label, setLabel] = useState('');
  const [timeErr, setTimeErr] = useState<string | null>(null);

  useEffect(() => {
    if (!subjectId && subjects[0]?.id) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const handleAddBlock = async (e: FormEvent) => {
    e.preventDefault();
    setTimeErr(null);
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setTimeErr('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }
    const resolvedSub = subjectId || subjects[0]?.id;
    if (!resolvedSub) return;
    const subName = subjectMap.get(resolvedSub)?.name ?? 'Clase';
    await addClassBlock({
      subjectId: resolvedSub,
      dayOfWeek,
      startTime,
      endTime,
      label: label.trim() || subName,
    });
    setLabel('');
    setShowAddModal(false);
  };

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
        <h1 className="text-base font-extrabold text-[#131B2E]">Horario Semanal</h1>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1 rounded-full bg-[#E5EEFF] px-3 py-1 text-xs font-bold text-[#004AC6]"
        >
          <Plus className="h-3.5 w-3.5" />
          Clase
        </button>
      </div>

      {/* Mode toggle */}
      <div className="grid grid-cols-2 rounded-2xl bg-[#EAEDFF] p-1">
        <button
          type="button"
          onClick={() => setViewMode('grid')}
          className={`rounded-xl py-2 text-xs font-bold transition ${
            viewMode === 'grid' ? 'bg-white text-[#131B2E] shadow-2xs' : 'text-[#434655]'
          }`}
        >
          Cuadrícula Semanal
        </button>
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`rounded-xl py-2 text-xs font-bold transition ${
            viewMode === 'list' ? 'bg-white text-[#131B2E] shadow-2xs' : 'text-[#434655]'
          }`}
        >
          Lista por Materia
        </button>
      </div>

      {viewMode === 'grid' ? (
        <section className="rounded-3xl border border-[#E5E7F3] bg-white p-3.5 space-y-3">
          <div className="grid grid-cols-5 gap-1.5">
            {DAYS.map((d) => {
              const dayBlocks = classBlocks
                .filter((b) => b.dayOfWeek === d.dow)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              return (
                <div key={d.dow} className="space-y-1.5">
                  <div className="rounded-lg bg-[#F2F3FF] py-1 text-center text-[10px] font-extrabold text-[#434655]">
                    {d.short}
                  </div>
                  {dayBlocks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#E5E7F3] py-4 text-center text-[10px] text-[#737686]">
                      Libre
                    </div>
                  ) : (
                    dayBlocks.map((b) => {
                      const sub = subjectMap.get(b.subjectId);
                      return (
                        <div
                          key={b.id}
                          className="group relative rounded-xl p-1.5 text-white shadow-2xs"
                          style={{ backgroundColor: sub?.colorHex ?? '#2563EB' }}
                        >
                          <p className="truncate text-[10px] font-extrabold leading-tight">
                            {b.label}
                          </p>
                          <p className="text-[9px] opacity-90">{b.startTime}</p>
                          <button
                            type="button"
                            onClick={() => void deleteClassBlock(b.id)}
                            className="mt-1 inline-flex items-center gap-0.5 rounded bg-black/20 px-1 py-0.5 text-[9px]"
                            aria-label={`Eliminar ${b.label}`}
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                            Quitar
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>

          {config ? (
            <div className="flex items-center justify-between rounded-2xl bg-[#E2F7F5] px-3 py-2.5 text-xs font-bold text-[#006A63]">
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
      ) : (
        <section className="space-y-2.5">
          {subjects.length === 0 ? (
            <div className="rounded-3xl border border-[#E5E7F3] bg-white p-5 text-center text-xs text-[#737686]">
              Agrega materias en Plan → Materias para ver tu lista.
            </div>
          ) : (
            subjects.map((sub) => {
              const blocks = classBlocks.filter((b) => b.subjectId === sub.id);
              return (
                <div
                  key={sub.id}
                  className="rounded-2xl border border-[#E5E7F3] bg-white p-3.5 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: sub.colorHex }}
                    />
                    <span className="text-xs font-extrabold text-[#131B2E]">{sub.name}</span>
                  </div>
                  {blocks.length === 0 ? (
                    <p className="text-[11px] text-[#737686]">Sin horarios registrados aún.</p>
                  ) : (
                    blocks.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between rounded-xl bg-[#F2F3FF] px-3 py-1.5 text-xs"
                      >
                        <span className="font-semibold text-[#131B2E]">
                          {DAYS.find((d) => d.dow === b.dayOfWeek)?.name} · {b.startTime}–{b.endTime}
                        </span>
                        <button
                          type="button"
                          onClick={() => void deleteClassBlock(b.id)}
                          className="text-[#BA1A1A]"
                          aria-label="Quitar bloque"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              );
            })
          )}
        </section>
      )}

      <p className="text-center text-[11px] text-[#737686]">
        Tus huecos libres permiten que la IA programe tus micro-metas sin empalmes.
      </p>

      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-sm"
      >
        <Plus className="h-4 w-4" />
        Agregar bloque de clase o laboratorio
      </button>

      <ModalDialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        labelledBy="add-class-title"
        closedBy="any"
      >
        <form
          onSubmit={(e) => void handleAddBlock(e)}
          className="rounded-3xl border border-[#E5E7F3] bg-white p-5 shadow-xl space-y-3.5 text-[#131B2E]"
        >
          <h1 id="add-class-title" className="text-base font-extrabold">
            Nuevo bloque de clase
          </h1>
          {subjects.length === 0 ? (
            <p className="text-xs text-[#BA1A1A]">
              Primero agrega al menos una materia en Plan → Materias.
            </p>
          ) : (
            <>
              <div>
                <label htmlFor="cls-sub" className="mb-1 block text-xs font-bold text-[#434655]">
                  Materia
                </label>
                <select
                  id="cls-sub"
                  value={subjectId || subjects[0]?.id}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="mp-input text-xs"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="cls-day" className="mb-1 block text-xs font-bold text-[#434655]">
                  Día
                </label>
                <select
                  id="cls-day"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                  className="mp-input text-xs"
                >
                  {DAYS.map((d) => (
                    <option key={d.dow} value={d.dow}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="cls-start" className="mb-1 block text-xs font-bold text-[#434655]">
                    Inicio
                  </label>
                  <input
                    id="cls-start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mp-input text-xs"
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
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mp-input text-xs"
                  />
                </div>
              </div>
              {timeErr ? (
                <p role="alert" className="text-xs font-semibold text-[#BA1A1A]">
                  {timeErr}
                </p>
              ) : null}
              <div>
                <label htmlFor="cls-label" className="mb-1 block text-xs font-bold text-[#434655]">
                  Etiqueta corta (opcional)
                </label>
                <input
                  id="cls-label"
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ej. Lab Sistemas"
                  className="mp-input text-xs"
                />
              </div>
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
                  className="rounded-xl bg-[#2563EB] py-2.5 text-xs font-bold text-white"
                >
                  Guardar clase
                </button>
              </div>
            </>
          )}
        </form>
      </ModalDialog>
    </div>
  );
}
