ALTER TABLE application_incidents
  ADD COLUMN IF NOT EXISTS assigned_to_user_id BIGINT,
  ADD COLUMN IF NOT EXISTS assigned_to_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS assigned_to_email VARCHAR(255);
