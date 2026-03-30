ALTER TABLE application_incidents
  ADD COLUMN IF NOT EXISTS incident_status VARCHAR(32),
  ADD COLUMN IF NOT EXISTS related_ticket_id BIGINT;

UPDATE application_incidents
SET incident_status = 'new'
WHERE incident_status IS NULL;

ALTER TABLE application_incidents
  ALTER COLUMN incident_status SET NOT NULL,
  ALTER COLUMN incident_status SET DEFAULT 'new';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_application_incidents_incident_status'
  ) THEN
    ALTER TABLE application_incidents
      ADD CONSTRAINT chk_application_incidents_incident_status
      CHECK (incident_status IN ('new', 'assigned', 'ticket_created', 'monitoring', 'resolved', 'canceled'));
  END IF;
END $$;
