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
    -- ---------------------------------------------------------------
    -- consentimentos-outbound: GET e DELETE de consentimento
    -- ---------------------------------------------------------------
    (
      'consentimentos-outbound',
      '/open-banking/consents/v3/consents/{consentId}',
      'GET',
      'Consulta de consentimento existente roteada para Consentimentos Outbound.',
      548
    ),
    (
      'consentimentos-outbound',
      '/open-banking/consents/v3/consents/{consentId}',
      'DELETE',
      'Revogação/cancelamento de consentimento roteado para Consentimentos Outbound.',
      549
    ),

    -- ---------------------------------------------------------------
    -- iniciadora-pagamentos: criação de consentimento e pagamento PIX
    -- ---------------------------------------------------------------
    (
      'iniciadora-pagamentos',
      '/open-banking/payments/v4/consents',
      'POST',
      'Criação de consentimento de pagamento roteada para Iniciadora de Pagamentos.',
      551
    ),
    (
      'iniciadora-pagamentos',
      '/open-banking/payments/v4/consents/{consentId}',
      'GET',
      'Consulta de consentimento de pagamento roteada para Iniciadora de Pagamentos.',
      551
    ),
    (
      'iniciadora-pagamentos',
      '/open-banking/payments/v4/pix/payments',
      'POST',
      'Iniciação de pagamento PIX roteada para Iniciadora de Pagamentos.',
      552
    ),
    (
      'iniciadora-pagamentos',
      '/open-banking/payments/v4/pix/payments/{paymentId}',
      'GET',
      'Consulta de pagamento PIX roteada para Iniciadora de Pagamentos.',
      552
    ),
    (
      'iniciadora-pagamentos',
      '/open-banking/payments/v4/pix/payments/{paymentId}',
      'PATCH',
      'Cancelamento de pagamento PIX roteado para Iniciadora de Pagamentos.',
      553
    ),

    -- ---------------------------------------------------------------
    -- detentora-pagamentos: processamento e devolução de pagamento
    -- ---------------------------------------------------------------
    (
      'detentora-pagamentos',
      '/open-banking/payments/v4/pix/payments',
      'POST',
      'Processamento de pagamento PIX roteado para Detentora de Pagamentos.',
      554
    ),
    (
      'detentora-pagamentos',
      '/open-banking/payments/v4/pix/payments/{paymentId}',
      'GET',
      'Consulta de pagamento PIX roteada para Detentora de Pagamentos.',
      554
    ),
    (
      'detentora-pagamentos',
      '/open-banking/payments/v4/pix/payments/{paymentId}',
      'PATCH',
      'Devolução/cancelamento de pagamento PIX roteado para Detentora de Pagamentos.',
      555
    ),

    -- ---------------------------------------------------------------
    -- servicos-outbound: dados cadastrais PF e PJ, contas
    -- ---------------------------------------------------------------
    (
      'servicos-outbound',
      '/open-banking/customers/v2/personal/identifications',
      'GET',
      'Consulta de dados cadastrais PF roteada para Serviços Outbound.',
      557
    ),
    (
      'servicos-outbound',
      '/open-banking/customers/v2/personal/financial-relations',
      'GET',
      'Consulta de relações financeiras PF roteada para Serviços Outbound.',
      557
    ),
    (
      'servicos-outbound',
      '/open-banking/customers/v2/personal/qualifications',
      'GET',
      'Consulta de qualificações PF roteada para Serviços Outbound.',
      557
    ),
    (
      'servicos-outbound',
      '/open-banking/customers/v2/business/identifications',
      'GET',
      'Consulta de dados cadastrais PJ roteada para Serviços Outbound.',
      557
    ),
    (
      'servicos-outbound',
      '/open-banking/customers/v2/business/financial-relations',
      'GET',
      'Consulta de relações financeiras PJ roteada para Serviços Outbound.',
      557
    ),
    (
      'servicos-outbound',
      '/open-banking/accounts/v2/accounts',
      'GET',
      'Listagem de contas roteada para Serviços Outbound.',
      558
    ),
    (
      'servicos-outbound',
      '/open-banking/accounts/v2/accounts/{accountId}',
      'GET',
      'Consulta de conta roteada para Serviços Outbound.',
      558
    ),
    (
      'servicos-outbound',
      '/open-banking/accounts/v2/accounts/{accountId}/transactions',
      'GET',
      'Consulta de transações de conta roteada para Serviços Outbound.',
      558
    ),
    (
      'servicos-outbound',
      '/open-banking/loans/v2/contracts',
      'GET',
      'Listagem de contratos de empréstimo roteada para Serviços Outbound.',
      559
    ),
    (
      'servicos-outbound',
      '/open-banking/loans/v2/contracts/{contractId}',
      'GET',
      'Consulta de contrato de empréstimo roteada para Serviços Outbound.',
      559
    ),
    (
      'servicos-outbound',
      '/open-banking/financings/v2/contracts',
      'GET',
      'Listagem de contratos de financiamento roteada para Serviços Outbound.',
      561
    ),
    (
      'servicos-outbound',
      '/open-banking/financings/v2/contracts/{contractId}',
      'GET',
      'Consulta de contrato de financiamento roteada para Serviços Outbound.',
      561
    ),

    -- ---------------------------------------------------------------
    -- compartilhamento-dados-maq-captura: cartão de crédito e recursos
    -- ---------------------------------------------------------------
    (
      'compartilhamento-dados-maq-captura',
      '/open-banking/resources/v3/resources',
      'GET',
      'Consulta de recursos roteada para Compartilhamento de Dados.',
      560
    ),
    (
      'compartilhamento-dados-maq-captura',
      '/open-banking/accounts/v2/accounts/{accountId}/balances',
      'GET',
      'Consulta de saldo de conta roteada para Compartilhamento de Dados.',
      558
    ),
    (
      'compartilhamento-dados-maq-captura',
      '/open-banking/accounts/v2/accounts/{accountId}/overdraft-limits',
      'GET',
      'Consulta de limite de cheque especial roteada para Compartilhamento de Dados.',
      558
    ),
    (
      'compartilhamento-dados-maq-captura',
      '/open-banking/credit-cards-accounts/v2/accounts',
      'GET',
      'Listagem de contas de cartão de crédito roteada para Compartilhamento de Dados.',
      559
    ),
    (
      'compartilhamento-dados-maq-captura',
      '/open-banking/credit-cards-accounts/v2/accounts/{creditCardAccountId}/bills',
      'GET',
      'Consulta de faturas de cartão de crédito roteada para Compartilhamento de Dados.',
      559
    )

) AS seeded (owner_slug, endpoint, method, description, category_template_id)
  ON owner.slug = seeded.owner_slug
ON CONFLICT (ticket_owner_id, endpoint, method) DO UPDATE
SET description          = EXCLUDED.description,
    category_template_id = EXCLUDED.category_template_id,
    is_active            = TRUE,
    updated_at           = NOW();
