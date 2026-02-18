

## Exclusao de Leads com Status "Novo"

### Situacao Atual
- **1.588 leads** com status "novo" no banco de dados
- **0 interacoes** vinculadas a esses leads
- **0 tarefas** vinculadas a esses leads
- Exclusao segura, sem dependencias

### Acao
Executar um comando SQL para deletar todos os registros da tabela `leads` onde `status = 'novo'`.

```text
DELETE FROM leads WHERE status = 'novo';
```

### Importante
- Esta acao e **irreversivel** - os 1.588 leads serao excluidos permanentemente
- A pagina de Leads sera atualizada automaticamente apos a exclusao (o React Query invalida o cache)
- Nenhum outro dado sera afetado

### Detalhes tecnicos
- Nao ha necessidade de alterar codigo, apenas executar o SQL de limpeza no banco
- Nenhuma migracao necessaria - e uma operacao de dados pontual

