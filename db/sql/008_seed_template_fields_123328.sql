INSERT INTO template_fields (
  template_id,
  field_name,
  field_label_api,
  field_type,
  is_required,
  context_key,
  list_options
) VALUES
  (123328, 'Seu client_id neste participante',           'CustomColumn72sr',  'text',              TRUE, 'client_id',             NULL),
  (123328, 'URL do endpoint acionado',                   'CustomColumn68sr',  'long',              TRUE, 'endpoint',              NULL),
  (123328, 'Headers e Payload da solicitação (Request)', 'CustomColumn69sr',  'long',              TRUE, 'payload_request',       NULL),
  (123328, 'Código HTTP da resposta',                    'CustomColumn229sr', 'list',              TRUE, 'http_status_code',      '{"429":"2","5xx":"4","4xx":"3","*":"1"}'),
  (123328, 'Headers e Payload da resposta (Response)',   'CustomColumn71sr',  'long',              TRUE, 'payload_response',      NULL),
  (123328, 'Nome e Versão da API',                       'CustomColumn114sr', 'text',              TRUE, 'stage_name_version',    NULL),
  (123328, 'Versão API',                                 'CustomColumn115sr', 'text',              TRUE, 'api_version',           NULL),
  (123328, 'Produto/Funcionalidade',                     'CustomColumn165sr', 'text',              TRUE, 'product_feature',       NULL),
  (123328, 'Etapa(nome e versão api)',                   'CustomColumn166sr', 'text',              TRUE, 'stage_name_version',    NULL),
  (123328, 'Tipo do Cliente',                            'CustomColumn120sr', 'list_multi_select', TRUE, 'tipo_cliente',          '{"PF":"1","PJ":"2"}'),
  (123328, 'Canal da Jornada',                           'CustomColumn174sr', 'list',              TRUE, 'canal_jornada',         '{"App to app":"1","App to browser":"2","Browser to browser":"3","Browser to app":"4","Não se aplica":"5"}'),
  (123328, 'X-Fapi-Interaction-ID',                      'CustomColumn156sr', 'long',              TRUE, 'x_fapi_interaction_id', NULL),
  (123328, 'Destinatário',                               'CustomColumn38sr',  'text',              TRUE, 'destinatario',          NULL)
ON CONFLICT (template_id, field_name) DO UPDATE
SET
  field_label_api = EXCLUDED.field_label_api,
  field_type      = EXCLUDED.field_type,
  is_required     = EXCLUDED.is_required,
  context_key     = EXCLUDED.context_key,
  list_options    = EXCLUDED.list_options;
