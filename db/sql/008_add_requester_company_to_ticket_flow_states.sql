ALTER TABLE ticket_flow_states
  ADD COLUMN IF NOT EXISTS requester_company_name VARCHAR(255);

ALTER TABLE ticket_flow_states
  ADD COLUMN IF NOT EXISTS requester_company_key VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_ticket_flow_states_requester_company_key
  ON ticket_flow_states (requester_company_key);
