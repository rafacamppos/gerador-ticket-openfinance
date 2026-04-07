-- auth_server: UUID do Authorization Server de cada IF no diretório Open Finance Brasil.
-- Os valores abaixo são representativos para ambiente de desenvolvimento.
-- Em produção, consultar o Diretório de Participantes do Bacen.

INSERT INTO support_teams (team_name, financial_institution_name, auth_server)
VALUES
  -- Bancos Grandes
  ('N2_Bradesco',          'BANCO BRADESCO S.A.',                       'a8ff7799-e654-4b38-9df5-c1a4d2f3b601'),
  ('N2_Santander',         'BANCO SANTANDER (BRASIL) S.A.',             'b1c2d3e4-f567-4890-ab12-cdef01234567'),
  ('N2_BancoDoBrasil',     'BANCO DO BRASIL S.A.',                      'c3d4e5f6-7890-4a1b-bc23-def012345678'),
  ('N2_CaixaEconomica',    'CAIXA ECONÔMICA FEDERAL',                   'd4e5f678-90ab-4c2d-cd34-ef0123456789'),

  -- Bancos Médios e Digitais
  ('N2_XP',                'XP INVESTIMENTOS CCTVM S/A',                'e5f67890-abcd-4d3e-de45-f01234567890'),
  ('N2_Nubank',            'NU PAGAMENTOS S.A.',                        'f6789012-bcde-4e4f-ef56-012345678901'),
  ('N2_BTGPactual',        'BANCO BTG PACTUAL S.A.',                    '01234567-cdef-4f50-f067-123456789012'),
  ('N2_BancoInter',        'BANCO INTER S.A.',                          '12345678-def0-4061-0178-234567890123'),
  ('N2_C6Bank',            'BANCO C6 S.A.',                             '23456789-ef01-4172-1289-345678901234'),
  ('N2_PicPay',            'PICPAY SERVIÇOS S.A.',                      '3456789a-f012-4283-239a-456789012345'),
  ('N2_Mercado',           'MERCADO PAGO INSTITUIÇÃO DE PAGAMENTO LTDA','456789ab-0123-4394-34ab-567890123456'),
  ('N2_PagSeguro',         'PAGSEGURO INTERNET INSTITUIÇÃO DE PAGAMENTO','56789abc-1234-44a5-45bc-678901234567'),

  -- Bancos Regionais e Cooperativas
  ('N2_Sicoob',            'CONFEDERAÇÃO NACIONAL DAS COOPERATIVAS DO SICOOB',
                                                                         '6789abcd-2345-45b6-56cd-789012345678'),
  ('N2_Sicredi',           'BANCO COOPERATIVO SICREDI S.A.',            '789abcde-3456-46c7-67de-890123456789'),
  ('N2_Original',          'BANCO ORIGINAL S.A.',                       '89abcdef-4567-47d8-78ef-901234567890'),
  ('N2_BancoSafra',        'BANCO SAFRA S.A.',                          '9abcdef0-5678-48e9-89f0-012345678901'),
  ('N2_BRB',               'BRB - BANCO DE BRASÍLIA S.A.',              'abcdef01-6789-49fa-9a01-123456789012'),
  ('N2_Ailos',             'COOPERATIVA CENTRAL DE CRÉDITO - AILOS',    'bcdef012-789a-4a0b-ab12-234567890123')
ON CONFLICT (team_name, financial_institution_name) DO UPDATE
SET auth_server = EXCLUDED.auth_server,
    is_active   = TRUE,
    updated_at  = NOW();
