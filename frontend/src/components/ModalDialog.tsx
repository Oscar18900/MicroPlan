import { useEffect, useRef, type ReactNode } from 'react';

interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  closedBy?: 'any' | 'closerequest' | 'none';
  children: ReactNode;
}

/**
 * Accessible wrapper around the native <dialog> element following Modern Web Guidance:
 * - Uses showModal() via ref (no redundant role="dialog" or aria-modal).
 * - Resets dialog.returnValue on close so stale results never leak.
 * - Provides progressive fallback for closedby="any" on browsers without native support.
 */
export function ModalDialog({
  open,
  onClose,
  labelledBy,
  closedBy = 'any',
  children,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };

    const handleCancel = (e: Event) => {
      if (closedBy === 'none') {
        e.preventDefault();
      }
    };

    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('cancel', handleCancel);

    // Progressive enhancement fallback for closedby="any" (e.g. Safari)
    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (closedBy === 'any' && !('closedBy' in HTMLDialogElement.prototype)) {
        pressedOutside = isOutside(e);
      }
    };
    const handlePointerUp = (e: PointerEvent) => {
      if (
        closedBy === 'any' &&
        !('closedBy' in HTMLDialogElement.prototype) &&
        pressedOutside &&
        isOutside(e)
      ) {
        dialog.close();
      }
    };

    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('pointerup', handlePointerUp);

    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('pointerup', handlePointerUp);
    };
  }, [closedBy, onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      {...({ closedby: closedBy } as Record<string, string>)}
    >
      {open ? children : null}
    </dialog>
  );
}
