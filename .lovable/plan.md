

## Plano: Permitir edição e movimentação de leads finalizados (Convertido/Perdido)

### Objetivo
Remover as restrições que impedem a edição e movimentação de leads com status "convertido" ou "perdido", permitindo que sejam editados e movidos para qualquer outra coluna do Kanban.

### Mudanças necessárias

#### 1. LeadCard.tsx
- Remover a condição `disabled` do `useDraggable` que bloqueia drag para leads convertidos/perdidos
- Remover a condição `isFinalized` que esconde o botão de editar e o drag handle
- Remover a classe `opacity-70 cursor-default` aplicada a leads finalizados
- Manter o drag handle e botão de editar visíveis para todos os status

#### 2. LeadsPage.tsx
- Remover o bloco que impede movimentação de leads convertidos/perdidos no `handleDragEnd` (o trecho que exibe o toast de erro "Não é possível mover leads já finalizados")
- Permitir que o drag-and-drop funcione normalmente para qualquer lead, independente do status atual

### Resumo das alterações

| Arquivo | O que muda |
|---------|-----------|
| `LeadCard.tsx` | Remove `disabled` do draggable, remove ocultação do edit button e drag handle para leads finalizados, remove estilo de opacidade reduzida |
| `LeadsPage.tsx` | Remove validação que bloqueia movimentação de leads convertidos/perdidos |

