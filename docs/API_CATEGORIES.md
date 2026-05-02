# API de Categorias

Documentação dos endpoints para consulta de categorias de templates.

## Base URL

```
/api/v1/open-finance
```

---

## Endpoints

### 1. Listar Todas as Categorias

**GET** `/categories`

Retorna a lista completa de todas as categorias com seus 3 níveis, template associado e type.

#### Resposta (200 OK)

```json
{
  "data": [
    {
      "id": 547,
      "category_name": "Erro na Jornada ou Dados",
      "sub_category_name": "Obtendo um Consentimento",
      "third_level_category_name": "Criação de Consentimento",
      "template_id": 123328,
      "type": 1
    },
    {
      "id": 564,
      "category_name": "Conformidade",
      "sub_category_name": "Correções Necessárias em APIs",
      "third_level_category_name": "Correções Necessárias em APIs",
      "template_id": 8794,
      "type": 1
    }
  ],
  "count": 2
}
```

#### Campos de Resposta

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `data` | `Array<Category>` | Lista de categorias |
| `count` | `number` | Quantidade total de categorias retornadas |

#### Tipo Category

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `number` | ID único da categoria |
| `category_name` | `string` | Nome da categoria principal |
| `sub_category_name` | `string` | Nome da subcategoria |
| `third_level_category_name` | `string` | Nome do terceiro nível de categoria |
| `template_id` | `number` | ID do template associado |
| `type` | `number` | Tipo da categoria (1 = incidente, 10 = requisição/notificação) |

#### Exemplo com cURL

```bash
curl -X GET "http://localhost:3000/api/v1/open-finance/categories" \
  -H "Content-Type: application/json"
```

---

### 2. Obter Categoria por ID

**GET** `/categories/:categoryId`

Retorna os detalhes de uma categoria específica.

#### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-----------|-----------|
| `categoryId` | `number` | Sim | ID único da categoria |

#### Resposta (200 OK)

```json
{
  "data": {
    "id": 547,
    "category_name": "Erro na Jornada ou Dados",
    "sub_category_name": "Obtendo um Consentimento",
    "third_level_category_name": "Criação de Consentimento",
    "template_id": 123328,
    "type": 1
  }
}
```

#### Resposta (400 Bad Request)

Quando o `categoryId` é inválido ou não é um número:

```json
{
  "message": "ID da categoria inválido.",
  "details": {
    "categoryId": "abc"
  }
}
```

#### Resposta (404 Not Found)

Quando a categoria com o ID informado não existe:

```json
{
  "message": "Categoria não encontrada.",
  "details": {
    "categoryId": 999
  }
}
```

#### Exemplo com cURL

```bash
# Obter categoria com ID 547
curl -X GET "http://localhost:3000/api/v1/open-finance/categories/547" \
  -H "Content-Type: application/json"
```

---

## Casos de Uso

### 1. Descobrir qual é o template para um endpoint

```javascript
// 1. Listar todas as categorias
GET /api/v1/open-finance/categories

// 2. Procurar pela categoria que corresponde ao seu endpoint
// Ex: categoria com nome "Erro na Jornada ou Dados", 
//     subcategoria "Obtendo um Consentimento",
//     terceiro nível "Criação de Consentimento"

// 3. Pegar o template_id retornado (ex: 123328)
```

### 2. Buscar detalhes completos de uma categoria

```javascript
// Se você tem apenas o ID da categoria
GET /api/v1/open-finance/categories/547

// Retorna todos os 3 níveis + template_id + type
```

### 3. Integração com `/report-application-error`

Após a mudança para usar `category_name`, `sub_category_name`, `third_level_category_name`:

```javascript
// 1. Listar categorias
const response = await fetch('/api/v1/open-finance/categories');
const { data: categories } = await response.json();

// 2. Encontrar a categoria desejada
const category = categories.find(cat => 
  cat.category_name === 'Erro na Jornada ou Dados' &&
  cat.sub_category_name === 'Obtendo um Consentimento' &&
  cat.third_level_category_name === 'Criação de Consentimento'
);

// 3. Usar no endpoint de reporte
await fetch('/api/v1/open-finance/:teamSlug/report-application-error', {
  method: 'POST',
  body: JSON.stringify({
    endpoint: '/open-banking/consents/v3/consents',
    method: 'POST',
    categoryName: category.category_name,
    subCategoryName: category.sub_category_name,
    thirdLevelCategoryName: category.third_level_category_name,
    // ... outros campos
  })
});
```

---

## Tipo de Retorno

Toda resposta bem-sucedida retorna um objeto JSON com a estrutura definida acima.

Em caso de erro, o servidor retorna um objeto com:
- `message`: descrição do erro
- `details`: informações adicionais sobre o erro (quando aplicável)

---

## Notas

- Os endpoints estão sob proteção de CORS — certifique-se de que seu cliente está configurado para permitir requisições cross-origin
- Não há limite de taxa (rate limiting) nesses endpoints, mas isso pode mudar no futuro
- Os valores de `type` indicam o propósito da categoria:
  - `1` = Incidente (erro reportado)
  - `10` = Requisição ou Notificação (solicitação de mudança, informação, etc.)
