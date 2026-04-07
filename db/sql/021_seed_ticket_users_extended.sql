-- ATENÇÃO: senhas em plain-text apenas para ambiente de desenvolvimento.
-- Em produção, armazenar hash bcrypt ou equivalente.

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
    -- iniciadora-pagamentos
    (
      'Admin Iniciadora',
      'admin.iniciadora@openfinance.local',
      'changeme_iniciadora',
      'adm',
      'iniciadora-pagamentos'
    ),
    (
      'Analista Iniciadora',
      'analista.iniciadora@openfinance.local',
      'changeme_iniciadora',
      'user',
      'iniciadora-pagamentos'
    ),

    -- detentora-pagamentos
    (
      'Admin Detentora',
      'admin.detentora@openfinance.local',
      'changeme_detentora',
      'adm',
      'detentora-pagamentos'
    ),
    (
      'Analista Detentora',
      'analista.detentora@openfinance.local',
      'changeme_detentora',
      'user',
      'detentora-pagamentos'
    ),

    -- consentimentos-inbound (Rafael e Diego já existem via 007)
    -- adicionando apenas backup admin
    (
      'Admin Consentimentos Inbound',
      'admin.consentimentos.inbound@openfinance.local',
      'changeme_consent_in',
      'adm',
      'consentimentos-inbound'
    ),

    -- consentimentos-outbound
    (
      'Admin Consentimentos Outbound',
      'admin.consentimentos.outbound@openfinance.local',
      'changeme_consent_out',
      'adm',
      'consentimentos-outbound'
    ),
    (
      'Analista Consentimentos Outbound',
      'analista.consentimentos.outbound@openfinance.local',
      'changeme_consent_out',
      'user',
      'consentimentos-outbound'
    ),

    -- servicos-outbound
    (
      'Admin Serviços Outbound',
      'admin.servicos.outbound@openfinance.local',
      'changeme_servicos',
      'adm',
      'servicos-outbound'
    ),
    (
      'Analista Serviços Outbound',
      'analista.servicos.outbound@openfinance.local',
      'changeme_servicos',
      'user',
      'servicos-outbound'
    ),

    -- compartilhamento-dados-maq-captura
    (
      'Admin Compartilhamento Dados',
      'admin.compartilhamento@openfinance.local',
      'changeme_compartilhamento',
      'adm',
      'compartilhamento-dados-maq-captura'
    ),
    (
      'Analista Compartilhamento Dados',
      'analista.compartilhamento@openfinance.local',
      'changeme_compartilhamento',
      'user',
      'compartilhamento-dados-maq-captura'
    ),

    -- su-super-usuarios
    (
      'Super Usuário Admin',
      'admin.su@openfinance.local',
      'changeme_su',
      'adm',
      'su-super-usuarios'
    ),
    (
      'Analista SU',
      'analista.su@openfinance.local',
      'changeme_su',
      'user',
      'su-super-usuarios'
    )

) AS seeded (name, email, password, profile, owner_slug)
  ON owner.slug = seeded.owner_slug
ON CONFLICT (email) DO UPDATE
SET name            = EXCLUDED.name,
    password        = EXCLUDED.password,
    profile         = EXCLUDED.profile,
    ticket_owner_id = EXCLUDED.ticket_owner_id,
    is_active       = TRUE,
    updated_at      = NOW();
