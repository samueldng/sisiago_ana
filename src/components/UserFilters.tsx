'use client'

import { UserFilters as UserFiltersType, UserRole } from '@/types'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Filter, X, Users } from 'lucide-react'
import { useState } from 'react'

interface UserFiltersProps {
  filters: UserFiltersType
  onFiltersChange: (filters: UserFiltersType) => void
  totalUsers: number
  activeUsers: number
}

export function UserFilters({ filters, onFiltersChange, totalUsers, activeUsers }: UserFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined })
  }

  const handleRoleChange = (value: string) => {
    const newFilters = { ...filters }
    if (value === 'all') {
      delete newFilters.role
    } else {
      newFilters.role = value as UserRole
    }
    onFiltersChange(newFilters)
  }

  const handleStatusChange = (value: string) => {
    const newFilters = { ...filters }
    if (value === 'all') {
      delete newFilters.isActive
    } else {
      newFilters.isActive = value === 'active'
    }
    onFiltersChange(newFilters)
  }

  const handleDepartmentChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      department: value || undefined 
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = filters.search || filters.role || filters.isActive !== undefined || filters.department

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Header com estatísticas */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">
                {totalUsers} usuários
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {activeUsers} ativos
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
          </Button>
        </div>

        {/* Busca principal - sempre visível */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros expandidos */}
        {isExpanded && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro por Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Função
                </label>
                <Select
                  value={filters.role || 'all'}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as funções" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as funções</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                    <SelectItem value={UserRole.MANAGER}>Gerente</SelectItem>
                    <SelectItem value={UserRole.OPERATOR}>Operador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <Select
                  value={
                    filters.isActive === undefined 
                      ? 'all' 
                      : filters.isActive 
                        ? 'active' 
                        : 'inactive'
                  }
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Departamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento
                </label>
                <Input
                  placeholder="Filtrar por departamento"
                  value={filters.department || ''}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                />
              </div>
            </div>

            {/* Botão para limpar filtros */}
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Limpar filtros</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Indicador de filtros ativos */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Busca: {filters.search}
              </span>
            )}
            {filters.role && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Função: {filters.role === UserRole.ADMIN ? 'Administrador' : 
                         filters.role === UserRole.MANAGER ? 'Gerente' : 'Operador'}
              </span>
            )}
            {filters.isActive !== undefined && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                Status: {filters.isActive ? 'Ativo' : 'Inativo'}
              </span>
            )}
            {filters.department && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                Depto: {filters.department}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}