ALTER TABLE application_incidents
  ADD COLUMN IF NOT EXISTS client_id UUID;

UPDATE application_incidents
SET client_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE client_id IS NULL;

ALTER TABLE application_incidents
  ALTER COLUMN client_id SET NOT NULL;
