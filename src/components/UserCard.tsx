'use client'

import { User, UserRole } from '@/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Edit, MoreVertical, Trash2, UserCheck, UserX, Eye, Phone, Mail, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UserCardProps {
  user: User
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onToggleStatus: (user: User) => void
  onView: (user: User) => void
}

const getRoleColor = (role: UserRole) => {
  switch (role) {
    case UserRole.ADMIN:
      return 'bg-red-100 text-red-800 border-red-200'
    case UserRole.MANAGER:
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case UserRole.OPERATOR:
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrador'
    case UserRole.MANAGER:
      return 'Gerente'
    case UserRole.OPERATOR:
      return 'Operador'
    default:
      return role
  }
}

export function UserCard({ user, onEdit, onDelete, onToggleStatus, onView }: UserCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatLastLogin = (date?: Date) => {
    if (!date) return 'Nunca'
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR
    })
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
      user.isActive ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500 opacity-75'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getRoleColor(user.role)}>
                  {getRoleLabel(user.role)}
                </Badge>
                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                  {user.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(user)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                {user.isActive ? (
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
                onClick={() => onDelete(user)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          {user.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="mr-2 h-4 w-4" />
              {user.phone}
            </div>
          )}
          
          {user.department && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="mr-2 h-4 w-4" />
              {user.department}
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="mr-2 h-4 w-4" />
            Último login: {formatLastLogin(user.lastLogin)}
          </div>
          
          <div className="text-xs text-gray-500 pt-2 border-t">
            Criado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}