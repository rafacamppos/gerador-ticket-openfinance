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
    (
      'consentimentos-outbound',
      'consentimento-redirecionamento-conclusao',
      'AND',
      'problem_type',
      'equals',
      'Erro na Jornada ou Dados',
      10,
      'Regra inicial baseada no ticket 158721 para falhas na jornada de consentimento outbound.'
    ),
    (
      'consentimentos-outbound',
      'consentimento-redirecionamento-conclusao',
      'AND',
      'problem_sub_type',
      'equals',
      'Obtendo um Consentimento',
      10,
      'Regra inicial baseada no ticket 158721 para falhas na jornada de consentimento outbound.'
    ),
    (
      'consentimentos-outbound',
      'consentimento-redirecionamento-conclusao',
      'AND',
      'third_level_category',
      'equals',
      'Redirecionamento para Conclusao',
      10,
      'Regra inicial baseada no ticket 158721 para falhas na jornada de consentimento outbound.'
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
    priority_order = EXCLUDED.priority_order,
    notes = EXCLUDED.notes,
    is_active = TRUE,
    updated_at = NOW();
