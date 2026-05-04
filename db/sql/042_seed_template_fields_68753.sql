INSERT INTO template_fields (
  template_id, field_name, field_label_api, field_type, is_required, context_key, list_options
) VALUES
  (68753, 'Destinatário',                                              'CustomColumn38sr',  'text',              TRUE,  'destinatario',        NULL),
  (68753, 'Nome da marca de destino',                                  'CustomColumn73sr',  'text',              TRUE,  'nome_marca_destino',  NULL),
  (68753, 'URL do arquivo .well-known da transmissora/detentora',      'CustomColumn74sr',  'long',              TRUE,  'url_well_known',      NULL),
  (68753, 'Conteúdo do arquivo .well-known da transmissora/detentora', 'CustomColumn75sr',  'long',              TRUE,  'conteudo_well_known', NULL),
  (68753, 'Tipo do Cliente',                                           'CustomColumn120sr', 'list_multi_select', FALSE, 'tipo_cliente',        '{"PF":"1","PJ":"2"}'),
  (68753, 'Nome e Versão da API',                                      'CustomColumn114sr', 'text',              TRUE, 'stage_name_version',    NULL),
  (68753, 'Versão API',                                                'CustomColumn115sr', 'text',              TRUE,  'api_version',         NULL),
  (68753, 'Produto/Funcionalidade',                                    'CustomColumn165sr', 'text',              TRUE,  'product_feature',     NULL),
  (68753, 'Etapa(nome e versão api)',                                  'CustomColumn166sr', 'text',              TRUE,  'stage_name_version',  NULL),
  (68753, 'Canal da Jornada',                                          'CustomColumn174sr', 'list',              FALSE, 'canal_jornada',       '{"App to app":"1","App to browser":"2","Browser to browser":"3","Browser to app":"4","Não se aplica":"5"}'),
  (68753, 'X-Fapi-Interaction-ID',                                     'CustomColumn156sr', 'long',              FALSE, 'x_fapi_interaction_id', NULL)
ON CONFLICT (template_id, field_name) DO UPDATE
SET
  field_label_api = EXCLUDED.field_label_api,
  field_type      = EXCLUDED.field_type,
  is_required     = EXCLUDED.is_required,
  context_key     = EXCLUDED.context_key,
  list_options    = EXCLUDED.list_options;
