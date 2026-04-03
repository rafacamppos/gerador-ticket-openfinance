INSERT INTO template_fields (
  template_id,
  field_name,
  field_label_api,
  field_type,
  is_required
) VALUES
  (123328, 'Destinatário', 'CustomColumn38sr', 'text', TRUE),
  (123328, 'Seu client_id neste participante', 'CustomColumn72sr', 'text', TRUE),
  (123328, 'URL do endpoint acionado', 'CustomColumn68sr', 'long', TRUE),
  (123328, 'Headers e Payload da solicitação (Request)', 'CustomColumn69sr', 'long', TRUE),
  (123328, 'Código HTTP da resposta', 'CustomColumn229sr', 'list', TRUE),
  (123328, 'Headers e Payload da resposta (Response)', 'CustomColumn71sr', 'long', TRUE),
  (123328, 'Nome e Versão da API', 'CustomColumn114sr', 'text', TRUE),
  (123328, 'Versão API', 'CustomColumn115sr', 'text', TRUE),
  (123328, 'Produto/Funcionalidade', 'CustomColumn165sr', 'text', TRUE),
  (123328, 'Etapa(nome e versão api)', 'CustomColumn166sr', 'text', TRUE),
  (123328, 'Tipo do Cliente', 'CustomColumn120sr', 'list_multi_select', TRUE),
  (123328, 'Canal da Jornada', 'CustomColumn174sr', 'list', TRUE),
  (123328, 'X-Fapi-Interaction-ID', 'CustomColumn156sr', 'long', TRUE)
ON CONFLICT (template_id, field_name) DO UPDATE
SET
  field_label_api = EXCLUDED.field_label_api,
  field_type = EXCLUDED.field_type,
  is_required = EXCLUDED.is_required;
