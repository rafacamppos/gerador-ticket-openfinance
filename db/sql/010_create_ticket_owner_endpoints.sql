CREATE TABLE IF NOT EXISTS ticket_owner_endpoints (
  id BIGSERIAL PRIMARY KEY,
  ticket_owner_id BIGINT NOT NULL REFERENCES ticket_owners(id),
  endpoint VARCHAR(1024) NOT NULL,
  method VARCHAR(16) NOT NULL,
  description VARCHAR(255),
  category_template_id BIGINT NOT NULL REFERENCES category_templates(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ticket_owner_endpoints_owner_endpoint_method
    UNIQUE (ticket_owner_id, endpoint, method),
  CONSTRAINT chk_ticket_owner_endpoints_method
    CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'))
);

CREATE INDEX IF NOT EXISTS idx_ticket_owner_endpoints_lookup
  ON ticket_owner_endpoints (endpoint, method, is_active);

CREATE INDEX IF NOT EXISTS idx_ticket_owner_endpoints_owner_id
  ON ticket_owner_endpoints (ticket_owner_id, is_active, method ASC);
