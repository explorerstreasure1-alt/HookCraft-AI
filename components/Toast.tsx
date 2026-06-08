"use client";

import { useEffect, useState } from "react";

type ToastType = "success" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
const listeners = new Set<(toast: Toast) => void>();

export function showToast(message: string, type: ToastType = "info") {
  const toast: Toast = { id: ++toastId, message, type };
  listeners.forEach((fn) => fn(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4500);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-rise-in rounded-xl border px-5 py-3.5 text-sm font-semibold shadow-2xl backdrop-blur-xl pointer-events-auto ${
            toast.type === "success"
              ? "border-[#d4af37]/40 bg-[#121214]/95 text-[#d4af37] shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
              : "border-white/10 bg-[#121214]/95 text-[#fdfbf7] shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === "success" && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
