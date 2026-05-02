# Categories Module

Módulo isolado para gerenciar categorias de templates do Sysaid.

## 📁 Estrutura

```
src/modules/categories/
├── repositories/
│   └── categoryRepository.js    # Camada de acesso a dados
├── services/
│   └── categoryService.js       # Lógica de negócio
├── controllers/
│   └── categoryController.js    # Manipuladores de requisição HTTP
├── routes/
│   └── categoryRoutes.js        # Definição de rotas do módulo
├── index.js                     # Exportação do módulo
└── README.md                    # Este arquivo
```

## 🚀 Como Usar

### Integração no Aplicativo Principal

No arquivo principal de rotas (`src/routes/openFinanceRoutes.js`):

```javascript
const categoriesModule = require('../modules/categories');

// ... outros imports ...

const router = express.Router();

// ... outras rotas ...

// Registrar módulo de categorias
router.use('/categories', categoriesModule.routes);

module.exports = router;
```

### Acesso Direto aos Componentes

```javascript
// Usar o serviço diretamente
const categoriesModule = require('../modules/categories');
const { service } = categoriesModule;

const allCategories = await service.getAllCategories();
const category = await service.getCategoryById(123);
```

## 📚 Componentes

### Repository (`categoryRepository.js`)

Acessa dados da tabela `category_templates`.

**Funções:**
- `listAll()` — Retorna todas as categorias
- `findById(id)` — Retorna uma categoria por ID

```javascript
const { repository } = require('../modules/categories');

const categories = await repository.listAll();
const category = await repository.findById(547);
```

### Service (`categoryService.js`)

Contém lógica de negócio e validações.

**Funções:**
- `getAllCategories()` — Retorna todas as categorias
- `getCategoryById(id)` — Retorna categoria com validação

```javascript
const { service } = require('../modules/categories');

try {
  const category = await service.getCategoryById(id);
} catch (error) {
  // error.status === 400 ou 404
  // error.message = mensagem do erro
}
```

### Controller (`categoryController.js`)

Manipuladores HTTP com logging.

**Funções:**
- `list(req, res, next)` — GET /categories
- `getById(req, res, next)` — GET /categories/:categoryId

### Routes (`categoryRoutes.js`)

Define rotas do módulo.

```javascript
// GET /categories
// GET /categories/:categoryId
```

## 📋 Endpoints

### GET /categories

Retorna lista de todas as categorias.

**Response (200):**
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
    }
  ],
  "count": 1
}
```

### GET /categories/:categoryId

Retorna uma categoria por ID.

**Response (200):**
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

**Response (400):**
```json
{
  "message": "ID da categoria inválido.",
  "details": { "categoryId": "abc" }
}
```

**Response (404):**
```json
{
  "message": "Categoria não encontrada.",
  "details": { "categoryId": 999 }
}
```

## 🧪 Testes

Estrutura de testes:

```
tests/modules/categories/
├── repositories/
│   └── categoryRepository.test.js
├── services/
│   └── categoryService.test.js
├── controllers/
│   └── categoryController.test.js
└── helpers/
    └── testHelpers.js
```

### Executar Testes

```bash
# Testes do repositório
npm test -- tests/modules/categories/repositories/

# Testes do service
npm test -- tests/modules/categories/services/

# Testes do controller
npm test -- tests/modules/categories/controllers/

# Todos os testes do módulo
npm test -- tests/modules/categories/
```

**Total:** 13 testes (5 repository + 5 service + 3 controller)

## 🔄 Fluxo de Dados

```
Request HTTP
    ↓
categoryController.getById()
    ↓
categoryService.getCategoryById()
    ↓
categoryRepository.findById()
    ↓
Database Query
    ↓
Response JSON
```

## 📝 Estrutura de Dados

Cada categoria contém:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | number | ID único |
| `category_name` | string | Categoria principal |
| `sub_category_name` | string | Subcategoria |
| `third_level_category_name` | string | Terceiro nível |
| `template_id` | number | ID do template |
| `type` | number | 1=Incidente, 10=Requisição |

## 🔗 Dependências Externas

- `postgresClient.js` — Conexão com banco
- `logger.js` — Logging

## 📦 Exportações

O módulo exporta via `index.js`:

```javascript
{
  routes: categoryRoutes,
  controller: categoryController,
  service: categoryService,
  repository: categoryRepository,
}
```

## 🎯 Uso em Outro Projeto

Para copiar este módulo para outro projeto:

1. Copie a pasta `src/modules/categories/`
2. Copie a pasta `tests/modules/categories/`
3. No arquivo de rotas principal, adicione:
   ```javascript
   const categoriesModule = require('../modules/categories');
   router.use('/categories', categoriesModule.routes);
   ```
4. Rode os testes: `npm test -- tests/modules/categories/`

## 🔐 Segurança

- Validação de entrada no service
- IDs normalizados para números
- Sem acesso direto ao banco (via repository)
- Logging de todas as operações

## 📞 Manutenção

Para adicionar nova funcionalidade:

1. Adicione função ao `categoryRepository.js`
2. Crie wrapper no `categoryService.js` com validações
3. Crie handler no `categoryController.js`
4. Adicione rota em `categoryRoutes.js`
5. Crie testes para cada camada

## ✨ Próximas Etapas

Após validar o módulo de categorias:

1. Estender tabela `endpoints` com colunas de categoria
2. Atualizar `/report-application-error` para usar categorias
3. Migrar `ticket_owner_endpoints` → `endpoints`

Ver: `PLANO_DETALHADO.md` para detalhes.
