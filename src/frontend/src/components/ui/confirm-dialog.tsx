import type { ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

const toneClasses = {
  danger: 'bg-[#dc2626] hover:bg-[#b91c1c]',
  warning: 'bg-[#b45309] hover:bg-[#92400e]',
  primary: 'bg-[#1a56db] hover:bg-[#1647c0]',
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'primary',
  isLoading = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0f172a]/55 px-4 py-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-[8px] border border-[#e2e8f0] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4">
          <div className="flex gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#fef3c7] text-[#b45309]">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 id="confirm-dialog-title" className="text-ui-base font-semibold text-[#0f172a]">
                {title}
              </h2>
              <p className="mt-1 text-ui-sm text-[#475569]">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-[#d1d9e6] text-[#64748b] transition hover:bg-[#f8fafc] disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children ? <div className="px-5 py-4">{children}</div> : null}

        <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center rounded-[8px] border border-[#d1d9e6] bg-white px-4 text-ui-sm font-medium text-[#0f172a] transition hover:bg-[#f8fafc] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'inline-flex h-10 items-center justify-center rounded-[8px] px-4 text-ui-sm font-medium text-white transition disabled:opacity-60',
              toneClasses[tone],
            )}
          >
            {isLoading ? 'A processar...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
