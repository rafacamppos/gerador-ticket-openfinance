INSERT INTO ticket_users (name, email, password, profile, ticket_owner_id)
SELECT
  seeded.name,
  seeded.email,
  seeded.password,
  seeded.profile,
  owner.id
FROM ticket_owners owner
JOIN (
  VALUES
    (
      'Rafael de Campos',
      'rafael.campos@f1rst.com.br',
      '123456',
      'adm',
      'consentimentos-inbound'
    ),
    (
      'Diego Sena',
      'diego.sena@f1rst.com.br',
      '123456',
      'user',
      'consentimentos-inbound'
    )
) AS seeded (
  name,
  email,
  password,
  profile,
  owner_slug
)
  ON owner.slug = seeded.owner_slug
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    password = EXCLUDED.password,
    profile = EXCLUDED.profile,
    ticket_owner_id = EXCLUDED.ticket_owner_id,
    is_active = TRUE,
    updated_at = NOW();
