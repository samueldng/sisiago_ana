'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  AlertTriangle, 
  Brain, 
  Clock, 
  Globe, 
  Settings, 
  TrendingUp, 
  Users, 
  Shield, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  MapPin,
  Activity,
  Zap,
  Target
} from 'lucide-react'
import { toast } from 'sonner'

interface PatternDetection {
  id: string
  type: 'behavioral' | 'temporal' | 'geographic' | 'operational'
  name: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  user_id?: string
  user_email?: string
  detected_at: string
  first_occurrence: string
  last_occurrence: string
  occurrence_count: number
  pattern_data: any
  risk_indicators: string[]
  recommended_actions: string[]
  status: 'active' | 'investigating' | 'resolved' | 'false_positive'
}

interface PatternSummary {
  total_patterns: number
  by_severity: Record<string, number>
  by_type: Record<string, number>
  by_status: Record<string, number>
  avg_confidence: number
  high_risk_users: string[]
}

interface PatternFilters {
  user_id?: string
  pattern_type?: string
  severity_threshold?: string
  confidence_threshold?: number
  search?: string
}

const AuditPatterns: React.FC = () => {
  const [patterns, setPatterns] = useState<PatternDetection[]>([])
  const [summary, setSummary] = useState<PatternSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<PatternFilters>({
    pattern_type: 'all',
    severity_threshold: 'low',
    confidence_threshold: 70
  })
  const [selectedPattern, setSelectedPattern] = useState<PatternDetection | null>(null)
  const [analysisRunning, setAnalysisRunning] = useState(false)

  const fetchPatterns = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.user_id) params.append('user_id', filters.user_id)
      if (filters.pattern_type && filters.pattern_type !== 'all') {
        params.append('pattern_type', filters.pattern_type)
      }
      if (filters.severity_threshold) {
        params.append('severity_threshold', filters.severity_threshold)
      }
      if (filters.confidence_threshold) {
        params.append('confidence_threshold', filters.confidence_threshold.toString())
      }

      const response = await fetch(`/api/audit-patterns?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar padrões')
      
      const data = await response.json()
      setPatterns(data.data.patterns)
      setSummary(data.data.summary)
    } catch (error) {
      console.error('Erro ao buscar padrões:', error)
      toast.error('Erro ao carregar análise de padrões')
    } finally {
      setLoading(false)
    }
  }

  const updatePatternStatus = async (patternId: string, status: string, notes?: string) => {
    try {
      const response = await fetch('/api/audit-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          pattern_id: patternId,
          status,
          notes
        })
      })

      if (!response.ok) throw new Error('Erro ao atualizar status')
      
      toast.success('Status do padrão atualizado com sucesso')
      fetchPatterns()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status do padrão')
    }
  }

  const runAnalysis = async () => {
    setAnalysisRunning(true)
    try {
      const response = await fetch('/api/audit-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_analysis' })
      })

      if (!response.ok) throw new Error('Erro ao executar análise')
      
      toast.success('Análise de padrões iniciada com sucesso')
      
      // Simular tempo de análise
      setTimeout(() => {
        setAnalysisRunning(false)
        fetchPatterns()
        toast.success('Análise de padrões concluída')
      }, 3000)
    } catch (error) {
      console.error('Erro ao executar análise:', error)
      toast.error('Erro ao executar análise de padrões')
      setAnalysisRunning(false)
    }
  }

  useEffect(() => {
    fetchPatterns()
  }, [filters])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'behavioral': return <Users className="h-4 w-4" />
      case 'temporal': return <Clock className="h-4 w-4" />
      case 'geographic': return <Globe className="h-4 w-4" />
      case 'operational': return <Settings className="h-4 w-4" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'investigating': return <Eye className="h-4 w-4 text-yellow-500" />
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'false_positive': return <XCircle className="h-4 w-4 text-gray-500" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const filteredPatterns = patterns.filter(pattern => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        pattern.name.toLowerCase().includes(searchLower) ||
        pattern.description.toLowerCase().includes(searchLower) ||
        pattern.user_email?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Análise de Padrões</h2>
          <p className="text-muted-foreground">
            Detecção automática de comportamentos suspeitos e anomalias
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runAnalysis} 
            disabled={analysisRunning}
            className="gap-2"
          >
            {analysisRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {analysisRunning ? 'Analisando...' : 'Executar Análise'}
          </Button>
          <Button variant="outline" onClick={fetchPatterns} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Progress Bar para Análise */}
      {analysisRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Executando análise de padrões...</span>
                <span>Estimativa: 3 minutos</span>
              </div>
              <Progress value={33} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Padrões</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_patterns}</div>
              <p className="text-xs text-muted-foreground">
                Confiança média: {summary.avg_confidence}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Críticos/Altos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.by_severity.critical + summary.by_severity.high}
              </div>
              <p className="text-xs text-muted-foreground">
                Requerem atenção imediata
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários de Risco</CardTitle>
              <Shield className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {summary.high_risk_users.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Usuários com padrões suspeitos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.by_status.active}
              </div>
              <p className="text-xs text-muted-foreground">
                Padrões ativos para investigação
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome, descrição, usuário..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Padrão</Label>
              <Select
                value={filters.pattern_type || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, pattern_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="behavioral">Comportamental</SelectItem>
                  <SelectItem value="temporal">Temporal</SelectItem>
                  <SelectItem value="geographic">Geográfico</SelectItem>
                  <SelectItem value="operational">Operacional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severidade Mínima</Label>
              <Select
                value={filters.severity_threshold || 'low'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, severity_threshold: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidence">Confiança Mínima (%)</Label>
              <Input
                id="confidence"
                type="number"
                min="0"
                max="100"
                value={filters.confidence_threshold || 70}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  confidence_threshold: parseInt(e.target.value) || 70 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">Usuário</Label>
              <Input
                id="user"
                placeholder="ID do usuário"
                value={filters.user_id || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, user_id: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patterns List */}
      <Card>
        <CardHeader>
          <CardTitle>Padrões Detectados</CardTitle>
          <CardDescription>
            {loading ? 'Carregando...' : `${filteredPatterns.length} padrões encontrados`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredPatterns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum padrão encontrado com os filtros aplicados
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPatterns.map((pattern) => (
                <Card key={pattern.id} className="border-l-4" style={{
                  borderLeftColor: pattern.severity === 'critical' ? '#ef4444' :
                                  pattern.severity === 'high' ? '#f97316' :
                                  pattern.severity === 'medium' ? '#eab308' : '#3b82f6'
                }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(pattern.type)}
                          <CardTitle className="text-lg">{pattern.name}</CardTitle>
                          <Badge className={getSeverityColor(pattern.severity)}>
                            {pattern.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {pattern.confidence}% confiança
                          </Badge>
                        </div>
                        <CardDescription>{pattern.description}</CardDescription>
                        {pattern.user_email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {pattern.user_email}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(pattern.status)}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedPattern(pattern)}
                            >
                              Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                {getTypeIcon(pattern.type)}
                                {pattern.name}
                              </DialogTitle>
                              <DialogDescription>
                                Análise detalhada do padrão detectado
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[60vh]">
                              <div className="space-y-6">
                                {/* Pattern Info */}
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <Label className="text-sm font-medium">Informações Básicas</Label>
                                    <div className="mt-2 space-y-2 text-sm">
                                      <div>Tipo: {pattern.type}</div>
                                      <div>Severidade: {pattern.severity}</div>
                                      <div>Confiança: {pattern.confidence}%</div>
                                      <div>Status: {pattern.status}</div>
                                      <div>Ocorrências: {pattern.occurrence_count}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Timeline</Label>
                                    <div className="mt-2 space-y-2 text-sm">
                                      <div>Detectado: {new Date(pattern.detected_at).toLocaleString()}</div>
                                      <div>Primeira ocorrência: {new Date(pattern.first_occurrence).toLocaleString()}</div>
                                      <div>Última ocorrência: {new Date(pattern.last_occurrence).toLocaleString()}</div>
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                {/* Risk Indicators */}
                                <div>
                                  <Label className="text-sm font-medium">Indicadores de Risco</Label>
                                  <div className="mt-2 space-y-1">
                                    {pattern.risk_indicators.map((indicator, index) => (
                                      <div key={index} className="flex items-center gap-2 text-sm">
                                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                                        {indicator}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <Separator />

                                {/* Recommended Actions */}
                                <div>
                                  <Label className="text-sm font-medium">Ações Recomendadas</Label>
                                  <div className="mt-2 space-y-1">
                                    {pattern.recommended_actions.map((action, index) => (
                                      <div key={index} className="flex items-center gap-2 text-sm">
                                        <Zap className="h-3 w-3 text-blue-500" />
                                        {action}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <Separator />

                                {/* Pattern Data */}
                                <div>
                                  <Label className="text-sm font-medium">Dados do Padrão</Label>
                                  <div className="mt-2">
                                    <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                                      {JSON.stringify(pattern.pattern_data, null, 2)}
                                    </pre>
                                  </div>
                                </div>

                                {/* Status Update */}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updatePatternStatus(pattern.id, 'investigating')}
                                    disabled={pattern.status === 'investigating'}
                                  >
                                    Investigar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updatePatternStatus(pattern.id, 'resolved')}
                                    disabled={pattern.status === 'resolved'}
                                  >
                                    Resolver
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updatePatternStatus(pattern.id, 'false_positive')}
                                    disabled={pattern.status === 'false_positive'}
                                  >
                                    Falso Positivo
                                  </Button>
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
                        <span>Detectado em {new Date(pattern.detected_at).toLocaleString()}</span>
                        <span>{pattern.occurrence_count} ocorrências</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {pattern.risk_indicators.slice(0, 3).map((indicator, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {indicator}
                          </Badge>
                        ))}
                        {pattern.risk_indicators.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{pattern.risk_indicators.length - 3} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export { AuditPatterns }