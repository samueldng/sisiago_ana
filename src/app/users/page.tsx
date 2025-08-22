'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Search, Filter, Edit, Trash2, Eye, Users, UserCheck, UserX, Shield, Settings, Crown, Loader2 } from 'lucide-react'
import { z } from 'zod'
import { toast } from 'sonner'
import { useUsers, useUserStats, UserFilters, UserFormData } from '@/hooks/useUsers'
import { User } from '@/lib/supabase'

// Schema de validação
const userSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.enum(['ADMIN', 'MANAGER', 'OPERATOR'], {
    errorMap: () => ({ message: 'Selecione um papel válido' })
  }),
  is_active: z.boolean(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional()
})

type FormData = z.infer<typeof userSchema>

export default function UsersPage() {
  const { 
    users, 
    loading, 
    error, 
    total, 
    fetchUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    getUserById 
  } = useUsers()
  
  const { stats, loading: statsLoading, refetch: refetchStats } = useUserStats()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    role: 'OPERATOR',
    is_active: true,
    password: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const itemsPerPage = 6

  // Carregar usuários quando filtros mudarem
  useEffect(() => {
    loadUsers()
  }, [searchTerm, roleFilter, statusFilter, currentPage])

  const loadUsers = async () => {
    const filters: UserFilters = {
      search: searchTerm || undefined,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      status: statusFilter !== 'all' ? (statusFilter as 'active' | 'inactive') : undefined
    }

    const result = await fetchUsers(filters, currentPage, itemsPerPage)
    setTotalPages(result.totalPages)
  }

  // Validar formulário
  const validateForm = (data: FormData): boolean => {
    try {
      userSchema.parse(data)
      setFormErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message
          }
        })
        setFormErrors(errors)
      }
      return false
    }
  }

  // Criar usuário
  const handleCreateUser = async () => {
    if (!validateForm(formData)) return

    const result = await createUser(formData)
    if (result) {
      setIsCreateModalOpen(false)
      resetForm()
      loadUsers()
      refetchStats()
    }
  }

  // Editar usuário
  const handleEditUser = async () => {
    if (!selectedUser || !validateForm(formData)) return

    const { password, ...updateData } = formData
    const dataToUpdate = password ? formData : updateData
    
    const result = await updateUser(selectedUser.id, dataToUpdate)
    if (result) {
      setIsEditModalOpen(false)
      setSelectedUser(null)
      resetForm()
      loadUsers()
      refetchStats()
    }
  }

  // Excluir usuário
  const handleDeleteUser = async (userId: string) => {
    const success = await deleteUser(userId)
    if (success) {
      loadUsers()
      refetchStats()
    }
  }

  // Abrir modal de edição
  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name || '',
      email: user.email,
      role: user.role as 'ADMIN' | 'MANAGER' | 'OPERATOR',
      is_active: user.is_active,
      password: ''
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  // Resetar formulário
  const resetForm = () => {
    setFormData({ 
      name: '', 
      email: '', 
      role: 'OPERATOR', 
      is_active: true, 
      password: '' 
    })
    setFormErrors({})
  }

  // Mapear roles para exibição
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador'
      case 'MANAGER': return 'Gerente'
      case 'OPERATOR': return 'Operador'
      default: return role
    }
  }

  // Ícones para roles
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="h-4 w-4" />
      case 'MANAGER': return <Shield className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  // Cores para roles
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Cores para status
  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="text-gray-600 mt-1">Gerencie usuários, permissões e acessos do sistema</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome completo"
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Digite o email"
                  className={formErrors.email ? 'border-red-500' : ''}
                />
                {formErrors.email && <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>}
              </div>
              
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Digite a senha"
                  className={formErrors.password ? 'border-red-500' : ''}
                />
                {formErrors.password && <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>}
              </div>
              
              <div>
                <Label htmlFor="role">Papel</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger className={formErrors.role ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione o papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATOR">Operador</SelectItem>
                    <SelectItem value="MANAGER">Gerente</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.role && <p className="text-sm text-red-500 mt-1">{formErrors.role}</p>}
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="is_active">Usuário ativo</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateUser}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Usuário'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
       </div>

       {/* Estatísticas */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <Card>
           <CardContent className="p-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                 <p className="text-2xl font-bold text-gray-900">
                   {statsLoading ? (
                     <Loader2 className="h-6 w-6 animate-spin" />
                   ) : (
                     stats?.total || 0
                   )}
                 </p>
               </div>
               <Users className="h-8 w-8 text-blue-600" />
             </div>
           </CardContent>
         </Card>

         <Card>
           <CardContent className="p-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                 <p className="text-2xl font-bold text-green-600">
                   {statsLoading ? (
                     <Loader2 className="h-6 w-6 animate-spin" />
                   ) : (
                     stats?.active || 0
                   )}
                 </p>
               </div>
               <UserCheck className="h-8 w-8 text-green-600" />
             </div>
           </CardContent>
         </Card>

         <Card>
           <CardContent className="p-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-gray-600">Usuários Inativos</p>
                 <p className="text-2xl font-bold text-red-600">
                   {statsLoading ? (
                     <Loader2 className="h-6 w-6 animate-spin" />
                   ) : (
                     stats?.inactive || 0
                   )}
                 </p>
               </div>
               <UserX className="h-8 w-8 text-red-600" />
             </div>
           </CardContent>
         </Card>

         <Card>
           <CardContent className="p-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-gray-600">Administradores</p>
                 <p className="text-2xl font-bold text-purple-600">
                   {statsLoading ? (
                     <Loader2 className="h-6 w-6 animate-spin" />
                   ) : (
                     stats?.admins || 0
                   )}
                 </p>
               </div>
               <Crown className="h-8 w-8 text-purple-600" />
             </div>
           </CardContent>
         </Card>
       </div>

       {/* Filtros */}
       <Card>
         <CardContent className="p-6">
           <div className="flex flex-col lg:flex-row gap-4">
             <div className="flex-1">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                 <Input
                   placeholder="Buscar por nome ou email..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10"
                 />
               </div>
             </div>
             
             <div className="flex gap-2">
               <Select value={roleFilter} onValueChange={setRoleFilter}>
                 <SelectTrigger className="w-40">
                   <SelectValue placeholder="Papel" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Todos os papéis</SelectItem>
                   <SelectItem value="ADMIN">Administrador</SelectItem>
                   <SelectItem value="MANAGER">Gerente</SelectItem>
                   <SelectItem value="OPERATOR">Operador</SelectItem>
                 </SelectContent>
               </Select>
               
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                 <SelectTrigger className="w-32">
                   <SelectValue placeholder="Status" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Todos</SelectItem>
                   <SelectItem value="active">Ativo</SelectItem>
                   <SelectItem value="inactive">Inativo</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
         </CardContent>
       </Card>

       {/* Lista de Usuários */}
       {loading ? (
         <div className="flex justify-center items-center py-12">
           <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
           <span className="ml-2 text-gray-600">Carregando usuários...</span>
         </div>
       ) : error ? (
         <Card>
           <CardContent className="p-6 text-center">
             <p className="text-red-600">Erro ao carregar usuários: {error}</p>
             <Button 
               onClick={loadUsers} 
               className="mt-4"
               variant="outline"
             >
               Tentar novamente
             </Button>
           </CardContent>
         </Card>
       ) : users.length === 0 ? (
         <Card>
           <CardContent className="p-12 text-center">
             <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
             <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
             <p className="text-gray-600 mb-4">Não há usuários que correspondam aos filtros aplicados.</p>
             <Button onClick={() => {
               setSearchTerm('')
               setRoleFilter('all')
               setStatusFilter('all')
             }}>
               Limpar filtros
             </Button>
           </CardContent>
         </Card>
       ) : (
         <>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {users.map((user) => (
               <Card key={user.id} className="hover:shadow-lg transition-shadow">
                 <CardHeader className="pb-3">
                   <div className="flex items-start justify-between">
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                         <span className="text-blue-600 font-semibold text-sm">
                           {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                         </span>
                       </div>
                       <div>
                         <h3 className="font-semibold text-gray-900">{user.name || 'Sem nome'}</h3>
                         <p className="text-sm text-gray-600">{user.email}</p>
                       </div>
                     </div>
                     
                     <div className="flex space-x-1">
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => openEditModal(user)}
                         className="h-8 w-8 p-0"
                       >
                         <Edit className="h-4 w-4" />
                       </Button>
                       
                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                           <Button
                             size="sm"
                             variant="ghost"
                             className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                           <AlertDialogHeader>
                             <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                             <AlertDialogDescription>
                               Tem certeza que deseja excluir o usuário <strong>{user.name || user.email}</strong>? 
                               Esta ação não pode ser desfeita.
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel>Cancelar</AlertDialogCancel>
                             <AlertDialogAction
                               onClick={() => handleDeleteUser(user.id)}
                               className="bg-red-600 hover:bg-red-700"
                             >
                               Excluir
                             </AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                     </div>
                   </div>
                 </CardHeader>
                 
                 <CardContent className="pt-0">
                   <div className="space-y-3">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-2">
                         {getRoleIcon(user.role)}
                         <Badge className={getRoleColor(user.role)}>
                           {getRoleDisplay(user.role)}
                         </Badge>
                       </div>
                       
                       <Badge className={getStatusColor(user.is_active)}>
                         {user.is_active ? 'Ativo' : 'Inativo'}
                       </Badge>
                     </div>
                     
                     <div className="text-sm text-gray-600">
                       <p>Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                       {user.updated_at && (
                         <p>Atualizado: {new Date(user.updated_at).toLocaleDateString('pt-BR')}</p>
                       )}
                     </div>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>

           {/* Paginação */}
           {totalPages > 1 && (
             <div className="flex justify-center items-center space-x-2">
               <Button
                 variant="outline"
                 onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                 disabled={currentPage === 1}
               >
                 Anterior
               </Button>
               
               <div className="flex space-x-1">
                 {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                   <Button
                     key={page}
                     variant={currentPage === page ? "default" : "outline"}
                     onClick={() => setCurrentPage(page)}
                     className="w-10"
                   >
                     {page}
                   </Button>
                 ))}
               </div>
               
               <Button
                 variant="outline"
                 onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                 disabled={currentPage === totalPages}
               >
                 Próximo
               </Button>
             </div>
           )}
         </>
       )}

       {/* Modal de Edição */}
       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle>Editar Usuário</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div>
               <Label htmlFor="edit-name">Nome Completo</Label>
               <Input
                 id="edit-name"
                 value={formData.name}
                 onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                 placeholder="Digite o nome completo"
                 className={formErrors.name ? 'border-red-500' : ''}
               />
               {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
             </div>
             
             <div>
               <Label htmlFor="edit-email">Email</Label>
               <Input
                 id="edit-email"
                 type="email"
                 value={formData.email}
                 onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                 placeholder="Digite o email"
                 className={formErrors.email ? 'border-red-500' : ''}
               />
               {formErrors.email && <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>}
             </div>
             
             <div>
               <Label htmlFor="edit-password">Nova Senha (opcional)</Label>
               <Input
                 id="edit-password"
                 type="password"
                 value={formData.password}
                 onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                 placeholder="Digite a nova senha (deixe vazio para manter)"
                 className={formErrors.password ? 'border-red-500' : ''}
               />
               {formErrors.password && <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>}
             </div>
             
             <div>
               <Label htmlFor="edit-role">Papel</Label>
               <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
                 <SelectTrigger className={formErrors.role ? 'border-red-500' : ''}>
                   <SelectValue placeholder="Selecione o papel" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="OPERATOR">Operador</SelectItem>
                   <SelectItem value="MANAGER">Gerente</SelectItem>
                   <SelectItem value="ADMIN">Administrador</SelectItem>
                 </SelectContent>
               </Select>
               {formErrors.role && <p className="text-sm text-red-500 mt-1">{formErrors.role}</p>}
             </div>
             
             <div className="flex items-center space-x-2">
               <input
                 type="checkbox"
                 id="edit-is_active"
                 checked={formData.is_active}
                 onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                 className="rounded"
               />
               <Label htmlFor="edit-is_active">Usuário ativo</Label>
             </div>
             
             <div className="flex justify-end space-x-2 pt-4">
               <Button 
                 variant="outline" 
                 onClick={() => setIsEditModalOpen(false)}
                 disabled={loading}
               >
                 Cancelar
               </Button>
               <Button 
                 onClick={handleEditUser}
                 disabled={loading}
                 className="bg-blue-600 hover:bg-blue-700"
               >
                 {loading ? (
                   <>
                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     Salvando...
                   </>
                 ) : (
                   'Salvar Alterações'
                 )}
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   )
 }