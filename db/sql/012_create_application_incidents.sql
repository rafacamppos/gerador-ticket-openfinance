CREATE TABLE IF NOT EXISTS application_incidents (
  id BIGSERIAL PRIMARY KEY,
  ticket_owner_id BIGINT NOT NULL REFERENCES ticket_owners(id),
  x_fapi_interaction_id UUID NOT NULL,
  authorization_server UUID NOT NULL,
  client_id UUID NOT NULL,
  endpoint VARCHAR(1024) NOT NULL,
  method VARCHAR(16) NOT NULL,
  payload_erro JSONB NOT NULL,
  data_hora TIMESTAMPTZ NOT NULL,
  status_code_error INTEGER NOT NULL,
  incident_status VARCHAR(32) NOT NULL DEFAULT 'new',
  related_ticket_id BIGINT,
  assigned_to_user_id BIGINT,
  assigned_to_name VARCHAR(255),
  assigned_to_email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_application_incidents_method
    CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD')),
  CONSTRAINT chk_application_incidents_status_code
    CHECK (status_code_error BETWEEN 100 AND 599),
  CONSTRAINT chk_application_incidents_incident_status
    CHECK (incident_status IN ('new', 'assigned', 'ticket_created', 'monitoring', 'resolved', 'canceled'))
);

CREATE INDEX IF NOT EXISTS idx_application_incidents_owner_date
  ON application_incidents (ticket_owner_id, data_hora DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_application_incidents_fapi_interaction
  ON application_incidents (x_fapi_interaction_id);
