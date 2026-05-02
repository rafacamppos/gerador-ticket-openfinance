INSERT INTO template_fields (
  template_id, field_name, field_label_api, field_type, is_required, context_key, list_options
) VALUES
  (60744, 'Destinatário',                               'CustomColumn38sr',  'text',              TRUE,  'destinatario',       NULL),
  (60744, 'URL do endpoint acionado',                   'CustomColumn68sr',  'long',              TRUE,  'endpoint',           NULL),
  (60744, 'Headers e Payload da solicitação (Request)', 'CustomColumn69sr',  'long',              FALSE, 'payload_request',    NULL),
  (60744, 'Código HTTP da resposta',                    'CustomColumn229sr', 'list',              TRUE,  'http_status_code',   '{"429":"2","5xx":"4","4xx":"3","*":"1"}'),
  (60744, 'Headers e Payload da resposta (Response)',   'CustomColumn71sr',  'long',              TRUE,  'payload_response',   NULL),
  (60744, 'Tipo do Cliente',                            'CustomColumn120sr', 'list_multi_select', FALSE, 'tipo_cliente',       '{"PF":"1","PJ":"2"}'),
  (60744, 'Nome e Versão da API',                       'CustomColumn114sr', 'text',              TRUE,  'api_name_version',   NULL),
  (60744, 'Versão API',                                 'CustomColumn115sr', 'text',              TRUE,  'api_version',        NULL),
  (60744, 'Produto/Funcionalidade',                     'CustomColumn165sr', 'text',              TRUE,  'product_feature',    NULL),
  (60744, 'Etapa(nome e versão api)',                   'CustomColumn166sr', 'text',              TRUE,  'stage_name_version', NULL)
ON CONFLICT (template_id, field_name) DO UPDATE
SET
  field_label_api = EXCLUDED.field_label_api,
  field_type      = EXCLUDED.field_type,
  is_required     = EXCLUDED.is_required,
  context_key     = EXCLUDED.context_key,
  list_options    = EXCLUDED.list_options;
