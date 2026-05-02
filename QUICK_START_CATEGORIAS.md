# Quick Start - Endpoints de Categorias

## 🚀 Testar os Endpoints Rapidamente

### 1. Iniciar o Backend

```bash
cd /Users/rafaelcampos/git/gerador-ticket-openfinance
npm install
npm run db:reset  # opcional, se precisar resetar DB
npm run dev
```

Você verá:
```
✓ Server running on port 3000
```

---

### 2. Testar com cURL

#### Endpoint 1: Listar Todas as Categorias

```bash
curl -X GET "http://localhost:3000/api/v1/open-finance/categories" \
  -H "Content-Type: application/json"
```

**Esperado:** Array com todas as categorias

---

#### Endpoint 2: Obter Categoria Específica

```bash
# Obter categoria com ID 547
curl -X GET "http://localhost:3000/api/v1/open-finance/categories/547" \
  -H "Content-Type: application/json"
```

**Esperado:**
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

---

#### Teste: ID Inválido

```bash
# Usar 'abc' em vez de número
curl -X GET "http://localhost:3000/api/v1/open-finance/categories/abc" \
  -H "Content-Type: application/json"
```

**Esperado:** Status 400 + mensagem de erro

---

#### Teste: ID Não Encontrado

```bash
# Usar ID que não existe
curl -X GET "http://localhost:3000/api/v1/open-finance/categories/999999" \
  -H "Content-Type: application/json"
```

**Esperado:** Status 404 + "Categoria não encontrada"

---

### 3. Testar com Postman / Insomnia

#### Criar uma collection com:

**Request 1: List Categories**
- Method: GET
- URL: `http://localhost:3000/api/v1/open-finance/categories`
- Headers: `Content-Type: application/json`

**Request 2: Get Category By ID**
- Method: GET
- URL: `http://localhost:3000/api/v1/open-finance/categories/{{categoryId}}`
- Headers: `Content-Type: application/json`
- Env: `categoryId = 547`

---

### 4. Rodar Testes Automatizados

```bash
# Tester repository
npm test -- tests/repositories/categoryTemplateRepository.test.js

# Tester controller
npm test -- tests/controllers/categoryTemplateController.test.js

# Todos os testes (mais lento)
npm test
```

---

### 5. Testar com Node.js/JavaScript

```javascript
// Listar categorias
const response = await fetch('http://localhost:3000/api/v1/open-finance/categories');
const { data, count } = await response.json();
console.log(`${count} categorias encontradas`);

// Obter uma categoria
const response2 = await fetch('http://localhost:3000/api/v1/open-finance/categories/547');
const { data: category } = await response2.json();
console.log(category.category_name);  // "Erro na Jornada ou Dados"
```

---

## 🧪 Checklist de Validação

- [ ] Backend inicia sem erro
- [ ] GET /categories retorna dados
- [ ] GET /categories retorna count
- [ ] GET /categories/:id retorna uma categoria
- [ ] GET /categories/abc retorna 400
- [ ] GET /categories/999 retorna 404
- [ ] Testes repository passam (5/5)
- [ ] Testes controller passam (7/7)

---

## 📊 Exemplo: Encontrar Categoria para Endpoint

```bash
# 1. Listar todas as categorias
curl "http://localhost:3000/api/v1/open-finance/categories" | jq '.data'

# 2. Procurar pela categoria desejada:
# Buscar onde:
# - category_name = "Erro na Jornada ou Dados"
# - sub_category_name = "Obtendo um Consentimento"  
# - third_level_category_name = "Criação de Consentimento"

# 3. Anotar o ID encontrado (exemplo: 547)

# 4. Obter detalhes completos
curl "http://localhost:3000/api/v1/open-finance/categories/547" | jq '.'

# 5. Template associado está em: .data.template_id
```

---

## 🐛 Troubleshooting

### Erro: "Cannot GET /api/v1/open-finance/categories"

**Solução:** Backend não está rodando
```bash
npm run dev
```

### Erro: "Unexpected internal error"

**Solução:** Verifique logs do servidor
```bash
# Ver últimas linhas dos logs
tail -50 logs/app.log
```

### IDs não retornam dados

**Solução:** Confirme que o banco tem dados
```bash
# Conectar ao banco e verificar
psql $DATABASE_URL
SELECT id, category_name FROM category_templates LIMIT 5;
```

---

## 📚 Documentação Completa

Para documentação mais detalhada, ver:
- `docs/API_CATEGORIES.md` — Documentação da API
- `IMPLEMENTACAO_ENDPOINTS_CATEGORIAS.md` — Detalhes da implementação

---

## 💡 Casos de Uso Reais

### Use Case 1: Frontend descobrir disponível templates

```javascript
// Buscar todas as categorias disponíveis
const categories = await fetch('/api/v1/open-finance/categories')
  .then(r => r.json())
  .then(d => d.data);

// Agrupar por tipo (incidente=1, requisição=10)
const incidentes = categories.filter(c => c.type === 1);
const requisicoes = categories.filter(c => c.type === 10);

// Exibir em UI para usuário escolher
console.log(`${incidentes.length} tipos de incidente disponíveis`);
```

### Use Case 2: Backend carregar template por categoria

```javascript
// Após receber category_name, sub_category_name, third_level_category_name
const response = await fetch('/api/v1/open-finance/categories');
const { data } = await response.json();

const category = data.find(c => 
  c.category_name === receivedCategoryName &&
  c.sub_category_name === receivedSubCategoryName &&
  c.third_level_category_name === receivedThirdLevelName
);

const templateId = category.template_id;
// Agora carregue os campos do template
```

---

## ✅ Próximos Passos

Após validar que os endpoints funcionam:

1. Implementar Fase 2: Alterar tabela `endpoints`
2. Migrar dados de `ticket_owner_endpoints`
3. Deletar tabela `ticket_owner_endpoints`
4. Atualizar `/report-application-error` para usar as categorias

Referência: `PLANO_DETALHADO.md`
