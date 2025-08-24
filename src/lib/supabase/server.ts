import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Usar valores padrão para evitar erros durante o build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// Aviso em vez de erro para permitir o build
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Aviso: Variáveis de ambiente do Supabase não configuradas. Usando valores padrão.')
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