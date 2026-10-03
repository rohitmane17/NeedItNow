import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AlertCircle, Clock, Loader2, X } from 'lucide-react'
import { CATEGORIES, LOCATIONS, type Category, type RequestDraft } from '../lib/types'

interface RequestFormModalProps {
  open: boolean
  submitting: boolean
  error: string | null
  onClose: () => void
  onSubmit: (draft: RequestDraft) => Promise<void>
}

const fieldClasses =
  'w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

const labelClasses = 'mb-1.5 block text-xs font-medium text-slate-300'

export function RequestFormModal({
  open,
  submitting,
  error,
  onClose,
  onSubmit,
}: RequestFormModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('Items')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [contact, setContact] = useState('')
  const [touched, setTouched] = useState(false)

  const titleInputRef = useRef<HTMLInputElement>(null)
  const onCloseRef = useRef(onClose)

  const resetForm = () => {
    setTitle('')
    setLocation('')
    setDescription('')
    setContact('')
    setTouched(false)
  }

  // Close = reset the draft, then hand control back to the parent.
  const close = () => {
    resetForm()
    onClose()
  }

  // Track the latest onClose without widening the auto-focus effect below —
  // the parent re-renders every second (ticking clock), so an inline
  // `onClose` identity must never retrigger focus.
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // ✅ Auto-focus ONLY once when the modal opens.
  // CRITICAL: do NOT add title / location / description / contact to this
  // dependency array — that is what caused focus to jump back to the first
  // field while typing in the others. Form state is reset by `close()` /
  // `resetForm()`, never inside this effect.
  useEffect(() => {
    if (!open) return

    const focusTimer = window.setTimeout(() => titleInputRef.current?.focus(), 50)
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        resetForm()
        onCloseRef.current()
      }
    }
    const previousOverflow = document.body.style.overflow
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
    }
    // Deps intentionally `[open]` only — see comment above.
  }, [open])

  if (!open) return null

  const errors = {
    title: title.trim().length < 4 ? 'Give it a clear title (at least 4 characters)' : '',
    location: location.trim() === '' ? 'Tell people where you need it' : '',
    description: description.length > 400 ? 'Keep the details under 400 characters' : '',
    contact: contact.trim().length < 5 ? 'Add a way people can reach you' : '',
  }
  const isValid = !errors.title && !errors.location && !errors.description && !errors.contact

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (!isValid || submitting) return

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        contact_info: contact.trim(),
      })
      // Parent closes the modal on success; clear the draft so the next
      // post starts empty (belt and braces alongside `close()`).
      resetForm()
    } catch {
      // Keep the modal open on failure so the student does not lose input.
      return
    }
  }

  const showError = (message: string) => (touched && message ? message : null)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-request-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-slate-900 p-6 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="new-request-title" className="text-xl font-bold text-white">
              Post a Campus Request
            </h2>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="size-3.5 text-indigo-300" aria-hidden />
              It expires automatically 24 hours from now.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Title */}
          <div>
            <label htmlFor="req-title" className={labelClasses}>
              What do you need? <span className="text-rose-400">*</span>
            </label>
            <input
              id="req-title"
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g., Scientific Calculator fx-991EX"
              maxLength={90}
              className={fieldClasses}
            />
            {showError(errors.title) ? (
              <p className="mt-1 text-xs text-rose-300">{errors.title}</p>
            ) : null}
          </div>

          {/* Location (free text with campus suggestions) */}
          <div>
            <label htmlFor="req-location" className={labelClasses}>
              Where do you need it? <span className="text-rose-400">*</span>
            </label>
            <input
              id="req-location"
              type="text"
              list="campus-locations"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="e.g., C-Block 3rd Floor / Library"
              className={fieldClasses}
            />
            <datalist id="campus-locations">
              {LOCATIONS.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            {showError(errors.location) ? (
              <p className="mt-1 text-xs text-rose-300">{errors.location}</p>
            ) : null}
            <p className="mt-1 text-[11px] text-slate-500">
              Pick a campus spot so it matches the location filter.
            </p>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="req-category" className={labelClasses}>
              Category
            </label>
            <select
              id="req-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as Category)}
              className={fieldClasses}
            >
              {CATEGORIES.map((option) => (
                <option key={option} value={option} className="bg-slate-900">
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="req-desc" className={labelClasses}>
              Details / Notes
            </label>
            <textarea
              id="req-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Needed for today's practical exam till 2 PM…"
              rows={3}
              maxLength={400}
              className={`${fieldClasses} resize-none`}
            />
            <div className="mt-1 flex items-center justify-between">
              {showError(errors.description) ? (
                <p className="text-xs text-rose-300">{errors.description}</p>
              ) : (
                <span />
              )}
              <span className="text-[11px] tabular-nums text-slate-500">
                {description.length}/400
              </span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <label htmlFor="req-contact" className={labelClasses}>
              Contact Info <span className="text-rose-400">*</span>
            </label>
            <input
              id="req-contact"
              type="text"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="Telegram handle or WhatsApp number"
              className={fieldClasses}
            />
            {showError(errors.contact) ? (
              <p className="mt-1 text-xs text-rose-300">{errors.contact}</p>
            ) : null}
          </div>

          {error ? (
            <p className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {error}
            </p>
          ) : null}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={close}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Posting…
                </span>
              ) : (
                'Post Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
