

## Inativar Clientes - Botao Individual + Inativacao em Massa (90 dias sem receita)

### O que sera feito

**1. Botao "Inativar" na tabela de clientes**
- Adicionar um botao com icone `UserX` na coluna de acoes de cada cliente
- Ao clicar, exibir um dialog de confirmacao antes de marcar como inativo (`active = false`)
- O botao so aparece para clientes ativos

**2. Botao "Inativar Sem Receita" no header da pagina**
- Adicionar um botao no topo da pagina ao lado dos botoes existentes (Mesclar, Importar, Novo)
- Ao clicar, o sistema consulta o banco para identificar todos os clientes ativos que **nao possuem nenhuma receita nos ultimos 90 dias**
- Exibe um dialog de confirmacao mostrando quantos clientes serao afetados
- Apos confirmacao, atualiza todos de uma vez para `active = false`

### Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/clients/ClientsTable.tsx` | Adicionar botao "Inativar" por linha com callback `onDeactivate` |
| `src/pages/ClientsPage.tsx` | Adicionar botao "Inativar Sem Receita", dialog de confirmacao, e logica de inativacao em massa |
| `src/hooks/useClients.ts` | Adicionar hook `useDeactivateInactiveClients` que consulta receitas dos ultimos 90 dias e faz update em massa |

### Detalhes tecnicos

**Inativacao individual:**
- Usa o `useUpdateClient` ja existente com `{ id, active: false }`
- Dialog de confirmacao com AlertDialog do Radix

**Inativacao em massa (90 dias):**
- Query SQL: buscar clientes ativos cujo `id` NAO aparece em `revenues` com `date >= now() - 90 dias`
- Atualizar todos esses clientes com `active = false` em batch
- Exibir toast com quantidade de clientes inativados

**Logica da query:**
```text
1. Buscar IDs de clientes com receita nos ultimos 90 dias (SELECT DISTINCT client_id FROM revenues WHERE date >= current_date - 90)
2. Buscar clientes ativos cujo ID nao esta nessa lista
3. Atualizar active = false para todos eles
```

