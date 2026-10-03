export const CATEGORIES = ['Items', 'Academic', 'People', 'Events', 'Other'] as const

export type Category = (typeof CATEGORIES)[number]

export const LOCATIONS = [
  'A-Block',
  'B-Block',
  'C-Block',
  'D-Block',
  'TT-Block',
  'Library',
  'A-Block Canteen',
  'Main Gate',
  'Hostel',
  'Online',
  'Other',
] as const

export type CampusLocation = (typeof LOCATIONS)[number]

export interface Request {
  id: string
  title: string
  description: string | null
  category: Category
  location: string
  contact_info: string
  created_at: string
  expires_at: string
  helper_count: number
}

/** What the create form produces — timestamps and id are filled in by the DB. */
export type RequestDraft = {
  title: string
  description: string
  category: Category
  location: string
  contact_info: string
}

export type SortKey = 'newest' | 'expiring' | 'helped'

export const isCategory = (value: string): value is Category =>
  (CATEGORIES as readonly string[]).includes(value)

export const categoryStyles: Record<Category, { chip: string; icon: string; dot: string }> = {
  Items: {
    chip: 'bg-sky-500/10 text-sky-300 ring-sky-500/30',
    icon: 'text-sky-300 bg-sky-500/10 ring-sky-500/30',
    dot: 'bg-sky-400',
  },
  Academic: {
    chip: 'bg-violet-500/10 text-violet-300 ring-violet-500/30',
    icon: 'text-violet-300 bg-violet-500/10 ring-violet-500/30',
    dot: 'bg-violet-400',
  },
  People: {
    chip: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
    icon: 'text-emerald-300 bg-emerald-500/10 ring-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  Events: {
    chip: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
    icon: 'text-amber-300 bg-amber-500/10 ring-amber-500/30',
    dot: 'bg-amber-400',
  },
  Other: {
    chip: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
    icon: 'text-rose-300 bg-rose-500/10 ring-rose-500/30',
    dot: 'bg-rose-400',
  },
}
