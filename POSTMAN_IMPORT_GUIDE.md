# Guia de Importação no Postman

## 📥 Como Importar a Collection no Postman

### Método 1: Importar Arquivo JSON (Recomendado)

**Passo 1:** Abra o Postman

**Passo 2:** Clique em **File** → **Import**

![Postman Menu](assets/postman-menu.png)

**Passo 3:** Escolha **Upload Files**

**Passo 4:** Selecione o arquivo:
```
postman_categories_collection.json
```

**Passo 5:** Clique em **Import**

**Pronto!** A collection será importada com todos os endpoints.

---

### Método 2: Importar por Link

Se o arquivo estiver em um repositório:

**Passo 1:** Clique em **File** → **Import**

**Passo 2:** Selecione a aba **URL**

**Passo 3:** Cole a URL do arquivo JSON

**Passo 4:** Clique em **Import**

---

## 🔧 Configurar Variáveis de Ambiente

### Passo 1: Criar Environment

**Passo 1a:** No Postman, clique no ícone de **Engrenagem** (canto superior direito)

**Passo 1b:** Clique em **Environments** → **Create New Environment**

**Passo 1c:** Nomeie como:
```
Local Development
```

### Passo 2: Adicionar Variáveis

Adicione as seguintes variáveis:

| Variável | Inicial Value | Tipo |
|----------|---------------|------|
| `baseUrl` | `http://localhost:3000` | string |
| `categoryId` | `547` | string |

### Passo 3: Salvar e Ativar

**Passo 3a:** Clique em **Save**

**Passo 3b:** Selecione o environment no dropdown (canto superior direito)

---

## 📋 Endpoints Disponíveis

Após importar, você terá acesso a:

### 1. **List All Categories**
```
GET /api/v1/open-finance/categories
```
- Retorna: Array de todas as categorias
- Status: 200 OK

### 2. **Get Category By ID**
```
GET /api/v1/open-finance/categories/:categoryId
```
- Parâmetro: `categoryId` (number)
- Retorna: Uma categoria ou erro
- Status: 200 OK, 400 Bad Request, 404 Not Found

### 3. **Test: Invalid ID**
```
GET /api/v1/open-finance/categories/abc
```
- Teste de validação
- Status esperado: 400

---

## 🚀 Usando os Endpoints

### Exemplo 1: Listar Categorias

**Passo 1:** Clique na requisição **List All Categories**

**Passo 2:** Clique em **Send**

**Esperado:**
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

### Exemplo 2: Buscar Categoria por ID

**Passo 1:** Clique em **Get Category By ID**

**Passo 2:** Verifique a URL:
```
{{baseUrl}}/api/v1/open-finance/categories/{{categoryId}}
```

**Passo 3:** Clique em **Send**

**Esperado:** Dados da categoria 547

### Exemplo 3: Mudar o ID

**Passo 1:** Clique na aba **Params**

**Passo 2:** Localize `categoryId`

**Passo 3:** Mude o valor (ex: `564` em vez de `547`)

**Passo 4:** Clique em **Send**

**Resultado:** Dados da categoria 564

---

## 📊 Estrutura de Resposta

### Resposta Sucesso (200 OK)

```json
{
  "data": {
    "id": 547,
    "category_name": "string",
    "sub_category_name": "string",
    "third_level_category_name": "string",
    "template_id": 123328,
    "type": 1
  }
}
```

### Resposta Erro (400 Bad Request)

```json
{
  "message": "ID da categoria inválido.",
  "details": {
    "categoryId": "abc"
  }
}
```

### Resposta Erro (404 Not Found)

```json
{
  "message": "Categoria não encontrada.",
  "details": {
    "categoryId": 999
  }
}
```

---

## 🧪 Testes Inclusos

A collection já inclui exemplos de resposta para:

✅ **Sucesso** - Categoria encontrada (200)
✅ **Erro 400** - ID inválido
✅ **Erro 404** - Categoria não encontrada

**Para ver as respostas esperadas:**

1. Clique em qualquer requisição
2. Veja a aba **Response** (abaixo)
3. Clique em um dos exemplos em **Save response**

---

## 💾 Arquivo da Collection

**Localização:**
```
postman_categories_collection.json
```

**Conteúdo:**
- 3 requisições GET
- 1 requisição de setup
- Variáveis pré-configuradas
- Exemplos de resposta
- Descrições em cada endpoint

---

## 🔄 Workflow Recomendado

1. **Importar** a collection
2. **Configurar** o environment (Local Development)
3. **Rodar** "List All Categories" para testar conexão
4. **Buscar** categorias específicas por ID
5. **Testar** casos de erro (ID inválido, não encontrado)

---

## ⚙️ Variáveis Pré-configuradas

Você pode modificar as variáveis em qualquer momento:

| Variável | Uso | Padrão |
|----------|-----|--------|
| `{{baseUrl}}` | URL base da API | `http://localhost:3000` |
| `{{categoryId}}` | ID da categoria a buscar | `547` |

**Para alterar:**
1. Clique no ícone de **Engrenagem** (canto superior direito)
2. Selecione seu environment
3. Edite os valores
4. Clique em **Save**

---

## 🐛 Troubleshooting

### Erro: "Could not get any response"

**Solução:** Verifique se o servidor está rodando
```bash
npm run dev
```

### Erro: "Cannot GET /api/v1/open-finance/categories"

**Solução:** Verifique se você está no URL correto
- Esperado: `http://localhost:3000/api/v1/open-finance/categories`
- Verifique `{{baseUrl}}` na variável

### Resposta demora ou não aparece

**Solução:** Aumente o timeout no Postman
1. Clique em **Settings** (ícone de engrenagem)
2. Procure por **Request timeout**
3. Aumente para `30000` (30 segundos)

---

## 📞 Referência Rápida

| Ação | Tecla |
|------|-------|
| Enviar requisição | `Ctrl+Enter` |
| Salvar requisição | `Ctrl+S` |
| Duplicar requisição | `Ctrl+D` |
| Buscar | `Ctrl+K` |

---

## ✨ Próximos Passos

Após testar os endpoints:

1. ✅ Validar que todos retornam dados
2. ✅ Testar casos de erro (400, 404)
3. ✅ Usar em seu fluxo de desenvolvimento
4. ✅ Integrar com outras APIs

**Arquivo:** `docs/API_CATEGORIES.md` para documentação completa

---

## 🎯 Checklist

- [ ] Baixei o arquivo `postman_categories_collection.json`
- [ ] Importei no Postman (File → Import)
- [ ] Configurei o environment "Local Development"
- [ ] Verifiquei que `baseUrl` = `http://localhost:3000`
- [ ] Rodei "List All Categories" com sucesso
- [ ] Testei "Get Category By ID" com ID 547
- [ ] Testei caso de erro (ID inválido)
- [ ] Pronto para usar!

---

Qualquer dúvida, consulte `docs/API_CATEGORIES.md` para documentação completa.
