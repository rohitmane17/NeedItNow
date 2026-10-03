import * as demo from './demoStore'
import { supabase, isSupabaseConfigured } from './supabase'
import type { Request, RequestDraft } from './types'

/**
 * Single data layer for the app. Every read is bounded by `expires_at > now()`
 * so an expired request can never reach the UI, even if the purge job lags
 * behind (defence in depth on top of the RLS SELECT policy).
 */

export type DataMode = 'live' | 'demo'

export const dataMode: DataMode = isSupabaseConfigured ? 'live' : 'demo'

const nowIso = (): string => new Date().toISOString()

const ensureLive = () => {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

function toAppError(error: { message: string } | null, fallback: string): Error {
  return new Error(error?.message ?? fallback)
}

/** All requests that still have life left, newest first. */
export async function listRequests(): Promise<Request[]> {
  if (dataMode === 'demo') {
    await delay()
    return demo.getActiveRequests()
  }

  const { data, error } = await ensureLive()
    .from('requests')
    .select('*')
    .gt('expires_at', nowIso())
    .order('created_at', { ascending: false })

  if (error) throw toAppError(error, 'Could not load requests')
  return (data ?? []) as Request[]
}

/** Inserts a request; the database stamps created_at and a 24h expires_at. */
export async function createRequest(draft: RequestDraft): Promise<Request> {
  if (dataMode === 'demo') {
    await delay(350)
    return demo.insertRequest(draft)
  }

  const { data, error } = await ensureLive()
    .from('requests')
    .insert({
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      category: draft.category,
      location: draft.location.trim(),
      contact_info: draft.contact_info.trim(),
    })
    .select()
    .single()

  if (error) throw toAppError(error, 'Could not post the request')
  return data as Request
}

/**
 * Atomically increments helper_count via the `increment_helper_count` RPC.
 * Falls back to a guarded UPDATE if the function has not been migrated yet.
 */
export async function claimHelp(id: string): Promise<Request> {
  if (dataMode === 'demo') {
    await delay(250)
    const updated = demo.bumpHelperCount(id)
    if (!updated) throw new Error('This request has already expired')
    return updated
  }

  const client = ensureLive()

  const { data: rpcData, error: rpcError } = await client.rpc('increment_helper_count', {
    request_id: id,
  })
  if (!rpcError && rpcData) return rpcData as Request

  const { data: current, error: readError } = await client
    .from('requests')
    .select('*')
    .eq('id', id)
    .gt('expires_at', nowIso())
    .single()

  if (readError || !current) throw new Error('This request has already expired')

  const { data: updated, error: writeError } = await client
    .from('requests')
    .update({ helper_count: (current.helper_count ?? 0) + 1 })
    .eq('id', id)
    .gt('expires_at', nowIso())
    .select()
    .single()

  if (writeError) throw toAppError(writeError, 'Could not register your help')
  return updated as Request
}

/** Hard-deletes everything older than 24 hours (delete_expired_requests()). */
export async function runCleanup(): Promise<number> {
  if (dataMode === 'demo') {
    return demo.runCleanup()
  }

  const { error } = await ensureLive().rpc('delete_expired_requests')
  if (error) throw toAppError(error, 'Cleanup failed')
  return 0
}

const delay = (ms = 220) => new Promise<void>((resolve) => setTimeout(resolve, ms))
