CREATE TABLE IF NOT EXISTS application_incidents (
  id BIGSERIAL PRIMARY KEY,
  ticket_owner_id BIGINT NOT NULL REFERENCES ticket_owners(id),
  x_fapi_interaction_id UUID NOT NULL,
  authorization_server UUID NOT NULL,
  client_id UUID NOT NULL,
  endpoint VARCHAR(1024) NOT NULL,
  method VARCHAR(16) NOT NULL,
  payload_request JSONB NOT NULL,
  payload_response JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  http_status_code INTEGER NOT NULL,
  incident_status VARCHAR(32) NOT NULL DEFAULT 'new',
  related_ticket_id BIGINT REFERENCES ticket_flow_states(ticket_id) ON DELETE SET NULL,
  assigned_to_user_id BIGINT REFERENCES ticket_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description VARCHAR(1024) NOT NULL,
  CONSTRAINT chk_application_incidents_method
    CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD')),
  CONSTRAINT chk_application_incidents_status_code
    CHECK (http_status_code BETWEEN 100 AND 599),
  CONSTRAINT chk_application_incidents_incident_status
    CHECK (incident_status IN ('new', 'assigned', 'ticket_created', 'monitoring', 'resolved', 'canceled'))
);

CREATE INDEX IF NOT EXISTS idx_application_incidents_owner_date
  ON application_incidents (ticket_owner_id, occurred_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_application_incidents_fapi_interaction
  ON application_incidents (x_fapi_interaction_id);
