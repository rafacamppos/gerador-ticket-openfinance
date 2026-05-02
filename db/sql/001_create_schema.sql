CREATE TABLE IF NOT EXISTS catalog_versions (
  id BIGSERIAL PRIMARY KEY,
  source_name VARCHAR(120) NOT NULL,
  version_label VARCHAR(80) NOT NULL,
  checksum VARCHAR(128),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_catalog_versions UNIQUE (source_name, version_label)
);


CREATE TABLE IF NOT EXISTS category_templates (
  id BIGINT PRIMARY KEY,
  category_name VARCHAR(255) NOT NULL,
  sub_category_name VARCHAR(255) NOT NULL,
  third_level_category_name VARCHAR(255) NOT NULL,
  template_id BIGINT NOT NULL,
  type INTEGER NOT NULL
);


CREATE TABLE IF NOT EXISTS field_definitions (
  id BIGSERIAL PRIMARY KEY,
  field_code VARCHAR(120) NOT NULL,
  front_label VARCHAR(255) NOT NULL,
  details TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  catalog_version_id BIGINT REFERENCES catalog_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_field_definitions UNIQUE (field_code)
);

CREATE TABLE IF NOT EXISTS field_api_mappings (
  id BIGSERIAL PRIMARY KEY,
  field_definition_id BIGINT NOT NULL REFERENCES field_definitions(id) ON DELETE CASCADE,
  api_key VARCHAR(120) NOT NULL,
  direction VARCHAR(16) NOT NULL DEFAULT 'both',
  source_system VARCHAR(80) NOT NULL DEFAULT 'open_finance_regulator',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  catalog_version_id BIGINT REFERENCES catalog_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_field_api_mappings UNIQUE (field_definition_id, api_key, source_system),
  CONSTRAINT chk_field_api_mappings_direction CHECK (direction IN ('read', 'write', 'both'))
);

CREATE TABLE IF NOT EXISTS field_type_mappings (
  id BIGSERIAL PRIMARY KEY,
  field_definition_id BIGINT NOT NULL REFERENCES field_definitions(id) ON DELETE CASCADE,
  api_key VARCHAR(120) NOT NULL,
  data_type_id BIGINT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  raw_type_label VARCHAR(120) NOT NULL,
  catalog_version_id BIGINT REFERENCES catalog_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_field_type_mappings UNIQUE (field_definition_id, api_key)
);

CREATE TABLE IF NOT EXISTS field_list_values (
  id BIGSERIAL PRIMARY KEY,
  field_definition_id BIGINT NOT NULL REFERENCES field_definitions(id) ON DELETE CASCADE,
  option_value VARCHAR(120) NOT NULL,
  option_label VARCHAR(255) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  catalog_version_id BIGINT REFERENCES catalog_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_field_list_values UNIQUE (field_definition_id, option_value)
);

CREATE TABLE IF NOT EXISTS template_fields (
  id BIGSERIAL PRIMARY KEY,
  template_id BIGINT NOT NULL,
  field_name VARCHAR(120) NOT NULL,
  field_label_api VARCHAR(255) NOT NULL,
  field_type VARCHAR(60) NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  context_key VARCHAR(120),
  list_options JSONB,
  CONSTRAINT uq_template_fields UNIQUE (template_id, field_name)
);

CREATE TABLE IF NOT EXISTS support_teams (
  id BIGSERIAL PRIMARY KEY,
  team_name VARCHAR(255) NOT NULL,
  financial_institution_name VARCHAR(255) NOT NULL,
  auth_server UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_support_teams UNIQUE (team_name, financial_institution_name)
);

CREATE TABLE IF NOT EXISTS api_versions (
  id BIGSERIAL PRIMARY KEY,
  api_name_version VARCHAR(255) NOT NULL,
  api_version VARCHAR(120) NOT NULL,
  product_feature VARCHAR(255) NOT NULL,
  stage_name_version VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_api_versions UNIQUE (api_name_version, api_version, product_feature, stage_name_version)
);

CREATE TABLE IF NOT EXISTS monitored_items (
  id BIGSERIAL PRIMARY KEY,
  monitored_item_name VARCHAR(255) NOT NULL,
  catalog_version_id BIGINT REFERENCES catalog_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_monitored_items UNIQUE (monitored_item_name)
);

CREATE TABLE IF NOT EXISTS payment_states (
  id BIGSERIAL PRIMARY KEY,
  regulator_code VARCHAR(80) NOT NULL,
  catalog_version_id BIGINT REFERENCES catalog_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_payment_states UNIQUE (regulator_code)
);

CREATE TABLE IF NOT EXISTS consent_states (
  id BIGSERIAL PRIMARY KEY,
  regulator_code VARCHAR(120) NOT NULL,
  catalog_version_id BIGINT REFERENCES catalog_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_consent_states UNIQUE (regulator_code)
);

CREATE TABLE IF NOT EXISTS endpoints (
  id BIGSERIAL PRIMARY KEY,
  endpoint_url TEXT NOT NULL,
  http_method VARCHAR(16) NOT NULL,
  api_name VARCHAR(255) NOT NULL,
  api_version_id BIGINT REFERENCES api_versions(id),
  monitored_item_id BIGINT REFERENCES monitored_items(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  catalog_version_id BIGINT REFERENCES catalog_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_endpoints UNIQUE (endpoint_url, http_method)
);

CREATE TABLE IF NOT EXISTS ticket_owners (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_triage_team BOOLEAN NOT NULL DEFAULT FALSE,
  is_fallback_owner BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ticket_owners_slug UNIQUE (slug),
  CONSTRAINT uq_ticket_owners_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS ticket_owner_rules (
  id BIGSERIAL PRIMARY KEY,
  ticket_owner_id BIGINT NOT NULL REFERENCES ticket_owners(id) ON DELETE CASCADE,
  rule_group_code VARCHAR(120) NOT NULL,
  logical_operator VARCHAR(8) NOT NULL DEFAULT 'AND',
  field_code VARCHAR(120) NOT NULL,
  operator VARCHAR(20) NOT NULL,
  expected_value TEXT NOT NULL,
  priority_order INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_ticket_owner_rules_logical_operator
    CHECK (logical_operator IN ('AND', 'OR')),
  CONSTRAINT chk_ticket_owner_rules_operator
    CHECK (
      operator IN (
        'equals',
        'not_equals',
        'contains',
        'starts_with',
        'ends_with',
        'in',
        'regex'
      )
    ),
  CONSTRAINT uq_ticket_owner_rules_rule_item
    UNIQUE (ticket_owner_id, rule_group_code, field_code, operator, expected_value)
);

CREATE TABLE IF NOT EXISTS estado_ticket (
  id BIGINT PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_estado_ticket_nome UNIQUE (nome)
);

CREATE TABLE IF NOT EXISTS catalog_load_executions (
  id BIGSERIAL PRIMARY KEY,
  catalog_version_id BIGINT REFERENCES catalog_versions(id),
  execution_name VARCHAR(120) NOT NULL,
  status VARCHAR(40) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_catalog_load_executions_status CHECK (status IN ('running', 'success', 'failed'))
);


CREATE INDEX IF NOT EXISTS idx_category_templates_category
  ON category_templates (category_name, sub_category_name, third_level_category_name, type);

CREATE INDEX IF NOT EXISTS idx_field_api_mappings_api_key
  ON field_api_mappings (api_key);

CREATE INDEX IF NOT EXISTS idx_template_fields_template
  ON template_fields (template_id, is_required, field_name);


CREATE INDEX IF NOT EXISTS idx_ticket_owners_active
  ON ticket_owners (is_active, is_triage_team, is_fallback_owner);

CREATE INDEX IF NOT EXISTS idx_ticket_owner_rules_lookup
  ON ticket_owner_rules (ticket_owner_id, rule_group_code, priority_order, is_active);

CREATE INDEX IF NOT EXISTS idx_ticket_owner_rules_field
  ON ticket_owner_rules (field_code, operator, is_active);


INSERT INTO estado_ticket (id, nome) VALUES
  (1, 'NOVO'),
  (2, 'EM ANÁLISE N1'),
  (3, 'EM ATENDIMENTO N1'),
  (4, 'ATENDIMENTO ENCERRADO'),
  (5, 'AGUARDANDO REQUISITANTE'),
  (6, 'ENCAMINHADO N2 ATENDIMENTO'),
  (7, 'EM ANÁLISE N2'),
  (8, 'EM ATENDIMENTO N2'),
  (9, 'ENCAMINHADO N1 ANÁLISE'),
  (11, 'ENCERRADO PELO REQUISITANTE'),
  (12, 'ATUALIZADO PELO REQUISITANTE'),
  (13, 'REABERTO PELO REQUISITANTE'),
  (15, 'AGUARDANDO IMPLEMENTAÇÃO N2'),
  (17, 'AGUARDANDO REQUISITANTE - VALIDAÇÃO DA IMPLEMENTAÇÃO'),
  (22, 'ENCAMINHADO PARA OPERAÇÃO DE MONITORAMENTO'),
  (23, 'IMPLEMENTADA SOLUÇÃO PARCIAL'),
  (24, 'CORREÇÃO IMPLEMENTADA'),
  (25, 'AGUARDANDO VALIDAÇÃO DA NÃO CONFORMIDADE'),
  (26, 'AGUARDANDO REEXECUÇÃO/CONTESTAÇÃO'),
  (27, 'AGUARDANDO VALIDAÇÃO DA ESTRUTURA'),
  (28, 'ENCAMINHADO PARA N3 OPERAÇÃO DE MONITORAMENTO'),
  (29, 'ENCAMINHADO PARA N3 ANÁLISE TÉCNICA'),
  (30, 'CANCELADO'),
  (31, 'APROVAÇÃO CONCLUÍDA'),
  (32, 'AGUARDANDO DADOS N3'),
  (33, 'TODOS')
ON CONFLICT (id) DO UPDATE
SET nome = EXCLUDED.nome,
    updated_at = NOW();
