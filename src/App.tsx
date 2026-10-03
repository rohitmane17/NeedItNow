import { useCallback, useState } from 'react'
import { AlertTriangle, HeartHandshake, Sparkles, Timer } from 'lucide-react'
import { Header } from './components/Header'
import { FilterBar } from './components/FilterBar'
import { RequestCard } from './components/RequestCard'
import { RequestFormModal } from './components/RequestFormModal'
import { EmptyState } from './components/EmptyState'
import { Toast, type ToastMessage } from './components/Toast'
import { useRequests, type RequestFilters } from './hooks/useRequests'
import { dataMode } from './lib/api'
import type { RequestDraft } from './lib/types'

const initialFilters: RequestFilters = {
  query: '',
  category: 'All',
  location: 'All',
  sort: 'newest',
}

const stats = [
  {
    key: 'active',
    label: 'Live requests',
    icon: Sparkles,
    tone: 'text-indigo-300 bg-indigo-500/10 ring-indigo-500/30',
  },
  {
    key: 'expiringSoon',
    label: 'Expiring < 1h',
    icon: Timer,
    tone: 'text-amber-300 bg-amber-500/10 ring-amber-500/30',
  },
  {
    key: 'helpers',
    label: 'Helpers pledged',
    icon: HeartHandshake,
    tone: 'text-emerald-300 bg-emerald-500/10 ring-emerald-500/30',
  },
] as const

export default function App() {
  const [filters, setFilters] = useState<RequestFilters>(initialFilters)
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const requests = useRequests(filters)
  const { clearError, create, claim, loading, error, submitting, stats: liveStats } = requests

  const notify = useCallback((text: string, tone: ToastMessage['tone']) => {
    setToast({ id: Date.now(), text, tone })
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await requests.reload()
    } finally {
      setRefreshing(false)
    }
  }, [requests])

  const handleSubmit = useCallback(
    async (draft: RequestDraft) => {
      try {
        await create(draft)
        setModalOpen(false)
        notify('Posted. It will auto-delete in 24 hours.', 'success')
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Could not post the request', 'error')
        throw err
      }
    },
    [create, notify],
  )

  const handleClaim = useCallback(
    async (id: string) => {
      if (claimingId) return
      setClaimingId(id)
      try {
        await claim(id)
        notify('Thanks — the requester can see you are on it.', 'success')
      } catch {
        notify('That request expired before your help could register.', 'error')
      } finally {
        setClaimingId(null)
      }
    },
    [claim, claimingId, notify],
  )

  const isFiltered =
    filters.query.trim() !== '' || filters.category !== 'All' || filters.location !== 'All'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_65%)]"
      />

      <Header
        mode={dataMode}
        onPost={() => setModalOpen(true)}
        onRefresh={handleRefresh}
        refreshing={refreshing || loading}
      />

      <main className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
        <section className="grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon
            const value = liveStats[stat.key]
            return (
              <div
                key={stat.key}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3.5"
              >
                <span className={`grid size-9 place-items-center rounded-xl ring-1 ${stat.tone}`}>
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <div>
                  <p className="text-xl font-semibold tabular-nums leading-none text-white">
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
                </div>
              </div>
            )
          })}
        </section>

        <div className="mt-8">
          <FilterBar filters={filters} onChange={setFilters} resultCount={requests.requests.length} />
        </div>

        {error ? (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p>{error}</p>
              <button
                type="button"
                onClick={clearError}
                className="mt-1 text-xs font-medium underline underline-offset-2 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        <section className="mt-6" aria-label="Active requests">
          {loading && requests.requests.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-56 animate-pulse rounded-2xl border border-white/5 bg-slate-900/50"
                />
              ))}
            </div>
          ) : requests.requests.length === 0 ? (
            <EmptyState filtered={isFiltered} onPost={() => setModalOpen(true)} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {requests.requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  now={requests.now}
                  onClaim={handleClaim}
                  claiming={claimingId === request.id}
                />
              ))}
            </div>
          )}
        </section>

        <footer className="mt-14 border-t border-white/5 pt-6 text-xs leading-relaxed text-slate-500">
          <p>
            <span className="font-medium text-slate-400">NeedItNow</span> · a 24-hour request
            board for VIT Pune. Requests are deleted exactly 24 hours after posting — enforced by
            the UI countdown, an <code className="text-slate-400">expires_at &gt; NOW()</code>{' '}
            filter on every query, row level security, and a database purge job.
            {dataMode === 'demo' ? ' Currently running on local demo data.' : ''}
          </p>
        </footer>
      </main>

      <RequestFormModal
        open={modalOpen}
        submitting={submitting}
        error={error}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
