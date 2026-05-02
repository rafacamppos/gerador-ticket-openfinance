# Integração do Módulo de Categorias

Guia para integrar o módulo isolado de categorias no aplicativo principal.

---

## 📁 Estrutura do Módulo

Todo o código está isolado em:

```
src/modules/categories/
├── repositories/categoryRepository.js
├── services/categoryService.js
├── controllers/categoryController.js
├── routes/categoryRoutes.js
├── index.js
└── README.md

tests/modules/categories/
├── repositories/categoryRepository.test.js
├── services/categoryService.test.js
├── controllers/categoryController.test.js
└── helpers/testHelpers.js
```

**Vantagem:** Copie a pasta inteira `src/modules/categories/` para sua outra versão sem afetar nada.

---

## 🔌 Integração em 3 Passos

### PASSO 1: Importar o Módulo

**Arquivo:** `src/routes/openFinanceRoutes.js`

**Adicione no topo (após outros imports):**

```javascript
const categoriesModule = require('../modules/categories');
```

**Seu arquivo fica assim:**

```javascript
const express = require('express');
const multer = require('multer');
const openFinanceAuthController = require('../controllers/openFinanceAuthController');
const openFinanceApplicationIncidentsController = require('../controllers/openFinanceApplicationIncidentsController');
const openFinanceEnvironmentController = require('../controllers/openFinanceEnvironmentController');
const openFinanceTicketFlowController = require('../controllers/openFinanceTicketFlowController');
const openFinanceTicketsController = require('../controllers/openFinanceTicketsController');
const categoriesModule = require('../modules/categories');  // ← NOVO

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ... resto do arquivo
```

---

### PASSO 2: Registrar as Rotas do Módulo

**Ainda no arquivo:** `src/routes/openFinanceRoutes.js`

**Adicione após as outras rotas (antes de `module.exports`):**

```javascript
router.use('/categories', categoriesModule.routes);
```

**Seu arquivo fica assim:**

```javascript
// ... outras rotas ...

router.get(
  '/ticket-templates/:templateId/required-fields',
  openFinanceTicketsController.listRequiredTemplateFields
);
router.use('/categories', categoriesModule.routes);  // ← NOVO

module.exports = router;
```

---

### PASSO 3: Validar Integração

**Execute:**

```bash
npm test -- tests/modules/categories/
```

**Esperado:** 13 testes passando (5 + 5 + 3)

```
✔ categoryRepository.test.js (5 testes)
✔ categoryService.test.js (5 testes)
✔ categoryController.test.js (3 testes)

Total: 13 passing
```

---

## ✅ Verificação Pós-Integração

### Checklist

- [ ] Arquivo `src/routes/openFinanceRoutes.js` importa `categoriesModule`
- [ ] Rotas registradas com `router.use('/categories', categoriesModule.routes)`
- [ ] Testes passam: `npm test -- tests/modules/categories/`
- [ ] Backend inicia sem erro: `npm run dev`
- [ ] Endpoints respondendo:
  - [ ] `curl http://localhost:3000/api/v1/open-finance/categories`
  - [ ] `curl http://localhost:3000/api/v1/open-finance/categories/547`

---

## 📋 Modificações Necessárias

| Arquivo | Mudança | Tipo |
|---------|---------|------|
| `src/routes/openFinanceRoutes.js` | Adicionar 1 import + 1 router.use() | Integração |
| `src/modules/categories/` | Copiar pasta completa | Novo módulo |
| `tests/modules/categories/` | Copiar pasta completa | Novos testes |

**Total:** 2 passos de integração (1 linha import + 1 linha rota)

---

## 🚀 Endpoints Após Integração

Após integrar, você terá acesso a:

### GET `/api/v1/open-finance/categories`

Lista todas as categorias.

```bash
curl -X GET 'http://localhost:3000/api/v1/open-finance/categories' \
  -H 'Content-Type: application/json'
```

**Response:**
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

### GET `/api/v1/open-finance/categories/:categoryId`

Obtém uma categoria por ID.

```bash
curl -X GET 'http://localhost:3000/api/v1/open-finance/categories/547' \
  -H 'Content-Type: application/json'
```

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

**Response (404):**
```json
{
  "message": "Categoria não encontrada.",
  "details": { "categoryId": 999 }
}
```

---

## 🔍 Estrutura do Módulo

```
categoriesModule = {
  routes: express.Router(),        // Rotas do módulo
  controller: {                    // Handlers HTTP
    list(req, res, next),
    getById(req, res, next)
  },
  service: {                       // Lógica de negócio
    getAllCategories(),
    getCategoryById(id)
  },
  repository: {                    // Acesso a dados
    listAll(),
    findById(id)
  }
}
```

---

## 📖 Usar Componentes Diretamente

Se precisar usar o módulo em outra parte do código:

```javascript
const categoriesModule = require('../modules/categories');

// Usar o serviço
const { service } = categoriesModule;
const allCategories = await service.getAllCategories();
const category = await service.getCategoryById(123);

// Usar o repositório
const { repository } = categoriesModule;
const categories = await repository.listAll();
const cat = await repository.findById(547);

// Usar o controller
const { controller } = categoriesModule;
// await controller.list(req, res, next);
```

---

## 🔄 Copiar para Outro Projeto

Para copiar este módulo para outra versão do projeto:

### Passo 1: Copiar os arquivos

```bash
# No projeto de origem
cp -r src/modules/categories /caminho/outro/projeto/src/modules/

cp -r tests/modules/categories /caminho/outro/projeto/tests/modules/
```

### Passo 2: Integrar no outro projeto

1. Abra `src/routes/openFinanceRoutes.js` no outro projeto
2. Adicione o import: `const categoriesModule = require('../modules/categories');`
3. Adicione a rota: `router.use('/categories', categoriesModule.routes);`
4. Execute: `npm test -- tests/modules/categories/`

**Pronto!** O módulo está integrado.

---

## 🧪 Testes

### Rodar Testes do Módulo

```bash
npm test -- tests/modules/categories/
```

### Rodar Todos os Testes

```bash
npm test
```

### Testes Específicos

```bash
# Apenas repositório
npm test -- tests/modules/categories/repositories/

# Apenas service
npm test -- tests/modules/categories/services/

# Apenas controller
npm test -- tests/modules/categories/controllers/
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module '../modules/categories'"

**Solução:** Verifique se a pasta existe:
```bash
ls -la src/modules/categories/
```

### Erro: "router.use is not a function"

**Solução:** Verifique se `router` está definido:
```javascript
const router = express.Router();
router.use('/categories', categoriesModule.routes);
```

### Testes falham

**Solução:** Verifique se todos os arquivos foram copiados:
```bash
ls -la src/modules/categories/
ls -la tests/modules/categories/
```

---

## 📊 Resumo das Mudanças

| Arquivo | Mudança | Linhas |
|---------|---------|--------|
| `src/routes/openFinanceRoutes.js` | Import módulo | +1 |
| `src/routes/openFinanceRoutes.js` | Registrar rotas | +1 |
| Novos arquivos | Módulo completo | ~400 linhas |
| Novos testes | 13 testes | ~400 linhas |

**Total impacto:** 2 linhas no arquivo principal

---

## ✨ Pronto!

Após seguir este guia, você terá:

✅ Módulo de categorias completamente isolado  
✅ 2 endpoints funcionando (`/categories` e `/categories/:id`)  
✅ 13 testes automatizados  
✅ Fácil de copiar para outros projetos  
✅ Documentação completa no `src/modules/categories/README.md`

---

## 📞 Próximas Etapas

Com o módulo integrado, você pode:

1. Usar os endpoints na UI para listar categorias
2. Implementar a migração de `ticket_owner_endpoints`
3. Estender o módulo com novas funcionalidades

Ver: `PLANO_DETALHADO.md` para as próximas fases.
