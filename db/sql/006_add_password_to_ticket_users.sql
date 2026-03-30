ALTER TABLE ticket_users
  ADD COLUMN IF NOT EXISTS password VARCHAR(255);

UPDATE ticket_users
SET password = '123456'
WHERE password IS NULL OR password = '';

ALTER TABLE ticket_users
  ALTER COLUMN password SET NOT NULL;
