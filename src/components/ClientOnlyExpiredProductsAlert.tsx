'use client'

import dynamic from 'next/dynamic'

// Componente que só carrega no cliente para evitar problemas de hidratação
const ExpiredProductsAlert = dynamic(
  () => import('./ExpiredProductsAlert').then(mod => ({ default: mod.ExpiredProductsAlert })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="flex items-center">
          <div className="w-5 h-5 bg-gray-300 rounded mr-2"></div>
          <div className="h-4 bg-gray-300 rounded w-48"></div>
        </div>
      </div>
    )
  }
)

interface ClientOnlyExpiredProductsAlertProps {
  daysAhead?: number
  className?: string
}

export function ClientOnlyExpiredProductsAlert({ daysAhead = 7, className = '' }: ClientOnlyExpiredProductsAlertProps) {
  return <ExpiredProductsAlert daysAhead={daysAhead} className={className} />
}