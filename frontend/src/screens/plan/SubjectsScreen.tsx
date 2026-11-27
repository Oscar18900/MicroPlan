import { useState, type FormEvent } from 'react';
import { ArrowLeft, Calendar, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const COLORS = ['#2563EB', '#7C3AED', '#0D9488', '#D97706', '#E11D48'];

export function SubjectsScreen() {
  const subjects = useAppStore((s) => s.subjects);
  const classBlocks = useAppStore((s) => s.classBlocks);
  const deliveries = useAppStore((s) => s.deliveries);
  const addSubject = useAppStore((s) => s.addSubject);
  const deleteSubject = useAppStore((s) => s.deleteSubject);
  const setPlanSubView = useAppStore((s) => s.setPlanSubView);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setProfileSubView = useAppStore((s) => s.setProfileSubView);

  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addSubject(name, color);
    setName('');
    setColor(COLORS[(subjects.length + 1) % COLORS.length]);
  };

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
        <h1 className="text-base font-extrabold text-[#131B2E]">Mis Materias</h1>
        <span className="rounded-full bg-[#E5EEFF] px-2.5 py-0.5 text-[11px] font-bold text-[#004AC6]">
          {subjects.length} activas
        </span>
      </div>

      <section className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-2.5">
        {subjects.length === 0 ? (
          <p className="py-4 text-center text-xs text-[#737686]">
            Aún no has agregado materias. Registra la primera abajo.
          </p>
        ) : (
          subjects.map((sub) => {
            const blocksCount = classBlocks.filter((b) => b.subjectId === sub.id).length;
            const delCount = deliveries.filter(
              (d) => d.subjectId === sub.id && d.status === 'active'
            ).length;
            return (
              <div
                key={sub.id}
                className="flex items-center justify-between rounded-2xl bg-[#F2F3FF] px-3.5 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: sub.colorHex }}
                  />
                  <div>
                    <p className="text-xs font-bold text-[#131B2E]">{sub.name}</p>
                    <p className="text-[11px] text-[#737686]">
                      {blocksCount} bloques clase · {delCount} entregas activas
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteSubject(sub.id)}
                  className="rounded-xl p-1.5 text-[#737686] hover:text-[#BA1A1A]"
                  aria-label={`Eliminar materia ${sub.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </section>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-3"
      >
        <span className="block text-[11px] font-extrabold tracking-wide text-[#737686] uppercase">
          Agregar nueva materia
        </span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Inteligencia Artificial"
          className="mp-input text-sm"
        />
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-[#737686]">Color:</span>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full transition ${
                color === c ? 'ring-2 ring-offset-2 ring-[#131B2E]' : ''
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

      <button
        type="button"
        onClick={() => {
          setProfileSubView('schedule');
          setActiveTab('profile');
        }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E5E7F3] bg-white py-3 text-xs font-bold text-[#2563EB]"
      >
        <Calendar className="h-4 w-4" />
        Ver y editar Horario Semanal →
      </button>
    </div>
  );
}
