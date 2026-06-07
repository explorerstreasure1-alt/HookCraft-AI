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
      }, 5000);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-[riseIn_400ms_ease-out_both] rounded-xl border px-5 py-4 text-sm font-semibold shadow-2xl backdrop-blur-xl ${
            toast.type === "success"
              ? "border-[#d4af37]/40 bg-[#121214]/90 text-[#d4af37]"
              : "border-white/10 bg-[#121214]/90 text-[#fdfbf7]"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
