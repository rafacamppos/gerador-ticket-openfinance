-- =====================================================================
-- Categoria: Erro na Jornada ou Dados > Obtendo um Consentimento
-- Template: 123328 (Consentimento) | Owners: consentimentos-inbound / outbound
-- =====================================================================
INSERT INTO category_templates (id, category_name, sub_category_name, third_level_category_name, template_id, type)
VALUES
  -- Já existe: 547 | Criação de Consentimento | 123328
  (548, 'Erro na Jornada ou Dados', 'Obtendo um Consentimento', 'Redirecionamento para Conclusão',       123328, 1),
  (549, 'Erro na Jornada ou Dados', 'Obtendo um Consentimento', 'Cancelamento de Consentimento',         123328, 1),
  (550, 'Erro na Jornada ou Dados', 'Obtendo um Consentimento', 'Revogação de Consentimento',            123328, 1),

-- =====================================================================
-- Categoria: Erro na Jornada ou Dados > Iniciando um Pagamento
-- Template: 123329 (Pagamento PIX) | Owner: iniciadora-pagamentos
-- =====================================================================
  (551, 'Erro na Jornada ou Dados', 'Iniciando um Pagamento',   'Criação de Consentimento de Pagamento', 123329, 1),
  (552, 'Erro na Jornada ou Dados', 'Iniciando um Pagamento',   'Iniciação do Pagamento PIX',            123329, 1),
  (553, 'Erro na Jornada ou Dados', 'Iniciando um Pagamento',   'Cancelamento de Pagamento',             123329, 1),

-- =====================================================================
-- Categoria: Erro na Jornada ou Dados > Recebendo um Pagamento
-- Template: 123329 (Pagamento PIX) | Owner: detentora-pagamentos
-- =====================================================================
  (554, 'Erro na Jornada ou Dados', 'Recebendo um Pagamento',   'Processamento do Pagamento PIX',        123329, 1),
  (555, 'Erro na Jornada ou Dados', 'Recebendo um Pagamento',   'Devolução de Pagamento PIX',            123329, 1),
  (556, 'Erro na Jornada ou Dados', 'Recebendo um Pagamento',   'Pagamento Rejeitado pela Detentora',    123329, 1),

-- =====================================================================
-- Categoria: Erro na Jornada ou Dados > Compartilhamento de Dados
-- Template: 123330 (Dados) | Owners: servicos-outbound / compartilhamento-dados-maq-captura
-- =====================================================================
  (557, 'Erro na Jornada ou Dados', 'Compartilhamento de Dados', 'Consulta de Dados Cadastrais',        123330, 1),
  (558, 'Erro na Jornada ou Dados', 'Compartilhamento de Dados', 'Consulta de Dados de Contas',         123330, 1),
  (559, 'Erro na Jornada ou Dados', 'Compartilhamento de Dados', 'Consulta de Dados de Crédito',        123330, 1),
  (560, 'Erro na Jornada ou Dados', 'Compartilhamento de Dados', 'Consulta de Recursos',                123330, 1),
  (561, 'Erro na Jornada ou Dados', 'Compartilhamento de Dados', 'Consulta de Dados de Financiamentos', 123330, 1),

-- =====================================================================
-- Categoria: Não Conformidade Técnica
-- Template: 123328 | Owner: su-super-usuarios (triagem)
-- =====================================================================
  (562, 'Não Conformidade Técnica', 'Problema de Disponibilidade', 'Indisponibilidade de Endpoint',     123328, 2),
  (563, 'Não Conformidade Técnica', 'Problema de Performance',     'Timeout ou Alta Latência',          123328, 2),
  (564, 'Não Conformidade Técnica', 'Segurança',                   'Falha de Autenticação FAPI',        123328, 2)
ON CONFLICT (id) DO UPDATE
SET category_name            = EXCLUDED.category_name,
    sub_category_name        = EXCLUDED.sub_category_name,
    third_level_category_name= EXCLUDED.third_level_category_name,
    template_id              = EXCLUDED.template_id,
    type                     = EXCLUDED.type;
