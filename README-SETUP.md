# Setup do Banco de Dados - SisIago

## ✅ Status Atual
- ✅ Tabelas criadas no Supabase
- ✅ Cliente Supabase funcionando
- ✅ Dados de exemplo inseridos
- ⚠️ RLS precisa ser configurado
- ✅ Cliente Supabase configurado e funcionando

## 🔧 Configuração Necessária

### 1. Executar Script RLS (OBRIGATÓRIO)
Para resolver o aviso "unrestricted data is publicly accessible via api as rls is disabled":

```sql
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/uzaclmtjkimccuibuily/sql

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

-- Políticas simples para desenvolvimento
CREATE POLICY "Allow all for authenticated users" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON products FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON sales FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON sale_items FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON payments FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON system_configs FOR ALL USING (true);

SELECT 'RLS habilitado com políticas simples para desenvolvimento!' as message;
```

### 2. Variáveis de Ambiente Configuradas ✅
O arquivo `.env` já está configurado com:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `DATABASE_URL`

### 3. Cliente Supabase ✅
O arquivo `src/lib/supabase.ts` está configurado e funcionando.

## 🚀 Como Usar

### Importar o cliente Supabase:
```typescript
import { supabase, db } from '@/lib/supabase'

// Exemplo: Listar categorias
const { data: categories } = await db.categories.findMany()

// Exemplo: Criar produto
const { data: product } = await db.products.create({
  name: 'Produto Teste',
  sale_price: 10.50,
  category_id: 'categoria-id'
})
```

### Usar cliente Supabase:
```typescript
// Cliente Supabase já configurado
```

Use:
```typescript
import { db } from '@/lib/supabase'
const { data: categories } = await db.categories.findMany()
```

## 🔍 Testes

### Testar conexão:
```bash
node test-supabase-client.js
```

### Verificar aplicação:
```bash
npm run dev
```

## 📝 Próximos Passos

1. ✅ Executar script RLS no Supabase
2. 🔄 Atualizar componentes para usar cliente Supabase
3. 🔄 Testar todas as funcionalidades
4. 🔄 Deploy atualizado

## 🛠️ Arquivos Importantes

- `src/lib/supabase.ts` - Cliente Supabase configurado
- `supabase-setup.sql` - Script de criação das tabelas
- `simple-rls.sql` - Script RLS simplificado
- `enable-rls.sql` - Script RLS completo (produção)
- `test-supabase-client.js` - Teste de conexão