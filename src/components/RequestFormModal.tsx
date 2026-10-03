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
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 transition hover:border-white/20 focus:border-indigo-400 focus:bg-white/10 focus:outline-none'

const labelClasses = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400'

export function RequestFormModal({
  open,
  submitting,
  error,
  onClose,
  onSubmit,
}: RequestFormModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('Items')
  const [location, setLocation] = useState('C-Block')
  const [contact, setContact] = useState('')
  const [touched, setTouched] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    titleRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const errors = {
    title: title.trim().length < 4 ? 'Give it a clear title (at least 4 characters)' : '',
    description: description.length > 400 ? 'Keep the description under 400 characters' : '',
    contact: contact.trim().length < 5 ? 'Add a way people can reach you' : '',
  }
  const isValid = !errors.title && !errors.description && !errors.contact

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
    } catch {
      // The parent surfaces the failure through `error`; keep the modal open
      // so the student does not lose what they typed.
      return
    }
    setTitle('')
    setDescription('')
    setContact('')
    setTouched(false)
  }

  const showError = (message: string) => (touched && message ? message : null)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-request-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl shadow-black/50 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="new-request-title" className="text-lg font-semibold text-white">
              Post a request
            </h2>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="size-3.5 text-indigo-300" aria-hidden />
              It will disappear automatically 24 hours from now.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          <div>
            <label className={labelClasses} htmlFor="field-title">
              What do you need?
            </label>
            <input
              id="field-title"
              ref={titleRef}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Borrow a stapler for the C-Block desk"
              maxLength={90}
              className={fieldClasses}
            />
            {showError(errors.title) ? (
              <p className="mt-1 text-xs text-rose-300">{errors.title}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClasses} htmlFor="field-description">
              Details <span className="normal-case text-slate-500">(optional)</span>
            </label>
            <textarea
              id="field-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              maxLength={400}
              placeholder="When, where, and any deadline the helper should know about."
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClasses} htmlFor="field-category">
                Category
              </label>
              <select
                id="field-category"
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

            <div>
              <label className={labelClasses} htmlFor="field-location">
                Location
              </label>
              <select
                id="field-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className={fieldClasses}
              >
                {LOCATIONS.map((option) => (
                  <option key={option} value={option} className="bg-slate-900">
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClasses} htmlFor="field-contact">
              Contact info
            </label>
            <input
              id="field-contact"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="Phone / Telegram handle / WhatsApp link"
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

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Posting…
                </>
              ) : (
                'Post for 24 hours'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
