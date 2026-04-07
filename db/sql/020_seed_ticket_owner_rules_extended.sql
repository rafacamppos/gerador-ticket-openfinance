-- Referência de field_code válidos (buildRoutingContext):
--   problem_type, problem_sub_type, third_level_category,
--   endpoint, http_status, instituicao_requerente,
--   title, status, type, sr_type, template,
--   assigned_group, request_user, responsibility,
--   current_support_level, interaction_id
--
-- Operadores disponíveis:
--   equals, not_equals, contains, starts_with, ends_with, in, regex

INSERT INTO ticket_owner_rules (
  ticket_owner_id,
  rule_group_code,
  logical_operator,
  field_code,
  operator,
  expected_value,
  priority_order,
  notes
)
SELECT
  owner.id,
  seeded.rule_group_code,
  seeded.logical_operator,
  seeded.field_code,
  seeded.operator,
  seeded.expected_value,
  seeded.priority_order,
  seeded.notes
FROM ticket_owners owner
JOIN (
  VALUES

    -- ===========================================================
    -- iniciadora-pagamentos
    -- Prioridade 10: Iniciando um Pagamento (qualquer subcategoria)
    -- ===========================================================
    (
      'iniciadora-pagamentos',
      'iniciadora-pagamento-pix',
      'AND', 'problem_type', 'equals',
      'Erro na Jornada ou Dados', 10,
      'Tickets de erro na jornada de iniciação de pagamento.'
    ),
    (
      'iniciadora-pagamentos',
      'iniciadora-pagamento-pix',
      'AND', 'problem_sub_type', 'equals',
      'Iniciando um Pagamento', 10,
      'Tickets de erro na jornada de iniciação de pagamento.'
    ),

    -- ===========================================================
    -- detentora-pagamentos
    -- Prioridade 10: Recebendo um Pagamento
    -- ===========================================================
    (
      'detentora-pagamentos',
      'detentora-pagamento-pix',
      'AND', 'problem_type', 'equals',
      'Erro na Jornada ou Dados', 10,
      'Tickets de erro no processamento de pagamento pela detentora.'
    ),
    (
      'detentora-pagamentos',
      'detentora-pagamento-pix',
      'AND', 'problem_sub_type', 'equals',
      'Recebendo um Pagamento', 10,
      'Tickets de erro no processamento de pagamento pela detentora.'
    ),

    -- ===========================================================
    -- consentimentos-inbound
    -- Prioridade 10: Criação de Consentimento
    -- ===========================================================
    (
      'consentimentos-inbound',
      'consentimento-criacao-inbound',
      'AND', 'problem_type', 'equals',
      'Erro na Jornada ou Dados', 10,
      'Tickets de falha na criação de consentimento (instituição detentora).'
    ),
    (
      'consentimentos-inbound',
      'consentimento-criacao-inbound',
      'AND', 'problem_sub_type', 'equals',
      'Obtendo um Consentimento', 10,
      'Tickets de falha na criação de consentimento (instituição detentora).'
    ),
    (
      'consentimentos-inbound',
      'consentimento-criacao-inbound',
      'AND', 'third_level_category', 'equals',
      'Criação de Consentimento', 10,
      'Tickets de falha na criação de consentimento (instituição detentora).'
    ),

    -- ===========================================================
    -- consentimentos-outbound (já tem redirecionamento-conclusao)
    -- Prioridade 10: Cancelamento ou Revogação de Consentimento
    -- ===========================================================
    (
      'consentimentos-outbound',
      'consentimento-cancelamento-revogacao',
      'AND', 'problem_type', 'equals',
      'Erro na Jornada ou Dados', 10,
      'Tickets de cancelamento ou revogação de consentimento outbound.'
    ),
    (
      'consentimentos-outbound',
      'consentimento-cancelamento-revogacao',
      'AND', 'problem_sub_type', 'equals',
      'Obtendo um Consentimento', 10,
      'Tickets de cancelamento ou revogação de consentimento outbound.'
    ),
    (
      'consentimentos-outbound',
      'consentimento-cancelamento-revogacao',
      'AND', 'third_level_category', 'in',
      'Cancelamento de Consentimento;Revogação de Consentimento', 10,
      'Tickets de cancelamento ou revogação de consentimento outbound.'
    ),

    -- ===========================================================
    -- servicos-outbound
    -- Prioridade 10: Compartilhamento de Dados (exceto Recursos)
    -- ===========================================================
    (
      'servicos-outbound',
      'servicos-compartilhamento-dados',
      'AND', 'problem_type', 'equals',
      'Erro na Jornada ou Dados', 10,
      'Tickets de falha em compartilhamento de dados outbound (cadastral, contas, crédito).'
    ),
    (
      'servicos-outbound',
      'servicos-compartilhamento-dados',
      'AND', 'problem_sub_type', 'equals',
      'Compartilhamento de Dados', 10,
      'Tickets de falha em compartilhamento de dados outbound (cadastral, contas, crédito).'
    ),
    (
      'servicos-outbound',
      'servicos-compartilhamento-dados',
      'AND', 'third_level_category', 'in',
      'Consulta de Dados Cadastrais;Consulta de Dados de Contas;Consulta de Dados de Crédito;Consulta de Dados de Financiamentos', 10,
      'Tickets de falha em compartilhamento de dados outbound (cadastral, contas, crédito).'
    ),

    -- ===========================================================
    -- compartilhamento-dados-maq-captura
    -- Prioridade 10: Consulta de Recursos ou Cartão de Crédito
    -- ===========================================================
    (
      'compartilhamento-dados-maq-captura',
      'maq-captura-recursos-cartao',
      'AND', 'problem_type', 'equals',
      'Erro na Jornada ou Dados', 10,
      'Tickets de falha em consulta de recursos e cartão de crédito (maq. de captura).'
    ),
    (
      'compartilhamento-dados-maq-captura',
      'maq-captura-recursos-cartao',
      'AND', 'problem_sub_type', 'equals',
      'Compartilhamento de Dados', 10,
      'Tickets de falha em consulta de recursos e cartão de crédito (maq. de captura).'
    ),
    (
      'compartilhamento-dados-maq-captura',
      'maq-captura-recursos-cartao',
      'AND', 'third_level_category', 'in',
      'Consulta de Recursos;Consulta de Dados de Crédito', 10,
      'Tickets de falha em consulta de recursos e cartão de crédito (maq. de captura).'
    )

) AS seeded (
  owner_slug,
  rule_group_code,
  logical_operator,
  field_code,
  operator,
  expected_value,
  priority_order,
  notes
)
  ON owner.slug = seeded.owner_slug
ON CONFLICT (ticket_owner_id, rule_group_code, field_code, operator, expected_value) DO UPDATE
SET logical_operator = EXCLUDED.logical_operator,
    priority_order   = EXCLUDED.priority_order,
    notes            = EXCLUDED.notes,
    is_active        = TRUE,
    updated_at       = NOW();
