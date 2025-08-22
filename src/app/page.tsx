'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ShoppingCart,
  Package,
  CreditCard,
  BarChart3,
  Users,
  Settings,
  Scan,
  Calendar,
  TrendingUp,
  LogOut,
  User,
  Clock,
  FileText,
  Shield
} from 'lucide-react'
import { formatDateTime } from '@/utils'
import { ClientOnlyExpiredProductsAlert } from '@/components/ClientOnlyExpiredProductsAlert'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

// Importação dinâmica para evitar problemas de hidratação
const DashboardStats = dynamic(() => import('@/components/DashboardStats').then(mod => ({ default: mod.DashboardStats })), {
  ssr: false,
  loading: () => (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Dia</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
})

const ClientTime = dynamic(() => import('@/components/ClientTime'), {
  ssr: false,
  loading: () => <span>--:--</span>
})



// Interface movida para o hook useDashboardStats

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Nova Venda',
      description: 'Iniciar processo de venda',
      icon: ShoppingCart,
      href: '/pdv',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Escanear Produto',
      description: 'Ler código de barras',
      icon: Scan,
      href: '/pdv?scanner=true',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Produtos',
      description: 'Gerenciar inventário',
      icon: Package,
      href: '/produtos',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Vendas',
      description: 'Histórico de vendas',
      icon: BarChart3,
      href: '/vendas',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ]



  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
              src="/logo.svg" 
              alt="Logo" 
              className="h-8 w-auto"
            />
              <span className="ml-3 text-xs sm:text-sm text-gray-500 bg-blue-100 px-2 py-1 rounded-full">PDV</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Relógio em tempo real - visível em todas as telas */}
              <div className="text-sm font-mono bg-gray-100 px-3 py-1 rounded-lg">
                <Calendar className="inline w-4 h-4 mr-1 text-blue-600" />
                <ClientTime />
              </div>
              
              {/* Informações do usuário */}
              {user && (
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{user.name || user.email}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Gerente' : 'Usuário'}
                  </span>
                </div>
              )}
              
              <Button variant="outline" size="sm" asChild>
                <Link href="/configuracoes">
                  <Settings className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Configurações</span>
                </Link>
              </Button>
              
              {/* Botão de logout */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Ações Rápidas */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.title} href={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-6 text-center">
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Estatísticas */}
        <DashboardStats />

        {/* Alertas de Produtos Vencidos */}
        <section className="mb-8">
          <ClientOnlyExpiredProductsAlert daysAhead={7} />
        </section>

        {/* Navegação Principal */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Módulos do Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/pdv">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2 text-green-600" />
                    Ponto de Venda
                  </CardTitle>
                  <CardDescription>
                    Interface principal para realizar vendas com leitor de código de barras
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/produtos">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2 text-purple-600" />
                    Produtos
                  </CardTitle>
                  <CardDescription>
                    Cadastro e gerenciamento de produtos e estoque
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/categorias">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2 text-indigo-600" />
                    Categorias
                  </CardTitle>
                  <CardDescription>
                    Gerenciamento de categorias de produtos
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/vendas">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-orange-600" />
                    Vendas
                  </CardTitle>
                  <CardDescription>
                    Histórico de vendas, relatórios e acompanhamento de pagamentos
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/pagamentos">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                    Pagamentos
                  </CardTitle>
                  <CardDescription>
                    Gestão de pagamentos PIX, cartão e dinheiro
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/clientes">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-indigo-600" />
                    Clientes
                  </CardTitle>
                  <CardDescription>
                    Cadastro de clientes e histórico de compras
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/relatorios">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-red-600" />
                    Relatórios
                  </CardTitle>
                  <CardDescription>
                    Análises de vendas, produtos mais vendidos e performance
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Link para usuários - apenas para administradores */}
            {user?.role === 'admin' && (
              <Link href="/users">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2 text-indigo-600" />
                      Usuários
                    </CardTitle>
                    <CardDescription>
                      Gerenciar usuários do sistema
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}

            {/* Link para dashboard de auditoria avançado - apenas para administradores */}
            {user?.role === 'admin' && (
              <Link href="/audit-dashboard">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-red-600" />
                      Dashboard de Auditoria
                    </CardTitle>
                    <CardDescription>
                      Dashboard avançado com alertas, métricas e análises de segurança
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}

            {/* Link para logs de auditoria - apenas para administradores */}
            {user?.role === 'admin' && (
              <Link href="/audit-logs">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-gray-600" />
                      Logs de Auditoria
                    </CardTitle>
                    <CardDescription>
                      Visualizar logs de atividades do sistema
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}
          </div>
        </section>
      </main>
      </div>
    </ProtectedRoute>
  )
}