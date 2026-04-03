INSERT INTO support_teams (team_name, financial_institution_name, auth_server)
VALUES
  ('N2_BancoItaú', 'ITAÚ UNIBANCO S.A.', '3c8c00be-f66b-4db2-a777-d833ee4d3d96')
ON CONFLICT (team_name, financial_institution_name) DO UPDATE
SET auth_server = EXCLUDED.auth_server,
    is_active   = TRUE,
    updated_at  = NOW();
