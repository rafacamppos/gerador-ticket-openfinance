CREATE TABLE IF NOT EXISTS ticket_flow_states (
  ticket_id BIGINT PRIMARY KEY,
  ticket_title VARCHAR(500),
  ticket_status VARCHAR(120),
  requester_company_name VARCHAR(255),
  requester_company_key VARCHAR(120),
  current_stage VARCHAR(60) NOT NULL,
  current_owner_slug VARCHAR(120),
  assigned_owner_slug VARCHAR(120),
  accepted_by_team BOOLEAN NOT NULL DEFAULT FALSE,
  responded_by_team BOOLEAN NOT NULL DEFAULT FALSE,
  returned_to_su BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_ticket_flow_states_stage CHECK (
    current_stage IN (
      'triage_su',
      'routed_to_owner',
      'accepted_by_owner',
      'returned_to_su',
      'responded_by_owner',
      'closed_canceled'
    )
  )
);

CREATE TABLE IF NOT EXISTS ticket_flow_events (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES ticket_flow_states(ticket_id) ON DELETE CASCADE,
  action VARCHAR(60) NOT NULL,
  from_stage VARCHAR(60),
  to_stage VARCHAR(60) NOT NULL,
  from_owner_slug VARCHAR(120),
  to_owner_slug VARCHAR(120),
  actor_name VARCHAR(255),
  actor_email VARCHAR(255),
  note TEXT,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_ticket_flow_events_action CHECK (
    action IN (
      'route_to_owner',
      'accept',
      'respond',
      'return_to_su',
      'reject',
      'canceled',
      'closed'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_ticket_flow_states_owner_stage
  ON ticket_flow_states (current_owner_slug, current_stage, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_flow_states_updated_at
  ON ticket_flow_states (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_flow_events_ticket_created
  ON ticket_flow_events (ticket_id, created_at DESC);
