#!/bin/bash

# Script para facilitar merge manual dos endpoints de categorias
# Uso: bash merge_categorias.sh

echo "=========================================="
echo "Merge Manual - Endpoints de Categorias"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script no diretório raiz do projeto${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Checando estrutura de diretórios...${NC}"
echo ""

# Criar diretórios se não existem
mkdir -p src/repositories
mkdir -p src/controllers
mkdir -p tests/repositories
mkdir -p tests/controllers
mkdir -p docs

echo -e "${GREEN}✅ Diretórios confirmados${NC}"
echo ""

# Listar arquivos que serão criados/atualizados
echo -e "${YELLOW}📁 Arquivos a serem processados:${NC}"
echo ""

echo "NOVOS ARQUIVOS:"
echo "  1. src/repositories/categoryTemplateRepository.js"
echo "  2. src/controllers/categoryTemplateController.js"
echo "  3. tests/repositories/categoryTemplateRepository.test.js"
echo "  4. tests/controllers/categoryTemplateController.test.js"
echo "  5. docs/API_CATEGORIES.md"
echo ""

echo "ARQUIVOS A MODIFICAR:"
echo "  1. src/routes/openFinanceRoutes.js (adicionar import + 2 rotas)"
echo ""

echo -e "${YELLOW}📝 Instruções:${NC}"
echo ""
echo "1. Copie os 5 arquivos NOVOS do repositório de origem para este projeto"
echo ""
echo "2. Modifique src/routes/openFinanceRoutes.js:"
echo ""
echo "   a) Adicione no topo (após outros imports):"
echo "      const categoryTemplateController = require('../controllers/categoryTemplateController');"
echo ""
echo "   b) Adicione no final (antes de module.exports):"
echo "      router.get('/categories', categoryTemplateController.listCategories);"
echo "      router.get('/categories/:categoryId', categoryTemplateController.getCategoryById);"
echo ""

echo -e "${YELLOW}🧪 Validação:${NC}"
echo ""

# Verificar se os arquivos novos existem
ARQUIVO1="src/repositories/categoryTemplateRepository.js"
ARQUIVO2="src/controllers/categoryTemplateController.js"
ARQUIVO3="tests/repositories/categoryTemplateRepository.test.js"
ARQUIVO4="tests/controllers/categoryTemplateController.test.js"
ARQUIVO5="docs/API_CATEGORIES.md"

arquivos_ok=true

if [ -f "$ARQUIVO1" ]; then
    echo -e "${GREEN}✅${NC} $ARQUIVO1 encontrado"
else
    echo -e "${YELLOW}⏳${NC} $ARQUIVO1 (pendente)"
    arquivos_ok=false
fi

if [ -f "$ARQUIVO2" ]; then
    echo -e "${GREEN}✅${NC} $ARQUIVO2 encontrado"
else
    echo -e "${YELLOW}⏳${NC} $ARQUIVO2 (pendente)"
    arquivos_ok=false
fi

if [ -f "$ARQUIVO3" ]; then
    echo -e "${GREEN}✅${NC} $ARQUIVO3 encontrado"
else
    echo -e "${YELLOW}⏳${NC} $ARQUIVO3 (pendente)"
    arquivos_ok=false
fi

if [ -f "$ARQUIVO4" ]; then
    echo -e "${GREEN}✅${NC} $ARQUIVO4 encontrado"
else
    echo -e "${YELLOW}⏳${NC} $ARQUIVO4 (pendente)"
    arquivos_ok=false
fi

if [ -f "$ARQUIVO5" ]; then
    echo -e "${GREEN}✅${NC} $ARQUIVO5 encontrado"
else
    echo -e "${YELLOW}⏳${NC} $ARQUIVO5 (pendente)"
    arquivos_ok=false
fi

echo ""

# Verificar se openFinanceRoutes.js foi atualizado
if grep -q "categoryTemplateController" src/routes/openFinanceRoutes.js; then
    echo -e "${GREEN}✅${NC} src/routes/openFinanceRoutes.js atualizado"
else
    echo -e "${YELLOW}⏳${NC} src/routes/openFinanceRoutes.js (pendente atualização)"
fi

echo ""

if [ "$arquivos_ok" = true ] && grep -q "categoryTemplateController" src/routes/openFinanceRoutes.js; then
    echo -e "${GREEN}=========================================="
    echo "✅ TUDO PRONTO! Executando testes..."
    echo "==========================================${NC}"
    echo ""

    # Rodar testes
    echo -e "${YELLOW}Testando repository...${NC}"
    npm test -- tests/repositories/categoryTemplateRepository.test.js 2>&1 | tail -15

    echo ""
    echo -e "${YELLOW}Testando controller...${NC}"
    npm test -- tests/controllers/categoryTemplateController.test.js 2>&1 | tail -15

    echo ""
    echo -e "${GREEN}✅ MERGE COMPLETO!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "  1. npm run dev  (iniciar servidor)"
    echo "  2. curl http://localhost:3000/api/v1/open-finance/categories"
    echo "  3. Ver QUICK_START_CATEGORIAS.md para mais exemplos"
else
    echo -e "${YELLOW}⏳ MERGE INCOMPLETO${NC}"
    echo ""
    echo "Faltam completar:"
    if [ "$arquivos_ok" = false ]; then
        echo "  - Copiar os 5 arquivos NOVOS"
    fi
    if ! grep -q "categoryTemplateController" src/routes/openFinanceRoutes.js; then
        echo "  - Atualizar src/routes/openFinanceRoutes.js"
    fi
    echo ""
    echo "Para detalhes, ver MERGE_CATEGORIAS_GUIA.md"
fi

echo ""
