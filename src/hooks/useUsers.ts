import { useState, useEffect } from 'react'
import { supabase, User } from '@/lib/supabase'
import { createAuditLog } from '@/lib/audit'
import { toast } from 'sonner'

export interface UserFilters {
  search?: string
  role?: string
  status?: 'active' | 'inactive' | 'all'
}

export interface UserFormData {
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR'
  is_active: boolean
  password?: string
}

export interface UsersResponse {
  users: User[]
  total: number
  page: number
  totalPages: number
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  // Buscar usuários com filtros e paginação
  const fetchUsers = async (filters: UserFilters = {}, page = 1, limit = 10): Promise<UsersResponse> => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Aplicar filtro de busca por nome ou email
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim()
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }

      // Aplicar filtro por role
      if (filters.role && filters.role !== 'all') {
        query = query.eq('role', filters.role.toUpperCase())
      }

      // Aplicar filtro por status
      if (filters.status && filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active')
      }

      // Aplicar paginação
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error: queryError, count } = await query

      if (queryError) {
        console.error('Erro na query do Supabase:', queryError)
        throw new Error(`Erro ao buscar usuários: ${queryError.message}`)
      }

      const totalCount = count || 0
      const totalPages = Math.ceil(totalCount / limit)

      const usersData = data || []
      setUsers(usersData)
      setTotal(totalCount)

      return {
        users: usersData,
        total: totalCount,
        page,
        totalPages
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar usuários'
      console.error('Erro ao buscar usuários:', err)
      setError(errorMessage)
      toast.error(errorMessage)
      return {
        users: [],
        total: 0,
        page: 1,
        totalPages: 0
      }
    } finally {
      setLoading(false)
    }
  }

  // Criar usuário
  const createUser = async (userData: UserFormData): Promise<User | null> => {
    setLoading(true)
    setError(null)

    try {
      // Verificar se o email já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', userData.email)
        .single()
      
      if (existingUser) {
        throw new Error('Este email já está em uso')
      }

      // Criar usuário (senha será hasheada no backend)
      const { data, error: createError } = await supabase
        .from('users')
        .insert({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          is_active: userData.is_active,
          password: userData.password || 'temp123' // Senha temporária
        })
        .select()
        .single()

      if (createError) {
        throw new Error(createError.message)
      }

      if (data) {
        // Log de auditoria
        await createAuditLog(
          'users',
          data.id,
          'CREATE',
          {
            newValues: {
              name: data.name,
              email: data.email,
              role: data.role,
              is_active: data.is_active
            },
            userId: 'system' // TODO: pegar do contexto de auth
          }
        )

        toast.success('Usuário criado com sucesso!')
        // Recarregar lista de usuários
        await fetchUsers()
        return data
      }

      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar usuário'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Atualizar usuário
  const updateUser = async (id: string, userData: Partial<UserFormData>): Promise<User | null> => {
    setLoading(true)
    setError(null)

    try {
      // Buscar dados atuais para auditoria
      const { data: currentUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      
      if (!currentUser) {
        throw new Error('Usuário não encontrado')
      }

      // Se está alterando email, verificar se já existe
      if (userData.email && userData.email !== currentUser.email) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', userData.email)
          .single()
        
        if (existingUser && existingUser.id !== id) {
          throw new Error('Este email já está em uso')
        }
      }

      // Atualizar usuário
      const { data, error: updateError } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw new Error(updateError.message)
      }

      if (data) {
        // Log de auditoria
        await createAuditLog(
          'users',
          id,
          'UPDATE',
          {
            oldValues: {
              name: currentUser.name,
              email: currentUser.email,
              role: currentUser.role,
              is_active: currentUser.is_active
            },
            newValues: {
              name: data.name,
              email: data.email,
              role: data.role,
              is_active: data.is_active
            },
            userId: 'system' // TODO: pegar do contexto de auth
          }
        )

        toast.success('Usuário atualizado com sucesso!')
        // Recarregar lista de usuários
        await fetchUsers()
        return data
      }

      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar usuário'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Excluir usuário
  const deleteUser = async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      // Buscar dados atuais para auditoria
      const { data: currentUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      
      if (!currentUser) {
        throw new Error('Usuário não encontrado')
      }

      // Excluir usuário
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      // Log de auditoria
       await createAuditLog(
         'users',
         id,
         'DELETE',
         {
           oldValues: {
             name: currentUser.name,
             email: currentUser.email,
             role: currentUser.role,
             is_active: currentUser.is_active
           },
           userId: 'system' // TODO: pegar do contexto de auth
         }
       )

      toast.success('Usuário excluído com sucesso!')
      // Recarregar lista de usuários
      await fetchUsers()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir usuário'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Buscar usuário por ID
  const getUserById = async (id: string): Promise<User | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (queryError) {
        throw new Error(queryError.message)
      }

      return data || null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar usuário'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading: loading,
    isLoading: loading,
    error,
    total,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserById
  }
}

// Hook para estatísticas de usuários
export function useUserStats() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    managers: 0,
    operators: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

    try {
      // Buscar todas as estatísticas dos usuários
      const { data, error: statsError } = await supabase
        .from('users')
        .select('role, is_active')
      
      if (statsError) {
        console.error('Erro na query de estatísticas:', statsError)
        throw new Error(`Erro ao buscar estatísticas: ${statsError.message}`)
      }
      
      if (!data) {
        setStats({ total: 0, active: 0, inactive: 0, admins: 0, managers: 0, operators: 0 })
        return
      }
      
      const total = data.length
      const active = data.filter(user => user.is_active === true).length
      const inactive = data.filter(user => user.is_active === false).length
      const admins = data.filter(user => user.role === 'ADMIN').length
      const managers = data.filter(user => user.role === 'MANAGER').length
      const operators = data.filter(user => user.role === 'OPERATOR').length

      setStats({
        total,
        active,
        inactive,
        admins,
        managers,
        operators
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar estatísticas'
      console.error('Erro ao buscar estatísticas:', err)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}