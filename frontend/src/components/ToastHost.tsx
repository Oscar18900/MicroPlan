import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function ToastHost() {
  const toasts = useAppStore((s) => s.toasts);
  const dismissToast = useAppStore((s) => s.dismissToast);

  return (
    <>
      {/* Accessible polite live region */}
      <div aria-live="polite" className="visually-hidden">
        {toasts.length > 0 ? toasts[toasts.length - 1].text : ''}
      </div>

      <div className="pointer-events-none fixed inset-x-0 top-14 z-50 mx-auto flex max-w-[400px] flex-col gap-2 px-4">
        {toasts.map((t) => {
          const styles =
            t.tone === 'success'
              ? 'border-[#117E3B]/25 bg-[#E6F7EC] text-[#0E602D]'
              : t.tone === 'warning'
                ? 'border-[#B15106]/25 bg-[#FFFBEB] text-[#8F4003]'
                : t.tone === 'danger'
                  ? 'border-[#BA1A1A]/25 bg-[#FFDAD6] text-[#93000A]'
                  : 'border-[#2563EB]/20 bg-[#FFFFFF] text-[#131B2E]';

          const Icon =
            t.tone === 'success'
              ? CheckCircle2
              : t.tone === 'warning' || t.tone === 'danger'
                ? AlertTriangle
                : Info;

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-xs font-medium shadow-md ${styles}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 leading-snug">{t.text}</span>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="rounded-lg p-1 opacity-70 hover:opacity-100"
                aria-label="Cerrar aviso"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
