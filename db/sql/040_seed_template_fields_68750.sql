INSERT INTO template_fields (
  template_id, field_name, field_label_api, field_type, is_required, context_key, list_options
) VALUES
  (68750, 'Destinatário',                                              'CustomColumn38sr',  'text',              TRUE, 'destinatario',       NULL),
  (68750, 'Este problema ocorreu no processo de Onboarding de ITP ?', 'CustomColumn59sr',  'text',              TRUE, 'onboarding_itp',     NULL),
  (68750, 'Nome e Versão da API',                                      'CustomColumn114sr', 'text',              TRUE, 'api_name_version',   NULL),
  (68750, 'Versão API',                                                'CustomColumn115sr', 'text',              TRUE, 'api_version',        NULL),
  (68750, 'Produto/Funcionalidade',                                    'CustomColumn165sr', 'text',              TRUE, 'product_feature',    NULL),
  (68750, 'Etapa(nome e versão api)',                                  'CustomColumn166sr', 'text',              TRUE, 'stage_name_version', NULL),
  (68750, 'Tipo do Cliente',                                           'CustomColumn120sr', 'list_multi_select', TRUE, 'tipo_cliente',       '{"PF":"1","PJ":"2"}'),
  (68750, 'Canal da Jornada',                                          'CustomColumn174sr', 'list',              TRUE, 'canal_jornada',      '{"App to app":"1","App to browser":"2","Browser to browser":"3","Browser to app":"4","Não se aplica":"5"}')
ON CONFLICT (template_id, field_name) DO UPDATE
SET
  field_label_api = EXCLUDED.field_label_api,
  field_type      = EXCLUDED.field_type,
  is_required     = EXCLUDED.is_required,
  context_key     = EXCLUDED.context_key,
  list_options    = EXCLUDED.list_options;
