# Endpoint: GET /api/v1/open-finance/funcionalidades_categorias

Retorna categorias em formato hierárquico de 3 níveis para criar menus navegáveis.

## Níveis de Hierarquia

1. **Nível 1 (Category)**: `category_name` - Categorias principais
2. **Nível 2 (SubCategory)**: `sub_category_name` - Subcategorias dentro de uma categoria
3. **Nível 3 (ThirdLevel)**: `third_level_category_name` - Detalhamento final da categoria

## Uso

### 1. Listar todas as categorias (Nível 1)

```bash
GET /api/v1/open-finance/funcionalidades_categorias
```

**Response:**
```json
{
  "data": [
    "Conformidade",
    "Erro na Jornada ou Dados",
    "Incidentes",
    ...
  ],
  "count": 14
}
```

### 2. Listar subcategorias de uma categoria (Nível 2)

```bash
GET /api/v1/open-finance/funcionalidades_categorias?category=Erro%20na%20Jornada%20ou%20Dados
```

**Response:**
```json
{
  "data": [
    "Consentimento em Status Intermediário",
    "Consumindo os Dados",
    "Fornecendo os Dados",
    "Obtendo um Consentimento",
    ...
  ],
  "count": 11
}
```

### 3. Listar detalhamento de uma subcategoria (Nível 3)

```bash
GET /api/v1/open-finance/funcionalidades_categorias?sub_category=Obtendo%20um%20Consentimento
```

**Response:**
```json
{
  "data": [
    "Autenticação do Usuário",
    "Autorização pelo Usuário",
    "Criação de Consentimento",
    "Redirecionamento para Autenticação",
    "Redirecionamento para Conclusão",
    "Troca de AuthCode por AccesToken"
  ],
  "count": 6
}
```

## Query Parameters

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `category` | string (opcional) | Filtra por categoria (retorna subcategorias) | `category=Erro%20na%20Jornada%20ou%20Dados` |
| `sub_category` | string (opcional) | Filtra por subcategoria (retorna terceiro nível) | `sub_category=Obtendo%20um%20Consentimento` |

**Prioridade**: Se ambos os parâmetros forem fornecidos, `sub_category` tem prioridade.

## Response Format

```json
{
  "data": [
    "string1",
    "string2",
    ...
  ],
  "count": 0
}
```

- `data`: Array com valores únicos ordenados alfabeticamente
- `count`: Número total de itens retornados

## Arquitetura

### Arquivos criados:
- `src/modules/categories/repositories/categoryHierarchyRepository.js` - Acesso a dados
- `src/modules/categories/services/categoryHierarchyService.js` - Lógica de negócio
- `src/modules/categories/controllers/categoryHierarchyController.js` - Handler HTTP

### Testes:
- `tests/modules/categories/repositories/categoryHierarchyRepository.test.js` (6 testes)
- `tests/modules/categories/services/categoryHierarchyService.test.js` (4 testes)

## Exemplo de Uso (Frontend)

```typescript
// Nível 1: Carregar categorias
const categories = await fetch('/api/v1/open-finance/funcionalidades_categorias')
  .then(r => r.json())
  .then(r => r.data);

// Nível 2: Ao clicar em uma categoria
const subCategories = await fetch(
  `/api/v1/open-finance/funcionalidades_categorias?category=${category}`
)
  .then(r => r.json())
  .then(r => r.data);

// Nível 3: Ao clicar em uma subcategoria
const thirdLevel = await fetch(
  `/api/v1/open-finance/funcionalidades_categorias?sub_category=${subCategory}`
)
  .then(r => r.json())
  .then(r => r.data);
```

## Status HTTP

- **200**: Sucesso
- **500**: Erro no servidor (database error, etc.)
