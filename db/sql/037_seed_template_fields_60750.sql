INSERT INTO template_fields (
  template_id, field_name, field_label_api, field_type, is_required, context_key, list_options
) VALUES
  (60750, 'Destinatário',                          'CustomColumn38sr',  'text',              TRUE,  'destinatario',            NULL),
  (60750, 'URL do endpoint acionado',              'CustomColumn68sr',  'long',              TRUE,  'endpoint',                NULL),
  (60750, 'X-Fapi-Interaction-ID',                 'CustomColumn156sr', 'long',              TRUE,  'x_fapi_interaction_id',   NULL),
  (60750, 'ID do Consentimento',                   'CustomColumn157sr', 'long',              TRUE,  'id_consentimento',        NULL),
  (60750, 'Estado atual do consentimento',         'CustomColumn158sr', 'list',              TRUE,  'estado_consentimento',    NULL),
  (60750, 'O erro ocorre para um ou mais clientes?','CustomColumn159sr','text',              FALSE, 'erro_multiplos_clientes', NULL),
  (60750, 'Tipo do Cliente',                       'CustomColumn120sr', 'list_multi_select', FALSE, 'tipo_cliente',            '{"PF":"1","PJ":"2"}'),
  (60750, 'Nome e Versão da API',                  'CustomColumn114sr', 'text',              TRUE,  'api_name_version',        NULL),
  (60750, 'Versão API',                            'CustomColumn115sr', 'text',              TRUE,  'api_version',             NULL),
  (60750, 'Produto/Funcionalidade',                'CustomColumn165sr', 'text',              TRUE,  'product_feature',         NULL),
  (60750, 'Etapa(nome e versão api)',              'CustomColumn166sr', 'text',              TRUE,  'stage_name_version',      NULL)
ON CONFLICT (template_id, field_name) DO UPDATE
SET
  field_label_api = EXCLUDED.field_label_api,
  field_type      = EXCLUDED.field_type,
  is_required     = EXCLUDED.is_required,
  context_key     = EXCLUDED.context_key,
  list_options    = EXCLUDED.list_options;
