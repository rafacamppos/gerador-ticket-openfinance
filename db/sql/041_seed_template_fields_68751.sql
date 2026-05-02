INSERT INTO template_fields (
  template_id, field_name, field_label_api, field_type, is_required, context_key, list_options
) VALUES
  (68751, 'Destinatário',                                  'CustomColumn38sr',  'text',              TRUE,  'destinatario',          NULL),
  (68751, 'Seu client_id nesta transmissora/detentora',    'CustomColumn79sr',  'text',              FALSE, 'client_id_transmissora', NULL),
  (68751, 'Nome e Versão da API',                          'CustomColumn114sr', 'text',              TRUE,  'api_name_version',      NULL),
  (68751, 'Versão API',                                    'CustomColumn115sr', 'text',              TRUE,  'api_version',           NULL),
  (68751, 'Produto/Funcionalidade',                        'CustomColumn165sr', 'text',              TRUE,  'product_feature',       NULL),
  (68751, 'Etapa(nome e versão api)',                      'CustomColumn166sr', 'text',              TRUE,  'stage_name_version',    NULL),
  (68751, 'Tipo do Cliente',                               'CustomColumn120sr', 'list_multi_select', FALSE, 'tipo_cliente',          '{"PF":"1","PJ":"2"}'),
  (68751, 'Canal da Jornada',                              'CustomColumn174sr', 'list',              FALSE, 'canal_jornada',         '{"App to app":"1","App to browser":"2","Browser to browser":"3","Browser to app":"4","Não se aplica":"5"}'),
  (68751, 'X-Fapi-Interaction-ID',                         'CustomColumn156sr', 'long',              FALSE, 'x_fapi_interaction_id', NULL)
ON CONFLICT (template_id, field_name) DO UPDATE
SET
  field_label_api = EXCLUDED.field_label_api,
  field_type      = EXCLUDED.field_type,
  is_required     = EXCLUDED.is_required,
  context_key     = EXCLUDED.context_key,
  list_options    = EXCLUDED.list_options;
