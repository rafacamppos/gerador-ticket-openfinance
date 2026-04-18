-- Reset de dados de tickets
-- Remove todos os registros de ticket sem afetar dados de configuração/catálogo.
--
-- Tabelas afetadas:
--   ticket_flow_events      (FK → ticket_flow_states ON DELETE CASCADE)
--   application_incidents   (FK → ticket_flow_states ON DELETE SET NULL)
--   ticket_flow_states      (tabela principal)
--
-- Tabelas preservadas:
--   ticket_owners, ticket_owner_rules, ticket_users, estado_ticket,
--   category_templates, template_fields, ticket_owner_endpoints,
--   support_teams, field_definitions e derivadas,
--   api_versions, endpoints, monitored_items,
--   payment_states, consent_states,
--   catalog_versions, catalog_load_executions

BEGIN;

-- 1. Remove o histórico de eventos (seria cascadeado pela deleção de
--    ticket_flow_states, mas deleção explícita evita varredura em cascata)
DELETE FROM ticket_flow_events;

-- 2. Remove incidentes — desvincula related_ticket_id e apaga os registros
DELETE FROM application_incidents;

-- 3. Remove os estados de ticket (cascadeia ticket_flow_events restantes)
DELETE FROM ticket_flow_states;

-- 4. Reinicia as sequences dos ids auto-gerados
ALTER SEQUENCE ticket_flow_events_id_seq RESTART WITH 1;
ALTER SEQUENCE application_incidents_id_seq RESTART WITH 1;

COMMIT;
