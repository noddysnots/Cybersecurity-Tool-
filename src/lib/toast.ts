import { create } from "zustand";

export type ToastItem = {
  id: string;
  message: string;
  createdAt: number;
};

type ToastState = {
  toasts: ToastItem[];
  showToast: (message: string) => void;
  dismissToast: (id: string) => void;
};

function toastId(): string {
  return `toast-${Math.random().toString(36).slice(2, 10)}`;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  showToast(message) {
    const trimmed = message.trim();
    if (!trimmed) return;
    const id = toastId();
    set((state) => ({
      toasts: [...state.toasts, { id, message: trimmed, createdAt: Date.now() }],
    }));
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, 4000);
    }
  },
  dismissToast(id) {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
