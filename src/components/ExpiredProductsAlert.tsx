'use client'

import { useExpiredProducts } from '@/hooks/useExpiredProducts'
import { AlertTriangle, Clock, Package, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ExpiredProductsAlertProps {
  daysAhead?: number
  className?: string
}

export function ExpiredProductsAlert({ daysAhead = 7, className = '' }: ExpiredProductsAlertProps) {
  const { data, summary, loading, error } = useExpiredProducts(daysAhead)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Evitar problemas de hidratação
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Não renderizar no servidor para evitar hidratação
  if (!isMounted) {
    return null
  }

  // Não exibir se foi dispensado ou se não há produtos vencidos/próximos ao vencimento
  if (isDismissed || (!loading && (!data || data.total === 0))) {
    return null
  }

  if (loading) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-yellow-600 mr-2 animate-spin" />
          <span className="text-yellow-800">Verificando produtos vencidos...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">Erro ao verificar produtos vencidos: {error}</span>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  if (!data || !summary) {
    return null
  }

  const hasExpiredProducts = data.expired.length > 0
  const hasExpiringSoonProducts = data.expiringSoon.length > 0

  const alertColor = hasExpiredProducts ? 'red' : 'yellow'
  const bgColor = hasExpiredProducts ? 'bg-red-50' : 'bg-yellow-50'
  const borderColor = hasExpiredProducts ? 'border-red-200' : 'border-yellow-200'
  const textColor = hasExpiredProducts ? 'text-red-800' : 'text-yellow-800'
  const iconColor = hasExpiredProducts ? 'text-red-600' : 'text-yellow-600'

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-3 sm:p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <AlertTriangle className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium ${textColor} text-sm sm:text-base`}>
              {hasExpiredProducts ? 'Produtos Vencidos!' : 'Produtos Próximos ao Vencimento'}
            </h3>
            <p className={`text-xs sm:text-sm ${textColor} mt-1 break-words`}>
              {hasExpiredProducts && (
                <span className="font-medium">
                  {data.expired.length} produto(s) vencido(s)
                </span>
              )}
              {hasExpiredProducts && hasExpiringSoonProducts && (
                <span className="hidden sm:inline"> • </span>
              )}
              {hasExpiredProducts && hasExpiringSoonProducts && (
                <br className="sm:hidden" />
              )}
              {hasExpiringSoonProducts && (
                <span>
                  {data.expiringSoon.length} produto(s) vencendo em {daysAhead} dias
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className={`${iconColor} hover:opacity-75 p-1 rounded touch-manipulation`}
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            <Package className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className={`${iconColor} hover:opacity-75 p-1 rounded touch-manipulation`}
            title="Dispensar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="mt-3 sm:mt-4 space-y-3">
          {/* Produtos Vencidos */}
          {data.expired.length > 0 && (
            <div>
              <h4 className="font-medium text-red-700 mb-2 text-sm sm:text-base">Produtos Vencidos:</h4>
              <div className="space-y-2">
                {data.expired.map((product) => (
                  <div key={product.id} className="bg-white rounded p-2 sm:p-3 border border-red-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{product.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Categoria: {product.category?.name || 'N/A'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Estoque: {product.stock} unidades
                        </p>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <p className="text-xs sm:text-sm font-medium text-red-600">
                          Vencido há {Math.abs(product.daysUntilExpiry)} dia(s)
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(product.expiryDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Produtos Próximos ao Vencimento */}
          {data.expiringSoon.length > 0 && (
            <div>
              <h4 className="font-medium text-yellow-700 mb-2 text-sm sm:text-base">Próximos ao Vencimento:</h4>
              <div className="space-y-2">
                {data.expiringSoon.map((product) => (
                  <div key={product.id} className="bg-white rounded p-2 sm:p-3 border border-yellow-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{product.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Categoria: {product.category?.name || 'N/A'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Estoque: {product.stock} unidades
                        </p>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <p className="text-xs sm:text-sm font-medium text-yellow-600">
                          {product.daysUntilExpiry} dia(s) restante(s)
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(product.expiryDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}