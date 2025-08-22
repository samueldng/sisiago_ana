'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  Users,
  UserCheck,
  UserX,
  Shield,
  MoreVertical,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

import { useUsers } from '@/hooks/useUsers'

// Mapeamento de roles para exibição
const roleMapping = {
  ADMIN: { label: 'Administrador', color: 'bg-red-100 text-red-800' },
  MANAGER: { label: 'Gerente', color: 'bg-blue-100 text-blue-800' },
  OPERATOR: { label: 'Operador', color: 'bg-green-100 text-green-800' }
} as const

type RoleKey = keyof typeof roleMapping

function UserManagement() {
  const { users, isLoading, error, updateUser, deleteUser } = useUsers()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Filtros
  const filteredUsers = useMemo(() => {
    if (!users) return []
    
    return users.filter(user => {
      const matchesSearch = (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = selectedRole === 'all' || user.role === selectedRole
      const matchesStatus = selectedStatus === 'all' || 
                           (selectedStatus === 'active' && user.is_active) ||
                           (selectedStatus === 'inactive' && !user.is_active)
      
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, selectedRole, selectedStatus])

  // Estatísticas
  const stats = useMemo(() => {
    if (!users) return { total: 0, active: 0, inactive: 0, admins: 0, managers: 0, operators: 0 }
    
    const total = users.length
    const active = users.filter(u => u.is_active).length
    const inactive = total - active
    const admins = users.filter(u => u.role === 'ADMIN').length
    const managers = users.filter(u => u.role === 'MANAGER').length
    const operators = users.filter(u => u.role === 'OPERATOR').length

    return { total, active, inactive, admins, managers, operators }
  }, [users])

  const handleToggleStatus = async (userId: string) => {
    const user = users?.find(u => u.id === userId)
    if (user) {
      await updateUser(userId, { is_active: !user.is_active })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      await deleteUser(userId)
    }
  }

  // Função para obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }



  if (!isMounted || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando usuários...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2 text-red-600">Erro ao carregar usuários</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários do sistema de forma eficiente
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} ativos, {stats.inactive} inativos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Inativos</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.inactive / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.admins}</div>
            <p className="text-xs text-muted-foreground">
              {stats.managers} gerentes, {stats.operators} operadores
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, email ou departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm"
        >
          <option value="all">Todas as funções</option>
          <option value="ADMIN">Administrador</option>
          <option value="MANAGER">Gerente</option>
          <option value="OPERATOR">Operador</option>
        </select>
        
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>

      {/* Resultados */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredUsers.length} de {users?.length || 0} usuários
        </p>
        {filteredUsers.length !== (users?.length || 0) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setSearchTerm('')
              setSelectedRole('all')
              setSelectedStatus('all')
            }}
          >
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Grid de usuários */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {(users?.length || 0) === 0 ? 'Nenhum usuário cadastrado' : 'Nenhum usuário encontrado'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {(users?.length || 0) === 0 
                ? 'Comece criando o primeiro usuário do sistema.'
                : 'Tente ajustar os filtros ou criar um novo usuário.'
              }
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {(users?.length || 0) === 0 ? 'Criar Primeiro Usuário' : 'Novo Usuário'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(user.name || 'U')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{user.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                          onClick={() => handleToggleStatus(user.id)}
                        >
                          {user.is_active ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${user.role && user.role in roleMapping ? roleMapping[user.role as RoleKey].color : 'bg-gray-100 text-gray-800'}`}
                    >
                      {user.role && user.role in roleMapping ? roleMapping[user.role as RoleKey].label : (user.role || 'Sem função')}
                    </Badge>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  
                  {user.department && (
                    <div>
                      <p className="text-xs text-muted-foreground">Departamento</p>
                      <p className="text-sm font-medium">{user.department}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Criado em</p>
                    <p className="text-sm">{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserManagement