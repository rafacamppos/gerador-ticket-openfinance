INSERT INTO monitored_items (monitored_item_name)
VALUES
  ('Consentimento'),
  ('Consentimento de Pagamento'),
  ('Pagamento PIX'),
  ('Dados Cadastrais'),
  ('Dados de Contas'),
  ('Dados de Cartão de Crédito'),
  ('Dados de Empréstimos'),
  ('Dados de Financiamentos'),
  ('Recursos')
ON CONFLICT (monitored_item_name) DO UPDATE
SET updated_at = NOW();
