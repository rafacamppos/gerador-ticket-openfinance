INSERT INTO template_fields (
  template_id, field_name, field_label_api, field_type, is_required, context_key, list_options
) VALUES
  (39, 'Nome Completo do novo usuário', 'CustomColumn6sr',  'text', TRUE,  'nome_completo_usuario', NULL),
  (39, 'E-mail do novo usuário',        'CustomColumn7sr',  'text', TRUE,  'email_usuario',         NULL),
  (39, 'Fone para contato',             'CustomColumn8sr',  'text', TRUE,  'fone_contato',          NULL),
  (39, 'Nome da instituição',           'CustomColumn9sr',  'text', TRUE,  'nome_instituicao',      NULL),
  (39, 'Setor econômico',               'CustomColumn10sr', 'list', TRUE,  'setor_economico',       NULL)
ON CONFLICT (template_id, field_name) DO UPDATE
SET
  field_label_api = EXCLUDED.field_label_api,
  field_type      = EXCLUDED.field_type,
  is_required     = EXCLUDED.is_required,
  context_key     = EXCLUDED.context_key,
  list_options    = EXCLUDED.list_options;
