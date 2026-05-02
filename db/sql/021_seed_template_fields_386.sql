INSERT INTO template_fields (
  template_id, field_name, field_label_api, field_type, is_required, context_key, list_options
) VALUES
  (386, 'Indisponibilidade - Inicio', 'CustomColumn22sr', 'datetime', TRUE, 'indisponibilidade_inicio', NULL),
  (386, 'Indisponibilidade - Fim',    'CustomColumn23sr', 'datetime', TRUE, 'indisponibilidade_fim',    NULL)
ON CONFLICT (template_id, field_name) DO UPDATE
SET
  field_label_api = EXCLUDED.field_label_api,
  field_type      = EXCLUDED.field_type,
  is_required     = EXCLUDED.is_required,
  context_key     = EXCLUDED.context_key,
  list_options    = EXCLUDED.list_options;
