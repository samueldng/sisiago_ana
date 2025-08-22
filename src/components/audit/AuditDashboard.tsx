'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuditStats } from '@/hooks/useAuditStats'
import { useAuditAlerts } from '@/hooks/useAuditAlerts'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { 
  ShoppingCart, 
  Package, 
  Users, 
  LogIn, 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Database,
  Clock,
  RefreshCw,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  Edit,
  Trash2,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'

interface AuditDashboardProps {
  className?: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const SEVERITY_COLORS = {
  low: '#10B981',
  medium: '#F59E0B', 
  high: '#EF4444',
  critical: '#DC2626'
}

export function AuditDashboard({ className }: AuditDashboardProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [activeTab, setActiveTab] = useState('overview')
  
  const { 
    stats, 
    loading: statsLoading, 
    error: statsError,
    getTimeRangeStats,
    compareWithPrevious,
    refresh: refreshStats
  } = useAuditStats({
    autoRefresh: true,
    refreshInterval: 60000,
    includeHourlyStats: true,
    includeDailyStats: true,
    includeRiskMetrics: true
  })

  const {
    alerts,
    unacknowledgedCount,
    loading: alertsLoading,
    refresh: refreshAlerts
  } = useAuditAlerts({
    autoRefresh: true,
    enableRealTime: true
  })

  // Função para mapear operações para contexto de negócio
  const getBusinessContext = (tableName: string, operation: string) => {
    const contexts = {
      'sales': {
        'INSERT': { icon: ShoppingCart, label: 'Nova Venda', color: 'text-green-600' },
        'UPDATE': { icon: Edit, label: 'Venda Alterada', color: 'text-yellow-600' },
        'DELETE': { icon: Trash2, label: 'Venda Cancelada', color: 'text-red-600' }
      },
      'products': {
        'INSERT': { icon: Plus, label: 'Produto Cadastrado', color: 'text-blue-600' },
        'UPDATE': { icon: Package, label: 'Produto Alterado', color: 'text-orange-600' },
        'DELETE': { icon: Trash2, label: 'Produto Removido', color: 'text-red-600' }
      },
      'users': {
        'INSERT': { icon: Users, label: 'Usuário Criado', color: 'text-purple-600' },
        'UPDATE': { icon: Edit, label: 'Usuário Alterado', color: 'text-indigo-600' },
        'DELETE': { icon: Trash2, label: 'Usuário Removido', color: 'text-red-600' }
      },
      'payments': {
        'INSERT': { icon: DollarSign, label: 'Pagamento Registrado', color: 'text-green-600' },
        'UPDATE': { icon: Edit, label: 'Pagamento Alterado', color: 'text-yellow-600' }
      }
    };
    
    return contexts[tableName]?.[operation] || { icon: Shield, label: 'Operação', color: 'text-gray-600' };
  };

  // Função para gerar descrição detalhada da operação
  const getBusinessDescription = (log: any) => {
    const { table_name, operation, new_values, old_values } = log;
    
    switch (table_name) {
      case 'sales':
        if (operation === 'INSERT') {
          const total = new_values?.total || new_values?.final_total;
          return total ? `Valor: R$ ${parseFloat(total).toFixed(2)}` : 'Nova transação';
        }
        if (operation === 'UPDATE') {
          return 'Status ou dados alterados';
        }
        return 'Venda cancelada';
        
      case 'products':
        if (operation === 'INSERT') {
          return new_values?.name ? `"${new_values.name}"` : 'Novo produto';
        }
        if (operation === 'UPDATE') {
          if (old_values?.stock !== new_values?.stock) {
            return `Estoque: ${old_values?.stock || 0} → ${new_values?.stock || 0}`;
          }
          if (old_values?.sale_price !== new_values?.sale_price) {
            return `Preço alterado`;
          }
          return 'Dados atualizados';
        }
        return 'Produto removido';
        
      case 'users':
        if (operation === 'INSERT') {
          return new_values?.name ? `"${new_values.name}"` : 'Novo usuário';
        }
        if (operation === 'UPDATE') {
          if (old_values?.role !== new_values?.role) {
            return `Perfil: ${old_values?.role} → ${new_values?.role}`;
          }
          return 'Dados atualizados';
        }
        return 'Usuário removido';
        
      case 'payments':
        if (operation === 'INSERT') {
          const amount = new_values?.amount;
          const method = new_values?.method;
          return `${method ? method.toUpperCase() : 'Pagamento'} ${amount ? `- R$ ${parseFloat(amount).toFixed(2)}` : ''}`;
        }
        return 'Pagamento alterado';
        
      default:
        return `${operation.toLowerCase()} em ${table_name}`;
    }
  };

  const handleTimeRangeChange = (range: '1h' | '24h' | '7d' | '30d') => {
    setTimeRange(range)
    getTimeRangeStats(range)
  }

  const handleRefresh = () => {
    refreshStats()
    refreshAlerts()
    toast.success('Dashboard atualizado')
  }

  const handleCompareWithPrevious = async () => {
    const comparison = await compareWithPrevious()
    if (comparison) {
      const change = ((comparison.current.totalLogs - comparison.previous.totalLogs) / comparison.previous.totalLogs) * 100
      toast.info(`Variação: ${change > 0 ? '+' : ''}${change.toFixed(1)}% em relação ao período anterior`)
    }
  }

  if (statsLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Alert Banner Skeleton */}
        <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <div className="flex space-x-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-red-500 mb-4">
            <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</h3>
          <p className="text-red-600 mb-4">{statsError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  // Preparar dados para gráficos de negócio
  const businessData = stats?.tableStats ? stats.tableStats.map(table => ({
    name: table.table_name === 'sales' ? 'Vendas' :
          table.table_name === 'products' ? 'Produtos' :
          table.table_name === 'users' ? 'Usuários' :
          table.table_name === 'payments' ? 'Pagamentos' :
          table.table_name,
    value: table.count,
    color: COLORS[stats.tableStats.indexOf(table) % COLORS.length]
  })) : []

  const operationData = stats?.operationStats ? [
    { name: 'Inserções', value: stats.operationStats.INSERT || 0, color: COLORS[0] },
    { name: 'Atualizações', value: stats.operationStats.UPDATE || 0, color: COLORS[1] },
    { name: 'Exclusões', value: stats.operationStats.DELETE || 0, color: COLORS[2] }
  ] : []

  const operationTypeData = stats?.operationStats ? [
    { name: 'Criações', value: stats.operationStats.INSERT || 0, color: COLORS[0] },
    { name: 'Alterações', value: stats.operationStats.UPDATE || 0, color: COLORS[1] },
    { name: 'Exclusões', value: stats.operationStats.DELETE || 0, color: COLORS[2] }
  ] : []

  const riskLevel = stats?.riskMetrics?.riskScore || 0
  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getRiskLabel = (score: number) => {
    if (score >= 80) return 'Crítico'
    if (score >= 60) return 'Alto'
    if (score >= 40) return 'Médio'
    return 'Baixo'
  }

  return (
    <div className={`min-h-screen bg-gray-50 p-2 sm:p-4 space-y-4 sm:space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Dashboard de Auditoria</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitoramento em tempo real das atividades do sistema
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-28 sm:w-32 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Última hora</SelectItem>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleCompareWithPrevious} variant="outline" size="sm" className="hidden sm:flex">
            <TrendingUp className="h-4 w-4 mr-2" />
            Comparar
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {unacknowledgedCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-800">
                  {unacknowledgedCount} alerta{unacknowledgedCount > 1 ? 's' : ''} de segurança não reconhecido{unacknowledgedCount > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-red-600">
                  Clique na aba "Alertas" para revisar
                </p>
              </div>
              <Button 
                onClick={() => setActiveTab('alerts')} 
                variant="destructive" 
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Revisar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Vendas</CardTitle>
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-base sm:text-2xl font-bold text-green-600">
              {statsLoading ? '...' : stats?.tableStats?.find(t => t.table_name === 'sales')?.count || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="sm:hidden">Trans.</span>
              <span className="hidden sm:inline">Transações</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Produtos</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-base sm:text-2xl font-bold text-orange-600">
              {statsLoading ? '...' : stats?.tableStats?.find(t => t.table_name === 'products')?.count || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="sm:hidden">Alt.</span>
              <span className="hidden sm:inline">Alterações</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Usuários</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-base sm:text-2xl font-bold text-purple-600">
              {statsLoading ? '...' : stats?.userStats?.length || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="sm:hidden">Ativ.</span>
              <span className="hidden sm:inline">Ativos</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Pagamentos</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-1 sm:pt-2">
            <div className="text-base sm:text-2xl font-bold text-blue-600">
              {statsLoading ? '...' : stats?.tableStats?.find(t => t.table_name === 'payments')?.count || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="sm:hidden">Trans.</span>
              <span className="hidden sm:inline">Transações</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-4 min-w-[320px] h-auto p-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2">
              <div className="flex flex-col items-center gap-1">
                <Database className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs">Geral</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="operations" className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2">
              <div className="flex flex-col items-center gap-1">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs">Ops</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2">
              <div className="flex flex-col items-center gap-1">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs">Trends</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2 relative">
              <div className="flex flex-col items-center gap-1">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs">Alertas</span>
                {unacknowledgedCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center">
                    {unacknowledgedCount > 9 ? '9+' : unacknowledgedCount}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-3 sm:space-y-4">
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
            {/* Operations Distribution */}
            <Card>
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-sm sm:text-base">Distribuição de Operações</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Tipos de operações realizadas no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={operationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => {
                          // Hide labels on very small screens
                          if (typeof window !== 'undefined' && window.innerWidth < 640) {
                            return percent > 0.1 ? `${(percent * 100).toFixed(0)}%` : '';
                          }
                          return `${name} ${(percent * 100).toFixed(0)}%`;
                        }}
                        outerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 50 : 80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {operationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [value, name]}
                        labelStyle={{ fontSize: '12px' }}
                        contentStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Tables */}
            <Card>
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-sm sm:text-base">Tabelas Mais Ativas</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Tabelas com maior número de modificações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-4">
                  {stats?.tableStats?.slice(0, 5).map((table, index) => (
                    <div key={table.table_name} className="flex items-center justify-between p-2 sm:p-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="font-medium text-sm sm:text-base truncate">{table.table_name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">{table.count}</Badge>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-center py-4 text-sm">
                      Nenhum dado disponível
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Atividade Recente */}
          <Card>
            <CardHeader className="pb-2 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                Atividades Recentes do Negócio
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Últimas operações importantes registradas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {stats?.recentActivity?.slice(0, 8).map((log, index) => {
                  const context = getBusinessContext(log.table_name, log.operation);
                  const IconComponent = context.icon;
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`p-1.5 sm:p-2 rounded-full bg-gray-100 ${context.color} flex-shrink-0`}>
                          <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">{context.label}</p>
                          <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
                            <span className="truncate">{log.users?.name || 'Sistema'}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">{log.table_name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs sm:text-sm font-medium">
                          {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                }) || (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <Shield className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm sm:text-base">Nenhuma atividade recente encontrada</p>
                    <p className="text-xs">As operações aparecerão aqui conforme forem realizadas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-3 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
            {/* Atividades de Negócio */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  Atividades de Negócio
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Distribuição das operações por área
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.tableStats && stats.tableStats.length > 0 ? (
                  <div className="h-[200px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.tableStats.map(table => ({
                            name: table.table_name === 'sales' ? 'Vendas' :
                                  table.table_name === 'products' ? 'Produtos' :
                                  table.table_name === 'users' ? 'Usuários' :
                                  table.table_name === 'payments' ? 'Pagamentos' :
                                  table.table_name,
                            value: table.count,
                            color: COLORS[stats.tableStats.indexOf(table) % COLORS.length]
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => {
                            if (typeof window !== 'undefined' && window.innerWidth < 640) {
                              return percent > 0.1 ? `${(percent * 100).toFixed(0)}%` : '';
                            }
                            return `${name} ${(percent * 100).toFixed(0)}%`;
                          }}
                          outerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 50 : 80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {stats.tableStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-gray-500">
                    <ShoppingCart className="h-8 w-8 sm:h-12 sm:w-12 mb-4 opacity-50" />
                    <p className="text-xs sm:text-sm font-medium">Nenhuma atividade registrada</p>
                    <p className="text-xs text-gray-400 mt-1">As operações aparecerão aqui conforme forem realizadas</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Operações por Tipo */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                  <Database className="h-4 w-4 sm:h-5 sm:w-5" />
                  Operações por Tipo
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Criações, alterações e exclusões
                </CardDescription>
              </CardHeader>
              <CardContent>
                {operationData && operationData.length > 0 ? (
                  <div className="h-[200px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={operationData} margin={{ bottom: typeof window !== 'undefined' && window.innerWidth < 640 ? 20 : 40 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          fontSize={typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 12}
                          angle={typeof window !== 'undefined' && window.innerWidth < 640 ? 0 : -45}
                          textAnchor={typeof window !== 'undefined' && window.innerWidth < 640 ? 'middle' : 'end'}
                          height={typeof window !== 'undefined' && window.innerWidth < 640 ? 20 : 40}
                        />
                        <YAxis fontSize={typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 12} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0088FE" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-gray-500">
                    <Database className="h-8 w-8 sm:h-12 sm:w-12 mb-4 opacity-50" />
                    <p className="text-xs sm:text-sm font-medium">Nenhuma operação registrada</p>
                    <p className="text-xs text-gray-400 mt-1">Os dados aparecerão aqui quando houver atividade</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detalhamento das Operações */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 sm:pb-6">
              <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                Detalhamento das Operações
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Análise detalhada das atividades por contexto de negócio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {stats?.tableStats?.map((table) => {
                  const context = getBusinessContext(table.table_name, 'UPDATE');
                  const IconComponent = context.icon;
                  
                  return (
                    <div key={table.table_name} className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className={`p-1.5 sm:p-2 rounded-full bg-gray-100 ${context.color}`}>
                          <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium capitalize text-xs sm:text-sm truncate">
                            {table.table_name === 'sales' ? 'Vendas' :
                             table.table_name === 'products' ? 'Produtos' :
                             table.table_name === 'users' ? 'Usuários' :
                             table.table_name === 'payments' ? 'Pagamentos' :
                             table.table_name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {table.count} operações
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                        <div 
                          className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${Math.min((table.count / Math.max(...(stats?.tableStats?.map(t => t.count) || [1]))) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                }) || (
                  <div className="col-span-full text-center py-6 sm:py-8 text-muted-foreground">
                    <Database className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">Nenhum dado de operação disponível</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* Tendências de Atividade Comercial */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  Tendências de Atividade Comercial
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Evolução das operações de negócio ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.hourlyStats && stats.hourlyStats.length > 0 ? (
                  <div className="h-[250px] sm:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.hourlyStats} margin={{ bottom: typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="hour" 
                          fontSize={typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 12}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getHours()}h`;
                          }}
                        />
                        <YAxis fontSize={typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 12} />
                        <Tooltip 
                          labelFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getHours()}:00`;
                          }}
                          formatter={(value, name) => [
                            value,
                            name === 'sales' ? 'Vendas' :
                            name === 'products' ? 'Produtos' :
                            name === 'users' ? 'Usuários' :
                            name === 'count' ? 'Operações Totais' : name
                          ]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                          name="count"
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] sm:h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                    <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 mb-4 opacity-50" />
                    <p className="text-sm sm:text-lg font-medium mb-2">Nenhum dado temporal disponível</p>
                    <p className="text-xs sm:text-sm text-center max-w-md px-4">
                      As tendências aparecerão aqui conforme as operações forem sendo realizadas no sistema
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo de Atividade por Período */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                    Vendas Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {stats?.tableStats?.find(t => t.table_name === 'sales')?.count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Transações registradas
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                    Produtos Alterados
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">
                    {stats?.tableStats?.find(t => t.table_name === 'products')?.count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Modificações no catálogo
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    Atividade de Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-lg sm:text-2xl font-bold text-purple-600">
                    {stats?.tableStats?.find(t => t.table_name === 'users')?.count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ações de usuários
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tendências Diárias */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-sm sm:text-lg">Tendências Diárias</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Atividade nos últimos 30 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.dailyStats && stats.dailyStats.length > 0 ? (
                  <div className="h-[200px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.dailyStats} margin={{ bottom: typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 12}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        />
                        <YAxis fontSize={typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 12} />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                          formatter={(value) => [value, 'Atividades']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#82ca9d" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-gray-500">
                    <svg className="h-8 w-8 sm:h-12 sm:w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-xs sm:text-sm font-medium">Nenhum dado diário disponível</p>
                    <p className="text-xs text-gray-400 mt-1 px-4 text-center">As tendências aparecerão conforme a atividade aumenta</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4 sm:space-y-6">
          <div className="grid gap-3 sm:gap-4">
            {/* Alertas de Negócio */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                  Alertas de Negócio
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Situações que requerem atenção nas operações comerciais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {/* Alerta de muitas exclusões de produtos */}
                  {stats?.operationStats?.DELETE && stats.operationStats.DELETE > 5 && (
                    <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-red-800 text-xs sm:text-sm">Muitas Exclusões Detectadas</p>
                        <p className="text-xs sm:text-sm text-red-600 mt-1">
                          {stats.operationStats.DELETE} exclusões registradas. Verifique se não há remoções acidentais de produtos ou dados importantes.
                        </p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Crítico
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alerta de baixa atividade de vendas */}
                  {stats?.tableStats?.find(t => t.table_name === 'sales')?.count === 0 && (
                    <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-yellow-800 text-xs sm:text-sm">Nenhuma Venda Registrada</p>
                        <p className="text-xs sm:text-sm text-yellow-600 mt-1">
                          Não foram detectadas vendas no período. Verifique se o sistema de vendas está funcionando corretamente.
                        </p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Atenção
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alerta de muitas alterações de produtos */}
                  {stats?.tableStats?.find(t => t.table_name === 'products')?.count && 
                   stats.tableStats.find(t => t.table_name === 'products')!.count > 20 && (
                    <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-blue-800 text-xs sm:text-sm">Alta Atividade no Catálogo</p>
                        <p className="text-xs sm:text-sm text-blue-600 mt-1">
                          {stats.tableStats.find(t => t.table_name === 'products')?.count} alterações em produtos detectadas. Monitore para garantir consistência dos dados.
                        </p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Informativo
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alerta de atividade suspeita de usuários */}
                  {stats?.userStats && stats.userStats.length > 0 && 
                   stats.userStats.some(user => user.count > 50) && (
                    <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <Users className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-purple-800">Atividade Intensa de Usuário</p>
                        <p className="text-sm text-purple-600 mt-1">
                          Usuário com mais de 50 operações detectado. Verifique se a atividade é legítima.
                        </p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Monitoramento
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Estado sem alertas */}
                  {(!stats?.operationStats?.DELETE || stats.operationStats.DELETE <= 5) &&
                   (stats?.tableStats?.find(t => t.table_name === 'sales')?.count || 0) > 0 &&
                   (!stats?.tableStats?.find(t => t.table_name === 'products') || 
                    stats.tableStats.find(t => t.table_name === 'products')!.count <= 20) &&
                   (!stats?.userStats || !stats.userStats.some(user => user.count > 50)) && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Shield className="h-16 w-16 mx-auto mb-4 opacity-50 text-green-500" />
                      <p className="text-lg font-medium mb-2">Sistema Operando Normalmente</p>
                      <p className="text-sm max-w-md mx-auto">
                        Todas as operações de negócio estão dentro dos parâmetros esperados. Nenhum alerta crítico detectado.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resumo de Segurança */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    Status de Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {riskLevel < 30 ? 'Baixo' : riskLevel < 70 ? 'Médio' : 'Alto'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nível de risco: {riskLevel}%
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Última Atividade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.recentActivity && stats.recentActivity.length > 0 ? 'Agora' : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.recentActivity && stats.recentActivity.length > 0 ? 'Sistema ativo' : 'Sem atividade'}
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Database className="h-4 w-4 text-purple-500" />
                    Total de Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats?.totalLogs || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registros de auditoria
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Alertas Recentes do Sistema</CardTitle>
                <CardDescription>
                  Notificações de segurança e atividades suspeitas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum alerta recente</p>
                    </div>
                  ) : (
                    alerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0 mt-1">
                          {alert.severity === 'critical' && <XCircle className="h-5 w-5 text-red-600" />}
                          {alert.severity === 'high' && <AlertCircle className="h-5 w-5 text-orange-600" />}
                          {alert.severity === 'medium' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                          {alert.severity === 'low' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                            <p className="text-xs text-gray-500">
                              {new Date(alert.timestamp).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {alert.description}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 text-xs text-gray-500 gap-1">
                            {alert.userEmail && (
                              <span>Usuário: {alert.userEmail}</span>
                            )}
                            {alert.ipAddress && (
                              <span>IP: {alert.ipAddress}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}