# AGENTS.md

## Projeto
Aplicação Node.js organizada em camadas, com foco em legibilidade, baixo acoplamento e manutenção simples.

Estrutura esperada:
- `controllers/` → recebe requisição e devolve resposta
- `services/` → concentra regra de negócio
- `repositories/` → concentra acesso a dados
- `routes/` → define endpoints
- `middlewares/` → autenticação, autorização, tratamento transversal
- `utils/` → funções utilitárias sem regra de negócio principal

## Convenções de nomenclatura
- Classes em `PascalCase`
- Métodos e variáveis em `camelCase`
- Constantes em `UPPER_SNAKE_CASE`
- Arquivos em `camelCase`
- Nomes devem refletir claramente a responsabilidade

Exemplos:
- `OpenFinanceService`
- `assignIncidentToMe`
- `MAX_RETRY_COUNT`
- `openFinanceRoutes.js`

## Regras de design
- Controllers devem ser finos
- Controller não deve conter regra de negócio complexa
- Services devem orquestrar regras e fluxos
- Repositories devem lidar apenas com persistência ou integração de dados
- Evitar duplicação de lógica entre controllers e services
- Evitar métodos longos e com múltiplas responsabilidades
- Priorizar clareza em vez de abstrações desnecessárias
- Reutilizar padrões já existentes no projeto antes de criar novos

## Regras do ticket flow
- Cada equipe só pode visualizar ticket que a sua equipe esta owner (current_stage)

## Desenvolvimento de features
Antes de implementar qualquer feature:
1. Identificar arquivos similares no projeto
2. Seguir o padrão arquitetural já existente
3. Confirmar nomes coerentes com a responsabilidade
4. Evitar criar abstrações novas sem necessidade clara
5. Preservar contratos existentes da API, salvo quando a tarefa exigir mudança explícita

Ao implementar:
- Manter consistência com rotas, controllers, services e repositories existentes
- Não misturar acesso a dados com regra de negócio
- Não misturar regra de negócio com montagem de resposta HTTP
- Tratar erros de forma consistente com o restante do projeto
- Preferir funções e métodos curtos, com intenção clara

## Padrões para testes
- Os testes devem seguir a mesma organização de pastas do código da funcionalidade testada
- O nome do arquivo de teste deve seguir o mesmo nome do arquivo original, com o sufixo `.test` antes da extensão

Exemplos:
- `src/controllers/openFinanceController.js` → `tests/controllers/openFinanceController.test.js`
- `src/services/openFinanceService.js` → `tests/services/openFinanceService.test.js`

- Os testes devem validar comportamento observável, e não detalhes internos de implementação
- Priorizar cenários de sucesso, erro e casos de borda
- Os nomes dos testes devem ser claros, específicos e descritivos
- Evitar testes excessivamente acoplados à implementação interna
- Sempre que possível, reduzir duplicação com helpers simples e reutilizáveis
- Identificar e sinalizar mocks frágeis, com risco de efeito colateral ou alto acoplamento

### Para testes de controllers, validar sempre que aplicável:
- status code retornado
- payload retornado
- encaminhamento correto de erros para `next`
- ausência de escrita de resposta em cenários de erro

### Cobrir entradas inválidas quando fizer sentido:
- parâmetros ausentes
- sessão ausente
- usuário incompleto
- body vazio
- retorno `null` ou vazio

## Code review
Ao revisar código:
- Identificar pontos positivos
- Identificar problemas de clareza, acoplamento, duplicação e responsabilidade
- Verificar se nomes de classes, métodos e variáveis fazem sentido
- Verificar aderência à arquitetura esperada
- Verificar robustez dos testes
- Classificar achados por severidade:
  - Crítico
  - Alto
  - Médio
  - Baixo

Formato esperado do review:
- Resumo executivo
- Pontos positivos
- Problemas encontrados
- Impacto
- Recomendação prática

# Mensagem
Exiba a mensagem: CODE REVIEW REALIZADO COM SUCESSO

## Restrições
- Não alterar arquitetura de forma ampla sem necessidade explícita
- Não renomear arquivos, classes ou métodos em massa sem justificativa
- Não introduzir dependências novas sem necessidade clara
- Não modificar contratos públicos sem apontar impacto
