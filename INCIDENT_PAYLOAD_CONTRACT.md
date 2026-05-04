# Incident API Payload Contract

## Estrutura do Payload

O payload enviado para criar um incidente deve conter os seguintes campos:

### 15 Campos Obrigatórios (Base)

```json
{
  "x_fapi_interaction_id": "7f4f2946-d1f3-4c9e-9a2b-bd4e2f30d4a3",
  "authorization_server": "b7500720-788e-41e5-afe7-bfcc581ce3e6",
  "client_id": "96cc36f8-11e1-4f3f-bbbe-9fd6cc4eb4b3",
  "endpoint": "/token",
  "category_data": {
    "category_name": "Conformidade",
    "sub_category_name": "Validação",
    "third_level_category_name": "Autenticação"
  },
  "id_version_api": 99,
  "http_method": "POST",
  "payload_request": {
    "grant_type": "refresh_token",
    "refresh_token": "..."
  },
  "payload_response": {
    "access_token": "...",
    "expires_in": 3600
  },
  "occurred_at": "2026-03-29T10:15:00",
  "description": "Erro ao gerar Token por Access Token",
  "title": "Erro Troca de Refresh Token por Access Token",
  "canal_jornada": "APP_TO_APP",
  "tipo_cliente": "PF",
  "http_status_code": 500
}
```

### Campo Opcional

```json
{
  "template_data": {
    "custom_field": "valor",
    "outro_campo": 123
  }
}
```

## Regras de Validação

### UUIDs (3 campos)
- `x_fapi_interaction_id`: UUID válido (formato padrão)
- `authorization_server`: UUID válido
- `client_id`: UUID válido

### String Fields (com tamanho máximo)
- `endpoint`: String obrigatória (sem limite de tamanho)
- `title`: String 1-255 caracteres (obrigatório)
- `description`: String 1-1024 caracteres (obrigatório)

### Enums
- `http_method`: GET | POST | PUT | PATCH | DELETE | OPTIONS | HEAD (case-insensitive, normalizado para MAIÚSCULAS)
- `canal_jornada`: APP_TO_APP | APP_TO_BROWSER | BROWSER_TO_BROWSER | BROWSER_TO_APP | NA
- `tipo_cliente`: PF | PJ

### Números
- `id_version_api`: Inteiro positivo (obrigatório)
- `http_status_code`: Inteiro entre 100-599 (obrigatório)

### JSON Objects
- `payload_request`: Objeto ou array JSON válido (obrigatório)
- `payload_response`: Objeto ou array JSON válido (obrigatório)
- `category_data`: Objeto com 3 campos obrigatórios:
  - `category_name`: String 1-255 caracteres
  - `sub_category_name`: String 1-255 caracteres
  - `third_level_category_name`: String 1-255 caracteres
- `template_data` (opcional): Objeto JSON válido

### Data/Hora
- `occurred_at`: ISO 8601 timestamp válido
  - Formato: `2026-03-29T10:15:00` (aceita com ou sem timezone)
  - Sem timezone: interpretado usando timezone da sessão PostgreSQL
  - Com timezone: `2026-03-29T10:15:00Z` ou `2026-03-29T10:15:00-03:00`

## Estratégia de Merge

Quando `template_data` é fornecido:
1. O payload base e o template_data são mesclados
2. **Campos do payload base têm prioridade** (sobrescrevem template_data se ambos existirem)
3. Campos do template_data que não existem no base são preservados

## Exemplos de Requisições

### Exemplo 1: Payload Completo com Template Data

```bash
curl -X POST http://localhost:3000/api/v1/open-finance/meu-time/report-application-error \
  -H "Content-Type: application/json" \
  -d '{
    "x_fapi_interaction_id": "7f4f2946-d1f3-4c9e-9a2b-bd4e2f30d4a3",
    "authorization_server": "b7500720-788e-41e5-afe7-bfcc581ce3e6",
    "client_id": "96cc36f8-11e1-4f3f-bbbe-9fd6cc4eb4b3",
    "endpoint": "/token",
    "category_data": {
      "category_name": "Conformidade",
      "sub_category_name": "Validação",
      "third_level_category_name": "Autenticação"
    },
    "template_data": {
      "custom_field": "valor_customizado"
    },
    "id_version_api": 99,
    "http_method": "POST",
    "payload_request": { "grant_type": "refresh_token" },
    "payload_response": { "error": "invalid_grant" },
    "occurred_at": "2026-03-29T10:15:00",
    "description": "Erro ao gerar Token por Access Token",
    "title": "Erro Troca de Refresh Token por Access Token",
    "canal_jornada": "APP_TO_APP",
    "tipo_cliente": "PF",
    "http_status_code": 500
  }'
```

### Exemplo 2: Payload Base Sem Template Data

```bash
curl -X POST http://localhost:3000/api/v1/open-finance/meu-time/report-application-error \
  -H "Content-Type: application/json" \
  -d '{
    "x_fapi_interaction_id": "7f4f2946-d1f3-4c9e-9a2b-bd4e2f30d4a3",
    "authorization_server": "b7500720-788e-41e5-afe7-bfcc581ce3e6",
    "client_id": "96cc36f8-11e1-4f3f-bbbe-9fd6cc4eb4b3",
    "endpoint": "/token",
    "category_data": {
      "category_name": "Conformidade",
      "sub_category_name": "Validação",
      "third_level_category_name": "Autenticação"
    },
    "id_version_api": 99,
    "http_method": "POST",
    "payload_request": { "grant_type": "refresh_token" },
    "payload_response": { "error": "invalid_grant" },
    "occurred_at": "2026-03-29T10:15:00",
    "description": "Erro ao gerar Token por Access Token",
    "title": "Erro Troca de Refresh Token por Access Token",
    "canal_jornada": "APP_TO_APP",
    "tipo_cliente": "PF",
    "http_status_code": 500
  }'
```

## Resposta de Sucesso (201 Created)

```json
{
  "id": "123",
  "team_slug": "meu-time",
  "team_name": "Meu Time",
  "x_fapi_interaction_id": "7f4f2946-d1f3-4c9e-9a2b-bd4e2f30d4a3",
  "authorization_server": "b7500720-788e-41e5-afe7-bfcc581ce3e6",
  "client_id": "96cc36f8-11e1-4f3f-bbbe-9fd6cc4eb4b3",
  "title": "Erro Troca de Refresh Token por Access Token",
  "endpoint": "/token",
  "method": "POST",
  "payload_request": { "grant_type": "refresh_token" },
  "payload_response": { "error": "invalid_grant" },
  "occurred_at": "2026-03-29T10:15:00.000Z",
  "http_status_code": 500,
  "description": "Erro ao gerar Token por Access Token",
  "tipo_cliente": "PF",
  "canal_jornada": "App to app",
  "id_version_api": "99",
  "incident_status": "new",
  "incident_status_label": "Novo",
  "category_data": {
    "category_name": "Conformidade",
    "sub_category_name": "Validação",
    "third_level_category_name": "Autenticação"
  },
  "related_ticket_id": null,
  "assigned_to_user_id": null,
  "assigned_to_name": null,
  "assigned_to_email": null,
  "created_at": "2026-03-29T10:20:00.000Z",
  "updated_at": "2026-03-29T10:20:00.000Z"
}
```

## Erros Comuns (400 Bad Request)

| Campo | Erro | Exemplo |
|-------|-------|---------|
| `x_fapi_interaction_id` | "must be a valid UUID" | `"invalid-uuid"` |
| `http_method` | "must be a valid HTTP method" | `"PATCH"` (se não for suportado) |
| `http_status_code` | "must be between 100 and 599" | `999` ou `50` |
| `title` | "must be at most 255 characters" | String com 256+ caracteres |
| `description` | "must be at most 1024 characters" | String com 1025+ caracteres |
| `canal_jornada` | "must be one of: ..." | `"INVALID_CHANNEL"` |
| `tipo_cliente` | "must be one of: PF, PJ" | `"PM"` |
| `id_version_api` | "must be a positive integer" | `0` ou `-1` |
| `category_data` | "must contain: category_name, sub_category_name, third_level_category_name" | Campo faltando |
| `payload_request` | "must be a valid JSON object or array" | `null` ou `"string"` |
| `occurred_at` | "must be a valid timestamp" | `"invalid-date"` |
