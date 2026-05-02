# Guia de Merge Manual - Endpoints de Categorias

## 📋 Estrutura

Este guia facilita o merge manual das mudanças de categorias com outra versão do sistema.

---

## 📁 ARQUIVOS NOVOS (Copiar como está)

Copie estes arquivos completos sem nenhuma alteração:

### 1. Repository
```
src/repositories/categoryTemplateRepository.js
```
**Ação:** Criar arquivo novo (copie o conteúdo exatamente como está)

### 2. Controller
```
src/controllers/categoryTemplateController.js
```
**Ação:** Criar arquivo novo (copie o conteúdo exatamente como está)

### 3. Testes - Repository
```
tests/repositories/categoryTemplateRepository.test.js
```
**Ação:** Criar arquivo novo

### 4. Testes - Controller
```
tests/controllers/categoryTemplateController.test.js
```
**Ação:** Criar arquivo novo

### 5. Documentação
```
docs/API_CATEGORIES.md
```
**Ação:** Criar arquivo novo

---

## ✏️ ARQUIVO COM MUDANÇAS (Modificar existente)

### Arquivo: `src/routes/openFinanceRoutes.js`

**Mudança 1 - Linha 7 (após outros imports)**

Adicionar import do novo controller:

```javascript
const categoryTemplateController = require('../controllers/categoryTemplateController');
```

**Seu arquivo deve ficar assim:**

```javascript
const express = require('express');
const multer = require('multer');
const openFinanceAuthController = require('../controllers/openFinanceAuthController');
const openFinanceApplicationIncidentsController = require('../controllers/openFinanceApplicationIncidentsController');
const openFinanceEnvironmentController = require('../controllers/openFinanceEnvironmentController');
const openFinanceTicketFlowController = require('../controllers/openFinanceTicketFlowController');
const openFinanceTicketsController = require('../controllers/openFinanceTicketsController');
const categoryTemplateController = require('../controllers/categoryTemplateController');  // ← NOVO
// ... resto do arquivo
```

---

**Mudança 2 - Final do arquivo (antes de `module.exports`)**

Adicionar as 2 novas rotas:

```javascript
router.get('/categories', categoryTemplateController.listCategories);
router.get('/categories/:categoryId', categoryTemplateController.getCategoryById);
```

**Seu arquivo deve ficar assim:**

```javascript
// ... outros routes ...

router.get(
  '/ticket-templates/:templateId/required-fields',
  openFinanceTicketsController.listRequiredTemplateFields
);
router.get('/categories', categoryTemplateController.listCategories);           // ← NOVO
router.get('/categories/:categoryId', categoryTemplateController.getCategoryById); // ← NOVO

module.exports = router;
```

---

## 🔍 VERIFICAÇÃO

Depois de fazer as mudanças, verifique:

### 1. Arquivos Novos Existem?
```bash
ls -la src/repositories/categoryTemplateRepository.js
ls -la src/controllers/categoryTemplateController.js
ls -la tests/repositories/categoryTemplateRepository.test.js
ls -la tests/controllers/categoryTemplateController.test.js
ls -la docs/API_CATEGORIES.md
```

### 2. Routes Atualizado?
```bash
grep "categoryTemplateController" src/routes/openFinanceRoutes.js
```

Deve retornar 3 linhas (1 import + 2 rotas)

### 3. Testes Passam?
```bash
npm test -- tests/repositories/categoryTemplateRepository.test.js
npm test -- tests/controllers/categoryTemplateController.test.js
```

Ambos devem retornar: **12 testes passando (5 + 7)**

---

## 🔗 INTEGRAÇÃO COM OUTRO CÓDIGO

Se você já tem mudanças no seu branch em outras áreas, não há conflitos:

- ❌ Nenhuma outra mudança em arquivos existentes
- ✅ Apenas 1 arquivo modificado: `openFinanceRoutes.js` (adições apenas no final)
- ✅ 4 arquivos novos (sem conflito possível)

---

## 📋 Checklist de Merge

- [ ] Copiei `src/repositories/categoryTemplateRepository.js`
- [ ] Copiei `src/controllers/categoryTemplateController.js`
- [ ] Copiei `tests/repositories/categoryTemplateRepository.test.js`
- [ ] Copiei `tests/controllers/categoryTemplateController.test.js`
- [ ] Copiei `docs/API_CATEGORIES.md`
- [ ] Atualizei `src/routes/openFinanceRoutes.js` (import + 2 rotas)
- [ ] Rodei testes e passaram
- [ ] Backend inicia sem erro
- [ ] Endpoints respondem: `curl http://localhost:3000/api/v1/open-finance/categories`

---

## 🆘 Se Tiver Conflito

Se houver conflito ao fazer merge:

### Conflito em `openFinanceRoutes.js`

Procure por `categoryTemplateController`:

**❌ Incorreto - deixou marcadores de conflito:**
```javascript
<<<<<<< HEAD
// seu código
=======
const categoryTemplateController = require('../controllers/categoryTemplateController');
>>>>>>> categorias
```

**✅ Correto - resolveu o conflito:**
```javascript
const categoryTemplateController = require('../controllers/categoryTemplateController');
// seu código abaixo
```

### Conflito em Rotas

**❌ Incorreto:**
```javascript
<<<<<<< HEAD
router.get('/ticket-templates/:templateId/required-fields', ...);
=======
router.get('/categories', categoryTemplateController.listCategories);
>>>>>>> categorias
module.exports = router;
```

**✅ Correto:**
```javascript
router.get('/ticket-templates/:templateId/required-fields', ...);
router.get('/categories', categoryTemplateController.listCategories);
router.get('/categories/:categoryId', categoryTemplateController.getCategoryById);
module.exports = router;
```

---

## 📦 Resumo das Mudanças

| Tipo | Arquivo | Ação |
|------|---------|------|
| Novo | `src/repositories/categoryTemplateRepository.js` | Criar |
| Novo | `src/controllers/categoryTemplateController.js` | Criar |
| Novo | `tests/repositories/categoryTemplateRepository.test.js` | Criar |
| Novo | `tests/controllers/categoryTemplateController.test.js` | Criar |
| Novo | `docs/API_CATEGORIES.md` | Criar |
| Modificar | `src/routes/openFinanceRoutes.js` | +1 import, +2 rotas |

**Total:** 5 arquivos novos + 1 arquivo modificado (leve)

---

## 🎯 Ordem Recomendada

1. Copiar os 5 arquivos novos para seus respectivos diretórios
2. Modificar `src/routes/openFinanceRoutes.js`
3. Rodar `npm test` para validar
4. Fazer commit das mudanças

---

## 💾 Backup Antes de Começar

```bash
# Fazer backup da versão atual
cp -r src src.backup
cp -r tests tests.backup
cp src/routes/openFinanceRoutes.js src/routes/openFinanceRoutes.js.backup
```

Se algo der errado:
```bash
# Restaurar
cp -r src.backup/* src/
cp -r tests.backup/* tests/
cp src/routes/openFinanceRoutes.js.backup src/routes/openFinanceRoutes.js
```

---

## 📞 Referência Rápida

**Novo Repository:**
- Arquivo: `src/repositories/categoryTemplateRepository.js`
- Funções: `listAllCategories()`, `getCategoryById(id)`

**Novo Controller:**
- Arquivo: `src/controllers/categoryTemplateController.js`
- Funções: `listCategories(req, res, next)`, `getCategoryById(req, res, next)`

**Rotas Adicionadas:**
```javascript
router.get('/categories', categoryTemplateController.listCategories);
router.get('/categories/:categoryId', categoryTemplateController.getCategoryById);
```

---

## ✨ Pronto!

Após seguir este guia, seus endpoints estarão prontos:
- ✅ GET `/api/v1/open-finance/categories`
- ✅ GET `/api/v1/open-finance/categories/:categoryId`

Com testes completos (12 testes passando).
