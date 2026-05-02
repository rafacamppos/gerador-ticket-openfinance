INSERT INTO template_fields (
  template_id, field_name, field_label_api, field_type, is_required, context_key, list_options
) VALUES
  (8794, 'Evidências do teste',    'CustomColumn84sr',  'text', FALSE, 'evidencias_teste',       NULL),
  (8794, 'Authorization Server ID','CustomColumn83sr',  'text', FALSE, 'authorization_server_id', NULL),
  (8794, 'Tipo de Erro',           'CustomColumn119sr', 'list', FALSE, 'tipo_erro',               NULL)
ON CONFLICT (template_id, field_name) DO UPDATE
SET
  field_label_api = EXCLUDED.field_label_api,
  field_type      = EXCLUDED.field_type,
  is_required     = EXCLUDED.is_required,
  context_key     = EXCLUDED.context_key,
  list_options    = EXCLUDED.list_options;
