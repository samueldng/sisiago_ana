# Instruções para Atualização do Banco de Dados

## Campo is_active na tabela users

Para que a funcionalidade de ativação/desativação de usuários funcione corretamente, é necessário adicionar o campo `is_active` à tabela `users`.

### SQL para executar no Supabase:

```sql
-- Adicionar campo is_active à tabela users
ALTER TABLE users 
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Atualizar usuários existentes para ativo por padrão
UPDATE users 
SET is_active = true 
WHERE is_active IS NULL;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'is_active';
```

### Como executar:

1. Acesse o painel do Supabase
2. Vá para "SQL Editor"
3. Execute o SQL acima
4. Verifique se a coluna foi criada corretamente

### Funcionalidades que dependem desta coluna:

- Ativação/Desativação de usuários na página de gerenciamento
- API de alteração de status (`/api/users/[id]/status`)
- Exibição do status na tabela de usuários

### Status atual:

- ❌ Coluna `is_active` não existe
- ✅ Interface preparada para usar a coluna
- ✅ API preparada para usar a coluna
- ✅ Validações implementadas

### Após adicionar a coluna:

- ✅ Funcionalidade de ativação/desativação funcionará
- ✅ Status será exibido corretamente na interface
- ✅ Logs de auditoria registrarão mudanças de status