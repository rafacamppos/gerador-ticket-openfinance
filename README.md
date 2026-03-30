# Gerador Ticket OpenFinance

Backend em Express 4 para automatizar operacoes de chamados no portal Open Finance.

## Executando

```bash
npm install
cp .env.example .env
npm run dev
```

## Endpoints

- `POST /api/v1/open-finance/auth/login`
- `GET /api/v1/open-finance/auth/me`
- `POST /api/v1/open-finance/auth/logout`
- `GET /api/v1/open-finance/tickets`
- `GET /api/v1/open-finance/tickets/:ticketId`
- `POST /api/v1/open-finance/tickets`
- `PUT /api/v1/open-finance/tickets/:ticketId`
- `POST /api/v1/open-finance/tickets/:ticketId/attachments`
- `POST /api/v1/open-finance/tickets/:ticketId/activities`
- `GET /api/v1/open-finance/ticket-templates/:templateId/required-fields`

## Observacao

Os endpoints encapsulam os recursos identificados na collection Postman localizada na raiz do projeto.
