ALTER TABLE application_incidents
  ADD COLUMN IF NOT EXISTS id_version_api BIGINT;
