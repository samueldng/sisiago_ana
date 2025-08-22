# SISIAGO - Sistema de Auditoria e Gestão

Sistema completo de auditoria e gestão desenvolvido com Next.js 14, TypeScript, Supabase e Tailwind CSS.

> 📋 **[Ver Documentação Técnica Completa](./DOCUMENTACAO_TECNICA_COMPLETA.md)** - Documentação detalhada de todas as correções e implementações

## 🌐 Aplicação em Produção

**URL Principal**: https://sisana.netlify.app

### 🔗 Links Diretos:
- **PDV (Ponto de Venda)**: https://sisana.netlify.app/pdv
- **Gerenciamento de Usuários**: https://sisana.netlify.app/users
- **Logs de Auditoria**: https://sisana.netlify.app/audit-logs
- **Gestão de Produtos**: https://sisana.netlify.app/produtos
- **Relatórios**: https://sisana.netlify.app/relatorios

## 🚀 Deploy no Netlify + Supabase

### Pré-requisitos
1. Conta no [Netlify](https://netlify.com)
2. Conta no [Supabase](https://supabase.com)
3. Node.js 18+ instalado
4. Git configurado

### Configuração do Supabase

1. **Criar projeto no Supabase:**
   - Acesse [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Anote a URL e a chave do banco

2. **Configurar banco de dados:**
   ```sql
   -- As tabelas são criadas via Supabase
   -- Apenas certifique-se de que o projeto está ativo
   ```

### Deploy no Netlify

1. **Conectar repositório:**
   - Faça push do código para GitHub/GitLab
   - Conecte o repositório no Netlify

2. **Configurar variáveis de ambiente:**
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   JWT_SECRET=your-secure-jwt-secret-key-minimum-32-characters
   NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Configurar build:**
   - Comando de build: `npm run build`
   - Diretório de publicação: `.next`
   - Adicione o arquivo `netlify.toml` para configurar redirecionamentos de API

### Comandos Úteis

```bash
# Desenvolvimento local
npm run dev

# Build para produção
npm run build

# Migrar banco (após deploy)
npm run migrate:deploy

# Popular banco com dados iniciais
npm run db:seed
```

## ✨ Características Principais

- **Sistema de Auditoria Completo**: Dashboard com métricas, sessões e notificações em tempo real
- **Gerenciamento de Usuários**: CRUD completo com filtros avançados e controle de permissões
- **Scanner de Código de Barras**: Integração com câmera para leitura de códigos
- **Autenticação Segura**: Sistema completo com Supabase Auth e proteção de rotas
- **Dashboard Interativo**: Gráficos e visualizações com Recharts
- **Type Safety**: 100% TypeScript com mais de 100 erros críticos corrigidos
- **Arquitetura Moderna**: Next.js 14 com App Router e componentes Shadcn/ui
- **Deploy Automático**: Pronto para Netlify + Supabase

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deploy**: Netlify com configuração de API routes
- **State Management**: React Query, Context API
- **Charts**: Recharts para visualizações
- **Scanner**: Integração com câmera do dispositivo
- **Autenticação**: JWT com middleware de proteção

## Instalação Local

```bash
# Clone o repositório
git clone <repository-url>
cd sisiago

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Configure o banco de dados
# Tabelas criadas via Supabase SQL Editor

# Popular com dados iniciais
npm run db:seed

# Inicie o servidor de desenvolvimento
npm run dev
```

## Estrutura do Projeto

```
src/
├── app/                 # App Router do Next.js 14
│   ├── pdv/            # Módulo PDV (Ponto de Venda)
│   ├── produtos/       # Gestão de Produtos
│   ├── vendas/         # Histórico de Vendas
│   ├── pagamentos/     # Controle de Pagamentos
│   ├── users/          # Gerenciamento de Usuários
│   ├── audit-logs/     # Logs de Auditoria
│   └── api/            # APIs do sistema
├── components/         # Componentes reutilizáveis
│   ├── ui/            # Componentes de UI base (Dialog, Select, etc.)
│   ├── BarcodeScanner.tsx
│   └── PixQRCode.tsx
├── lib/               # Utilitários e configurações
│   └── audit.ts       # Sistema de auditoria
├── contexts/          # Contextos React (AuthContext)
└── types/             # Definições de tipos TypeScript
```

## Módulos Implementados

### 🔍 Sistema de Auditoria
- **Dashboard de Performance**: Métricas em tempo real com gráficos interativos
- **Sessões de Usuário**: Monitoramento detalhado de atividades e sessões
- **Notificações**: Sistema de alertas e notificações em tempo real
- **Logs Detalhados**: Rastreamento completo de ações do sistema

### 👥 Gerenciamento de Usuários
- **CRUD Completo**: Criação, edição, visualização e exclusão de usuários
- **Filtros Avançados**: Busca por nome, email, departamento e status
- **Modal de Edição**: Interface intuitiva para edição de dados
- **Controle de Permissões**: Sistema de roles e autorizações

### 📱 Scanner de Código de Barras
- **Integração com Câmera**: Acesso direto à câmera do dispositivo
- **Múltiplos Formatos**: Suporte a diversos tipos de código de barras
- **Interface Responsiva**: Otimizado para dispositivos móveis e desktop

### 🔐 Sistema de Autenticação
- **Login/Logout**: Fluxo completo de autenticação com Supabase
- **Proteção de Rotas**: Middleware para controle de acesso
- **Verificação Automática**: Manutenção de sessão ativa
- **Context API**: Gerenciamento global de estado de autenticação

## 🔮 Roadmap

### ✅ Implementado
- **Sistema de Auditoria Completo**: Dashboard, sessões, notificações e performance
- **Gerenciamento de Usuários**: CRUD completo com filtros e permissões
- **Scanner de Código de Barras**: Integração funcional com câmera
- **Autenticação Segura**: Login/logout com Supabase Auth
- **Correções de TypeScript**: Mais de 100 erros críticos corrigidos
- **Middleware de Proteção**: Segurança de rotas e APIs
- **Interface Responsiva**: Design moderno com Tailwind CSS

### 🚧 Melhorias Futuras
- Correção dos ~300 erros de TypeScript restantes (não críticos)
- Implementação de testes automatizados
- Otimização de performance
- Documentação de API

### 📋 Expansões Planejadas
- **PDV (Ponto de Venda)**: Sistema completo de vendas
- **Gestão de Produtos**: Controle de estoque e inventário
- **Relatórios Avançados**: Analytics e dashboards personalizados
- **CRM**: Gestão de clientes e relacionamento
- **App Mobile**: Aplicativo nativo React Native

## 📚 Documentação

- **[Documentação Técnica Completa](./DOCUMENTACAO_TECNICA_COMPLETA.md)** - Todas as correções e implementações realizadas
- **[Guia de Deploy](./netlify.toml)** - Configuração para deploy no Netlify
- **[Resumo Executivo](./RESUMO_EXECUTIVO_FINAL.md)** - Visão geral do projeto

## 🔧 Estado Atual do Projeto

### ✅ Funcionalidades Operacionais
- Sistema de autenticação completo e funcional
- Dashboard de auditoria com métricas em tempo real
- Gerenciamento de usuários totalmente operacional
- Scanner de código de barras implementado
- Middleware de segurança ativo
- Servidor Next.js compilando sem erros críticos

### 🛠️ Correções Realizadas
- **AuthContext**: Verificação automática de autenticação
- **API de Verificação**: Padronização de respostas
- **AuditPerformance**: 37 erros de TypeScript corrigidos
- **AuditSessions**: 21 erros de TypeScript corrigidos
- **AuditNotifications**: 18 erros de TypeScript corrigidos
- **UserManagement**: Correções de tipos e verificações de nulidade
- **Scanner**: Implementação funcional com verificações adequadas

## 📄 Licença

MIT License