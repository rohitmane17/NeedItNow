import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as api from '../lib/api'
import { isExpired } from '../lib/time'
import type { Request, RequestDraft, SortKey } from '../lib/types'
import { useNow } from './useNow'

const CLEANUP_INTERVAL_MS = 60_000

export interface RequestFilters {
  query: string
  category: string
  location: string
  sort: SortKey
}

const matches = (request: Request, filters: RequestFilters): boolean => {
  const query = filters.query.trim().toLowerCase()
  const inCategory = filters.category === 'All' || request.category === filters.category
  const inLocation = filters.location === 'All' || request.location === filters.location
  if (!inCategory || !inLocation) return false
  if (!query) return true
  return [request.title, request.description ?? '', request.location, request.category]
    .join(' ')
    .toLowerCase()
    .includes(query)
}

const sortRequests = (rows: Request[], sort: SortKey): Request[] => {
  const copy = [...rows]
  switch (sort) {
    case 'expiring':
      return copy.sort((a, b) => +new Date(a.expires_at) - +new Date(b.expires_at))
    case 'helped':
      return copy.sort((a, b) => b.helper_count - a.helper_count)
    case 'newest':
    default:
      return copy.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
  }
}

/**
 * Owns the request list end-to-end:
 *  - loads rows that are still alive (`expires_at > now`),
 *  - drops rows client-side the moment they tick past 24h,
 *  - re-runs the server-side purge every minute,
 *  - exposes create / claim with optimistic updates.
 */
export function useRequests(filters: RequestFilters) {
  const now = useNow(1000)
  const [rows, setRows] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const loadingRef = useRef(false)

  const load = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    try {
      const active = await api.listRequests()
      setRows(active)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [])

  // Fetch on mount. Going through a promise keeps every setState off the
  // synchronous effect path (oxlint react/set-state-in-effect).
  useEffect(() => {
    void Promise.resolve()
      .then(load)
      .catch(() => undefined)
  }, [load])

  // Forgetful (PRN #7): hard-delete anything past 24h, on load and every minute.
  useEffect(() => {
    void api.runCleanup().catch(() => undefined)
    const id = window.setInterval(() => {
      void api.runCleanup().catch(() => undefined)
    }, CLEANUP_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [])

  // Refresh from the server periodically so new posts from other students land.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!document.hidden) void load()
    }, 30_000)
    return () => window.clearInterval(id)
  }, [load])

  const activeRows = useMemo(
    () => rows.filter((row) => !isExpired(row.expires_at, now)),
    [rows, now],
  )

  const visibleRows = useMemo(
    () => sortRequests(activeRows.filter((row) => matches(row, filters)), filters.sort),
    [activeRows, filters],
  )

  const create = useCallback(async (draft: RequestDraft) => {
    setSubmitting(true)
    try {
      const created = await api.createRequest(draft)
      setRows((current) => [created, ...current])
      setError(null)
      return created
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not post the request'
      setError(message)
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [])

  /** Optimistic helper bump; rolls back if the row expired mid-flight. */
  const claim = useCallback(async (id: string) => {
    let snapshot: Request[] = []
    setRows((current) => {
      snapshot = current
      return current.map((row) =>
        row.id === id ? { ...row, helper_count: row.helper_count + 1 } : row,
      )
    })
    try {
      const updated = await api.claimHelp(id)
      setRows((current) => current.map((row) => (row.id === id ? updated : row)))
      return updated
    } catch (err) {
      setRows(snapshot)
      const message = err instanceof Error ? err.message : 'Could not register your help'
      setError(message)
      throw err
    }
  }, [])

  const expiringSoon = activeRows.filter(
    (row) => +new Date(row.expires_at) - now < 60 * 60 * 1000,
  ).length

  const stats = {
    active: activeRows.length,
    expiringSoon,
    helpers: activeRows.reduce((sum, row) => sum + row.helper_count, 0),
  }

  return {
    requests: visibleRows,
    loading,
    error,
    submitting,
    stats,
    now,
    reload: load,
    clearError: () => setError(null),
    create,
    claim,
  }
}
