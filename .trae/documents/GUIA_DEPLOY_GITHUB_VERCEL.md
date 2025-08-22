# Guia de Deploy - GitHub e Vercel

## 1. Preparação do Repositório GitHub

### 1.1 Verificação do Estado Atual

Antes de fazer o push para o GitHub, verifique se todas as correções estão aplicadas:

```bash
# Verificar status do Git
git status

# Verificar se há arquivos não commitados
git diff

# Verificar se o build está funcionando
npm run build

# Verificar tipos TypeScript
npm run type-check
```

### 1.2 Commit das Correções

```bash
# Adicionar todos os arquivos modificados
git add .

# Commit com mensagem descritiva
git commit -m "fix: Correção completa de erros TypeScript e implementação do sistema de auditoria

- Corrigidos erros de undefined em UserFilters, UserManagement, UserModal
- Implementado sistema completo de auditoria (Sessions, Notifications, Performance)
- Corrigidos erros no WebOnDevicesBarcodeScanner
- Otimizado sistema de autenticação
- Adicionados hooks de auditoria (useAuditStats, useAuditLogs, etc.)
- Sistema pronto para produção"
```

### 1.3 Push para GitHub

```bash
# Push para o branch principal
git push origin main

# Ou se estiver em outro branch
git push origin [nome-do-branch]
```

## 2. Configuração do Vercel

### 2.1 Variáveis de Ambiente

Configure as seguintes variáveis no painel do Vercel:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Next.js
NEXTAUTH_SECRET=seu_secret_nextauth
NEXTAUTH_URL=https://seu-dominio.vercel.app

# Database
DATABASE_URL=sua_connection_string_supabase

# Outras configurações específicas do projeto
NODE_ENV=production
```

### 2.2 Configuração de Build

#### vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

### 2.3 Deploy via CLI

```bash
# Instalar Vercel CLI (se não estiver instalado)
npm i -g vercel

# Login no Vercel
vercel login

# Deploy para preview
vercel

# Deploy para produção
vercel --prod
```

### 2.4 Deploy via GitHub Integration

1. **Conectar Repositório**:

   * Acesse o painel do Vercel

   * Clique em "New Project"

   * Conecte sua conta do GitHub

   * Selecione o repositório SISIAGO

2. **Configurar Build Settings**:

   * Framework Preset: Next.js

   * Build Command: `npm run build`

   * Output Directory: `.next`

   * Install Command: `npm install`

3. **Deploy Automático**:

   * Cada push para `main` fará deploy automático

   * Pull requests criam preview deployments

## 3. Verificação Pós-Deploy

### 3.1 Checklist de Verificação

* [ ] **Homepage carrega corretamente**

* [ ] **Sistema de login funciona**

* [ ] **Dashboard de auditoria acessível**

* [ ] **Gestão de usuários operacional**

* [ ] **Scanner de código de barras funciona**

* [ ] **APIs respondem corretamente**

* [ ] **Banco de dados conectado**

* [ ] **Autenticação funcionando**

### 3.2 Testes de Produção

```bash
# Testar APIs principais
curl https://seu-dominio.vercel.app/api/auth/verify
curl https://seu-dominio.vercel.app/api/dashboard/stats
curl https://seu-dominio.vercel.app/api/products

# Verificar logs no Vercel
vercel logs
```

### 3.3 Monitoramento

1. **Vercel Analytics**: Habilitado automaticamente
2. **Error Tracking**: Configurar Sentry (opcional)
3. **Performance Monitoring**: Usar Vercel Speed Insights
4. **Uptime Monitoring**: Configurar alertas

## 4. Comandos Úteis

### 4.1 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build de produção
npm run build

# Verificar tipos
npm run type-check

# Linting
npm run lint

# Testes
npm test
```

### 4.2 Git Workflow

```bash
# Criar nova branch para feature
git checkout -b feature/nova-funcionalidade

# Fazer commits pequenos e descritivos
git add .
git commit -m "feat: adicionar nova funcionalidade X"

# Push da branch
git push origin feature/nova-funcionalidade

# Merge para main após review
git checkout main
git merge feature/nova-funcionalidade
git push origin main
```

### 4.3 Vercel CLI

```bash
# Ver deployments
vercel list

# Ver logs de um deployment
vercel logs [deployment-url]

# Promover preview para produção
vercel promote [deployment-url]

# Configurar domínio customizado
vercel domains add seu-dominio.com
```

## 5. Troubleshooting

### 5.1 Problemas Comuns

#### Build Failures

* Verificar se todas as dependências estão no package.json

* Confirmar que não há erros de TypeScript

* Verificar se as variáveis de ambiente estão configuradas

#### Runtime Errors

* Verificar logs no painel do Vercel

* Confirmar conexão com Supabase

* Verificar se as APIs estão respondendo

#### Performance Issues

* Analisar bundle size com `npm run analyze`

* Otimizar imagens e assets

* Implementar cache strategies

### 5.2 Rollback

```bash
# Reverter para deployment anterior
vercel rollback [deployment-url]

# Ou via Git
git revert [commit-hash]
git push origin main
```

