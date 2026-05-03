# API de Templates - Documentação Completa

## 📋 Visão Geral

A API de Templates fornece informações sobre a estrutura de campos necessários para criar tickets em diferentes templates do ServiceDesk (Sysaid). Cada template define qual é a forma/contrato de dados esperado para criar um incidente.

---

## 🔌 Endpoint Principal

### GET `/templates/:templateId/fields`

**Descrição:** Retorna a estrutura de campos obrigatórios de um template específico em formato de template de dados.

**Autenticação:** Não requerida

**Método HTTP:** GET

---

## 📥 Requisição

### Path Parameters

| Parâmetro | Tipo | Descrição | Obrigatório |
|---|---|---|---|
| `templateId` | integer | ID único do template no banco de dados | ✅ Sim |

### Exemplo de Requisição

```bash
GET /templates/123330/fields HTTP/1.1
Host: localhost:3000
```

```javascript
fetch('/templates/123330/fields')
  .then(res => res.json())
  .then(data => console.log(data))
```

---

## 📤 Resposta

### Estrutura de Sucesso (200 OK)

```json
{
  "data": {
    "template_id": 123330,
    "fields_count": 3,
    "fields": [
      {
        "context_key": "context_key_1",
        "field_name": "Nome do Campo",
        "field_type": "text",
        "is_required": true
      },
      {
        "context_key": "context_key_2",
        "field_name": "Tipo do Cliente",
        "field_type": "list",
        "is_required": false,
        "list_options": {"PF": "1", "PJ": "2"}
      }
    ]
  }
}
```

### Descrição dos Campos

| Campo | Tipo | Descrição |
|---|---|---|
| `template_id` | integer | ID do template |
| `fields_count` | integer | Quantidade de campos obrigatórios |
| `fields` | array | Array de objetos com informações detalhadas de cada campo |
| `fields[].context_key` | string | Chave de contexto do campo (usado para enviar dados) |
| `fields[].field_name` | string | Nome legível do campo |
| `fields[].field_type` | string | Tipo do campo (text, datetime, list, etc) |
| `fields[].is_required` | boolean | Se o campo é obrigatório |
| `fields[].list_options` | object | Opções de lista **(apenas se o campo for do tipo list)** |

### Exemplo Real - Template 123330

```json
{
  "data": {
    "template_id": 123330,
    "fields_count": 5,
    "fields": [
      {
        "context_key": "data_prevista_para_implementacao",
        "field_name": "Data Prevista para Implementação",
        "field_type": "datetime",
        "is_required": true
      },
      {
        "context_key": "justificativa_data_prevista",
        "field_name": "Justificativa Data Prevista",
        "field_type": "long",
        "is_required": false
      },
      {
        "context_key": "tipo_cliente",
        "field_name": "Tipo do Cliente",
        "field_type": "list_multi_select",
        "is_required": false,
        "list_options": {"PF": "1", "PJ": "2"}
      },
      {
        "context_key": "http_status_code",
        "field_name": "Código HTTP da resposta",
        "field_type": "list",
        "is_required": true,
        "list_options": {"429": "2", "5xx": "4", "4xx": "3", "*": "1"}
      },
      {
        "context_key": "endpoint",
        "field_name": "URL do endpoint acionado",
        "field_type": "long",
        "is_required": true
      }
    ]
  }
}
```

---

## ❌ Respostas de Erro

### 400 - Template ID Inválido

**Quando:** O templateId não é um número válido ou está vazio

```json
{
  "code": "INVALID_TEMPLATE_ID",
  "message": "ID do template inválido",
  "details": {
    "templateId": "abc"
  }
}
```

### 404 - Template Não Encontrado

**Quando:** O template não existe no banco de dados ou não tem campos definidos

```json
{
  "code": "TEMPLATE_NOT_FOUND",
  "message": "Template não encontrado ou não possui campos definidos",
  "details": {
    "templateId": 99999
  }
}
```

### 404 - Sem Campos Obrigatórios

**Quando:** O template existe mas não tem campos obrigatórios (além de title/description)

```json
{
  "code": "TEMPLATE_NO_REQUIRED_FIELDS",
  "message": "Template não possui campos obrigatórios (além de title e description)",
  "details": {
    "templateId": 123330,
    "totalFields": 3
  }
}
```

### 500 - Erro Interno

**Quando:** Falha ao conectar ao banco de dados ou erro inesperado

```json
{
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Erro ao buscar campos do template"
}
```

---

## 🔄 Fluxo de Funcionamento

```
┌─────────────────────────────────────┐
│  Frontend requisita campos           │
│  GET /templates/123330/fields       │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│  Backend processa                    │
│  1. Valida templateId               │
│  2. Busca no banco (template_fields) │
│  3. Filtra is_required = true       │
│  4. Remove title/description        │
│  5. Cria template object            │
└──────────────────┬──────────────────┘
                   ↓
┌─────────────────────────────────────┐
│  Retorna resposta                    │
│  {                                   │
│    "data": {                         │
│      "template_id": 123330,          │
│      "fields": [{ ... }]             │
│    }                                 │
│  }                                   │
└─────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────┐
│  Frontend usa para:                  │
│  1. Renderizar formulário dinâmico   │
│  2. Validar dados antes de enviar    │
│  3. Mostrar campos obrigatórios      │
└─────────────────────────────────────┘
```

---

## 🎯 Casos de Uso

### 1. Renderizar Formulário Dinâmico

**Objetivo:** Mostrar ao usuário quais campos ele precisa preencher para criar um ticket

```javascript
async function renderIncidentForm(templateId) {
  // Buscar estrutura do template
  const response = await fetch(`/templates/${templateId}/fields`);
  const { data } = await response.json();
  
  // Renderizar input para cada campo
  data.fields.forEach(field => {
    const input = document.createElement('input');
    input.type = field.field_type === 'datetime' ? 'datetime-local' : 'text';
    input.name = field.context_key;
    input.placeholder = field.field_name;
    input.required = field.is_required;
    input.title = `${field.field_name} (${field.field_type})`;
    
    // Se tem list_options, renderizar select
    if (field.list_options) {
      const select = document.createElement('select');
      select.name = field.context_key;
      select.required = field.is_required;
      
      Object.keys(field.list_options).forEach(label => {
        const option = document.createElement('option');
        option.value = label;
        option.textContent = label;
        select.appendChild(option);
      });
      
      form.appendChild(select);
    } else {
      form.appendChild(input);
    }
  });
}
```

### 2. Validação de Dados

**Objetivo:** Validar que todos os campos obrigatórios foram preenchidos antes de enviar

```javascript
async function validateIncidentData(templateId, formData) {
  // Buscar campos obrigatórios
  const response = await fetch(`/templates/${templateId}/fields`);
  const { data } = await response.json();
  
  // Validar campos obrigatórios
  const missingFields = data.fields
    .filter(field => field.is_required && !formData[field.context_key])
    .map(field => field.field_name);
  
  if (missingFields.length > 0) {
    throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
  }
  
  // Validar campos com list_options
  data.fields.forEach(field => {
    if (field.list_options && formData[field.context_key]) {
      const validOptions = Object.keys(field.list_options);
      if (!validOptions.includes(formData[field.context_key])) {
        throw new Error(`Valor inválido para ${field.field_name}`);
      }
    }
  });
  
  return true;
}
```

### 3. Preview de Dados

**Objetivo:** Mostrar um preview do que será enviado para o ServiceDesk

```javascript
async function previewTicket(templateId, formData) {
  // Buscar template
  const response = await fetch(`/templates/${templateId}/fields`);
  const { data } = await response.json();
  
  // Combinar informações do template com dados do usuário
  const preview = {
    template_id: data.template_id,
    total_fields: data.fields_count,
    fields: data.fields.map(field => ({
      ...field,
      value: formData[field.context_key] || field.value  // dados preenchidos ou vazio
    }))
  };
  
  return preview;
}
```

### 4. Suportar Múltiplos Templates

**Objetivo:** Sistema que suporta múltiplas formas de criar tickets baseado no template

```javascript
async function getTicketForm(endpointUrl, method) {
  // 1. Encontrar qual template usar para este endpoint
  const templateId = await findTemplateForEndpoint(endpointUrl, method);
  
  // 2. Buscar campos do template
  const { data } = await fetch(`/templates/${templateId}/fields`).then(r => r.json());
  
  // 3. Renderizar form específico para este template
  renderFormWithFields(data.fields[0]);
}
```

---

## 💾 Banco de Dados

### Tabela: `template_fields`

```sql
CREATE TABLE template_fields (
  id SERIAL PRIMARY KEY,
  template_id INT NOT NULL,
  field_name VARCHAR(255),           -- "Data Prevista para Implementação"
  field_label_api VARCHAR(255),      -- "CustomColumn82sr"
  field_type VARCHAR(50),             -- "text", "datetime", "list", "long"
  is_required BOOLEAN,                -- TRUE para campos obrigatórios
  context_key VARCHAR(255),           -- "data_prevista_para_implementacao"
  list_options JSONB,                 -- {"PF":"1","PJ":"2"} (para fields tipo list)
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(template_id, context_key)
);
```

### Exemplo de Registros

```sql
SELECT * FROM template_fields WHERE template_id = 123330;

-- Resultados:
-- id | template_id | field_name | field_label_api | field_type | is_required | context_key | list_options
-- 1  | 123330      | Data Prevista para Implementação | CustomColumn82sr | datetime | TRUE | data_prevista_para_implementacao | NULL
-- 2  | 123330      | Tipo do Cliente | CustomColumn120sr | list_multi_select | FALSE | tipo_cliente | {"PF":"1","PJ":"2"}
-- 3  | 123330      | Título | title | text | TRUE | titulo | NULL
-- 4  | 123330      | Descrição | description | text | TRUE | descricao | NULL
-- 5  | 123330      | Canal da Jornada | CustomColumn174sr | list | FALSE | canal_jornada | {"App to app":"1",...}
```

**Nota:** A API **exclui automaticamente** title e description da resposta (linhas 3 e 4)

---

## 🔍 Tipos de Campos Suportados

### `field_type`

| Tipo | Descrição | Exemplo | Validação |
|---|---|---|---|
| `text` | Texto simples | "Erro ao consumir API" | string, max 255 chars |
| `long` | Texto longo (multiline) | Descrição completa do problema | string, max 1024 chars |
| `integer` | Número inteiro | 42 | number, integer only |
| `date` | Data (ISO8601) | "2026-07-01" | YYYY-MM-DD |
| `datetime` | Data e hora | "2026-03-29T10:15:00" | ISO8601 |
| `list` | Dropdown com uma opção | "PJ" | deve estar em list_options |
| `list_multi_select` | Dropdown múltiplos | ["PF", "PJ"] | valores em list_options |

### `list_options`

Mapeamento de valores exibidos para valores salvos:

```json
{
  "display_value": "saved_value",
  "PF": "1",
  "PJ": "2"
}
```

**Padrões especiais:**

```json
{
  "=429": "2",           // Exact match (highest priority)
  "5xx": "4",            // Range match (500-599)
  "*": "1"               // Wildcard/fallback
}
```

---

## 🔗 Integração com Outros Endpoints

### 1. Na Criação de Incidente

```javascript
POST /santander/report-application-error
{
  "title": "Erro ao consumir API",
  "description": "...",
  "endpoint": "/api/v1/accounts",
  "method": "GET",
  "http_status_code": "429",
  "occurred_at": "2026-03-29T10:15:00",
  "tipo_cliente": "PF",
  "canal_jornada": "App to app",
  "category_name": "APIs",
  "sub_category_name": "Contas",
  "third_level_category_name": "Saldo"
  // Estes dados são salvos em application_incidents
}
```

**O sistema automaticamente:**
1. Encontra o template baseado na categoria/subcategoria
2. Salva os dados do incidente

### 2. Na Visualização do Incidente

```javascript
GET /santander/application-incidents/123/ticket-preview
// Usa getTemplateFields() para mostrar quais campos serão enviados
// Mapeia dados do incidente para o template
```

### 3. Na Criação do Ticket

```javascript
POST /santander/application-incidents/123/create-ticket
{
  "title": "Erro ao consumir API",
  "description": "...",
  "template_fields": [
    { "key": "CustomColumn82sr", "value": "2026-07-01" },
    { "key": "CustomColumn120sr", "value": "PJ" }
  ]
}
// Usa getTemplateFields() para validar e resolver list_options
// Envia para ServiceDesk com campos mapeados
```

---

## 📊 Estatísticas de Templates

### Quantidade de Templates

```bash
SELECT COUNT(DISTINCT template_id) FROM template_fields;
-- 42 templates diferentes
```

### Exemplo de Distribuição

| Template ID | Nome | Campos | Obrigatórios |
|---|---|---|---|
| 123328 | Template - Dados Abertos | 10 | 7 |
| 123330 | Template - Dados Abertos Fase 1 | 15 | 10 |
| 60739 | Template - OpenFinance | 12 | 8 |
| ... | ... | ... | ... |

---

## 🛡️ Validações da API

### Validação de Input

```javascript
// Template ID deve ser um número válido
if (!templateId || Number.isNaN(Number(templateId))) {
  return 400: 'INVALID_TEMPLATE_ID'
}
```

### Validação de Dados

```javascript
// Template deve existir e ter campos
if (!fields || fields.length === 0) {
  return 404: 'TEMPLATE_NOT_FOUND'
}

// Deve ter campos obrigatórios (após filtro)
if (requiredFields.length === 0) {
  return 404: 'TEMPLATE_NO_REQUIRED_FIELDS'
}
```

---

## 📝 Logging

Todas as requisições são logadas com:

```json
{
  "timestamp": "2026-05-03T14:30:00Z",
  "level": "info",
  "message": "Template required fields retrieved",
  "requestId": "abc123",
  "route": "getTemplateFields",
  "templateId": 123330,
  "totalFields": 10,
  "requiredFieldsCount": 7
}
```

**Para erros:**

```json
{
  "timestamp": "2026-05-03T14:30:00Z",
  "level": "warn",
  "message": "Template not found or has no fields",
  "requestId": "abc123",
  "route": "getTemplateFields",
  "templateId": 99999
}
```

---

## 🚀 Performance

### Tempo de Resposta

- **Cache:** Não há cache no backend (frontend pode fazer cache)
- **Típico:** < 50ms (uma query SELECT simples)
- **Máximo:** < 200ms (incluindo conexão ao banco)

### Otimizações

1. **Query direta:** Busca diretamente na tabela `template_fields`
2. **Sem JOINs:** Operação simples de SELECT
3. **Index:** Recomendado em `template_id` para performance

```sql
CREATE INDEX idx_template_fields_template_id 
ON template_fields(template_id);
```

---

## 🔐 Segurança

### Autenticação
- ✅ Não requerida (publicamente acessível)
- ✅ Apenas lê dados não sensíveis

### Autorização
- ✅ Sem restrições (qualquer usuário pode buscar templates)
- ✅ Não expõe dados de usuários ou tickets

### Validação
- ✅ Valida templateId para evitar SQL injection
- ✅ Filtra campos automaticamente (title/description)
- ✅ Validação de tipos no banco de dados

---

## 📚 Exemplos Completos

### React Component

```jsx
import React, { useState, useEffect } from 'react';

function IncidentForm({ templateId }) {
  const [templateFields, setTemplateFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetch(`/templates/${templateId}/fields`)
      .then(res => {
        if (!res.ok) throw new Error('Erro ao carregar template');
        return res.json();
      })
      .then(data => {
        setTemplateFields(data.data.fields);
        // Inicializar formData com valores vazios
        const initial = {};
        data.data.fields.forEach(field => {
          initial[field.context_key] = '';
        });
        setFormData(initial);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [templateId]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    const missingFields = templateFields
      .filter(f => f.is_required && !formData[f.context_key])
      .map(f => f.field_name);
    
    if (missingFields.length > 0) {
      alert(`Campos obrigatórios: ${missingFields.join(', ')}`);
      return;
    }

    // Enviar para criar ticket
    const response = await fetch(`/application-incidents/create-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Incidente reportado',
        description: 'Descrição do incidente',
        template_fields: templateFields.map(field => ({
          key: field.context_key,
          value: formData[field.context_key] || ''
        }))
      })
    });

    if (response.ok) {
      alert('Ticket criado com sucesso!');
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <form onSubmit={handleSubmit}>
      {templateFields.map(field => (
        <div key={field.context_key}>
          <label htmlFor={field.context_key}>
            {field.field_name}
            {field.is_required && <span style={{color: 'red'}}>*</span>}
          </label>
          
          {field.list_options ? (
            <select
              id={field.context_key}
              name={field.context_key}
              value={formData[field.context_key]}
              onChange={handleChange}
              required={field.is_required}
            >
              <option value="">-- Selecione --</option>
              {Object.keys(field.list_options).map(label => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          ) : field.field_type === 'datetime' ? (
            <input
              id={field.context_key}
              type="datetime-local"
              name={field.context_key}
              value={formData[field.context_key]}
              onChange={handleChange}
              required={field.is_required}
            />
          ) : field.field_type === 'long' ? (
            <textarea
              id={field.context_key}
              name={field.context_key}
              value={formData[field.context_key]}
              onChange={handleChange}
              required={field.is_required}
            />
          ) : (
            <input
              id={field.context_key}
              type="text"
              name={field.context_key}
              value={formData[field.context_key]}
              onChange={handleChange}
              required={field.is_required}
            />
          )}
          
          {field.field_type && (
            <small style={{color: '#999'}}>Tipo: {field.field_type}</small>
          )}
        </div>
      ))}
      <button type="submit">Criar Incidente</button>
    </form>
  );
}

export default IncidentForm;
```

### Node.js/Fetch Example

```javascript
async function getTemplateAndValidate(templateId, userInput) {
  try {
    // 1. Buscar template
    const templateRes = await fetch(`/templates/${templateId}/fields`);
    if (!templateRes.ok) {
      throw new Error(`Template ${templateId} não encontrado`);
    }
    
    const { data: template } = await templateRes.json();
    
    // 2. Validar campos obrigatórios
    const missingFields = template.fields
      .filter(f => f.is_required && !userInput[f.context_key])
      .map(f => f.field_name);
    
    if (missingFields.length > 0) {
      throw new Error(`Campos faltando: ${missingFields.join(', ')}`);
    }
    
    // 3. Validar list_options
    template.fields.forEach(field => {
      if (field.list_options && userInput[field.context_key]) {
        const validOptions = Object.keys(field.list_options);
        if (!validOptions.includes(userInput[field.context_key])) {
          throw new Error(`Valor inválido para ${field.field_name}`);
        }
      }
    });
    
    // 4. Preparar payload para enviar
    const payload = {
      title: userInput.title || 'Incidente',
      description: userInput.description || 'Sem descrição',
      template_fields: template.fields.map(field => ({
        key: field.field_label_api,
        value: userInput[field.context_key] || ''
      }))
    };
    
    // 5. Retornar validado
    return {
      valid: true,
      template_id: template.template_id,
      fields_count: template.fields_count,
      payload
    };
    
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

// Exemplo de uso:
const result = await getTemplateAndValidate(123330, {
  title: 'Erro ao consumir API',
  description: 'API retorna 429',
  data_prevista_para_implementacao: '2026-07-01',
  tipo_cliente: 'PJ',
  canal_jornada: 'App to app'
});

if (result.valid) {
  console.log('Validado com sucesso!', result.payload);
} else {
  console.error('Erro:', result.error);
}
```

---

## 🎓 Próximos Passos

### Para Usar a API:
1. ✅ Conhecer o `templateId` do seu caso de uso
2. ✅ Fazer GET `/templates/:templateId/fields`
3. ✅ Renderizar formulário com os campos retornados
4. ✅ Validar dados antes de enviar para criar ticket

### Para Gerenciar Templates:
- Adicionar novo template → Seed SQL em `db/sql/0XX_seed_template_fields_*.sql`
- Modificar campo → UPDATE em `template_fields`
- Remover template → DELETE de `template_fields` (cuidado com dados existentes)

