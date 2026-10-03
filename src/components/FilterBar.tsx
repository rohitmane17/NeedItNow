import { MapPin, Search, SlidersHorizontal } from 'lucide-react'
import { CATEGORIES, LOCATIONS, type SortKey } from '../lib/types'
import type { RequestFilters } from '../hooks/useRequests'

interface FilterBarProps {
  filters: RequestFilters
  onChange: (next: RequestFilters) => void
  resultCount: number
}

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'expiring', label: 'Expiring soon' },
  { value: 'helped', label: 'Most helped' },
]

const selectClasses =
  'h-9 appearance-none rounded-lg border border-white/10 bg-white/5 pl-8 pr-8 text-sm text-slate-200 transition hover:border-white/20 focus:border-indigo-400 focus:outline-none'

export function FilterBar({ filters, onChange, resultCount }: FilterBarProps) {
  const set = <K extends keyof RequestFilters>(key: K, value: RequestFilters[K]) =>
    onChange({ ...filters, [key]: value })

  return (
    <section className="space-y-3" aria-label="Filter requests">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={filters.query}
            onChange={(event) => set('query', event.target.value)}
            placeholder="Search: calculator, lab record, volunteer…"
            aria-label="Search requests"
            className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 transition hover:border-white/20 focus:border-indigo-400 focus:bg-white/10 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <MapPin
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <select
              value={filters.location}
              onChange={(event) => set('location', event.target.value)}
              aria-label="Filter by location"
              className={selectClasses}
            >
              <option value="All" className="bg-slate-900">
                All locations
              </option>
              {LOCATIONS.map((location) => (
                <option key={location} value={location} className="bg-slate-900">
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <SlidersHorizontal
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <select
              value={filters.sort}
              onChange={(event) => set('sort', event.target.value as SortKey)}
              aria-label="Sort requests"
              className={selectClasses}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['All', ...CATEGORIES] as const).map((category) => {
          const active = filters.category === category
          return (
            <button
              key={category}
              type="button"
              onClick={() => set('category', category)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                active
                  ? 'bg-white text-slate-900 ring-white'
                  : 'bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {category}
            </button>
          )
        })}
        <span className="ml-auto text-xs tabular-nums text-slate-500">
          {resultCount} active {resultCount === 1 ? 'request' : 'requests'}
        </span>
      </div>
    </section>
  )
}
