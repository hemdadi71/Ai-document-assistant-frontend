'use client';

import { useEffect, useId, useRef } from 'react';
import { LoaderCircle, X } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  description: string;
  value?: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  title,
  description,
  value,
  confirmLabel,
  cancelLabel,
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    cancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy]);

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="glass w-full max-w-sm rounded-2xl border border-white/10 p-5 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id={titleId} className="font-semibold text-white">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={cancelLabel}
            className="rounded-lg p-1.5 text-[#8894aa] transition hover:bg-white/5 disabled:opacity-40"
          >
            <X size={17} />
          </button>
        </div>

        <p
          id={descriptionId}
          className="text-sm leading-6 text-[#a7b1c5]"
        >
          {description}
        </p>

        {value && (
          <div className="mt-3 truncate rounded-lg bg-white/[.04] px-3 py-2 text-xs text-[#d5dced]">
            {value}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-xs text-[#b2bdd0] transition hover:bg-white/5 disabled:opacity-40"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-xl bg-[#c45e69] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#d16a75] disabled:opacity-50"
          >
            {busy ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
