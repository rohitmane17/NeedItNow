import { addHours, differenceInMilliseconds, formatDistance } from 'date-fns'

/** PRN #7 "Forgetful": the entire lifetime of a request. */
export const LIFETIME_HOURS = 24
export const LIFETIME_MS = LIFETIME_HOURS * 60 * 60 * 1000

/** When a request created at `createdAt` must disappear. */
export function expiryFrom(createdAt: Date | string): Date {
  return addHours(new Date(createdAt), LIFETIME_HOURS)
}

/** Milliseconds until the request hard-expires (negative once it is dead). */
export function msUntilExpiry(expiresAt: string, now: number): number {
  return differenceInMilliseconds(new Date(expiresAt), now)
}

export function isExpired(expiresAt: string, now: number): boolean {
  return msUntilExpiry(expiresAt, now) <= 0
}

/** 0 → freshly posted, 1 → about to vanish. Drives the expiry progress bar. */
export function lifetimeFraction(expiresAt: string, now: number): number {
  const remaining = msUntilExpiry(expiresAt, now)
  return Math.min(1, Math.max(0, 1 - remaining / LIFETIME_MS))
}

/** "23h 12m" / "12m 04s" / "expired" */
export function formatCountdown(msLeft: number): string {
  if (msLeft <= 0) return 'expired'
  const totalSeconds = Math.floor(msLeft / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`
  return `${seconds}s`
}

/** "3 hours ago" — measured against the shared ticking clock, not Date.now(). */
export function formatPostedAt(createdAt: string, now: number): string {
  return formatDistance(new Date(createdAt), new Date(now), { addSuffix: true })
}

/** Timestamps for the demo store, which has no database to apply defaults. */
export function lifetimeWindow(now = Date.now()): { created_at: string; expires_at: string } {
  return {
    created_at: new Date(now).toISOString(),
    expires_at: new Date(now + LIFETIME_MS).toISOString(),
  }
}
