'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, ReactNode } from 'react'
import { toast } from 'react-hot-toast'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache por 5 minutos
            staleTime: 5 * 60 * 1000,
            // Manter cache por 10 minutos
            gcTime: 10 * 60 * 1000,
            // Retry 3 vezes com backoff exponencial
            retry: (failureCount, error) => {
              // Não retry para erros 4xx (exceto 408, 429)
              if (error instanceof Error && error.message.includes('4')) {
                const status = parseInt(error.message.match(/\d{3}/)?.[0] || '0')
                if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
                  return false
                }
              }
              return failureCount < 3
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch quando a janela ganha foco (útil para mobile)
            refetchOnWindowFocus: true,
            // Refetch quando reconecta
            refetchOnReconnect: true,
            // Não refetch automaticamente no mount se os dados são frescos
            refetchOnMount: 'always',
            // Network mode para funcionar offline
            networkMode: 'offlineFirst'
          },
          mutations: {
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            networkMode: 'offlineFirst',
            onError: (error) => {
              console.error('❌ Erro na mutação:', error)
              toast.error(
                error instanceof Error 
                  ? error.message 
                  : 'Erro ao executar operação'
              )
            }
          }
        },
        // Logger customizado para debug
        logger: {
          log: (message) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('🔍 React Query:', message)
            }
          },
          warn: (message) => {
            console.warn('⚠️ React Query Warning:', message)
          },
          error: (message) => {
            console.error('❌ React Query Error:', message)
          }
        }
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}