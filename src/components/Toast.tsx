import { useEffect, useRef } from 'react'
import { CheckCircle2, X } from 'lucide-react'

export interface ToastMessage {
  id: number
  text: string
  tone: 'success' | 'error'
}

interface ToastProps {
  toast: ToastMessage | null
  onDismiss: () => void
}

export function Toast({ toast, onDismiss }: ToastProps) {
  // Read the latest handler through a ref. The parent re-renders every second
  // (the ticking expiry clock lives in useRequests), so an inline `onDismiss`
  // changes identity every tick. Depending on it directly restarted the timer
  // below once per second, so the toast never actually auto-dismissed.
  const onDismissRef = useRef(onDismiss)
  useEffect(() => {
    onDismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => onDismissRef.current(), 4000)
    return () => window.clearTimeout(id)
    // Deps intentionally `[toast]` only — see comment above.
  }, [toast])

  if (!toast) return null

  const isError = toast.tone === 'error'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-2xl shadow-black/40 ${
        isError
          ? 'border-rose-500/40 bg-rose-950/90 text-rose-100'
          : 'border-emerald-500/40 bg-slate-900/95 text-slate-100'
      }`}
    >
      {isError ? (
        <X className="size-4 shrink-0 text-rose-300" aria-hidden />
      ) : (
        <CheckCircle2 className="size-4 shrink-0 text-emerald-300" aria-hidden />
      )}
      <span className="min-w-0 flex-1">{toast.text}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 text-slate-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}
