import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowLeft, FileUp, Paperclip, Plus, ShieldAlert, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { AddClassModal } from '../../components/AddClassModal';
import { aiPlannerAdapter } from '../../services/adapter';
import { addDaysYYYYMMDD, getTodayKey } from '../../services/timeService';
import type { AttachmentMeta } from '../../types/domain';

const DRAFT_STORAGE_KEY = 'microplan_new_delivery_draft';

interface SavedDraft {
  subjectId: string;
  title: string;
  dueDate: string;
  instructionsText: string;
  attachmentMeta?: AttachmentMeta;
}

function loadDraft(defaultSubjectId: string): SavedDraft {
  const fallback: SavedDraft = {
    subjectId: defaultSubjectId,
    title: '',
    dueDate: addDaysYYYYMMDD(getTodayKey(), 3),
    instructionsText: '',
    attachmentMeta: undefined,
  };
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SavedDraft>;
    return {
      subjectId: parsed.subjectId || defaultSubjectId,
      title: parsed.title ?? '',
      dueDate: parsed.dueDate || fallback.dueDate,
      instructionsText: parsed.instructionsText ?? '',
      attachmentMeta: parsed.attachmentMeta,
    };
  } catch {
    return fallback;
  }
}

export function NewDeliveryScreen() {
  const subjects = useAppStore((s) => s.subjects);
  const config = useAppStore((s) => s.config);
  const classBlocks = useAppStore((s) => s.classBlocks);
  const microTasks = useAppStore((s) => s.microTasks);
  const setPlanSubView = useAppStore((s) => s.setPlanSubView);
  const setPendingAiDraft = useAppStore((s) => s.setPendingAiDraft);
  const createManualDelivery = useAppStore((s) => s.createManualDelivery);
  const addSubject = useAppStore((s) => s.addSubject);
  const pushToast = useAppStore((s) => s.pushToast);

  const initial = loadDraft(subjects[0]?.id ?? '');
  const [subjectId, setSubjectId] = useState(initial.subjectId);
  const [quickSubjectName, setQuickSubjectName] = useState('');
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [title, setTitle] = useState(initial.title);
  const [dueDate, setDueDate] = useState(initial.dueDate);
  const [instructionsText, setInstructionsText] = useState(initial.instructionsText);
  const [attachmentMeta, setAttachmentMeta] = useState<AttachmentMeta | undefined>(
    initial.attachmentMeta
  );
  const [attachmentFile, setAttachmentFile] = useState<File | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const payload: SavedDraft = {
        subjectId,
        title,
        dueDate,
        instructionsText,
        attachmentMeta,
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota issues
    }
  }, [subjectId, title, dueDate, instructionsText, attachmentMeta]);

  const clearDraftStorage = () => {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let extractedExcerpt: string | undefined;
    if (file.type.startsWith('text/') || /\.(txt|md|csv)$/i.test(file.name)) {
      try {
        const text = await file.text();
        extractedExcerpt = text.slice(0, 500);
        if (!instructionsText.trim()) {
          setInstructionsText(text.slice(0, 1200));
        }
      } catch {
        // Ignore read error
      }
    }
    setAttachmentMeta({
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSizeBytes: file.size,
      extractedExcerpt,
    });
    setAttachmentFile(file);
    e.target.value = '';
  };

  const ensureSubjectId = async (): Promise<string | null> => {
    if (subjectId && subjects.some((s) => s.id === subjectId)) return subjectId;
    if (subjects.length > 0) return subjects[0].id;
    if (quickSubjectName.trim()) {
      const created = await addSubject(quickSubjectName.trim(), '#2563EB');
      if (created) {
        setSubjectId(created.id);
        return created.id;
      }
    }
    pushToast('Selecciona o crea una materia primero.', 'warning');
    return null;
  };

  const handleAnalyzeWithAi = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      pushToast('Escribe el título de tu entrega.', 'warning');
      return;
    }
    const resolvedSubId = await ensureSubjectId();
    if (!resolvedSubId || !config) return;

    const subjectName =
      subjects.find((s) => s.id === resolvedSubId)?.name ??
      quickSubjectName.trim() ??
      'Materia';

    clearDraftStorage();
    setPendingAiDraft(null);
    setPlanSubView('analyzing_ai');
    const proposal = await aiPlannerAdapter.breakdownDelivery({
      subjectName,
      title: title.trim(),
      dueDate,
      instructionsText: instructionsText.trim(),
      attachmentMeta,
      attachmentFile,
      config,
      classBlocks,
      existingMicroTasks: microTasks,
    });

    setPendingAiDraft({
      subjectId: resolvedSubId,
      subjectName,
      title: title.trim(),
      dueDate,
      instructionsText: instructionsText.trim(),
      attachmentMeta,
      proposal,
    });
  };

  const handleCreateManual = async () => {
    if (!title.trim()) {
      pushToast('Escribe el título de tu entrega.', 'warning');
      return;
    }
    const resolvedSubId = await ensureSubjectId();
    if (!resolvedSubId) return;
    clearDraftStorage();
    await createManualDelivery({
      subjectId: resolvedSubId,
      title: title.trim(),
      dueDate,
      instructionsText: instructionsText.trim(),
    });
  };

  return (
    <div className="space-y-4 px-4 py-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            clearDraftStorage();
            setPlanSubView('list');
          }}
          className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold text-[#434655] hover:bg-[#EAEDFF]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
        <h1 className="text-base font-extrabold text-[#131B2E]">Nueva Entrega</h1>
        <span className="rounded-full bg-[#E5EEFF] px-2.5 py-0.5 text-[11px] font-bold text-[#004AC6]">
          &lt; 1 min
        </span>
      </div>

      <form onSubmit={(e) => void handleAnalyzeWithAi(e)} className="space-y-4">
        {/* 1. Materia */}
        <section className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold tracking-wide text-[#737686] uppercase">
              1. Materia
            </span>
            <button
              type="button"
              onClick={() => setShowAddClassModal(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB]"
            >
              <Plus className="h-3.5 w-3.5" />
              Gestionar
            </button>
          </div>
          {subjects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {subjects.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSubjectId(sub.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    subjectId === sub.id
                      ? 'bg-[#131B2E] text-white'
                      : 'bg-[#F2F3FF] text-[#434655]'
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: sub.colorHex }}
                  />
                  {sub.name}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <label htmlFor="quick-sub" className="mb-1 block text-xs font-semibold text-[#434655]">
                Nombre de tu materia
              </label>
              <input
                id="quick-sub"
                type="text"
                value={quickSubjectName}
                onChange={(e) => setQuickSubjectName(e.target.value)}
                placeholder="Ej. Ingeniería de Software"
                className="mp-input text-sm"
              />
            </div>
          )}
        </section>

        {/* 2. Título y fecha */}
        <section className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-3">
          <span className="block text-[11px] font-extrabold tracking-wide text-[#737686] uppercase">
            2. Título y fecha de entrega
          </span>
          <div>
            <label htmlFor="del-title" className="mb-1 block text-xs font-semibold text-[#434655]">
              ¿Qué tienes que entregar?
            </label>
            <input
              id="del-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Proyecto final de arquitectura cliente-servidor"
              className="mp-input text-sm"
            />
          </div>
          <div>
            <label htmlFor="del-due" className="mb-1 block text-xs font-semibold text-[#434655]">
              Fecha límite
            </label>
            <input
              id="del-due"
              type="date"
              required
              min={getTodayKey()}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mp-input text-sm font-semibold"
            />
          </div>
        </section>

        {/* 3. Instrucciones o Rúbrica */}
        <section className="rounded-3xl border border-[#E5E7F3] bg-white p-4 space-y-3">
          <span className="block text-[11px] font-extrabold tracking-wide text-[#737686] uppercase">
            3. Instrucciones o rúbrica (opcional para IA)
          </span>
          <textarea
            rows={3}
            value={instructionsText}
            onChange={(e) => setInstructionsText(e.target.value)}
            placeholder="Pega aquí los puntos de tu rúbrica o las indicaciones del profe..."
            className="mp-input resize-none text-xs leading-relaxed"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.txt,.md"
            onChange={(e) => void handleFileChange(e)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#2563EB]/40 bg-[#F2F3FF] px-3 py-3 text-xs font-bold text-[#004AC6] hover:bg-[#E5EEFF] transition"
          >
            <FileUp className="h-4 w-4" />
            <span>Adjuntar PDF, foto de rúbrica o archivo .txt</span>
          </button>

          {attachmentMeta ? (
            <div className="flex items-center justify-between rounded-xl bg-[#E6F7EC] px-3 py-2 text-xs font-semibold text-[#117E3B]">
              <span className="flex items-center gap-1.5 truncate">
                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                {attachmentMeta.fileName} (
                {Math.max(1, Math.round(attachmentMeta.fileSizeBytes / 1024))} KB)
              </span>
              <button
                type="button"
                onClick={() => setAttachmentMeta(undefined)}
                className="ml-2 text-[11px] underline"
              >
                Quitar
              </button>
            </div>
          ) : null}

          <div className="flex items-start gap-2 rounded-2xl bg-[#FAF8FF] p-2.5 text-[11px] text-[#434655]">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#006A63]" />
            <span>
              <strong>Uso ético:</strong> el agente solo organiza pasos accionables y tiempos;
              nunca redacta ensayos ni resuelve tus tareas.
            </span>
          </div>
        </section>

        <div className="space-y-2.5">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#004AC6]"
          >
            <Sparkles className="h-4 w-4" />
            Analizar y desglosar con IA
          </button>
          <button
            type="button"
            onClick={() => void handleCreateManual()}
            className="w-full py-2 text-center text-xs font-bold text-[#434655] hover:text-[#131B2E]"
          >
            Prefiero agregar mis pasos manualmente
          </button>
        </div>
      </form>

      <AddClassModal
        open={showAddClassModal}
        initialMode="new"
        onClose={() => setShowAddClassModal(false)}
        onSaved={(newSubjectId) => setSubjectId(newSubjectId)}
      />
    </div>
  );
}
