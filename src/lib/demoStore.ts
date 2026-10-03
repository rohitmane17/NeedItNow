import { isCategory, type Category, type Request, type RequestDraft } from './types'
import { lifetimeWindow } from './time'

/**
 * localStorage-backed stand-in for Postgres, used until VITE_SUPABASE_* env
 * vars exist. It mimics the same rules the database enforces:
 *   - rows live 24 hours,
 *   - expired rows are never returned,
 *   - reads trigger a purge (delete_expired_requests()).
 */

const STORAGE_KEY = 'needitnow.requests.v1'
const HOUR = 60 * 60 * 1000

type Seed = Omit<Request, 'id' | 'expires_at'> & { ageMs: number }

const seedRows: Seed[] = [
  {
    title: 'Need a scientific calculator (Casio fx-991) for 2 hours',
    description:
      'Tomorrow\'s Engineering Mathematics II internal. Happy to pick it up from C-Block and return it the same day.',
    category: 'Items',
    location: 'C-Block',
    contact_info: 'WhatsApp +91 98XXX 41120',
    created_at: '',
    helper_count: 2,
    ageMs: 1.5 * HOUR,
  },
  {
    title: 'DSA lab record pages — someone to get mine from the staff room',
    description:
      'I am on leave today. Experiment 7 record needs to be submitted before 5 PM to Prof. Kulkarni.',
    category: 'Academic',
    location: 'B-Block',
    contact_info: 'Telegram @aarav_vit',
    created_at: '',
    helper_count: 0,
    ageMs: 4 * HOUR,
  },
  {
    title: 'Looking for a teammate for the hackathon pitch tonight',
    description:
      'Need one designer/dev comfortable with Figma or React. Idea is finalised, only the deck and demo remain.',
    category: 'People',
    location: 'Online',
    contact_info: 'Discord: rohan#4411',
    created_at: '',
    helper_count: 3,
    ageMs: 7 * HOUR,
  },
  {
    title: 'Extra umbrella needed at the Main Gate',
    description: 'Raining hard and I left mine in the hostel. Will return it tomorrow morning.',
    category: 'Other',
    location: 'Main Gate',
    contact_info: 'Call +91 90XXX 88213',
    created_at: '',
    helper_count: 1,
    ageMs: 11 * HOUR,
  },
  {
    title: 'Volunteers for the tech fest registration desk',
    description:
      'Two-hour shift, 10 AM–12 PM at A-Block. Lunch coupon included. No prior experience required.',
    category: 'Events',
    location: 'A-Block',
    contact_info: 'WhatsApp group: vit-techfest-volunteers',
    created_at: '',
    helper_count: 5,
    ageMs: 19 * HOUR,
  },
  {
    title: 'Borrow a 65W USB-C charger overnight',
    description: 'Laptop charger died and the service centre opens only after tomorrow. Will return by 9 AM.',
    category: 'Items',
    location: 'Hostel',
    contact_info: 'Telegram @meera_p',
    created_at: '',
    helper_count: 0,
    ageMs: 23 * HOUR,
  },
]

const randomId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `local-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`

function readStore(): Request[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (row): row is Request =>
        typeof row === 'object' &&
        row !== null &&
        typeof (row as Request).id === 'string' &&
        typeof (row as Request).expires_at === 'string' &&
        isCategory(String((row as Request).category)),
    )
  } catch {
    return []
  }
}

function writeStore(rows: Request[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
  } catch {
    // Private browsing / quota exceeded — demo keeps working in memory only.
  }
}

function seed(): Request[] {
  const now = Date.now()
  const rows = seedRows.map((row) => {
    const created = now - row.ageMs
    const { ageMs: _ignored, ...rest } = row
    void _ignored
    return {
      ...rest,
      id: randomId(),
      created_at: new Date(created).toISOString(),
      expires_at: new Date(created + 24 * HOUR).toISOString(),
    }
  })
  writeStore(rows)
  return rows
}

/** Drops everything past its 24h window — the demo twin of delete_expired_requests(). */
export function purgeExpired(rows: Request[] = readStore()): Request[] {
  const alive = rows.filter((row) => new Date(row.expires_at).getTime() > Date.now())
  if (alive.length !== rows.length) writeStore(alive)
  return alive
}

export function getActiveRequests(): Request[] {
  let rows = readStore()
  if (rows.length === 0) {
    rows = seed()
  }
  return purgeExpired(rows)
    .slice()
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
}

export function insertRequest(draft: RequestDraft): Request {
  const timestamps = lifetimeWindow()
  const row: Request = {
    id: randomId(),
    title: draft.title.trim(),
    description: draft.description.trim() ? draft.description.trim() : null,
    category: draft.category as Category,
    location: draft.location.trim(),
    contact_info: draft.contact_info.trim(),
    helper_count: 0,
    ...timestamps,
  }
  writeStore([row, ...purgeExpired()])
  return row
}

export function bumpHelperCount(id: string): Request | null {
  const rows = purgeExpired()
  const row = rows.find((candidate) => candidate.id === id)
  if (!row) return null
  const updated: Request = { ...row, helper_count: row.helper_count + 1 }
  writeStore(rows.map((candidate) => (candidate.id === id ? updated : candidate)))
  return updated
}

export function runCleanup(): number {
  const before = readStore().length
  const after = purgeExpired().length
  return before - after
}
