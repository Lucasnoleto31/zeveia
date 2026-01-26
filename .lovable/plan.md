

## Atualização em Massa de Campanha de Leads

### Resumo da Operação

Atualizar **28 leads** cadastrados pela Karen no dia 26/01/2026, alterando a campanha de **"Treinamento"** para **"Insta25/01 (Treinamento)"**.

---

### Dados Identificados

| Campo | Valor |
|-------|-------|
| Assessora | Karen Cristina Borges de Oliveira |
| ID da Karen | `816220b9-3b5d-4d31-aba1-891f5a9ca2de` |
| Campanha Atual | Treinamento |
| ID Campanha Atual | `b3b0776f-3afb-4f6b-8cc0-e1b2955e67ce` |
| Campanha Nova | Insta25/01 (Treinamento) |
| ID Campanha Nova | `bed00059-25e5-40fc-8418-e8aadb1030fb` |
| Total de Leads | 28 |
| Data de Criação | 26/01/2026 |

---

### Leads Afetados (amostra)

1. Juliano
2. Brenner Dias Martins
3. Gabriel Santos Oliveira
4. Matheus Pereira de Souza
5. Pedro Henrique
6. Luan Santana Luz Santos
7. Vitor Gabriel
8. Patricia Vergil
9. Jardel Mengoni
10. Diego dos Santos Costa
11. Alexandre Martins
12. Gustavo
13. Fernando de Deus
14. Cleverson
15. Wellington
16. Gabriel Lopes de Aquino
17. Israel dos Santos
18. Hugo Silva
19. Grasiele de Melo Oliveira Brito
20. Elvis Cristiano de Souza
21. Leandro Noberto de Araujo
22. Gabriel Barbosa Martins dos Santos
23. Fernando Tome
24. Cristiane Andriato Souza
25. Keke Rosberg Praxedes de Menezes
26. Matheus Maturano
27. (+ mais 2 leads)

---

### Comando SQL a Executar

```sql
UPDATE leads
SET 
  campaign_id = 'bed00059-25e5-40fc-8418-e8aadb1030fb',
  updated_at = NOW()
WHERE assessor_id = '816220b9-3b5d-4d31-aba1-891f5a9ca2de'
  AND created_at >= '2026-01-26 00:00:00'
  AND created_at < '2026-01-27 00:00:00'
  AND campaign_id = 'b3b0776f-3afb-4f6b-8cc0-e1b2955e67ce';
```

---

### Resultado Esperado

- **28 leads** terão sua campanha alterada de "Treinamento" para "Insta25/01 (Treinamento)"
- O campo `updated_at` será atualizado para registrar a modificação
- Os relatórios de funil e análise de cohort refletirão a nova campanha automaticamente

