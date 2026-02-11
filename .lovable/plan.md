

## Plano: Seleção em massa de leads + ação "Marcar como Perdido"

### Objetivo
Adicionar checkboxes nos cards de leads na coluna "Novo" permitindo seleção múltipla, com uma barra de ações em massa que inclui o botão "Marcar como Perdido" para todos os leads selecionados de uma vez.

---

### Mudanças necessárias

#### 1. LeadCard.tsx - Adicionar checkbox de seleção
- Receber novas props: `selectable`, `selected`, `onSelect`
- Quando `selectable=true`, exibir um checkbox no canto superior esquerdo do card
- O clique no checkbox não deve disparar navegação nem drag

#### 2. LeadsPage.tsx - Estado de seleção e barra de ações em massa
- Adicionar estado `selectedLeadIds: Set<string>` para controlar quais leads estão selecionados
- Adicionar estado `isBulkLostOpen: boolean` para o dialog de perda em massa
- Passar props de seleção para os LeadCards da coluna "novo"
- Exibir uma barra flutuante de ações em massa quando houver leads selecionados, contendo:
  - Contador de leads selecionados
  - Botão "Selecionar todos" (seleciona todos da coluna "novo")
  - Botão "Desmarcar todos"
  - Botão "Marcar como Perdido" (abre dialog)

#### 3. BulkMarkAsLostDialog.tsx - Novo componente
- Similar ao `MarkAsLostDialog` existente, mas para múltiplos leads
- Exibe a quantidade de leads que serão marcados como perdido
- Solicita o motivo da perda (obrigatório) e observações (opcional)
- Ao confirmar, executa `updateLead.mutateAsync` para cada lead selecionado em sequência (ou usa Promise.all para paralelizar)
- Limpa a seleção após sucesso

#### 4. useLeads.ts - Adicionar hook de atualização em massa
- Criar `useBulkUpdateLeads()` que recebe um array de IDs e os dados de update
- Executa todas as atualizações em paralelo usando `Promise.all`
- Invalida o cache de leads ao final

---

### Detalhes técnicos

**Estado de seleção no LeadsPage:**
```text
const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
```

**LeadCard recebe props condicionais:**
- Apenas leads da coluna "novo" terão `selectable=true`
- O checkbox fica visivel ao lado do drag handle

**Barra de ações em massa:**
- Aparece fixada no rodape da tela (sticky bottom) quando `selectedLeadIds.size > 0`
- Estilo: fundo escuro, texto claro, com animacao de entrada

**BulkMarkAsLostDialog:**
- Reutiliza o mesmo select de `loss_reasons` do `MarkAsLostDialog`
- Aplica o mesmo `loss_reason_id` e `observations` para todos os leads selecionados
- Atualiza `status: 'perdido'` e `lost_at: new Date().toISOString()` em cada lead

**Hook useBulkUpdateLeads:**
```text
mutationFn: async ({ ids, data }) => {
  const updates = ids.map(id =>
    supabase.from('leads').update(data).eq('id', id)
  );
  const results = await Promise.all(updates);
  // check for errors
}
```

---

### Correção dos erros de build existentes
Os erros de TypeScript nos arquivos `useChurnPrediction.ts`, `useDashboard.ts`, `useHealthScore.ts`, `useRetention.ts`, e `batchFetch.ts` estao relacionados a incompatibilidades entre os tipos gerados automaticamente (`supabase/types.ts`) e os tipos manuais. Esses erros serao corrigidos junto com a implementacao, adicionando casts `as any` nos pontos necessarios para desbloquear o build.

