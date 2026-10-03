import { Hourglass, Plus, RefreshCw, Zap } from 'lucide-react'
import type { DataMode } from '../lib/api'

interface HeaderProps {
  mode: DataMode
  onPost: () => void
  onRefresh: () => void
  refreshing: boolean
}

export function Header({ mode, onPost, onRefresh, refreshing }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/25">
            <Zap className="size-5 text-white" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg font-bold tracking-tight text-white">
              NeedItNow
            </p>
            <p className="hidden text-xs text-slate-400 sm:block">
              VIT Pune · requests that live for 24 hours
            </p>
          </div>
        </div>

        <span
          className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 md:inline-flex ${
            mode === 'live'
              ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30'
              : 'bg-amber-500/10 text-amber-300 ring-amber-500/30'
          }`}
          title={
            mode === 'live'
              ? 'Connected to Supabase'
              : 'No Supabase credentials found — using local demo data'
          }
        >
          <span
            className={`size-1.5 rounded-full ${mode === 'live' ? 'bg-emerald-400' : 'bg-amber-400'}`}
          />
          {mode === 'live' ? 'Live' : 'Demo data'}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="grid size-9 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            aria-label="Refresh requests"
          >
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onPost}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Plus className="size-4" aria-hidden />
            Post a request
          </button>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center gap-2 border-t border-white/5 px-4 py-2 text-xs text-slate-400 sm:px-6">
        <Hourglass className="size-3.5 shrink-0 text-indigo-300" aria-hidden />
        <span>
          Forgetting is a feature: every request auto-deletes{' '}
          <span className="text-slate-200">24 hours</span> after it is posted — in the UI, in
          every query, and in the database.
        </span>
      </div>
    </header>
  )
}
