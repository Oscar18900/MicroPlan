import { useState } from 'react';
import { ArrowLeft, Check, Moon, Plus, ShieldCheck, Sparkles, Sun, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const SUBJECT_COLORS = ['#2563EB', '#7C3AED', '#0D9488', '#D97706', '#E11D48'];
const LEISURE_TAG_OPTIONS = ['Paseo', 'Gym', 'Videojuegos', 'Música', 'Series', 'Lectura'];

export function OnboardingFlow() {
  const user = useAppStore((s) => s.user);
  const config = useAppStore((s) => s.config);
  const updateOnboardingProfile = useAppStore((s) => s.updateOnboardingProfile);
  const saveOnboardingSubjects = useAppStore((s) => s.saveOnboardingSubjects);
  const saveOnboardingLeisure = useAppStore((s) => s.saveOnboardingLeisure);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Profile & Sleep
  const [career, setCareer] = useState(user?.career || 'Ing. en Ciencias de la Computación');
  const [semester, setSemester] = useState(user?.semester || '7°+');
  const [sleepGoal, setSleepGoal] = useState<7.0 | 7.5 | 8.0>(config?.sleepGoalHours ?? 7.5);
  const [curfewTime, setCurfewTime] = useState(config?.curfewAlertTime ?? '22:30');
  const [bedtimeLimit, setBedtimeLimit] = useState(config?.bedtimeLimitTime ?? '23:00');

  // Step 2: Subjects
  const [subjectDrafts, setSubjectDrafts] = useState<
    Array<{ name: string; colorHex: string; shift: 'morning' | 'afternoon' | 'mixed' }>
  >([
    { name: 'Seminario de Investigación', colorHex: '#2563EB', shift: 'morning' },
    { name: 'Sistemas Distribuidos', colorHex: '#7C3AED', shift: 'morning' },
  ]);
  const [newSubName, setNewSubName] = useState('');
  const [newSubColor, setNewSubColor] = useState(SUBJECT_COLORS[2]);
  const [shift, setShift] = useState<'morning' | 'afternoon' | 'mixed'>('morning');

  // Step 3: Protected Leisure
  const [leisureStart, setLeisureStart] = useState(config?.leisureStart ?? '17:00');
  const [leisureEnd, setLeisureEnd] = useState(config?.leisureEnd ?? '18:00');
  const [leisureTags, setLeisureTags] = useState<string[]>(
    config?.leisureTags ?? ['Paseo', 'Gym', 'Videojuegos']
  );

  const handleNextStep1 = async () => {
    await updateOnboardingProfile({
      career: career.trim() || 'Universitario BUAP',
      semester,
      sleepGoalHours: sleepGoal,
      curfewAlertTime: curfewTime,
      bedtimeLimitTime: bedtimeLimit,
    });
    setStep(2);
  };

  const handleAddSubjectDraft = () => {
    if (!newSubName.trim()) return;
    setSubjectDrafts((prev) => [
      ...prev,
      { name: newSubName.trim(), colorHex: newSubColor, shift },
    ]);
    setNewSubName('');
    setNewSubColor(SUBJECT_COLORS[(subjectDrafts.length + 1) % SUBJECT_COLORS.length]);
  };

  const handleNextStep2 = async () => {
    await saveOnboardingSubjects(subjectDrafts.map((s) => ({ ...s, shift })));
    setStep(3);
  };

  const handleNextStep3 = async () => {
    await saveOnboardingLeisure({
      leisureStart,
      leisureEnd,
      leisureDays: [1, 2, 3, 4, 5],
      leisureTags,
    });
    setStep(4);
  };

  const toggleTag = (tag: string) => {
    setLeisureTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="min-h-dvh w-full bg-[#EAEDFF]/60 flex justify-center">
      <div className="flex min-h-dvh w-full max-w-[430px] flex-col bg-[#FAF8FF] px-5 py-6 shadow-[0_0_40px_rgba(19,27,46,0.08)]">
        {/* Top Onboarding Header (01.3 - 01.6) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#434655]">
            <div className="flex items-center gap-2">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s))}
                  className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-[#EAEDFF]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Atrás
                </button>
              ) : (
                <span>Configuración inicial</span>
              )}
            </div>
            <span className="text-[#737686]">Paso {step} de 4</span>
            <button
              type="button"
              onClick={() => void completeOnboarding(false)}
              className="rounded-lg px-2 py-1 text-[#2563EB] hover:bg-[#E5EEFF]"
            >
              Omitir
            </button>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EAEDFF]">
            <div
              className="h-full rounded-full bg-[#2563EB] transition-all duration-300"
              style={{ width: `${step * 25}%` }}
            />
          </div>
        </div>

        {/* Step 1: 01.3 Perfil y Sueño */}
        {step === 1 ? (
          <div className="mt-6 flex flex-1 flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-extrabold text-[#131B2E]">Cuéntanos sobre tu semestre</h1>
                <p className="mt-1 text-xs text-[#434655]">
                  Ajustaremos tu carga académica diaria para proteger al menos 7 horas de sueño.
                </p>
              </div>

              <div className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-4">
                <div>
                  <label htmlFor="onb-career" className="mb-1.5 block text-xs font-semibold text-[#434655]">
                    Carrera / Facultad
                  </label>
                  <input
                    id="onb-career"
                    type="text"
                    value={career}
                    onChange={(e) => setCareer(e.target.value)}
                    className="mp-input"
                  />
                </div>
                <div>
                  <span className="mb-2 block text-xs font-semibold text-[#434655]">
                    Semestre actual
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {['1°–3°', '4°–6°', '7°+', 'Posgrado'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSemester(item)}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                          semester === item
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-[#F2F3FF] text-[#434655] hover:bg-[#EAEDFF]'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#131B2E] flex items-center gap-1.5">
                    <Moon className="h-4 w-4 text-[#006A63]" />
                    Meta diaria de sueño
                  </span>
                  <span className="rounded-full bg-[#E2F7F5] px-2.5 py-0.5 text-[11px] font-bold text-[#006A63]">
                    Mínimo 7h
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([7.0, 7.5, 8.0] as const).map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setSleepGoal(hrs)}
                      className={`rounded-xl py-2.5 text-xs font-bold transition ${
                        sleepGoal === hrs
                          ? 'bg-[#006A63] text-white'
                          : 'bg-[#F2F3FF] text-[#434655]'
                      }`}
                    >
                      {sleepGoal === hrs ? `✓ ${hrs.toFixed(1)} hrs` : `${hrs.toFixed(1)} hrs`}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="onb-curfew" className="mb-1 block text-[11px] font-semibold text-[#737686]">
                      Alerta nocturna
                    </label>
                    <input
                      id="onb-curfew"
                      type="time"
                      value={curfewTime}
                      onChange={(e) => setCurfewTime(e.target.value)}
                      className="mp-input text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label htmlFor="onb-bedtime" className="mb-1 block text-[11px] font-semibold text-[#737686]">
                      Límite dormir
                    </label>
                    <input
                      id="onb-bedtime"
                      type="time"
                      value={bedtimeLimit}
                      onChange={(e) => setBedtimeLimit(e.target.value)}
                      className="mp-input text-sm font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleNextStep1()}
              className="w-full rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#004AC6]"
            >
              Continuar a Materias →
            </button>
          </div>
        ) : null}

        {/* Step 2: 01.4 Materias y Horario */}
        {step === 2 ? (
          <div className="mt-6 flex flex-1 flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-extrabold text-[#131B2E]">Tus materias y horario</h1>
                <p className="mt-1 text-xs text-[#434655]">
                  Registra tus materias iniciales. Al crear entregas podrás elegirlas directo de la lista.
                </p>
              </div>

              <div className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-3">
                <span className="block text-xs font-bold text-[#434655]">
                  Materias activas ({subjectDrafts.length})
                </span>
                <div className="space-y-2">
                  {subjectDrafts.map((s, idx) => (
                    <div
                      key={`${s.name}-${idx}`}
                      className="flex items-center justify-between rounded-2xl bg-[#F2F3FF] px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: s.colorHex }}
                        />
                        <span className="text-xs font-semibold text-[#131B2E]">{s.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSubjectDrafts((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="rounded-lg p-1 text-[#737686] hover:text-[#BA1A1A]"
                        aria-label={`Quitar ${s.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#E5E7F3] space-y-2.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      placeholder="Agregar otra materia..."
                      className="mp-input flex-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubjectDraft}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#E5EEFF] px-3 text-xs font-bold text-[#004AC6]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#737686]">Color:</span>
                    {SUBJECT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewSubColor(c)}
                        className={`h-5 w-5 rounded-full transition ${
                          newSubColor === c ? 'ring-2 ring-offset-2 ring-[#131B2E]' : ''
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-2.5">
                <span className="block text-xs font-bold text-[#434655]">
                  Turno principal de clases
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'morning', label: 'Matutino 8–14h' },
                    { id: 'afternoon', label: 'Vespertino 14–20h' },
                    { id: 'mixed', label: 'Mixto' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setShift(opt.id as 'morning' | 'afternoon' | 'mixed')}
                      className={`rounded-xl px-2 py-2.5 text-[11px] font-bold transition ${
                        shift === opt.id
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-[#F2F3FF] text-[#434655]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#737686]">
                  Luego podrás ajustar cada bloque exacto en Perfil → Horario Semanal.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleNextStep2()}
              className="w-full rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#004AC6]"
            >
              Continuar a Ocio Protegido →
            </button>
          </div>
        ) : null}

        {/* Step 3: 01.5 Ocio Protegido */}
        {step === 3 ? (
          <div className="mt-6 flex flex-1 flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-extrabold text-[#131B2E]">Blinda tu tiempo libre de día</h1>
                <p className="mt-1 text-xs text-[#434655]">
                  Si descansas de día con culpa cero, evitas desvelarte de madrugada buscando tiempo libre.
                </p>
              </div>

              <div className="rounded-3xl border border-[#006A63]/20 bg-[#E2F7F5]/65 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#006A63]">
                  <ShieldCheck className="h-4 w-4" />
                  Bloque Inmune a Tareas
                </div>
                <p className="text-base font-extrabold text-[#131B2E]">
                  Ocio Diurno Protegido
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="onb-lstart" className="mb-1 block text-[11px] font-semibold text-[#434655]">
                      Inicio
                    </label>
                    <input
                      id="onb-lstart"
                      type="time"
                      value={leisureStart}
                      onChange={(e) => setLeisureStart(e.target.value)}
                      className="mp-input text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label htmlFor="onb-lend" className="mb-1 block text-[11px] font-semibold text-[#434655]">
                      Fin
                    </label>
                    <input
                      id="onb-lend"
                      type="time"
                      value={leisureEnd}
                      onChange={(e) => setLeisureEnd(e.target.value)}
                      className="mp-input text-sm font-bold"
                    />
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-xs font-semibold text-[#434655]">
                    ¿Qué disfrutas hacer en ese bloque?
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {LEISURE_TAG_OPTIONS.map((tag) => {
                      const active = leisureTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            active
                              ? 'bg-[#006A63] text-white'
                              : 'bg-white text-[#434655] border border-[#E5E7F3]'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleNextStep3()}
              className="w-full rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#004AC6]"
            >
              Ver demo de Microplanificación →
            </button>
          </div>
        ) : null}

        {/* Step 4: 01.6 Demo Microplan IA */}
        {step === 4 ? (
          <div className="mt-6 flex flex-1 flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-extrabold text-[#131B2E]">Tu primer desglose con IA</h1>
                <p className="mt-1 text-xs text-[#434655]">
                  Así dividimos una entrega grande en micro-metas diarias sin saturar tu horario ni tu sueño.
                </p>
              </div>

              <div className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#E5EEFF] px-2.5 py-0.5 text-[11px] font-bold text-[#004AC6]">
                    Ejemplo · Plazo 3 días
                  </span>
                  <span className="text-[11px] font-semibold text-[#006A63] flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    Sin resolver la tarea
                  </span>
                </div>
                <p className="text-sm font-bold text-[#131B2E]">Ensayo de Metodologías Ágiles</p>

                <div className="space-y-2">
                  {[
                    { when: 'Hoy · 4:00 PM', title: 'Investigar 3 fuentes primarias y esquema', dur: '25 min' },
                    { when: 'Mañana · 4:00 PM', title: 'Redactar borrador del marco teórico', dur: '50 min' },
                    { when: 'Día 3 · 4:00 PM', title: 'Revisar citas APA y formato final', dur: '25 min' },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center justify-between rounded-2xl bg-[#F2F3FF] px-3 py-2.5"
                    >
                      <div>
                        <p className="text-[11px] font-semibold text-[#2563EB]">{item.when}</p>
                        <p className="text-xs font-semibold text-[#131B2E]">{item.title}</p>
                      </div>
                      <span className="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-[#434655]">
                        {item.dur}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-[#E6F7EC] px-3 py-2 text-xs font-semibold text-[#117E3B]">
                  <Check className="h-4 w-4 shrink-0" />
                  Terminas todo antes de las {curfewTime} y conservas tu Ocio Protegido.
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => void completeOnboarding(true)}
                className="w-full rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#004AC6]"
              >
                ¡Comenzar con este ejemplo en mi Plan!
              </button>
              <button
                type="button"
                onClick={() => void completeOnboarding(false)}
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#E5E7F3] bg-white py-3 text-xs font-bold text-[#434655] hover:bg-[#F2F3FF]"
              >
                <Sun className="h-3.5 w-3.5 text-[#006A63]" />
                Empezar con mi agenda limpia
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
