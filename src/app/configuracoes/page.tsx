'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Settings, Save, Building2, Printer, CreditCard } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Configuracoes {
  empresa: {
    nome: string
    cnpj: string
    endereco: string
  }
  pdv: {
    impressora: string
    gaveta: boolean
  }
}

export default function ConfiguracoesPage() {
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>({
    empresa: {
      nome: '',
      cnpj: '',
      endereco: ''
    },
    pdv: {
      impressora: '',
      gaveta: false
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentDate, setCurrentDate] = useState<string>('')

  useEffect(() => {
    loadConfiguracoes()
    // Definir data atual apenas no cliente
    setCurrentDate(new Date().toLocaleDateString('pt-BR'))
  }, [])

  const loadConfiguracoes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/configuracoes')
      const data = await response.json()
      
      if (data.success) {
        setConfiguracoes(data.data)
      } else {
        console.error('Erro ao carregar configurações:', data.error)
        toast.error('Erro ao carregar configurações')
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configuracoes)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Configurações salvas com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const updateEmpresa = (field: string, value: string) => {
    setConfiguracoes(prev => ({
      ...prev,
      empresa: {
        ...prev.empresa,
        [field]: value
      }
    }))
  }

  const updatePdv = (field: string, value: string | boolean) => {
    setConfiguracoes(prev => ({
      ...prev,
      pdv: {
        ...prev.pdv,
        [field]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Configurações</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configurações da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados da Empresa
            </CardTitle>
            <CardDescription>
              Informações básicas da sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Empresa</Label>
              <Input
                id="nome"
                value={configuracoes.empresa.nome}
                onChange={(e) => updateEmpresa('nome', e.target.value)}
                placeholder="Nome da sua empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={configuracoes.empresa.cnpj}
                onChange={(e) => updateEmpresa('cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                value={configuracoes.empresa.endereco}
                onChange={(e) => updateEmpresa('endereco', e.target.value)}
                placeholder="Endereço completo da empresa"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações do PDV */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Configurações do PDV
            </CardTitle>
            <CardDescription>
              Configurações do ponto de venda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="impressora">Impressora Padrão</Label>
              <Input
                id="impressora"
                value={configuracoes.pdv.impressora}
                onChange={(e) => updatePdv('impressora', e.target.value)}
                placeholder="Nome da impressora"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Gaveta de Dinheiro
                </Label>
                <p className="text-sm text-muted-foreground">
                  Abrir gaveta automaticamente após venda
                </p>
              </div>
              <Switch
                checked={configuracoes.pdv.gaveta}
                onCheckedChange={(checked) => updatePdv('gaveta', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
          <CardDescription>
            Detalhes sobre a versão e configuração atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="text-sm font-medium">Versão</Label>
              <p className="text-sm text-muted-foreground">1.0.0</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Ambiente</Label>
              <p className="text-sm text-muted-foreground">
                {process.env.NODE_ENV === 'production' ? 'Produção' : 'Desenvolvimento'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Última Atualização</Label>
              <p className="text-sm text-muted-foreground">
                {currentDate || 'Carregando...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}