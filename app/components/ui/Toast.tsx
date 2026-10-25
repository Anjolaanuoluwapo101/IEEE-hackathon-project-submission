"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface Toast {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"], duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast["type"] = "info", duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  const typeStyles = {
    success: "bg-emerald text-white",
    error: "bg-danger text-white",
    info: "bg-ink text-white",
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3" role="region" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-slide-up px-4 py-3 rounded-xl shadow-xl ${typeStyles[toast.type || "info"]} flex items-center gap-3 max-w-sm`}
          role="alert"
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}