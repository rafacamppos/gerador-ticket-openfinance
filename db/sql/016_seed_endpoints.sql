INSERT INTO endpoints (endpoint_url, http_method, api_name, api_version_id)
SELECT
  seeded.endpoint_url,
  seeded.http_method,
  seeded.api_name,
  av.id
FROM (
  VALUES
    ('/open-banking/consents/v3/consents', 'POST',   'Dados Cliente - Fase 2'),
    ('/open-banking/consents/v3/consents', 'DELETE', 'Dados Cliente - Fase 2')
) AS seeded (endpoint_url, http_method, api_name)
JOIN api_versions av
  ON  av.api_name_version = 'Dados Cliente - Fase 2'
  AND av.api_version       = '3.3.1'
  AND av.product_feature   = 'Consentimento'
  AND av.stage_name_version = 'Dados Cliente - Fase 2 - Consentimento, 3.3.1'
ON CONFLICT (endpoint_url, http_method) DO UPDATE
SET api_version_id = EXCLUDED.api_version_id,
    api_name       = EXCLUDED.api_name,
    is_active      = TRUE,
    updated_at     = NOW();
