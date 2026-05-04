INSERT INTO template_fields (
  template_id, field_name, field_label_api, field_type, is_required, context_key, list_options
) VALUES
  (60736, 'Nome e Versão da API',                              'CustomColumn114sr', 'text',              TRUE, 'stage_name_version',   NULL),
  (60736, 'Versão API',                                        'CustomColumn115sr', 'text',              TRUE,  'api_version',        NULL),
  (60736, 'Produto/Funcionalidade',                            'CustomColumn165sr', 'text',              TRUE,  'product_feature',    NULL),
  (60736, 'Etapa(nome e versão api)',                          'CustomColumn166sr', 'text',              TRUE,  'stage_name_version', NULL),
  (60736, 'Tipo do Cliente',                                   'CustomColumn120sr', 'list_multi_select', FALSE, 'tipo_cliente',       '{"PF":"1","PJ":"2"}'),
  (60736, 'Test Plan ID onde foi observado o incidente',       'CustomColumn37sr',  'text',              TRUE,  'test_plan_id',       NULL)
ON CONFLICT (template_id, field_name) DO UPDATE
SET
  field_label_api = EXCLUDED.field_label_api,
  field_type      = EXCLUDED.field_type,
  is_required     = EXCLUDED.is_required,
  context_key     = EXCLUDED.context_key,
  list_options    = EXCLUDED.list_options;
