import { AnimatePresence, motion } from "framer-motion";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "error" | "info";
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="pointer-events-auto rounded-2xl bg-white p-4 shadow-xl dark:bg-surface-elevated-dark dark:border dark:border-slate-700/50"
            role="status"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-text dark:text-text-dark-on-surface">{toast.title}</p>
                {toast.description && <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">{toast.description}</p>}
              </div>
              <button
                aria-label="Dismiss notification"
                className="text-text-muted transition hover:text-text dark:text-text-dark-on-surface/70 dark:hover:text-text-dark-on-surface"
                onClick={() => onDismiss(toast.id)}
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
