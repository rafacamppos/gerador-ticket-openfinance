CREATE TABLE IF NOT EXISTS ticket_users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  profile VARCHAR(16) NOT NULL,
  ticket_owner_id BIGINT NOT NULL REFERENCES ticket_owners(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ticket_users_email UNIQUE (email),
  CONSTRAINT chk_ticket_users_profile CHECK (profile IN ('user', 'adm'))
);

CREATE INDEX IF NOT EXISTS idx_ticket_users_ticket_owner_id
  ON ticket_users (ticket_owner_id, is_active, name ASC);
