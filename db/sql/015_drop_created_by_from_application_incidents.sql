ALTER TABLE application_incidents
  DROP COLUMN IF EXISTS created_by_user_id,
  DROP COLUMN IF EXISTS created_by_name,
  DROP COLUMN IF EXISTS created_by_email;
