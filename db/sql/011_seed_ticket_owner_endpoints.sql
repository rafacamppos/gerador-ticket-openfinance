INSERT INTO ticket_owner_endpoints (ticket_owner_id, endpoint, method, description, category_template_id)
SELECT
  owner.id,
  seeded.endpoint,
  seeded.method,
  seeded.description,
  seeded.category_template_id
FROM ticket_owners owner
JOIN (
  VALUES
    (
      'consentimentos-inbound',
      '/open-banking/consents/v3/consents',
      'POST',
      'Endpoint de criacao de consentimento roteado para Consentimentos Inbound.',
      547
    ),
    (
      'consentimentos-inbound',
      '/open-banking/consents/v3/consents',
      'DELETE',
      'Endpoint de exclusao de consentimento roteado para Consentimentos Inbound.',
      547
    )
) AS seeded (
  owner_slug,
  endpoint,
  method,
  description,
  category_template_id
)
  ON owner.slug = seeded.owner_slug
ON CONFLICT (ticket_owner_id, endpoint, method) DO UPDATE
SET description = EXCLUDED.description,
    category_template_id = EXCLUDED.category_template_id,
    is_active = TRUE,
    updated_at = NOW();
