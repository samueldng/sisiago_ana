'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  ArrowLeft
} from 'lucide-react'
import { Category } from '@/types'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    loadCategories()
    loadProductCounts()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.data)
      } else {
        console.error('Erro ao carregar categorias:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProductCounts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      
      if (data.success && data.products) {
        const counts: Record<string, number> = {}
        data.products.forEach((product: any) => {
          const categoryId = product.categoryId || 'sem-categoria'
          counts[categoryId] = (counts[categoryId] || 0) + 1
        })
        setProductCounts(counts)
      }
    } catch (error) {
      console.error('Erro ao carregar contagem de produtos:', error)
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Nome da categoria é obrigatório')
      return
    }

    try {
      setFormLoading(true)
      
      const url = editingCategory 
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories'
      
      const method = editingCategory ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(editingCategory ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!')
        setShowForm(false)
        setEditingCategory(null)
        setFormData({ name: '', description: '' })
        loadCategories()
        loadProductCounts()
      } else {
        alert(data.error || 'Erro ao salvar categoria')
      }
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      alert('Erro ao salvar categoria')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({ name: category.name, description: category.description || '' })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Categoria excluída com sucesso!')
        loadCategories()
        loadProductCounts()
      } else {
        alert(data.error || 'Erro ao excluir categoria')
      }
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      alert('Erro ao excluir categoria')
    }
  }

  const handleNewCategory = () => {
    setEditingCategory(null)
    setFormData({ name: '', description: '' })
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingCategory(null)
    setFormData({ name: '', description: '' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Categorias</h1>
            </div>
            <Button onClick={handleNewCategory}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Formulário */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Categoria *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Bebidas"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Ex: Refrigerantes, sucos, águas"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Busca */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Categorias */}
        <Card>
          <CardHeader>
            <CardTitle>Categorias ({filteredCategories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando categorias...</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" onClick={handleNewCategory}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Categoria
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Nome</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Descrição</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Produtos</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCategories.map((category) => (
                        <tr key={category.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{category.name}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-600">
                              {category.description || '-'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-600">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {productCounts[category.id] || 0} produtos
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(category)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(category.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {filteredCategories.map((category) => (
                    <Card key={category.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-lg">{category.name}</h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {category.description || 'Sem descrição'}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                          {productCounts[category.id] || 0} produtos
                        </span>
                      </div>
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          className="flex-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
