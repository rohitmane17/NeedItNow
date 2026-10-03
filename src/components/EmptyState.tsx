import { Inbox, TimerReset } from 'lucide-react'

interface EmptyStateProps {
  filtered: boolean
  onPost: () => void
}

export function EmptyState({ filtered, onPost }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 px-6 py-14 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/5 text-slate-300">
        {filtered ? <Inbox className="size-6" aria-hidden /> : <TimerReset className="size-6" aria-hidden />}
      </span>
      <h3 className="mt-4 text-base font-semibold text-white">
        {filtered ? 'Nothing matches those filters' : 'No active requests right now'}
      </h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-400">
        {filtered
          ? 'Try clearing the search or picking a different category — new requests appear here every few minutes.'
          : 'Everything posted in the last 24 hours has expired and been deleted. Post the first one of the day.'}
      </p>
      {!filtered ? (
        <button
          type="button"
          onClick={onPost}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Post a request
        </button>
      ) : null}
    </div>
  )
}
