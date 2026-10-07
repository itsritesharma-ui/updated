import { createClient } from '@supabase/supabase-js'

// The publishable key is safe to expose in a browser client. Environment
// variables still override these defaults on Vercel and local machines.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://plzlvgdlscwhbfrpcjtp.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_aI6w8Ve5aFrYxfG9b9Gi4w_Ste7yc5K'

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)


