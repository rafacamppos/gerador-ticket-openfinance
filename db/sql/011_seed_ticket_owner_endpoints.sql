INSERT INTO ticket_owner_endpoints (ticket_owner_id, endpoint, method, description)
SELECT
  owner.id,
  seeded.endpoint,
  seeded.method,
  seeded.description
FROM ticket_owners owner
JOIN (
  VALUES
    (
      'consentimentos-inbound',
      '/open-banking/consents/v3/consents',
      'POST',
      'Endpoint de criacao de consentimento roteado para Consentimentos Inbound.'
    ),
    (
      'consentimentos-inbound',
      '/open-banking/consents/v3/consents',
      'DELETE',
      'Endpoint de exclusao de consentimento roteado para Consentimentos Inbound.'
    )
) AS seeded (
  owner_slug,
  endpoint,
  method,
  description
)
  ON owner.slug = seeded.owner_slug
ON CONFLICT (ticket_owner_id, endpoint, method) DO UPDATE
SET description = EXCLUDED.description,
    is_active = TRUE,
    updated_at = NOW();
