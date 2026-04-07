-- Estados de pagamento conforme especificação BCB Open Finance Brasil.
-- Ref: Manual de Segurança e Manual de APIs de Pagamentos v4.

INSERT INTO payment_states (regulator_code)
VALUES
  ('ACCP'),   -- AcceptedCustomerProfile: aceito pela instituição detentora após validação de perfil
  ('ACSC'),   -- AcceptedSettlementCompleted: liquidação concluída com sucesso
  ('ACWC'),   -- AcceptedWithChange: aceito com alteração (ex: data de liquidação ajustada)
  ('ACWP'),   -- AcceptedWithoutPosting: aceito mas ainda não lançado
  ('CANC'),   -- Cancelled: cancelado pelo iniciador ou detentora antes da liquidação
  ('PDNG'),   -- Pending: aguardando processamento pela detentora
  ('RCVD'),   -- Received: recebido pela detentora, pendente de validação
  ('RJCT'),   -- Rejected: rejeitado pela detentora ou pelo SPI
  ('SCHD')    -- Scheduled: agendado para liquidação futura
ON CONFLICT (regulator_code) DO UPDATE
SET updated_at = NOW();
