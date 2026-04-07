INSERT INTO api_versions (api_name_version, api_version, product_feature, stage_name_version)
VALUES
  ('Open Finance Brasil Consents API',                'v3', 'Consentimento',              'consents-v3'),
  ('Open Finance Brasil Payment Consents API',        'v4', 'Consentimento de Pagamento',  'payments-consents-v4'),
  ('Open Finance Brasil Payments API',                'v4', 'Pagamento PIX',               'payments-pix-v4'),
  ('Open Finance Brasil Resources API',               'v3', 'Recursos',                    'resources-v3'),
  ('Open Finance Brasil Customers Personal Data API', 'v2', 'Dados Cadastrais PF',         'customers-personal-v2'),
  ('Open Finance Brasil Customers Business Data API', 'v2', 'Dados Cadastrais PJ',         'customers-business-v2'),
  ('Open Finance Brasil Accounts API',                'v2', 'Contas',                      'accounts-v2'),
  ('Open Finance Brasil Credit Cards API',            'v2', 'Cartão de Crédito',           'credit-cards-v2'),
  ('Open Finance Brasil Loans API',                   'v2', 'Empréstimos',                 'loans-v2'),
  ('Open Finance Brasil Financings API',              'v2', 'Financiamentos',              'financings-v2')
ON CONFLICT (api_name_version, api_version, product_feature, stage_name_version) DO UPDATE
SET updated_at = NOW();
