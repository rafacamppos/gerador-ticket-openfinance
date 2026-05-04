INSERT INTO template_fields (
  template_id, field_name, field_label_api, field_type, is_required, context_key, list_options
) VALUES
  (60740, 'Destinatário',                                                    'CustomColumn38sr',  'text',              TRUE,  'destinatario',        NULL),
  (60740, 'Nome da marca de destino',                                        'CustomColumn73sr',  'text',              TRUE,  'nome_marca_destino',  NULL),
  (60740, 'URL do arquivo .well-known da transmissora/detentora',            'CustomColumn74sr',  'long',              TRUE,  'url_well_known',      NULL),
  (60740, 'Conteúdo do arquivo .well-known da transmissora/detentora',       'CustomColumn75sr',  'long',              TRUE,  'conteudo_well_known', NULL),
  (60740, 'Tipo do Cliente',                                                 'CustomColumn120sr', 'list_multi_select', FALSE, 'tipo_cliente',        '{"PF":"1","PJ":"2"}'),
  (60740, 'Nome e Versão da API',                                            'CustomColumn114sr', 'text',              TRUE, 'stage_name_version',    NULL),
  (60740, 'Versão API',                                                      'CustomColumn115sr', 'text',              TRUE,  'api_version',         NULL),
  (60740, 'Produto/Funcionalidade',                                          'CustomColumn165sr', 'text',              TRUE,  'product_feature',     NULL),
  (60740, 'Etapa(nome e versão api)',                                        'CustomColumn166sr', 'text',              TRUE,  'stage_name_version',  NULL)
ON CONFLICT (template_id, field_name) DO UPDATE
SET
  field_label_api = EXCLUDED.field_label_api,
  field_type      = EXCLUDED.field_type,
  is_required     = EXCLUDED.is_required,
  context_key     = EXCLUDED.context_key,
  list_options    = EXCLUDED.list_options;
