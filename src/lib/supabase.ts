import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const looksReal = (value: string | undefined): value is string =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  !value.includes('your-project') &&
  !value.includes('<')

/**
 * When both env vars are present the app talks to real Postgres.
 * Otherwise it falls back to the browser-local demo store so the UI is fully
 * usable before Supabase credentials exist. See README → "Going live".
 */
export const isSupabaseConfigured = Boolean(url && anonKey && looksReal(url) && looksReal(anonKey))

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: false },
    })
  : null
