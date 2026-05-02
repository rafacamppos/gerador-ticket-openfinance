#!/bin/bash

# ============================================================
# CURL COMMANDS - API DE CATEGORIAS
# ============================================================
#
# Copie e cole os comandos abaixo no seu terminal
# Certifique-se que o servidor está rodando em localhost:3000
#
# ============================================================

echo "🔧 ENDPOINTS DE CATEGORIAS - CURL COMMANDS"
echo "==========================================="
echo ""
echo "Certifique-se que o servidor está rodando:"
echo "  npm run dev"
echo ""
echo "==========================================="
echo ""

# 1. LISTAR TODAS AS CATEGORIAS
echo "1️⃣  LISTAR TODAS AS CATEGORIAS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "curl -X GET 'http://localhost:3000/api/v1/open-finance/categories' \\"
echo "  -H 'Content-Type: application/json'"
echo ""
echo "# Copie e cole o comando acima no terminal"
echo ""

# 2. OBTER CATEGORIA POR ID (Sucesso)
echo "2️⃣  OBTER CATEGORIA POR ID (Exemplo: ID 547)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "curl -X GET 'http://localhost:3000/api/v1/open-finance/categories/547' \\"
echo "  -H 'Content-Type: application/json'"
echo ""
echo "# Copie e cole o comando acima no terminal"
echo ""

# 3. OBTER CATEGORIA - ID INVÁLIDO (Erro 400)
echo "3️⃣  TESTE - ID INVÁLIDO (deve retornar 400)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "curl -X GET 'http://localhost:3000/api/v1/open-finance/categories/abc' \\"
echo "  -H 'Content-Type: application/json'"
echo ""
echo "# Esperado: Status 400, mensagem 'ID da categoria inválido'"
echo ""

# 4. OBTER CATEGORIA - ID NÃO ENCONTRADO (Erro 404)
echo "4️⃣  TESTE - ID NÃO ENCONTRADO (deve retornar 404)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "curl -X GET 'http://localhost:3000/api/v1/open-finance/categories/999999' \\"
echo "  -H 'Content-Type: application/json'"
echo ""
echo "# Esperado: Status 404, mensagem 'Categoria não encontrada'"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 DICAS:"
echo "  • Use 'jq' para formatar JSON: ... | jq ."
echo "  • Use 'wc' para contar categorias: ... | jq '.data | length'"
echo "  • Use 'grep' para filtrar: ... | jq '.data[] | select(.type == 1)'"
echo ""
echo "✨ IMPORTE NO POSTMAN:"
echo "  1. Abra o Postman"
echo "  2. Clique em 'Import'"
echo "  3. Selecione 'postman_categories_collection.json'"
echo ""
