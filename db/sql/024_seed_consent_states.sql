-- Estados de consentimento conforme especificação BCB Open Finance Brasil.
-- Ref: Manual de APIs de Consentimentos v3.

INSERT INTO consent_states (regulator_code)
VALUES
  ('AUTHORISED'),             -- Consentimento autorizado pelo usuário final
  ('AWAITING_AUTHORISATION'), -- Aguardando autorização do usuário (janela de 5 min)
  ('REJECTED'),               -- Rejeitado pelo usuário ou expirado sem autorização
  ('CONSUMED'),               -- Consentimento utilizado (fluxo de pagamento concluído)
  ('EXPIRED')                 -- Expirado após o período de vigência configurado
ON CONFLICT (regulator_code) DO UPDATE
SET updated_at = NOW();
