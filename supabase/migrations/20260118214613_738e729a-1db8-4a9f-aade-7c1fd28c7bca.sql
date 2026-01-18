-- Atualizar platform_costs de clientes inativos para o cliente ativo equivalente (por CPF)
UPDATE platform_costs pc
SET client_id = active_client.id
FROM clients inactive_client
JOIN clients active_client ON active_client.cpf = inactive_client.cpf
WHERE pc.client_id = inactive_client.id
  AND inactive_client.active = false
  AND active_client.active = true
  AND inactive_client.id != active_client.id
  AND inactive_client.cpf IS NOT NULL;

-- Atualizar platform_costs de clientes inativos para o cliente ativo equivalente (por CNPJ)
UPDATE platform_costs pc
SET client_id = active_client.id
FROM clients inactive_client
JOIN clients active_client ON active_client.cnpj = inactive_client.cnpj
WHERE pc.client_id = inactive_client.id
  AND inactive_client.active = false
  AND active_client.active = true
  AND inactive_client.id != active_client.id
  AND inactive_client.cnpj IS NOT NULL;