

## Plano: Criar lead automaticamente ao iniciar playbook de retencao

### Objetivo
Quando o usuario clicar em "Iniciar Playbook" para um cliente em risco na pagina de Retencao, alem de criar as acoes do playbook, o sistema deve automaticamente criar um lead (oportunidade) no CRM vinculado a esse cliente.

### Como funciona

O sistema ja suporta leads vinculados a clientes existentes (campo `client_id` na tabela `leads`) - sao tratados como "oportunidades". A mudanca e criar um lead desse tipo automaticamente ao iniciar um playbook.

### Mudancas necessarias

#### 1. `src/pages/RetentionDashboardPage.tsx` - Criar lead ao iniciar playbook

Na funcao `handleStartPlaybook`, apos o `startPlaybook.mutate` ter sucesso:
- Inserir um novo lead na tabela `leads` com:
  - `name`: nome do cliente + " - Retencao"
  - `client_id`: ID do cliente
  - `status`: `'em_contato'`
  - `assessor_id`: assessor do cliente (`selectedClient.assessorId`)
  - `observations`: "Lead criado automaticamente pelo playbook de retencao: [nome do playbook]"
- Invalidar o cache de leads (`queryKey: ['leads']`)
- Exibir toast de sucesso informando que o lead foi criado

#### 2. `src/hooks/useRetention.ts` - Estender `useStartPlaybook` (alternativa mais limpa)

Ao inves de fazer no componente, integrar a criacao do lead diretamente dentro da mutation `useStartPlaybook`:
- Apos inserir as retention_actions, inserir tambem um lead
- Isso garante que a logica fica centralizada no hook

### Detalhes tecnicos

**Lead criado automaticamente:**
```text
{
  name: `${clientName} - Retenção`,
  client_id: clientId,
  status: 'em_contato',
  assessor_id: client.assessorId,
  observations: `Lead criado automaticamente via playbook "${playbookName}"`
}
```

**Fluxo:**
1. Usuario clica em "Iniciar Playbook" para um cliente em risco
2. Sistema cria as acoes do playbook (comportamento existente)
3. Sistema cria um lead/oportunidade vinculado ao cliente
4. Toast confirma: "Playbook iniciado e lead criado no CRM"

### Resumo das alteracoes

| Arquivo | O que muda |
|---------|-----------|
| `src/pages/RetentionDashboardPage.tsx` | `handleStartPlaybook` passa o nome do cliente e do playbook para o hook |
| `src/hooks/useRetention.ts` | `useStartPlaybook` cria um lead automaticamente apos inserir as acoes |

