import { useState } from 'react'
import {
  CalendarDays,
  Copy,
  GraduationCap,
  HelpCircle,
  MapPin,
  Package,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { categoryStyles, type Category, type Request } from '../lib/types'
import { formatCountdown, formatPostedAt, isExpired, lifetimeFraction, msUntilExpiry } from '../lib/time'

const categoryIcon: Record<Category, LucideIcon> = {
  Items: Package,
  Academic: GraduationCap,
  People: Users,
  Events: CalendarDays,
  Other: HelpCircle,
}

interface RequestCardProps {
  request: Request
  now: number
  onClaim: (id: string) => void
  claiming: boolean
}

export function RequestCard({ request, now, onClaim, claiming }: RequestCardProps) {
  const [copied, setCopied] = useState(false)
  const msLeft = msUntilExpiry(request.expires_at, now)

  if (isExpired(request.expires_at, now)) return null

  const styles = categoryStyles[request.category]
  const Icon = categoryIcon[request.category]
  const progress = lifetimeFraction(request.expires_at, now)
  const urgent = msLeft <= 60 * 60 * 1000
  const ticking = msLeft <= 15 * 60 * 1000

  const copyContact = async () => {
    try {
      await navigator.clipboard.writeText(request.contact_info)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-slate-900">
      <div className="flex items-start gap-3">
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ring-1 ${styles.icon}`}>
          <Icon className="size-4.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${styles.chip}`}>
              {request.category}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <MapPin className="size-3" aria-hidden />
              {request.location}
            </span>
          </div>
          <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-white">
            {request.title}
          </h3>
        </div>
      </div>

      {request.description ? (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-400">
          {request.description}
        </p>
      ) : null}

      {/* Expiry meter — PRN #7 rendered literally. */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="truncate text-slate-500">
            Posted {formatPostedAt(request.created_at, now)}
          </span>
          <span
            className={`inline-flex items-center gap-1 font-medium tabular-nums ${
              urgent ? 'text-rose-300' : 'text-slate-300'
            } ${ticking ? 'animate-pulse' : ''}`}
            title="This request is deleted automatically 24 hours after it was posted"
          >
            <span className={`size-1.5 rounded-full ${urgent ? 'bg-rose-400' : 'bg-emerald-400'}`} />
            Expires in {formatCountdown(msLeft)}
          </span>
        </div>
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label="Time remaining before this request is deleted automatically"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
              urgent ? 'bg-rose-400' : 'bg-gradient-to-r from-indigo-500 to-fuchsia-500'
            }`}
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
        <button
          type="button"
          onClick={copyContact}
          className="inline-flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-white/5 px-2.5 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          title="Copy contact info"
        >
          {copied ? (
            <>
              <Copy className="size-3.5 shrink-0 text-emerald-300" aria-hidden />
              <span className="truncate text-emerald-300">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{request.contact_info}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => onClaim(request.id)}
          disabled={claiming}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
        >
          <Users className="size-3.5" aria-hidden />
          I&apos;ll help · {request.helper_count}
        </button>
      </div>
    </article>
  )
}
