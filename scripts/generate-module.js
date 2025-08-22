#!/usr/bin/env node

/**
 * Script de Automação - Gerador de Módulos SisIago
 * 
 * Gera automaticamente a estrutura completa de um novo módulo:
 * - Páginas (lista, criar, editar)
 * - APIs (CRUD completo)
 * - Componentes base
 * - Tipos TypeScript
 * - Validações Zod
 * 
 * Uso: node scripts/generate-module.js <nome-do-modulo>
 * Exemplo: node scripts/generate-module.js fornecedores
 */

const fs = require('fs')
const path = require('path')

// Configurações
const moduleName = process.argv[2]
if (!moduleName) {
  console.error('❌ Erro: Nome do módulo é obrigatório')
  console.log('📖 Uso: node scripts/generate-module.js <nome-do-modulo>')
  console.log('📝 Exemplo: node scripts/generate-module.js fornecedores')
  process.exit(1)
}

const moduleNameCapitalized = moduleName.charAt(0).toUpperCase() + moduleName.slice(1)
const moduleNameSingular = moduleName.endsWith('s') ? moduleName.slice(0, -1) : moduleName
const moduleNameSingularCapitalized = moduleNameSingular.charAt(0).toUpperCase() + moduleNameSingular.slice(1)

console.log(`🚀 Gerando módulo: ${moduleNameCapitalized}`)

// Função para criar diretórios
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    console.log(`📁 Criado diretório: ${dirPath}`)
  }
}

// Função para criar arquivos
function createFile(filePath, content) {
  fs.writeFileSync(filePath, content)
  console.log(`📄 Criado arquivo: ${filePath}`)
}

// Templates
const templates = {
  // Página principal (lista)
  mainPage: `'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface ${moduleNameSingularCapitalized} {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export default function ${moduleNameCapitalized}Page() {
  const [${moduleName}, set${moduleNameCapitalized}] = useState<${moduleNameSingularCapitalized}[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch${moduleNameCapitalized}()
  }, [])

  const fetch${moduleNameCapitalized} = async () => {
    try {
      const response = await fetch('/api/${moduleName}')
      if (response.ok) {
        const data = await response.json()
        set${moduleNameCapitalized}(data)
      }
    } catch (error) {
      console.error('Erro ao carregar ${moduleName}:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered${moduleNameCapitalized} = ${moduleName}.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      try {
        const response = await fetch(\`/api/${moduleName}/\${id}\`, {
          method: 'DELETE'
        })
        if (response.ok) {
          fetch${moduleNameCapitalized}()
        }
      } catch (error) {
        console.error('Erro ao excluir:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">${moduleNameCapitalized}</h1>
          <p className="text-muted-foreground">Gerencie seus ${moduleName}</p>
        </div>
        <Link href="/${moduleName}/novo">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo ${moduleNameSingularCapitalized}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar ${moduleName}..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <div className="grid gap-4">
        {filtered${moduleNameCapitalized}.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum ${moduleNameSingular} encontrado</p>
              <Link href="/${moduleName}/novo">
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro ${moduleNameSingularCapitalized}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          filtered${moduleNameCapitalized}.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    {item.description && (
                      <p className="text-muted-foreground mt-1">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                        {item.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Criado em {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={\`/${moduleName}/\${item.id}/editar\`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
`,

  // Página de criação
  createPage: `'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { ${moduleNameSingular}Schema, type ${moduleNameSingularCapitalized}Input } from '../types'

export default function Novo${moduleNameSingularCapitalized}Page() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<${moduleNameSingularCapitalized}Input>({
    name: '',
    description: '',
    status: 'active'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      // Validação
      const validatedData = ${moduleNameSingular}Schema.parse(formData)

      const response = await fetch('/api/${moduleName}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validatedData)
      })

      if (response.ok) {
        router.push('/${moduleName}')
      } else {
        const error = await response.json()
        setErrors({ general: error.message || 'Erro ao criar ${moduleNameSingular}' })
      }
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          fieldErrors[err.path[0]] = err.message
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ general: 'Erro inesperado' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof ${moduleNameSingularCapitalized}Input, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/${moduleName}">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Novo ${moduleNameSingularCapitalized}</h1>
          <p className="text-muted-foreground">Criar um novo ${moduleNameSingular}</p>
        </div>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do ${moduleNameSingularCapitalized}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {errors.general}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Digite o nome do ${moduleNameSingular}"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descrição opcional"
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={formData.status === 'active'}
                onCheckedChange={(checked) => handleChange('status', checked ? 'active' : 'inactive')}
              />
              <Label htmlFor="status">Ativo</Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
              <Link href="/${moduleName}">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
`,

  // API Route
  apiRoute: `import { NextRequest, NextResponse } from 'next/server'
import { ${moduleNameSingular}Schema } from '../types'

// Simulação de banco de dados (usar Supabase)
let ${moduleName}: any[] = []
let nextId = 1

export async function GET() {
  try {
    return NextResponse.json(${moduleName})
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar ${moduleName}' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validação
    const validatedData = ${moduleNameSingular}Schema.parse(body)
    
    // Criar novo item
    const new${moduleNameSingularCapitalized} = {
      id: nextId.toString(),
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    ${moduleName}.push(new${moduleNameSingularCapitalized})
    nextId++
    
    return NextResponse.json(new${moduleNameSingularCapitalized}, { status: 201 })
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar ${moduleNameSingular}' },
      { status: 500 }
    )
  }
}
`,

  // API Route [id]
  apiIdRoute: `import { NextRequest, NextResponse } from 'next/server'
import { ${moduleNameSingular}Schema } from '../../types'

// Simulação de banco de dados (usar Supabase)
let ${moduleName}: any[] = []

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ${moduleNameSingular} = ${moduleName}.find(item => item.id === params.id)
    
    if (!${moduleNameSingular}) {
      return NextResponse.json(
        { error: '${moduleNameSingularCapitalized} não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(${moduleNameSingular})
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar ${moduleNameSingular}' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = ${moduleNameSingular}Schema.parse(body)
    
    const index = ${moduleName}.findIndex(item => item.id === params.id)
    
    if (index === -1) {
      return NextResponse.json(
        { error: '${moduleNameSingularCapitalized} não encontrado' },
        { status: 404 }
      )
    }
    
    ${moduleName}[index] = {
      ...${moduleName}[index],
      ...validatedData,
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json(${moduleName}[index])
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro ao atualizar ${moduleNameSingular}' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const index = ${moduleName}.findIndex(item => item.id === params.id)
    
    if (index === -1) {
      return NextResponse.json(
        { error: '${moduleNameSingularCapitalized} não encontrado' },
        { status: 404 }
      )
    }
    
    ${moduleName}.splice(index, 1)
    
    return NextResponse.json({ message: '${moduleNameSingularCapitalized} excluído com sucesso' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao excluir ${moduleNameSingular}' },
      { status: 500 }
    )
  }
}
`,

  // Types
  types: `import { z } from 'zod'

// Schema de validação
export const ${moduleNameSingular}Schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active')
})

// Tipos TypeScript
export type ${moduleNameSingularCapitalized}Input = z.infer<typeof ${moduleNameSingular}Schema>

export interface ${moduleNameSingularCapitalized} extends ${moduleNameSingularCapitalized}Input {
  id: string
  createdAt: string
  updatedAt: string
}

// Tipos para formulários
export interface ${moduleNameSingularCapitalized}FormData extends ${moduleNameSingularCapitalized}Input {}

// Tipos para API responses
export interface ${moduleNameSingularCapitalized}Response {
  data: ${moduleNameSingularCapitalized}[]
  total: number
  page: number
  limit: number
}

export interface ${moduleNameSingularCapitalized}Error {
  error: string
  details?: any
}
`
}

// Criar estrutura de diretórios
const basePath = path.join(process.cwd(), 'src')
const appPath = path.join(basePath, 'app', moduleName)
const apiPath = path.join(basePath, 'app', 'api', moduleName)

// Diretórios
ensureDir(appPath)
ensureDir(path.join(appPath, 'novo'))
ensureDir(path.join(appPath, '[id]', 'editar'))
ensureDir(apiPath)
ensureDir(path.join(apiPath, '[id]'))

// Criar arquivos
createFile(path.join(appPath, 'page.tsx'), templates.mainPage)
createFile(path.join(appPath, 'novo', 'page.tsx'), templates.createPage)
createFile(path.join(appPath, 'types.ts'), templates.types)
createFile(path.join(apiPath, 'route.ts'), templates.apiRoute)
createFile(path.join(apiPath, '[id]', 'route.ts'), templates.apiIdRoute)

// Página de edição (cópia da criação com modificações)
const editPage = templates.createPage
  .replace(/Novo${moduleNameSingularCapitalized}Page/g, `Editar${moduleNameSingularCapitalized}Page`)
  .replace(/"Novo ${moduleNameSingularCapitalized}"/g, `"Editar ${moduleNameSingularCapitalized}"`)
  .replace(/"Criar um novo ${moduleNameSingular}"/g, `"Editar ${moduleNameSingular}"`)
  .replace(/method: 'POST'/g, `method: 'PUT'`)
  .replace(/\/api\/${moduleName}'/g, `\`/api/${moduleName}/\${id}\``)

createFile(path.join(appPath, '[id]', 'editar', 'page.tsx'), editPage)

console.log('\n✅ Módulo gerado com sucesso!')
console.log('\n📁 Estrutura criada:')
console.log(`   src/app/${moduleName}/`)
console.log(`   ├── page.tsx                    # Lista de ${moduleName}`)
console.log(`   ├── novo/page.tsx              # Criar ${moduleNameSingular}`)
console.log(`   ├── [id]/editar/page.tsx       # Editar ${moduleNameSingular}`)
console.log(`   └── types.ts                   # Tipos e validações`)
console.log(`   src/app/api/${moduleName}/`)
console.log(`   ├── route.ts                   # GET, POST`)
console.log(`   └── [id]/route.ts              # GET, PUT, DELETE`)

console.log('\n🚀 Próximos passos:')
console.log(`   1. Acesse: http://localhost:3000/${moduleName}`)
console.log(`   2. Integre com Supabase nas APIs`)
console.log(`   3. Customize os campos conforme necessário`)
console.log(`   4. Adicione validações específicas`)
console.log(`   5. Implemente testes automatizados`)

console.log('\n📚 Documentação:')
console.log(`   - Tipos: src/app/${moduleName}/types.ts`)
console.log(`   - Validação: Zod schemas incluídos`)
console.log(`   - UI: shadcn/ui components`)
console.log(`   - API: REST endpoints completos`)