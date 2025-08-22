'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  Filter,
  Download,
  Upload
} from 'lucide-react'
import { formatCurrency, translateUnit } from '@/utils'
import { Product, Category } from '@/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products')
      const data = await response.json()
      
      if (data.success) {
        setProducts(data.data)
      } else {
        console.error('Erro ao carregar produtos:', data.error)
        alert('Erro ao carregar produtos')
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      alert('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.data)
      } else {
        console.error('Erro ao carregar categorias:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  // Filtrar produtos
  const filteredProducts = (products || []).filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.includes(searchTerm) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Calcular estatísticas
  const totalProducts = products?.length || 0
  const activeProducts = products?.filter(p => p.isActive).length || 0
  const lowStockProducts = products?.filter(p => p.stock <= 10).length || 0
  const totalValue = products?.reduce((sum, p) => sum + (p.salePrice * p.stock), 0) || 0

  const deleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        setProducts(prev => prev.filter(p => p.id !== productId))
        alert('Produto excluído com sucesso!')
      } else {
        alert(data.error || 'Erro ao excluir produto')
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      alert('Erro ao excluir produto')
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Sem estoque', color: 'text-red-600 bg-red-50' }
    if (stock <= 10) return { text: 'Estoque baixo', color: 'text-yellow-600 bg-yellow-50' }
    return { text: 'Em estoque', color: 'text-green-600 bg-green-50' }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center min-w-0 flex-1">
              <Link href="/" className="flex items-center text-gray-600 mr-2 sm:mr-4 touch-friendly">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span className="hidden sm:block text-sm">Voltar</span>
              </Link>
              <Package className="w-5 h-5 sm:w-6 sm:h-6 mr-1 sm:mr-2 text-purple-600" />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Produtos</h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button variant="outline" size="sm" className="hidden md:flex touch-friendly">
                <Download className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden lg:block">Exportar</span>
              </Button>
              <Button variant="outline" size="sm" className="hidden md:flex touch-friendly">
                <Upload className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden lg:block">Importar</span>
              </Button>
              <Button variant="outline" size="sm" asChild className="touch-friendly">
                <Link href="/categorias">
                  <Package className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:block">Categorias</span>
                </Link>
              </Button>
              <Button size="sm" asChild className="touch-friendly">
                <Link href="/produtos/novo">
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:block">Novo</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{totalProducts}</div>
              <div className="text-sm text-gray-600">Total de Produtos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{activeProducts}</div>
              <div className="text-sm text-gray-600">Produtos Ativos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{lowStockProducts}</div>
              <div className="text-sm text-gray-600">Estoque Baixo</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalValue)}</div>
              <div className="text-sm text-gray-600">Valor Total</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome, código de barras ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>
            
            {showFilters && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Mínimo
                    </label>
                    <Input type="number" placeholder="0,00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Máximo
                    </label>
                    <Input type="number" placeholder="999,99" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="">Todos</option>
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="">Todos</option>
                      <option value="low">Estoque baixo</option>
                      <option value="out">Sem estoque</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando produtos...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" asChild>
                    <Link href="/produtos/novo">
                      <Plus className="w-4 h-4 mr-2" />
                      Cadastrar Primeiro Produto
                    </Link>
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
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Produto</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Categoria</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Preço</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Estoque</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const stockStatus = getStockStatus(product.stock)
                        return (
                          <tr key={product.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.barcode}</div>
                                {product.description && (
                                  <div className="text-xs text-gray-400 mt-1">{product.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {product.category?.name}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium">{formatCurrency(product.salePrice)}</div>
                              {product.costPrice && (
                                <div className="text-sm text-gray-500">
                                  Custo: {formatCurrency(product.costPrice)}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium">{product.stock} {translateUnit(product.unit)}</div>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                                {stockStatus.text}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                product.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.isActive ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <Link href={`/produtos/${product.id}/editar`}>
                                    <Edit className="w-4 h-4" />
                                  </Link>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteProduct(product.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stock)
                    return (
                      <Card key={product.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 text-lg">{product.name}</h3>
                            <p className="text-gray-600 text-sm mt-1">
                              {product.barcode && `Código: ${product.barcode}`}
                            </p>
                            {product.description && (
                              <p className="text-gray-500 text-xs mt-1">{product.description}</p>
                            )}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                            product.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                          <div>
                            <span className="text-gray-500">Categoria:</span>
                            <div className="font-medium">{product.category?.name || 'Sem categoria'}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Preço:</span>
                            <div className="font-medium">{formatCurrency(product.salePrice)}</div>
                            {product.costPrice && (
                              <div className="text-xs text-gray-500">Custo: {formatCurrency(product.costPrice)}</div>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-500">Estoque:</span>
                            <div className="font-medium">{product.stock} {translateUnit(product.unit)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Status:</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                              {stockStatus.text}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1"
                          >
                            <Link href={`/produtos/${product.id}/editar`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteProduct(product.id)}
                            className="flex-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}