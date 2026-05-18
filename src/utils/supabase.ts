import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || ''

const DEFAULT_URL = 'https://placeholder.supabase.co'

export const supabase: SupabaseClient = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : createClient(DEFAULT_URL, 'placeholder-key')

export const supabaseAdmin: SupabaseClient = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey)
  : createClient(DEFAULT_URL, 'placeholder-key')