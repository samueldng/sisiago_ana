'use client'

import { UserFormData, UserRole, UserModalData } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useState, useEffect } from 'react'
import { Eye, EyeOff, User as UserIcon, Mail, Phone, Building, Shield, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UserModalProps {
  modalData: UserModalData
  onClose: () => void
  onSave: (data: UserFormData) => Promise<void>
  isLoading?: boolean
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

export function UserModal({ modalData, onClose, onSave, isLoading = false }: UserModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    password: '',
    role: UserRole.OPERATOR,
    isActive: true,
    phone: '',
    department: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (modalData.user && modalData.mode !== 'create') {
      setFormData({
        email: modalData.user.email,
        name: modalData.user.name,
        password: '',
        role: modalData.user.role,
        isActive: modalData.user.isActive,
        phone: modalData.user.phone || '',
        department: modalData.user.department || ''
      })
    } else {
      setFormData({
        email: '',
        name: '',
        password: '',
        role: UserRole.OPERATOR,
        isActive: true,
        phone: '',
        department: ''
      })
    }
    setErrors({})
  }, [modalData])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (modalData.mode === 'create' && !formData.password) {
      newErrors.password = 'Senha é obrigatória para novos usuários'
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres'
    }

    if (formData.phone && !/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Telefone inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
    }
  }

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

  const getModalTitle = () => {
    switch (modalData.mode) {
      case 'create':
        return 'Novo Usuário'
      case 'edit':
        return 'Editar Usuário'
      case 'view':
        return 'Detalhes do Usuário'
      default:
        return 'Usuário'
    }
  }

  const isViewMode = modalData.mode === 'view'

  return (
    <Dialog open={modalData.isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserIcon className="h-5 w-5" />
            <span>{getModalTitle()}</span>
          </DialogTitle>
        </DialogHeader>

        {isViewMode && modalData.user ? (
          // Modo de visualização
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={modalData.user.avatar} alt={modalData.user.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
                  {getInitials(modalData.user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{modalData.user.name}</h3>
                <p className="text-gray-600">{modalData.user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getRoleColor(modalData.user.role)}>
                    {getRoleLabel(modalData.user.role)}
                  </Badge>
                  <Badge variant={modalData.user.isActive ? 'default' : 'secondary'}>
                    {modalData.user.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <div className="flex items-center mt-1">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{modalData.user.email}</span>
                  </div>
                </div>

                {modalData.user.phone && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                    <div className="flex items-center mt-1">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{modalData.user.phone}</span>
                    </div>
                  </div>
                )}

                {modalData.user.department && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Departamento</Label>
                    <div className="flex items-center mt-1">
                      <Building className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{modalData.user.department}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Função</Label>
                  <div className="flex items-center mt-1">
                    <Shield className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{getRoleLabel(modalData.user.role)}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Último Login</Label>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{formatLastLogin(modalData.user.lastLogin)}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Criado em</Label>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{new Date(modalData.user.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Modo de criação/edição
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Ex: Vendas, TI, Administração"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Função *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.OPERATOR}>Operador</SelectItem>
                    <SelectItem value={UserRole.MANAGER}>Gerente</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Usuário ativo</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="password">
                {modalData.mode === 'create' ? 'Senha *' : 'Nova Senha (deixe em branco para manter a atual)'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={modalData.mode === 'create' ? 'Senha do usuário' : 'Nova senha (opcional)'}
                  className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
            </div>
          </form>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isViewMode ? 'Fechar' : 'Cancelar'}
          </Button>
          {!isViewMode && (
            <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Salvando...' : modalData.mode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}