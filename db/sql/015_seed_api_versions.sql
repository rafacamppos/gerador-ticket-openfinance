INSERT INTO api_versions (api_name_version, api_version, product_feature, stage_name_version)
VALUES
  ('Dados Cliente - Fase 2', '3.3.1', 'Consentimento', 'Dados Cliente - Fase 2 - Consentimento, 3.3.1')
ON CONFLICT (api_name_version, api_version, product_feature, stage_name_version) DO NOTHING;
