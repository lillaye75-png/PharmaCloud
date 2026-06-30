"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const colors = {
    danger: { bg: "bg-red-100", icon: "text-red-600", btn: "bg-red-600 hover:bg-red-700" },
    warning: { bg: "bg-amber-100", icon: "text-amber-600", btn: "bg-amber-600 hover:bg-amber-700" },
    info: { bg: "bg-blue-100", icon: "text-blue-600", btn: "bg-blue-600 hover:bg-blue-700" },
  };

  const c = colors[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${c.bg}`}>
            <AlertTriangle size={20} className={c.icon} />
          </div>
          <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${c.btn}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
