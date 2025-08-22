'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  Package,
  Save,
  Scan,
  Calculator
} from 'lucide-react'
import { formatCurrency } from '@/utils'
import { Product, Category, ProductUnit } from '@/types'
import ZXingReliableScanner from '@/components/ZXingReliableScanner'

interface ProductFormData {
  name: string
  description: string
  barcode: string
  salePrice: string
  costPrice: string
  stock: string
  unit: ProductUnit
  categoryId: string
  isActive: boolean
  isPerishable: boolean
  expiryDate: string
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    barcode: '',
    salePrice: '',
    costPrice: '',
    stock: '',
    unit: ProductUnit.UN,
    categoryId: '',
    isActive: true,
    isPerishable: false,
    expiryDate: ''
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadProduct()
    loadCategories()
  }, [productId])

  const loadProduct = async () => {
    try {
      setLoadingProduct(true)
      const response = await fetch(`/api/products/${productId}`)
      const data = await response.json()
      
      if (data.success) {
        const product = data.data
        setFormData({
          name: product.name || '',
          description: product.description || '',
          barcode: product.barcode || '',
          salePrice: product.salePrice?.toString() || '',
          costPrice: product.costPrice?.toString() || '',
          stock: product.stock?.toString() || '',
          unit: product.unit || 'UN',
          categoryId: product.categoryId || '',
          isActive: product.isActive ?? true,
          isPerishable: product.isPerishable ?? false,
          expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : ''
        })
      } else {
        console.error('Erro ao carregar produto:', data.error)
        alert('Produto não encontrado')
        router.push('/produtos')
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error)
      alert('Erro ao conectar com o servidor')
      router.push('/produtos')
    } finally {
      setLoadingProduct(false)
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

  const handleInputChange = (field: keyof ProductFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.salePrice || parseFloat(formData.salePrice) <= 0) {
      newErrors.salePrice = 'Preço de venda deve ser maior que zero'
    }

    if (formData.costPrice && parseFloat(formData.costPrice) < 0) {
      newErrors.costPrice = 'Preço de custo não pode ser negativo'
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Estoque não pode ser negativo'
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Categoria é obrigatória'
    }

    // Validar produto perecível
    if (formData.isPerishable && !formData.expiryDate) {
      newErrors.expiryDate = 'Data de vencimento é obrigatória para produtos perecíveis'
    }

    if (!formData.isPerishable && formData.expiryDate) {
      newErrors.expiryDate = 'Produtos não perecíveis não devem ter data de vencimento'
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
      setLoading(true)
      
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        barcode: formData.barcode.trim() || null,
        salePrice: parseFloat(formData.salePrice),
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
        stock: parseInt(formData.stock),
        unit: formData.unit,
        categoryId: formData.categoryId,
        isActive: formData.isActive,
        isPerishable: formData.isPerishable,
        expiryDate: formData.isPerishable && formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })

      const data = await response.json()

      if (data.success) {
        alert('Produto atualizado com sucesso!')
        router.push('/produtos')
      } else {
        console.error('Erro ao atualizar produto:', data.error)
        alert(data.error || 'Erro ao atualizar produto')
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error)
      alert('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const startBarcodeScanner = () => {
    setIsScanning(true)
  }

  const handleScanResult = (barcode: string) => {
    handleInputChange('barcode', barcode)
    setIsScanning(false)
  }

  const closeBarcodeScanner = () => {
    setIsScanning(false)
  }

  const calculateMargin = () => {
    const salePrice = parseFloat(formData.salePrice) || 0
    const costPrice = parseFloat(formData.costPrice) || 0
    
    if (salePrice === 0 || costPrice === 0) return 0
    
    return ((salePrice - costPrice) / salePrice * 100).toFixed(1)
  }

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando produto...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/produtos" className="flex items-center text-gray-600 mr-4">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="hidden sm:block">Voltar</span>
              </Link>
              <Package className="w-6 h-6 mr-2 text-purple-600" />
              <h1 className="text-xl font-semibold text-gray-900">Editar Produto</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Produto *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Coca-Cola 2L"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.categoryId ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descrição detalhada do produto (opcional)"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Barras
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.barcode}
                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                    placeholder="Ex: 7894900011517"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={startBarcodeScanner}
                  >
                    <Scan className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preços e Estoque */}
          <Card>
            <CardHeader>
              <CardTitle>Preços e Estoque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço de Venda *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.salePrice}
                      onChange={(e) => handleInputChange('salePrice', e.target.value)}
                      placeholder="0,00"
                      className={`pl-10 ${errors.salePrice ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.salePrice && (
                    <p className="text-red-500 text-sm mt-1">{errors.salePrice}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço de Custo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPrice}
                      onChange={(e) => handleInputChange('costPrice', e.target.value)}
                      placeholder="0,00"
                      className={`pl-10 ${errors.costPrice ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.costPrice && (
                    <p className="text-red-500 text-sm mt-1">{errors.costPrice}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Margem de Lucro
                  </label>
                  <div className="flex items-center h-10 px-3 bg-gray-50 border border-gray-300 rounded-md">
                    <Calculator className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-700">{calculateMargin()}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque Atual *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                    placeholder="0"
                    className={errors.stock ? 'border-red-500' : ''}
                  />
                  {errors.stock && (
                    <p className="text-red-500 text-sm mt-1">{errors.stock}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value as ProductUnit)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="UN">Unidade</option>
                    <option value="KG">Quilograma</option>
                    <option value="G">Grama</option>
                    <option value="L">Litro</option>
                    <option value="ML">Mililitro</option>
                    <option value="M">Metro</option>
                    <option value="CM">Centímetro</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status do Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Produto ativo (disponível para venda)
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Produto Perecível */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Validade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPerishable"
                  checked={formData.isPerishable}
                  onChange={(e) => handleInputChange('isPerishable', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="isPerishable" className="text-sm font-medium text-gray-700">
                  Este produto é perecível (possui data de vencimento)
                </label>
              </div>
              
              {formData.isPerishable && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Vencimento *
                  </label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={errors.expiryDate ? 'border-red-500' : ''}
                  />
                  {errors.expiryDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/produtos')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </main>

      {/* Scanner de Código de Barras */}
      {isScanning && (
        <ZXingReliableScanner
          isOpen={isScanning}
          onScan={handleScanResult}
          onClose={closeBarcodeScanner}
        />
      )}
    </div>
  )
}