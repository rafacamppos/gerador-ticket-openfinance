# API de Template Fields

## Endpoint

```
GET /templates/:templateId/fields
```

## Descrição

Retorna todos os campos definidos para um template específico, incluindo:
- Nome do campo
- Label da API Sysaid
- Tipo de dados
- Se é obrigatório
- Chave de contexto (context_key) para o payload
- Opções de lista (para campos do tipo list)

---

## Parâmetros

| Parâmetro | Tipo | Localização | Descrição |
|---|---|---|---|
| templateId | integer | Path | ID do template (requerido) |

---

## Resposta (200 OK)

**Nota:** A resposta retorna apenas os campos obrigatórios (is_required=true) em formato de template. Os campos `title` e `description` são sempre excluídos do resultado. O objeto `fields` contém um único elemento com a estrutura de dados esperada.

```json
{
  "data": {
    "template_id": 123330,
    "fields": [
      {
        "data_prevista_para_implementacao": "",
        "tipo_cliente": "",
        "canal_jornada": ""
      }
    ]
  }
}
```

---

## Erros

### 400 - ID Inválido

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

```json
{
  "code": "TEMPLATE_NOT_FOUND",
  "message": "Template não encontrado ou não possui campos definidos",
  "details": {
    "templateId": 99999
  }
}
```

---

## Exemplos

### Exemplo 1: Buscar campos do Template 123330

```bash
curl -X GET http://localhost:3000/templates/123330/fields
```

**Resposta:**
```json
{
  "data": {
    "template_id": 123330,
    "fields": [
      {
        "data_prevista_para_implementacao": "",
        "tipo_cliente": "",
        "canal_jornada": ""
      }
    ]
  }
}
```

---

### Exemplo 2: Buscar campos do Template 60739

```bash
curl -X GET http://localhost:3000/templates/60739/fields
```

**Resposta:**
```json
{
  "data": {
    "template_id": 60739,
    "fields": [
      {
        "api_name_version": "",
        "api_version": "",
        "product_feature": "",
        "stage_name_version": "",
        "destinatario": "",
        "endpoint": "",
        "payload_request": "",
        "http_status_code": "",
        "payload_response": "",
        "x_fapi_interaction_id": ""
      }
    ]
  }
}
```

---

## Usando os Dados Retornados

### Para Criar um Formulário Dinâmico

```javascript
const response = await fetch('/templates/123330/fields');
const { data } = await response.json();

// Obter os context_keys dos campos obrigatórios
const fieldKeys = Object.keys(data.fields[0]);

// Inicializar objeto de formulário com os campos
const formData = { ...data.fields[0] };

// Renderizar inputs para cada campo
fieldKeys.forEach(contextKey => {
  createInput({
    name: contextKey,
    value: formData[contextKey],
    required: true
  });
});
```

### Para Validar um Payload

```javascript
const payload = {
  data_prevista_para_implementacao: "2026-07-01",
  tipo_cliente: "PJ",
  canal_jornada: "App to app"
};

const response = await fetch('/templates/123330/fields');
const { data: template } = await response.json();

// Validar que todos os campos obrigatórios foram preenchidos
const requiredFields = Object.keys(template.fields[0]);
const missingFields = requiredFields.filter(fieldKey => !payload[fieldKey]);

if (missingFields.length > 0) {
  console.error('Campos obrigatórios faltando:', missingFields);
}

// Validar que não há campos extras
const extraFields = Object.keys(payload).filter(k => !requiredFields.includes(k));
if (extraFields.length > 0) {
  console.warn('Campos extras que serão ignorados:', extraFields);
}
```

---

## Campos Suportados

### field_type

| Tipo | Descrição | Validação |
|---|---|---|
| text | Texto simples | string |
| long | Texto longo (multiline) | string |
| integer | Número inteiro | number |
| date | Data (ISO8601) | YYYY-MM-DD |
| datetime | Data e hora (ISO8601) | YYYY-MM-DDTHH:MM:SSZ |
| list | Dropdown com opções | deve estar em list_options |
| list_multi_select | Dropdown múltiplos | array de list_options |

### list_options

Mapeamento de valores exibidos para valores salvos:

```json
{
  "display_value": "saved_value",
  "PF": "1",
  "PJ": "2"
}
```

Padrões especiais suportados em alguns campos:
- `"429": "2"` - exato
- `"5xx": "4"` - range (500-599)
- `"*": "1"` - wildcard (fallback)

---

## Logging

Todas as requisições são logadas com:
- requestId
- templateId
- fieldsCount
- timestamp

```json
{
  "timestamp": "2026-05-03T14:30:00Z",
  "level": "info",
  "message": "Template fields retrieved",
  "requestId": "abc123",
  "route": "getTemplateFields",
  "templateId": 123330,
  "fieldsCount": 10
}
```

---

## Integração com Frontend

### React Example

```jsx
import { useState, useEffect } from 'react';

function IncidentForm({ templateId }) {
  const [fieldKeys, setFieldKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetch(`/templates/${templateId}/fields`)
      .then(res => res.json())
      .then(data => {
        const keys = Object.keys(data.data.fields[0]);
        setFieldKeys(keys);
        setFormData(data.data.fields[0]);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [templateId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <form>
      {fieldKeys.map(fieldKey => (
        <div key={fieldKey}>
          <label htmlFor={fieldKey}>
            {fieldKey}
            <span className="required">*</span>
          </label>

          <input
            id={fieldKey}
            type="text"
            name={fieldKey}
            value={formData[fieldKey]}
            onChange={handleChange}
            required
          />
        </div>
      ))}

      <button type="submit">Criar Incidente</button>
    </form>
  );
}

export default IncidentForm;
```

