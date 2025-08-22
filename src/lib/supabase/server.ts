import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// Cliente para uso no servidor com service role key
export const createServerClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Cliente para uso no servidor com cookies do usuário
export const createServerClientWithAuth = () => {
  const cookieStore = cookies()
  
  return createSupabaseClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          cookie: cookieStore.toString()
        }
      }
    }
  )
}

// Export padrão para compatibilidade
export const supabase = createServerClient()
export default supabase

// Cliente para uso em APIs de auditoria
export const createClient = createServerClient