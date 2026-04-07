INSERT INTO endpoints (endpoint_url, http_method, api_name, api_version_id, monitored_item_id)
SELECT
  seeded.endpoint_url,
  seeded.http_method,
  seeded.api_name,
  av.id,
  mi.id
FROM (
  VALUES
    -- Consents v3
    ('/open-banking/consents/v3/consents',                              'POST',   'Consents',          'Open Finance Brasil Consents API',                'v3', 'Consentimento',             'consents-v3',          'Consentimento'),
    ('/open-banking/consents/v3/consents/{consentId}',                  'GET',    'Consents',          'Open Finance Brasil Consents API',                'v3', 'Consentimento',             'consents-v3',          'Consentimento'),
    ('/open-banking/consents/v3/consents/{consentId}',                  'DELETE', 'Consents',          'Open Finance Brasil Consents API',                'v3', 'Consentimento',             'consents-v3',          'Consentimento'),

    -- Payments Consents v4
    ('/open-banking/payments/v4/consents',                              'POST',   'Payment Consents',  'Open Finance Brasil Payment Consents API',         'v4', 'Consentimento de Pagamento', 'payments-consents-v4', 'Consentimento de Pagamento'),
    ('/open-banking/payments/v4/consents/{consentId}',                  'GET',    'Payment Consents',  'Open Finance Brasil Payment Consents API',         'v4', 'Consentimento de Pagamento', 'payments-consents-v4', 'Consentimento de Pagamento'),

    -- Payments PIX v4
    ('/open-banking/payments/v4/pix/payments',                          'POST',   'Payments PIX',      'Open Finance Brasil Payments API',                'v4', 'Pagamento PIX',              'payments-pix-v4',      'Pagamento PIX'),
    ('/open-banking/payments/v4/pix/payments/{paymentId}',              'GET',    'Payments PIX',      'Open Finance Brasil Payments API',                'v4', 'Pagamento PIX',              'payments-pix-v4',      'Pagamento PIX'),
    ('/open-banking/payments/v4/pix/payments/{paymentId}',              'PATCH',  'Payments PIX',      'Open Finance Brasil Payments API',                'v4', 'Pagamento PIX',              'payments-pix-v4',      'Pagamento PIX'),

    -- Resources v3
    ('/open-banking/resources/v3/resources',                            'GET',    'Resources',         'Open Finance Brasil Resources API',               'v3', 'Recursos',                   'resources-v3',         'Recursos'),

    -- Customers Personal v2
    ('/open-banking/customers/v2/personal/identifications',             'GET',    'Customers Personal','Open Finance Brasil Customers Personal Data API',  'v2', 'Dados Cadastrais PF',        'customers-personal-v2','Dados Cadastrais'),
    ('/open-banking/customers/v2/personal/financial-relations',         'GET',    'Customers Personal','Open Finance Brasil Customers Personal Data API',  'v2', 'Dados Cadastrais PF',        'customers-personal-v2','Dados Cadastrais'),
    ('/open-banking/customers/v2/personal/qualifications',              'GET',    'Customers Personal','Open Finance Brasil Customers Personal Data API',  'v2', 'Dados Cadastrais PF',        'customers-personal-v2','Dados Cadastrais'),

    -- Customers Business v2
    ('/open-banking/customers/v2/business/identifications',             'GET',    'Customers Business','Open Finance Brasil Customers Business Data API',  'v2', 'Dados Cadastrais PJ',        'customers-business-v2','Dados Cadastrais'),
    ('/open-banking/customers/v2/business/financial-relations',         'GET',    'Customers Business','Open Finance Brasil Customers Business Data API',  'v2', 'Dados Cadastrais PJ',        'customers-business-v2','Dados Cadastrais'),

    -- Accounts v2
    ('/open-banking/accounts/v2/accounts',                              'GET',    'Accounts',          'Open Finance Brasil Accounts API',                'v2', 'Contas',                     'accounts-v2',          'Dados de Contas'),
    ('/open-banking/accounts/v2/accounts/{accountId}',                  'GET',    'Accounts',          'Open Finance Brasil Accounts API',                'v2', 'Contas',                     'accounts-v2',          'Dados de Contas'),
    ('/open-banking/accounts/v2/accounts/{accountId}/balances',         'GET',    'Accounts',          'Open Finance Brasil Accounts API',                'v2', 'Contas',                     'accounts-v2',          'Dados de Contas'),
    ('/open-banking/accounts/v2/accounts/{accountId}/transactions',     'GET',    'Accounts',          'Open Finance Brasil Accounts API',                'v2', 'Contas',                     'accounts-v2',          'Dados de Contas'),
    ('/open-banking/accounts/v2/accounts/{accountId}/overdraft-limits', 'GET',    'Accounts',          'Open Finance Brasil Accounts API',                'v2', 'Contas',                     'accounts-v2',          'Dados de Contas'),

    -- Credit Cards v2
    ('/open-banking/credit-cards-accounts/v2/accounts',                 'GET',    'Credit Cards',      'Open Finance Brasil Credit Cards API',            'v2', 'Cartão de Crédito',          'credit-cards-v2',      'Dados de Cartão de Crédito'),
    ('/open-banking/credit-cards-accounts/v2/accounts/{creditCardAccountId}/bills', 'GET', 'Credit Cards', 'Open Finance Brasil Credit Cards API', 'v2', 'Cartão de Crédito', 'credit-cards-v2', 'Dados de Cartão de Crédito'),

    -- Loans v2
    ('/open-banking/loans/v2/contracts',                                'GET',    'Loans',             'Open Finance Brasil Loans API',                   'v2', 'Empréstimos',                'loans-v2',             'Dados de Empréstimos'),
    ('/open-banking/loans/v2/contracts/{contractId}',                   'GET',    'Loans',             'Open Finance Brasil Loans API',                   'v2', 'Empréstimos',                'loans-v2',             'Dados de Empréstimos'),

    -- Financings v2
    ('/open-banking/financings/v2/contracts',                           'GET',    'Financings',        'Open Finance Brasil Financings API',              'v2', 'Financiamentos',             'financings-v2',        'Dados de Empréstimos'),
    ('/open-banking/financings/v2/contracts/{contractId}',              'GET',    'Financings',        'Open Finance Brasil Financings API',              'v2', 'Financiamentos',             'financings-v2',        'Dados de Empréstimos')

) AS seeded (
  endpoint_url, http_method, api_name,
  api_name_version, api_version, product_feature, stage_name_version,
  monitored_item_name
)
JOIN api_versions av
  ON  av.api_name_version   = seeded.api_name_version
  AND av.api_version         = seeded.api_version
  AND av.product_feature     = seeded.product_feature
  AND av.stage_name_version  = seeded.stage_name_version
JOIN monitored_items mi
  ON mi.monitored_item_name  = seeded.monitored_item_name
ON CONFLICT (endpoint_url, http_method) DO UPDATE
SET api_name         = EXCLUDED.api_name,
    api_version_id   = EXCLUDED.api_version_id,
    monitored_item_id= EXCLUDED.monitored_item_id,
    is_active        = TRUE,
    updated_at       = NOW();
