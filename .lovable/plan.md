

## Plano: Expandir seleção em massa + Auto-perdido para leads inativos

### 1. Expandir checkboxes de seleção em massa

**Arquivo: `src/pages/LeadsPage.tsx`**

Atualmente, apenas a coluna "Novo" permite seleção (`selectable={column.id === 'novo'}`). A mudança e simples:

- Alterar a condição de `selectable` para incluir as colunas `novo`, `em_contato` e `troca_assessoria`:
  ```text
  selectable={['novo', 'em_contato', 'troca_assessoria'].includes(column.id)}
  ```

- Atualizar o "Selecionar todos" para pegar leads das 3 colunas (nao apenas "novo"):
  ```text
  const selectableLeads = [
    ...getLeadsByStatus('novo'),
    ...getLeadsByStatus('em_contato'),
    ...getLeadsByStatus('troca_assessoria'),
  ];
  ```
  E usar `selectableLeads` no `handleSelectAll`.

### 2. Auto-marcar como perdido leads com 15+ dias sem interacao

**Abordagem:** Criar uma edge function agendada via cron que roda diariamente. Ela verifica leads ativos (status `novo`, `em_contato`, `troca_assessoria`) sem nenhuma interacao nos ultimos 15 dias e os marca automaticamente como `perdido`.

**Novo arquivo: `supabase/functions/auto-mark-lost-leads/index.ts`**

- Busca leads com status ativo (`novo`, `em_contato`, `troca_assessoria`)
- Para cada lead, verifica a data da ultima interacao na tabela `interactions` (ou `updated_at` do lead se nao houver interacoes)
- Se a ultima interacao/atualizacao foi ha mais de 15 dias, atualiza o status para `perdido` com `lost_at` preenchido
- Cria um loss_reason padrao "Sem interacao por 15 dias" se nao existir, ou usa um existente
- Loga quantos leads foram atualizados

**Agendamento via cron (SQL a ser executado via insert tool):**
- Agendar a funcao para rodar uma vez por dia (ex: meia-noite)
- Usar `pg_cron` + `pg_net` para chamar a edge function

**Logica da edge function:**
```text
1. Buscar todos os leads com status IN ('novo', 'em_contato', 'troca_assessoria')
2. Para cada lead, buscar a interacao mais recente
3. Se nao houver interacao E o lead.updated_at > 15 dias: marcar como perdido
4. Se houver interacao mas a mais recente > 15 dias: marcar como perdido
5. Retornar contagem de leads atualizados
```

### 3. Habilitar extensoes necessarias (migracao)

- Habilitar `pg_cron` e `pg_net` se ainda nao estiverem ativas
- Criar o cron job apontando para a edge function

### Resumo das alteracoes

| Arquivo | O que muda |
|---------|-----------|
| `src/pages/LeadsPage.tsx` | Expande `selectable` para 3 colunas, atualiza "Selecionar todos" |
| `supabase/functions/auto-mark-lost-leads/index.ts` | Nova edge function para auto-marcar leads inativos |
| Migracao SQL | Habilita `pg_cron`/`pg_net` |
| SQL via insert tool | Cria o agendamento cron diario |

