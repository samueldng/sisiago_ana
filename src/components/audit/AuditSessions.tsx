'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  Globe, 
  Monitor, 
  Smartphone, 
  MapPin, 
  AlertTriangle, 
  RefreshCw,
  Filter,
  Search,
  Activity,
  Users,
  Timer,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

interface UserSession {
  id: string
  user_id: string
  user_email: string
  user_name: string
  ip_address: string
  user_agent: string
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  browser: string
  os: string
  location: {
    country: string
    city: string
    region: string
    coordinates?: { lat: number; lng: number }
  }
  started_at: string
  ended_at?: string
  last_activity: string
  duration_minutes?: number
  is_active: boolean
  actions_count: number
  pages_visited: string[]
  risk_score: number
  risk_factors: string[]
  session_data: {
    login_method: string
    mfa_used: boolean
    concurrent_sessions: number
    suspicious_activities: string[]
    performance_metrics: {
      avg_response_time: number
      error_rate: number
      page_load_time: number
    }
  }
}

interface SessionStats {
  total_sessions: number
  active_sessions: number
  avg_duration: number
  unique_users: number
  by_device: Record<string, number>
  by_location: Record<string, number>
  high_risk_sessions: number
  concurrent_peak: number
}

interface SessionFilters {
  user_email?: string
  ip_address?: string
  device_type?: string
  location?: string
  risk_threshold?: number
  date_range?: {
    start: string
    end: string
  }
  is_active?: boolean
  search?: string
}

const AuditSessions: React.FC = () => {
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [stats, setStats] = useState<SessionStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<SessionFilters>({
    risk_threshold: 50
  })
  // const [selectedSession, setSelectedSession] = useState<UserSession | null>(null)
  const [activeTab, setActiveTab] = useState('sessions')

  // Simular dados de sessões
  const generateMockSessions = (): UserSession[] => {
    const mockSessions: UserSession[] = []
    const users = [
      { id: '1', email: 'admin@sisiago.com', name: 'Administrador' },
      { id: '2', email: 'user1@sisiago.com', name: 'João Silva' },
      { id: '3', email: 'user2@sisiago.com', name: 'Maria Santos' },
      { id: '4', email: 'user3@sisiago.com', name: 'Pedro Costa' }
    ]
    
    const locations = [
      { country: 'Brasil', city: 'São Paulo', region: 'SP' },
      { country: 'Brasil', city: 'Rio de Janeiro', region: 'RJ' },
      { country: 'Brasil', city: 'Brasília', region: 'DF' },
      { country: 'EUA', city: 'New York', region: 'NY' }
    ]
    
    const devices = ['desktop', 'mobile', 'tablet'] as const
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge']
    const os = ['Windows 11', 'macOS', 'iOS', 'Android']

    for (let i = 0; i < 20; i++) {
      const user = users[Math.floor(Math.random() * users.length)]
      if (!user) continue
      
      const location = locations[Math.floor(Math.random() * locations.length)]
      if (!location) continue
      
      const deviceIndex = Math.floor(Math.random() * devices.length)
      const device: 'desktop' | 'mobile' | 'tablet' = devices[deviceIndex] || 'desktop'
      const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      const isActive = Math.random() > 0.7
      const duration = isActive ? undefined : Math.floor(Math.random() * 480) + 10
      const endTime = isActive ? undefined : new Date(startTime.getTime() + (duration! * 60 * 1000))
      
      const riskFactors: string[] = []
      if (location.country !== 'Brasil') riskFactors.push('Localização suspeita')
      if (Math.random() > 0.8) riskFactors.push('Múltiplas tentativas de login')
      if (Math.random() > 0.9) riskFactors.push('Horário incomum')
      if (Math.random() > 0.85) riskFactors.push('Dispositivo não reconhecido')
      
      const riskScore = Math.min(100, riskFactors.length * 25 + Math.floor(Math.random() * 30))

      const session: UserSession = {
        id: `session_${i + 1}`,
        user_id: user.id,
        user_email: user.email,
        user_name: user.name,
        ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user_agent: `Mozilla/5.0 (${device === 'mobile' ? 'Mobile' : 'Desktop'})`,
        device_type: device,
        browser: browsers[Math.floor(Math.random() * browsers.length)] || 'Chrome',
        os: os[Math.floor(Math.random() * os.length)] || 'Windows 11',
        location: location,
        started_at: startTime.toISOString(),
        ...(endTime && { ended_at: endTime.toISOString() }),
        last_activity: isActive ? new Date().toISOString() : (endTime?.toISOString() || new Date().toISOString()),
        ...(duration && { duration_minutes: duration }),
        is_active: isActive,
        actions_count: Math.floor(Math.random() * 100) + 5,
        pages_visited: [
          '/dashboard',
          '/usuarios',
          '/relatorios',
          '/configuracoes'
        ].slice(0, Math.floor(Math.random() * 4) + 1),
        risk_score: riskScore,
        risk_factors: riskFactors,
        session_data: {
          login_method: Math.random() > 0.5 ? 'password' : 'sso',
          mfa_used: Math.random() > 0.3,
          concurrent_sessions: Math.floor(Math.random() * 3) + 1,
          suspicious_activities: riskFactors,
          performance_metrics: {
            avg_response_time: Math.floor(Math.random() * 1000) + 200,
            error_rate: Math.random() * 5,
            page_load_time: Math.floor(Math.random() * 3000) + 500
          }
        }
      }
      
      mockSessions.push(session)
    }

    return mockSessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
  }

  const calculateStats = (sessions: UserSession[]): SessionStats => {
    const activeSessions = sessions.filter(s => s.is_active)
    const completedSessions = sessions.filter(s => !s.is_active && s.duration_minutes)
    const avgDuration = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / completedSessions.length
      : 0

    const deviceCounts = sessions.reduce((acc, s) => {
      acc[s.device_type] = (acc[s.device_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const locationCounts = sessions.reduce((acc, s) => {
      const key = `${s.location.city}, ${s.location.country}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total_sessions: sessions.length,
      active_sessions: activeSessions.length,
      avg_duration: Math.round(avgDuration),
      unique_users: new Set(sessions.map(s => s.user_id)).size,
      by_device: deviceCounts,
      by_location: locationCounts,
      high_risk_sessions: sessions.filter(s => s.risk_score >= 70).length,
      concurrent_peak: Math.max(...Object.values(sessions.reduce((acc, s) => {
        const hour = new Date(s.started_at).getHours()
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      }, {} as Record<number, number>)))
    }
  }

  const fetchSessions = async () => {
    setLoading(true)
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockSessions = generateMockSessions()
      let filteredSessions = mockSessions

      // Aplicar filtros
      if (filters.user_email) {
        filteredSessions = filteredSessions.filter(s => 
          s.user_email.toLowerCase().includes(filters.user_email!.toLowerCase())
        )
      }
      
      if (filters.ip_address) {
        filteredSessions = filteredSessions.filter(s => 
          s.ip_address.includes(filters.ip_address!)
        )
      }
      
      if (filters.device_type && filters.device_type !== 'all') {
        filteredSessions = filteredSessions.filter(s => s.device_type === filters.device_type)
      }
      
      if (filters.is_active !== undefined) {
        filteredSessions = filteredSessions.filter(s => s.is_active === filters.is_active)
      }
      
      if (filters.risk_threshold) {
        filteredSessions = filteredSessions.filter(s => s.risk_score >= filters.risk_threshold!)
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredSessions = filteredSessions.filter(s => 
          s.user_email.toLowerCase().includes(searchLower) ||
          s.user_name.toLowerCase().includes(searchLower) ||
          s.ip_address.includes(searchLower) ||
          s.location.city.toLowerCase().includes(searchLower)
        )
      }

      setSessions(filteredSessions)
      setStats(calculateStats(filteredSessions))
    } catch (error) {
      console.error('Erro ao buscar sessões:', error)
      toast.error('Erro ao carregar sessões de usuário')
    } finally {
      setLoading(false)
    }
  }

  const terminateSession = async (sessionId: string) => {
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, is_active: false, ended_at: new Date().toISOString() }
          : s
      ))
      
      toast.success('Sessão terminada com sucesso')
    } catch (error) {
      console.error('Erro ao terminar sessão:', error)
      toast.error('Erro ao terminar sessão')
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [filters])

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50'
    if (score >= 60) return 'text-orange-600 bg-orange-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return <Smartphone className="h-4 w-4" />
      case 'tablet': return <Smartphone className="h-4 w-4" />
      case 'desktop': return <Monitor className="h-4 w-4" />
      default: return <Monitor className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Análise de Sessões</h2>
          <p className="text-muted-foreground">
            Monitoramento e análise de sessões de usuário em tempo real
          </p>
        </div>
        <Button onClick={fetchSessions} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active_sessions}</div>
              <p className="text-xs text-muted-foreground">
                de {stats.total_sessions} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.unique_users}</div>
              <p className="text-xs text-muted-foreground">
                usuários conectados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
              <Timer className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.avg_duration}min</div>
              <p className="text-xs text-muted-foreground">
                tempo de sessão
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alto Risco</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.high_risk_sessions}</div>
              <p className="text-xs text-muted-foreground">
                sessões suspeitas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Sessão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Usuário, IP, localização..."
                      value={filters.search || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="device">Tipo de Dispositivo</Label>
                  <Select
                    value={filters.device_type || 'all'}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, device_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filters.is_active === undefined ? 'all' : filters.is_active ? 'active' : 'inactive'}
                    onValueChange={(value: string) => setFilters(prev => ({ 
                      ...prev, 
                      is_active: value === 'all' ? undefined : value === 'active'
                    } as SessionFilters))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="active">Ativas</SelectItem>
                      <SelectItem value="inactive">Inativas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="risk">Risco Mínimo</Label>
                  <Input
                    id="risk"
                    type="number"
                    min="0"
                    max="100"
                    value={filters.risk_threshold || 0}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      risk_threshold: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sessions List */}
          <Card>
            <CardHeader>
              <CardTitle>Sessões de Usuário</CardTitle>
              <CardDescription>
                {loading ? 'Carregando...' : `${sessions.length} sessões encontradas`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma sessão encontrada com os filtros aplicados
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <Card key={session.id} className="border-l-4" style={{
                      borderLeftColor: session.is_active ? '#10b981' : '#6b7280'
                    }}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(session.device_type)}
                              <CardTitle className="text-lg">{session.user_name}</CardTitle>
                              <Badge variant={session.is_active ? 'default' : 'secondary'}>
                                {session.is_active ? 'Ativa' : 'Inativa'}
                              </Badge>
                              <Badge className={getRiskColor(session.risk_score)}>
                                Risco: {session.risk_score}%
                              </Badge>
                            </div>
                            <CardDescription>{session.user_email}</CardDescription>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {session.ip_address}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {session.location.city}, {session.location.country}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(session.started_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {session.is_active && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => terminateSession(session.id)}
                              >
                                Terminar
                              </Button>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                >
                                  Detalhes
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh]">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    {getDeviceIcon(session.device_type)}
                                    Sessão de {session.user_name}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Análise detalhada da sessão do usuário
                                  </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="max-h-[60vh]">
                                  <div className="space-y-6">
                                    {/* Session Info */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                      <div>
                                        <Label className="text-sm font-medium">Informações da Sessão</Label>
                                        <div className="mt-2 space-y-2 text-sm">
                                          <div>ID: {session.id}</div>
                                          <div>Status: {session.is_active ? 'Ativa' : 'Inativa'}</div>
                                          <div>Dispositivo: {session.device_type}</div>
                                          <div>Browser: {session.browser}</div>
                                          <div>OS: {session.os}</div>
                                          <div>Ações: {session.actions_count}</div>
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Timeline</Label>
                                        <div className="mt-2 space-y-2 text-sm">
                                          <div>Início: {new Date(session.started_at).toLocaleString()}</div>
                                          {session.ended_at && (
                                            <div>Fim: {new Date(session.ended_at).toLocaleString()}</div>
                                          )}
                                          <div>Última atividade: {new Date(session.last_activity).toLocaleString()}</div>
                                          {session.duration_minutes && (
                                            <div>Duração: {session.duration_minutes} minutos</div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <Separator />

                                    {/* Risk Analysis */}
                                    <div>
                                      <Label className="text-sm font-medium">Análise de Risco</Label>
                                      <div className="mt-2 space-y-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm">Score de Risco:</span>
                                          <Badge className={getRiskColor(session.risk_score)}>
                                            {session.risk_score}%
                                          </Badge>
                                        </div>
                                        {session.risk_factors.length > 0 && (
                                          <div>
                                            <span className="text-sm font-medium">Fatores de Risco:</span>
                                            <div className="mt-1 space-y-1">
                                              {session.risk_factors.map((factor, index) => (
                                                <div key={index} className="flex items-center gap-2 text-sm">
                                                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                                                  {factor}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <Separator />

                                    {/* Session Data */}
                                    <div>
                                      <Label className="text-sm font-medium">Dados da Sessão</Label>
                                      <div className="mt-2 grid gap-4 md:grid-cols-2">
                                        <div>
                                          <span className="text-sm font-medium">Autenticação:</span>
                                          <div className="mt-1 space-y-1 text-sm">
                                            <div>Método: {session.session_data.login_method}</div>
                                            <div>MFA: {session.session_data.mfa_used ? 'Sim' : 'Não'}</div>
                                            <div>Sessões concorrentes: {session.session_data.concurrent_sessions}</div>
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-sm font-medium">Performance:</span>
                                          <div className="mt-1 space-y-1 text-sm">
                                            <div>Tempo de resposta: {session.session_data.performance_metrics.avg_response_time}ms</div>
                                            <div>Taxa de erro: {session.session_data.performance_metrics.error_rate.toFixed(2)}%</div>
                                            <div>Carregamento: {session.session_data.performance_metrics.page_load_time}ms</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <Separator />

                                    {/* Pages Visited */}
                                    <div>
                                      <Label className="text-sm font-medium">Páginas Visitadas</Label>
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {session.pages_visited.map((page, index) => (
                                          <Badge key={index} variant="outline">
                                            {page}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{session.browser} em {session.os}</span>
                            <span>{session.actions_count} ações realizadas</span>
                          </div>
                          
                          {session.risk_factors.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {session.risk_factors.slice(0, 3).map((factor, index) => (
                                <Badge key={index} variant="destructive" className="text-xs">
                                  {factor}
                                </Badge>
                              ))}
                              {session.risk_factors.length > 3 && (
                                <Badge variant="destructive" className="text-xs">
                                  +{session.risk_factors.length - 3} mais
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {stats && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Device Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Distribuição por Dispositivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.by_device).map(([device, count]) => (
                      <div key={device} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(device)}
                          <span className="capitalize">{device}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(count / stats.total_sessions) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Location Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Distribuição Geográfica
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.by_location).slice(0, 5).map(([location, count]) => (
                      <div key={location} className="flex items-center justify-between">
                        <span className="text-sm">{location}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(count / stats.total_sessions) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { AuditSessions }