INSERT INTO ticket_owners (slug, name, description, is_triage_team, is_fallback_owner)
VALUES
  (
    'iniciadora-pagamentos',
    'Iniciadora de Pagamentos',
    'Area responsavel pelos tickets de Iniciadora de Pagamentos.',
    FALSE,
    FALSE
  ),
  (
    'detentora-pagamentos',
    'Detentora de Pagamentos',
    'Area responsavel pelos tickets de Detentora de Pagamentos.',
    FALSE,
    FALSE
  ),
  (
    'consentimentos-inbound',
    'Consentimentos Inbound',
    'Area responsavel pelos tickets de Consentimentos Inbound.',
    FALSE,
    FALSE
  ),
  (
    'consentimentos-outbound',
    'Consentimentos Outbound',
    'Area responsavel pelos tickets de Consentimentos Outbound.',
    FALSE,
    FALSE
  ),
  (
    'servicos-outbound',
    'Servicos Outbound',
    'Area responsavel pelos tickets de Servicos Outbound.',
    FALSE,
    FALSE
  ),
  (
    'compartilhamento-dados-maq-captura',
    'Compartilhamento de dados/Maq. Captura',
    'Area responsavel pelos tickets de Compartilhamento de dados e Maq. Captura.',
    FALSE,
    FALSE
  ),
  (
    'su-super-usuarios',
    'SU (Super Usuário)',
    'Area responsavel pela triagem e pelo fallback de tickets nao classificados automaticamente.',
    TRUE,
    TRUE
  )
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_triage_team = EXCLUDED.is_triage_team,
    is_fallback_owner = EXCLUDED.is_fallback_owner,
    is_active = TRUE,
    updated_at = NOW();
