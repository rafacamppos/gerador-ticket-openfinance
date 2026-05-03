# Fluxo Completo: Do Endpoint `/report-application-error` até a Criação de Ticket

## 1. Visão Geral do Fluxo

```
POST /report-application-error
    ↓
[1] Criar Incidente (application_incidents)
    ↓
[2] Buscar Template (baseado no endpoint + categorias)
    ↓
[3] Atribuir Incidente ao Usuário
    ↓
[4] Criar Ticket no ServiceDesk
    ↓
[5] Inicializar Fluxo do Ticket
    ↓
[6] Atualizar Status do Incidente
```

---

## 2. Passo 1: Criar Incidente (POST /report-application-error)

### Endpoint
```
POST /:teamSlug/report-application-error
```

### Fluxo no Serviço
**Arquivo:** `src/services/openFinanceApplicationIncidentsService.js` → `reportApplicationIncident()`

#### 2.1 Validações Iniciais
1. **Valida a equipe (teamSlug)**
   - Busca no repositório: `ticketOwnerRepository.getActiveOwnerBySlug()`
   - Se não existir → erro 404

#### 2.2 Normalização de Campos
Todos os campos do payload são validados e normalizados:

| Campo | Validação | Normalização |
|---|---|---|
| `x_fapi_interaction_id` | UUID obrigatório | Trim + validate UUID format |
| `authorization_server` | UUID obrigatório | Trim + validate UUID format |
| `client_id` | UUID obrigatório | Trim + validate UUID format |
| `title` | Obrigatório, máx 255 chars | Trim |
| `description` | Obrigatório, máx 1024 chars | Trim |
| `tipo_cliente` | Enum: `PF` ou `PJ` | Validate against contract |
| `canal_jornada` | Enum: várias opções | Map usando CANAL_JORNADA contract |
| `endpoint` | Obrigatório | Trim |
| `method` | HTTP method obrigatório | Uppercase (`GET`, `POST`, etc) |
| `payload_request` | JSON object obrigatório | Validate is object |
| `payload_response` | JSON object obrigatório | Validate is object |
| `occurred_at` | ISO8601 timestamp obrigatório | Parse e preserve local timezone |
| `http_status_code` | Status code obrigatório | String |
| `category_name` | Obrigatório | Trim |
| `sub_category_name` | Obrigatório | Trim |
| `third_level_category_name` | Obrigatório | Trim |

#### 2.3 Criação do Incidente
```javascript
const normalizedPayload = {
  ticket_owner_id: owner.id,        // ID da equipe
  team_slug: owner.slug,
  team_name: owner.name,
  x_fapi_interaction_id: '...',     // UUID
  authorization_server: '...',      // UUID
  client_id: '...',                 // UUID
  title: '...',                     // string 255 chars
  tipo_cliente: 'PF' | 'PJ',
  canal_jornada: '...',             // string
  endpoint: '...',                  // URL
  method: 'GET' | 'POST' | ...,     // HTTP method
  payload_request: {...},           // JSON
  payload_response: {...},          // JSON
  occurred_at: '2026-03-29T10:15:00', // timestamp
  http_status_code: '429' | '500' | ...,
  description: '...',               // string 1024 chars
  category_name: '...',             // string
  sub_category_name: '...',         // string
  third_level_category_name: '...'  // string
};

const createdIncident = await applicationIncidentRepository.createIncident(normalizedPayload);
```

#### 2.4 Banco de Dados
**Tabela:** `application_incidents`

```sql
CREATE TABLE application_incidents (
  id SERIAL PRIMARY KEY,
  ticket_owner_id INT NOT NULL,
  x_fapi_interaction_id VARCHAR(36),
  authorization_server VARCHAR(36),
  client_id VARCHAR(36),
  endpoint TEXT,
  method VARCHAR(10),
  payload_request JSONB,
  payload_response JSONB,
  occurred_at TIMESTAMP,
  http_status_code VARCHAR(10),
  title VARCHAR(255),
  description TEXT,
  tipo_cliente VARCHAR(10),
  canal_jornada VARCHAR(100),
  category_name VARCHAR(255),
  sub_category_name VARCHAR(255),
  third_level_category_name VARCHAR(255),
  incident_status VARCHAR(50),          -- REPORTED, ASSIGNED, TICKET_CREATED, MONITORING, RESOLVED, CANCELED
  related_ticket_id INT,                -- ID do ticket criado (vazio inicialmente)
  assigned_to_user_id INT,              -- Usuário responsável (vazio inicialmente)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Resposta (201 Created):**
```json
{
  "id": 12345,
  "team_slug": "santander",
  "team_name": "Santander",
  "title": "Erro ao consumir API",
  "description": "Descrição do problema",
  "endpoint": "/api/v1/accounts",
  "method": "GET",
  "http_status_code": "429",
  "occurred_at": "2026-03-29T10:15:00",
  "tipo_cliente": "PF",
  "canal_jornada": "App to app",
  "incident_status": "REPORTED",
  "x_fapi_interaction_id": "...",
  "authorization_server": "...",
  "client_id": "...",
  "category_name": "APIs",
  "sub_category_name": "Contas",
  "third_level_category_name": "Saldo",
  "assigned_to_user_id": null,
  "related_ticket_id": null,
  "created_at": "2026-05-03T04:30:00Z"
}
```

---

## 3. Passo 2: Resolver Template (Automático)

### Como o Template é Encontrado
**Quando:** Ao buscar o incidente para criar o ticket

**Query:** `getIncidentTicketContext()` (incidentTicketRepository.js)

```sql
SELECT
  ...
  ct.id AS category_template_id,
  ct.category_name,
  ct.sub_category_name,
  ct.third_level_category_name,
  ct.template_id,
  ct.type AS template_type,
  ...
FROM application_incidents ai
LEFT JOIN category_templates ct
  ON ct.category_name = ai.category_name
  AND ct.sub_category_name = ai.sub_category_name
  AND ct.third_level_category_name = ai.third_level_category_name
WHERE ai.id = $1
```

**Exemplo:**
- Incidente com `category_name = 'APIs'`, `sub_category_name = 'Contas'`, `third_level_category_name = 'Saldo'`
- Busca na tabela `category_templates` por essas três chaves
- Encontra `template_id = 123330`

---

## 4. Passo 3: Atribuir Incidente ao Usuário

### Endpoint
```
POST /:teamSlug/application-incidents/:incidentId/assign-to-me
```

**Serviço:** `assignApplicationIncidentToUser()`

**Alterações no Incidente:**
```javascript
{
  incident_status: 'ASSIGNED',
  assigned_to_user_id: portalUser.id  // ID do usuário logado
}
```

---

## 5. Passo 4: Criar Ticket (POST create-ticket)

### Endpoint
```
POST /:teamSlug/application-incidents/:incidentId/create-ticket
```

### Fluxo na Criação do Ticket

**Arquivo:** `src/services/openFinanceIncidentTicketService.js` → `createTicketFromIncident()`

#### 5.1 Validações de Pré-requisitos

1. ✅ Incidente existe
2. ✅ Nenhum ticket já foi vinculado (`related_ticket_id` vazio)
3. ✅ Usuário está autenticado
4. ✅ Incidente foi atribuído ao usuário (`assigned_to_user_id` preenchido)
5. ✅ Usuário autenticado é o mesmo que atribuído (autorização)
6. ✅ Status ainda é `REPORTED` (não foi criado ticket antes)
7. ✅ Template existe para este endpoint
8. ✅ Template tem campos definidos

#### 5.2 Enriched Context (Contexto Enriquecido)

Combina dados do incidente + payload da requisição:

```javascript
const enrichedContext = {
  ...incidentData,                      // Dados originais do incidente
  title: payload.title || ctx.title,    // Pode ser sobrescrito
  description: payload.description || ctx.description
};
```

#### 5.3 Construção dos Campos do Ticket

**Campos Base (sempre incluídos):**

```javascript
const baseFields = [
  { key: 'title',           value: enrichedContext.title },
  { key: 'description',     value: enrichedContext.description },
  { key: 'problem_type',    value: 'Incidentes_APIs_Contas_Saldo' },  // Categoria hierárquica
  { 
    key: 'CustomColumn16sr',
    value: 'N1 Service Desk',
    valueCaption: 'N1 Service Desk',
    keyCaption: 'Equipe solucionadora'
  }
];
```

**Campos Customizados (de acordo com o template):**

Existem **duas formas** de preencher os campos customizados:

##### 5.3a - Preenchimento Manual (via payload)

Se a requisição inclui `template_fields`:

```json
{
  "title": "...",
  "description": "...",
  "template_fields": [
    { "key": "CustomColumn82sr", "value": "2026-07-01" },
    { "key": "CustomColumn120sr", "value": "PJ" },
    { "key": "CustomColumn174sr", "value": "1" }
  ]
}
```

**Processo:**
1. Para cada campo no template, busca em `payload.template_fields` pelo `key`
2. Se o campo tem `list_options`, resolve o valor usando `resolveListOption()`
3. Senão, usa o valor como string

**Resolução de List Options:**
```javascript
function resolveListOption(listOptions, rawValue) {
  // 1. Tenta match exato: "=429"
  if (listOptions[`=${rawValue}`]) return listOptions[`=${rawValue}`];
  
  // 2. Tenta match direto: "PJ" → "2"
  if (listOptions[rawValue]) return listOptions[rawValue];
  
  // 3. Tenta match por range: "429" → "4xx"
  const rangeKey = `${rawValue[0]}xx`;
  if (listOptions[rangeKey]) return listOptions[rangeKey];
  
  // 4. Fallback para wildcard: "*"
  return listOptions['*'] ?? '';
}
```

**Exemplo - Campo com List Options:**
```
Template field:
  context_key: "http_status_code"
  field_label_api: "CustomColumn229sr"
  list_options: { "429": "2", "5xx": "4", "4xx": "3", "*": "1" }

Payload:
  { "key": "CustomColumn229sr", "value": "429" }

Resolução:
  1. Procura por "=429" → não encontra
  2. Procura por "429" → encontra "2"
  3. Retorna: { key: "CustomColumn229sr", value: "2" }
```

##### 5.3b - Preenchimento Automático (auto-fill)

Se o payload **não inclui** `template_fields` (array vazio ou ausente):

**Processo:**
1. Para cada campo do template, extrai o valor do contexto usando `field.context_key`
2. Aplica resolução de list options
3. Valida que todos os campos obrigatórios foram preenchidos

```javascript
function extractFieldValue(field, context) {
  const raw = context[field.context_key];
  
  if (raw === undefined || raw === null || raw === '') return '';
  
  if (field.list_options) {
    return resolveListOption(field.list_options, raw);
  }
  
  if (typeof raw === 'object') return JSON.stringify(raw);
  
  return String(raw);
}
```

**Exemplo - Auto-fill:**
```
Template field:
  context_key: "canal_jornada"
  field_label_api: "CustomColumn174sr"

Context (do incidente):
  canal_jornada: "1"  (após normalização)

Extração:
  context["canal_jornada"] = "1"
  Campo sem list_options → retorna "1"
  Resultado: { key: "CustomColumn174sr", value: "1" }
```

#### 5.4 Validação de Campos Obrigatórios

Se usando auto-fill e há campos obrigatórios vazios:

```javascript
const missing = [];
templateFields.forEach(field => {
  const value = extractFieldValue(field, context);
  if (field.is_required && !value) {
    missing.push(field.field_name);
  }
});

if (missing.length > 0) {
  throw buildError(`Campos obrigatórios não preenchidos: ${missing.join(', ')}.`, 422);
}
```

#### 5.5 Construção do Payload Final

```javascript
const info = [...baseFields, ...customFields];

// Exemplo final:
const info = [
  { key: 'title', value: 'Erro ao consumir API' },
  { key: 'description', value: 'Descrição completa...' },
  { key: 'problem_type', value: 'Incidentes_APIs_Contas' },
  { key: 'CustomColumn16sr', value: 'N1 Service Desk', ... },
  { key: 'CustomColumn82sr', value: '2026-07-01' },
  { key: 'CustomColumn120sr', value: '2' },
  { key: 'CustomColumn174sr', value: '1' },
  // ... mais campos
];
```

#### 5.6 Chamada para ServiceDesk (Sysaid)

**Cliente:** `src/clients/openFinanceDeskClient.js`

```javascript
const ticketResponse = await openFinanceDeskClient.postJson(
  '/sr',
  { info },
  { template: ctx.template_id, type: ctx.template_type },  // metadata
  headers,
  context
);
```

**Resposta do ServiceDesk:**
```json
{
  "id": "54321",              // ID do ticket criado
  "title": "Erro ao consumir API",
  "status": "NOVO",
  "template": "123330",
  // ... mais dados
}
```

---

## 6. Passo 5: Inicializar Fluxo do Ticket

**Arquivo:** `src/services/ticketFlowTransitions.js`

```javascript
const initialFlowState = buildInitialStateSeed({
  ticket: {
    id: createdTicketId,              // ID retornado pelo ServiceDesk
    title: ticketResponse.title,
    status: ticketResponse.status     // "NOVO"
  },
  routing: {
    owner_slug: ctx.team_slug,        // "santander"
    owner_name: ctx.team_name         // "Santander"
  },
  actor: {
    name: ctx.assigned_to_name,       // Nome do usuário
    email: ctx.assigned_to_email      // Email do usuário
  },
  assignment: {
    instituicao_requerente: 'Santander'
  }
});

// Salva o estado inicial no banco
await ticketFlowRepository.upsertInitialStateWithEvent(initialFlowState);
```

**Banco de Dados:** Tabelas `ticket_flows` e `ticket_events`

---

## 7. Passo 6: Atualizar Status do Incidente

```javascript
const updatedIncident = await applicationIncidentRepository.transitionIncident(
  teamSlug,
  incidentId,
  {
    incident_status: 'TICKET_CREATED',     // Mudança de status
    related_ticket_id: createdTicketId     // Vincula o ticket ao incidente
  }
);
```

**Resposta Final (201 Created):**
```json
{
  "incident": {
    "id": 12345,
    "title": "Erro ao consumir API",
    "incident_status": "TICKET_CREATED",
    "related_ticket_id": 54321,
    "assigned_to_user_id": 789,
    // ... outros campos
  },
  "ticket_id": "54321",
  "ticket": {
    "id": "54321",
    "title": "Erro ao consumir API",
    "status": "NOVO"
  }
}
```

---

## 8. Mapeamento de Campos: Incidente → Ticket

| Campo do Incidente | Campo do Template | Como é Preenchido | Transformação |
|---|---|---|---|
| `title` | `title` (base) | Do payload ou contexto | Direto |
| `description` | `description` (base) | Do payload ou contexto | Direto |
| `category_name` + `sub_category_name` + `third_level_category_name` | `problem_type` (base) | Construído | Join com `_` |
| Sempre hardcoded | `CustomColumn16sr` (base) | Constante | `'N1 Service Desk'` |
| `context_key` do template | `field_label_api` (custom) | Do contexto ou payload | Resolve list options |

**Exemplo Completo:**

```
INCIDENTE (application_incidents)
├── title: "Erro ao consumir API"
├── description: "A API retorna 429"
├── endpoint: "/api/v1/accounts"
├── method: "GET"
├── http_status_code: "429"
├── occurred_at: "2026-03-29T10:15:00"
├── tipo_cliente: "PF"
├── canal_jornada: "App to app"
├── category_name: "APIs"
├── sub_category_name: "Contas"
├── third_level_category_name: "Saldo"
└── template_id: 123330 (resolvido automaticamente)

         ↓ createTicketFromIncident()

TEMPLATE (template_fields) para template_id = 123330
├── Campo: Data Prevista para Implementação (context_key: data_prevista_para_implementacao)
├── Campo: Tipo do Cliente (context_key: tipo_cliente, list_options: {"PF":"1","PJ":"2"})
├── Campo: Canal da Jornada (context_key: canal_jornada, list_options: {"App to app":"1",...})
└── ...

         ↓ extractFieldValue() para cada campo

TICKET (Sysaid) - array info[]
├── { key: 'title', value: 'Erro ao consumir API' }
├── { key: 'description', value: 'A API retorna 429' }
├── { key: 'problem_type', value: 'Incidentes_APIs_Contas_Saldo' }
├── { key: 'CustomColumn16sr', value: 'N1 Service Desk' }
├── { key: 'CustomColumn82sr', value: '2026-07-01' }
├── { key: 'CustomColumn120sr', value: '1' }     // tipo_cliente "PF" → "1"
├── { key: 'CustomColumn174sr', value: '1' }     // canal_jornada "App to app" → "1"
└── ...

         ↓ openFinanceDeskClient.postJson()

RESPOSTA DO SERVICEDESK
└── { id: "54321", title: "...", status: "NOVO" }

         ↓ updateIncident() + createTicketFlow()

INCIDENTE ATUALIZADO
├── status: "TICKET_CREATED"
└── related_ticket_id: 54321
```

---

## 9. Fluxo de Estados do Incidente

```
REPORTED
  ↓ (Usuário se atribui)
ASSIGNED
  ↓ (Usuário cria ticket)
TICKET_CREATED
  ↓ (Monitoramento)
MONITORING / RESOLVED / CANCELED
```

---

## 10. Tratamento de Erros

| Erro | Quando | Código | Mensagem |
|---|---|---|---|
| Equipe não existe | reportIncident | 404 | 'Equipe não encontrada.' |
| Campo obrigatório vazio | reportIncident | 400 | 'Field "{name}" is required.' |
| UUID inválido | reportIncident | 400 | 'Field "{name}" must be a valid UUID.' |
| Incidente não existe | createTicketFromIncident | 404 | 'Incidente não encontrado.' |
| Ticket já criado | createTicketFromIncident | 409 | 'Um ticket já foi vinculado a este incidente.' |
| Usuário não autenticado | createTicketFromIncident | 401 | 'Usuário autenticado não encontrado.' |
| Incidente não atribuído | createTicketFromIncident | 409 | 'O incidente precisa ser atribuído antes da criação do ticket.' |
| Usuário não autorizado | createTicketFromIncident | 403 | 'Somente o usuário responsável pode criar o ticket.' |
| Template não existe | createTicketFromIncident | 422 | 'Nenhum template de ticket encontrado para o endpoint deste incidente.' |
| Campos obrigatórios vazios | createTicketFromIncident | 422 | 'Campos obrigatórios não preenchidos: {list}.' |
| ServiceDesk falha | createTicketFromIncident | 502 | 'ServiceDesk não retornou o identificador do ticket criado.' |

---

## 11. Resumo Visual do Fluxo de Dados

```
                    POST /report-application-error
                              ↓
                    ┌─────────────────────┐
                    │  Normalize Payload  │
                    └─────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  Create Incident    │ → application_incidents
                    └─────────────────────┘
                              ↓
                    Incident criado (REPORTED)
                              ↓
                    POST /assign-to-me
                              ↓
                    ┌─────────────────────┐
                    │  Assign to User     │
                    └─────────────────────┘
                              ↓
                    Incident updated (ASSIGNED)
                              ↓
        POST /create-ticket + enrichedContext
                              ↓
         ┌──────────────────────────────────┐
         │  Resolve Template from Endpoint  │
         └──────────────────────────────────┘
                              ↓
         ┌──────────────────────────────────┐
         │  Fetch Template Fields           │
         └──────────────────────────────────┘
                              ↓
         ┌──────────────────────────────────┐
         │  Build Ticket Fields             │
         │  ├─ Base Fields                  │
         │  │  └─ title, description,       │
         │  │     problem_type, solvers     │
         │  └─ Custom Fields                │
         │     └─ Extract from Context      │
         │     └─ Resolve List Options      │
         │     └─ Validate Required Fields  │
         └──────────────────────────────────┘
                              ↓
         ┌──────────────────────────────────┐
         │  POST to ServiceDesk (/sr)       │
         └──────────────────────────────────┘
                              ↓
         ┌──────────────────────────────────┐
         │  Create Ticket Flow              │
         └──────────────────────────────────┘
                              ↓
         ┌──────────────────────────────────┐
         │  Update Incident                 │
         │  ├─ status: TICKET_CREATED       │
         │  └─ related_ticket_id: {ID}      │
         └──────────────────────────────────┘
                              ↓
                  201 Created + Ticket Data
```

