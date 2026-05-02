INSERT INTO template_fields (
  template_id, field_name, field_label_api, field_type, is_required, context_key, list_options
) VALUES
  (6752, 'Organisation ID',      'CustomColumn53sr', 'text', TRUE,  'organisation_id',      NULL),
  (6752, 'Software Statement ID','CustomColumn54sr', 'text', FALSE, 'software_statement_id', NULL)
ON CONFLICT (template_id, field_name) DO UPDATE
SET
  field_label_api = EXCLUDED.field_label_api,
  field_type      = EXCLUDED.field_type,
  is_required     = EXCLUDED.is_required,
  context_key     = EXCLUDED.context_key,
  list_options    = EXCLUDED.list_options;
