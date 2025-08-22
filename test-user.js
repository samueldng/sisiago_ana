const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUser() {
  try {
    // Verificar se existe usuário com ID 1
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', '1')
      .single()
    
    if (userError) {
      console.log('Erro ao buscar usuário:', userError.message)
      
      // Tentar listar todos os usuários
      const { data: allUsers, error: allError } = await supabase
        .from('users')
        .select('*')
        .limit(5)
      
      if (allError) {
        console.log('Erro ao listar usuários:', allError.message)
      } else {
        console.log('Usuários existentes:', allUsers)
      }
    } else {
      console.log('Usuário encontrado:', user)
    }
  } catch (error) {
    console.error('Erro:', error.message)
  }
}

checkUser()