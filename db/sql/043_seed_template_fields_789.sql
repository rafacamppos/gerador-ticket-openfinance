INSERT INTO template_fields (
  template_id, field_name, field_label_api, field_type, is_required, context_key, list_options
) VALUES
  (789, 'Nome da instituição',    'CustomColumn9sr',  'text', TRUE,  'nome_instituicao',   NULL),
  (789, 'E-mail para notificação','CustomColumn12sr', 'text', FALSE, 'email_notificacao',  NULL),
  (789, 'E-mail do responsável',  'CustomColumn14sr', 'text', TRUE,  'email_responsavel',  NULL),
  (789, 'Fone para contato',      'CustomColumn8sr',  'text', TRUE,  'fone_contato',       NULL),
  (789, 'Analista, e-mail, fone', 'CustomColumn15sr', 'long', TRUE,  'analista_email_fone', NULL)
ON CONFLICT (template_id, field_name) DO UPDATE
SET
  field_label_api = EXCLUDED.field_label_api,
  field_type      = EXCLUDED.field_type,
  is_required     = EXCLUDED.is_required,
  context_key     = EXCLUDED.context_key,
  list_options    = EXCLUDED.list_options;
