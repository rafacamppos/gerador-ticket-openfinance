# Backlog Tecnico

## Objetivo
Construir um sistema de automacao de criacao de tickets para Open Finance, capaz de:
- consumir eventos de erro por API/CSV
- validar regras regulatorias e regras de criacao de ticket
- permitir triagem manual quando necessario
- criar tickets de forma padronizada no Service Desk
- manter rastreabilidade, auditoria e governanca

## Estado Atual
Ja existe uma base funcional com:
- backend Express 4
- autenticacao no portal Open Finance
- consulta de tickets e detalhe de ticket
- frontend Angular para login, listagem e consulta
- logging estruturado
- sessao HTTP local

O backlog abaixo cobre o escopo ainda faltante para transformar a base atual no produto completo.

## Criterios de Priorizacao
- `P0`: necessario para o fluxo core
- `P1`: necessario para operacao segura e escalavel
- `P2`: evolucao de eficiencia e inteligencia

## Epico 1: Modelagem do Dominio e Persistencia
Prioridade: `P0`

### Objetivo
Persistir o conhecimento de negocio necessario para classificacao, validacao, triagem e criacao automatica de tickets.

### Escopo
- modelar entidades centrais
- definir relacoes entre endpoint, categoria, template e campos
- criar persistencia para eventos, decisoes e execucoes

### Itens
1. Modelar a entidade `Endpoint`
Descricao:
- armazenar URL, metodo HTTP, nome da API, versao e categoria associada
- permitir uso da mesma API em multiplos endpoints

2. Modelar a entidade `Categoria`
Descricao:
- suportar hierarquia obrigatoria de 3 niveis
- armazenar nome canonico e eventuais aliases de classificacao

3. Modelar a entidade `Template`
Descricao:
- registrar identificador do template no Service Desk
- armazenar tipo do template e metadados de uso

4. Modelar a entidade `TemplateCampo`
Descricao:
- registrar nome funcional, nome tecnico da API, tipo, obrigatoriedade e regra de validacao

5. Modelar a entidade associativa `CategoriaTemplate`
Descricao:
- mapear qual template atende cada categoria
- suportar ordem, prioridade e regras obrigatorias de associacao

6. Modelar a entidade `EventoErro`
Descricao:
- armazenar o evento bruto recebido pela plataforma
- incluir origem, endpoint, payload bruto, headers e horario

7. Modelar a entidade `ValidacaoRegulatoria`
Descricao:
- registrar resultado da analise automatica das regras de negocio
- guardar regras avaliadas, status, justificativa e evidencias

8. Modelar a entidade `Triagem`
Descricao:
- armazenar fila, responsavel, status, decisao e justificativa

9. Modelar a entidade `ExecucaoCriacaoTicket`
Descricao:
- rastrear tentativa de criacao no service desk
- guardar request, response, retries e status final

10. Criar migrations iniciais do banco
Descricao:
- versionar schema
- permitir reproducao do ambiente em qualquer maquina

### Entregaveis
- DER inicial
- migrations SQL
- camada de acesso a dados
- seeds minimas para desenvolvimento

## Epico 2: Catalogo Regulatorio Versionado
Prioridade: `P0`

### Objetivo
Manter categorias, templates e campos regulatorios de forma versionada, reprodutivel e controlada por script/pipeline.

### Escopo
- carga versionada de categorias
- carga versionada de templates
- carga versionada de campos de template
- associacao categoria-template por script
- carga versionada de endpoints
- APIs read-only para consulta do catalogo

### Itens
1. Criar scripts idempotentes de carga de categorias
Descricao:
- carregar categorias de forma idempotente
- validar unicidade e consistencia dos 3 niveis

2. Criar scripts idempotentes de carga de templates
Descricao:
- carregar nome, tipo e identificador do service desk

3. Criar scripts idempotentes de carga de campos do template
Descricao:
- carregar obrigatoriedade, tipo, alias e regras

4. Criar scripts de associacao categoria-template
Descricao:
- vincular categorias a templates
- definir template padrao por categoria

5. Criar scripts de carga de endpoints
Descricao:
- manter catalogo de endpoints monitorados
- vincular endpoint a categoria

6. Criar APIs read-only de consulta do catalogo
Descricao:
- consultar categorias, templates, campos e endpoints sem permitir alteracao

7. Criar validacoes transacionais
Descricao:
- impedir template sem campos
- impedir categoria sem relacionamento minimo quando exigido

8. Criar controle de versao do catalogo
Descricao:
- registrar versao aplicada do catalogo
- permitir auditoria de quando o script/pipeline atualizou os dados

### Entregaveis
- scripts idempotentes de carga
- versao do catalogo persistida
- APIs read-only de consulta
- documentacao de atualizacao via script/pipeline

## Epico 3: Ingestao de Dados
Prioridade: `P0`

### Objetivo
Receber dados de erro de forma padronizada a partir de API e CSV.

### Escopo
- ingestao HTTP
- importacao CSV
- normalizacao para um evento canonico

### Itens
1. Criar endpoint de ingestao de erro por API
Descricao:
- receber payload com endpoint, contexto tecnico, severidade e evidencias
- validar esquema minimo

2. Criar importador CSV
Descricao:
- processar arquivo CSV
- mapear colunas para o modelo interno
- tratar falhas por linha

3. Criar normalizador de eventos
Descricao:
- transformar diferentes fontes em um contrato interno unico

4. Criar persistencia do evento bruto e evento normalizado
Descricao:
- garantir auditabilidade
- permitir reprocessamento

5. Criar deduplicacao basica
Descricao:
- evitar abertura repetida para o mesmo erro em janela configuravel

### Entregaveis
- pipeline de ingestao
- contrato canonico de evento
- armazenamento de payload bruto

## Epico 4: Motor de Validacao Regulatoria
Prioridade: `P0`

### Objetivo
Avaliar automaticamente se o erro observado realmente representa um caso aderente as regras do regulador.

### Escopo
- motor de regras
- avaliacao por endpoint/API/especificacao
- saida estruturada para triagem

### Itens
1. Definir contrato da regra de negocio
Descricao:
- entrada, condicao, severidade, justificativa, acao recomendada

2. Implementar executor de regras
Descricao:
- avaliar multiplas regras sobre um evento
- produzir resultado consolidado

3. Implementar classificacao de resultado
Descricao:
- `aprovado automaticamente`
- `necessita triagem`
- `rejeitado automaticamente`

4. Criar registro detalhado das regras avaliadas
Descricao:
- armazenar qual regra passou ou falhou
- manter motivacao e evidencias

5. Permitir evolucao de regras sem alterar o core
Descricao:
- externalizar configuracao sempre que viavel

### Entregaveis
- motor de regras
- relatorio de validacao
- auditoria por regra

## Epico 5: Motor de Criacao de Tickets
Prioridade: `P0`

### Objetivo
Gerar payloads corretos e padronizados para criacao do ticket no Service Desk.

### Escopo
- mapeamento categoria -> template
- consulta de campos obrigatorios
- composicao automatica do ticket
- retry e rastreabilidade

### Itens
1. Identificar categoria a partir do evento
Descricao:
- usar endpoint, regra e metadados do erro

2. Resolver template associado
Descricao:
- localizar template correto para a categoria

3. Buscar campos obrigatorios do template
Descricao:
- consultar catalogo local e, quando necessario, portal Open Finance

4. Criar montador do payload do ticket
Descricao:
- preencher titulo, descricao, categoria, contexto tecnico e campos customizados

5. Implementar validacao final antes do envio
Descricao:
- impedir envio com campos obrigatorios ausentes

6. Implementar retry automatico
Descricao:
- nova tentativa em falhas temporarias
- backoff controlado

7. Persistir request e response da criacao
Descricao:
- permitir auditoria e troubleshooting

### Entregaveis
- orquestrador de criacao
- validacao de payload
- historico de execucao

## Epico 6: Triagem Manual
Prioridade: `P0`

### Objetivo
Permitir decisao humana para casos ambigguos ou sensiveis.

### Escopo
- fila de triagem
- aprovacao/rejeicao
- justificativa obrigatoria
- rastreabilidade da decisao

### Itens
1. Criar status do workflow
Descricao:
- `recebido`
- `em validacao`
- `aguardando triagem`
- `aprovado`
- `rejeitado`
- `ticket criado`
- `falha na criacao`

2. Criar API de fila de triagem
Descricao:
- listar itens pendentes
- obter detalhes do caso

3. Criar API de decisao da triagem
Descricao:
- aprovar ou rejeitar
- exigir justificativa

4. Registrar evidencias da decisao
Descricao:
- regra regulatoria analisada
- impacto
- motivo da aprovacao/rejeicao

5. Acionar criacao automatica apos aprovacao
Descricao:
- encadear workflow sem acao manual adicional

### Entregaveis
- workflow de triagem
- trilha de auditoria
- APIs para frontend

## Epico 7: Frontend Operacional
Prioridade: `P1`

### Objetivo
Transformar o frontend atual em uma interface de operacao completa.

### Escopo
- manter login
- ampliar consultas
- adicionar triagem e administracao

### Itens
1. Finalizar tela de listagem de tickets
Descricao:
- filtros
- ordenacao
- paginacao backend ou frontend
- persistencia da consulta

2. Finalizar tela de detalhe do ticket
Descricao:
- exibir payload formatado
- exibir request/response tecnico
- suportar anexos e historico quando existirem

3. Criar tela de triagem
Descricao:
- fila pendente
- detalhe do caso
- acao de aprovar/rejeitar

4. Criar telas administrativas
Descricao:
- categorias
- templates
- campos
- endpoints

5. Criar fluxo de criacao manual assistida
Descricao:
- permitir montar ticket a partir de dados validados

6. Criar feedback visual operacional
Descricao:
- loading, erro, sucesso, estados vazios

### Entregaveis
- interface de operacao
- interface de triagem
- interface administrativa

## Epico 8: Seguranca e Controle de Acesso
Prioridade: `P1`

### Objetivo
Garantir acesso controlado, segregacao de responsabilidade e protecao de dados.

### Escopo
- autenticacao interna
- autorizacao por perfil
- protecao de dados sensiveis

### Itens
1. Definir papeis do sistema
Descricao:
- operador
- analista
- super usuario
- gestor
- administrador

2. Implementar RBAC
Descricao:
- limitar telas e acoes por perfil

3. Proteger segredos e credenciais
Descricao:
- remover segredos hardcoded do frontend
- armazenar credenciais do backend em configuracao segura

4. Sanear logs
Descricao:
- nao registrar senhas, cookies ou payloads sensiveis sem sanitizacao

5. Definir politica de sessao
Descricao:
- expiracao
- renovacao
- invalidacao

### Entregaveis
- middleware de autorizacao
- politica de sessao
- revisao de seguranca

## Epico 9: Observabilidade e Governanca
Prioridade: `P1`

### Objetivo
Permitir acompanhamento, troubleshooting e auditoria do fluxo completo.

### Escopo
- logs
- metricas
- dashboards
- trilha de auditoria

### Itens
1. Expandir logs estruturados
Descricao:
- correlacionar ingestao, validacao, triagem e criacao por `requestId` e `eventId`

2. Criar metricas operacionais
Descricao:
- erros recebidos
- validacoes executadas
- itens em triagem
- tickets criados
- falhas de criacao
- tempo medio por etapa

3. Criar dashboard operacional
Descricao:
- visibilidade do funil ponta a ponta

4. Criar trilha de auditoria
Descricao:
- quem fez o que
- quando
- com qual justificativa

### Entregaveis
- logs correlacionados
- metricas do fluxo
- dashboard e auditoria

## Epico 10: Resiliencia e Processamento Assincrono
Prioridade: `P1`

### Objetivo
Reduzir fragilidade operacional e suportar volume maior de processamento.

### Escopo
- filas
- jobs assincronos
- retry controlado
- dead-letter

### Itens
1. Introduzir fila de processamento
Descricao:
- desacoplar ingestao da criacao do ticket

2. Criar workers de validacao e criacao
Descricao:
- executar pipeline de forma assincrona

3. Implementar dead-letter queue
Descricao:
- reter eventos que falharam repetidamente

4. Implementar idempotencia
Descricao:
- evitar duplicacao de ticket em reprocessamentos

### Entregaveis
- arquitetura com fila
- workers resilientes
- estrategia de reprocessamento

## Epico 11: Qualidade e Testes
Prioridade: `P1`

### Objetivo
Garantir previsibilidade de mudancas e reduzir regressao.

### Escopo
- testes unitarios
- testes de integracao
- testes de contrato
- fixtures reais

### Itens
1. Cobrir motores de regra por teste unitario
Descricao:
- validar cada regra de negocio de forma isolada

2. Criar testes de integracao da pipeline
Descricao:
- ingestao -> validacao -> triagem -> criacao

3. Criar fixtures reais do portal Open Finance
Descricao:
- login
- ticket list
- ticket detail
- create/update

4. Criar testes de contrato frontend/backend
Descricao:
- garantir estabilidade do payload entre camadas

### Entregaveis
- suite automatizada
- fixtures versionadas
- cobertura minima acordada

## Epico 12: IA, Auto-Classificacao e RAG
Prioridade: `P2`

### Objetivo
Aumentar automacao e qualidade da classificacao com assistencia inteligente.

### Escopo
- sugestao de categoria/template
- auto-preenchimento
- base de conhecimento consultavel

### Itens
1. Criar base de conhecimento versionada
Descricao:
- regras regulatorias
- exemplos de tickets
- playbooks de triagem

2. Criar pipeline de embeddings e busca
Descricao:
- preparar o sistema para RAG

3. Implementar sugestao de categoria/template
Descricao:
- classificar evento com apoio de IA

4. Implementar sugestao de texto do ticket
Descricao:
- gerar descricao, causa e contexto tecnico

5. Criar feedback loop
Descricao:
- usar decisoes humanas para melhorar recomendacoes

### Entregaveis
- knowledge base
- servico de busca semantica
- assistente de classificacao

## Dependencias Entre Epicos
1. `Epico 1` antes de `Epico 2`, `3`, `4`, `5` e `6`
2. `Epico 2` antes de `Epico 5`
3. `Epico 3` antes de `Epico 4`
4. `Epico 4` antes de `Epico 6`
5. `Epico 6` antes do fluxo operacional completo
6. `Epico 8` e `9` devem evoluir em paralelo aos epicos core

## Plano de Entrega Recomendado

### Fase 1
- Epico 1
- Epico 2
- Epico 3

### Fase 2
- Epico 4
- Epico 5
- Epico 6

### Fase 3
- Epico 7
- Epico 8
- Epico 9

### Fase 4
- Epico 10
- Epico 11
- Epico 12

## Definicao de Pronto
Um item so deve ser considerado concluido quando:
- houver implementacao
- houver testes automatizados adequados
- houver log e tratamento de erro minimo
- houver documentacao suficiente para uso interno
- nao houver segredo sensivel exposto em codigo ou frontend

## Historias Detalhadas

### Epico 1: Modelagem do Dominio e Persistencia

#### H1.1 Criar schema inicial do dominio
Entregaveis:
- migrations para `endpoints`, `categorias`, `templates`, `template_campos`, `categoria_templates`
- constraints e chaves estrangeiras
Testavel:
- aplicar migration em banco limpo sem erro
- rollback funcionar
- constraints impedirem registros invalidos

#### H1.2 Criar schema operacional do fluxo
Entregaveis:
- migrations para `eventos_erro`, `validacoes_regulatorias`, `triagens`, `execucoes_criacao_ticket`
- enums ou tabelas de status
Testavel:
- persistir um evento completo com relacionamento valido
- consultar historico por `event_id`

#### H1.3 Implementar camada de repositorio
Entregaveis:
- repositorios para todas as entidades core
- testes de persistencia
Testavel:
- criar, ler, atualizar e listar entidades principais

#### H1.4 Criar seeds de desenvolvimento
Entregaveis:
- categorias base
- templates base
- endpoints base
Testavel:
- ambiente novo subir com dados minimos para fluxo manual

### Epico 2: Catalogo Regulatorio Versionado

#### H2.1 Script idempotente de categorias
Entregaveis:
- script de upsert de categorias
- validacao de unicidade dos 3 niveis
Testavel:
- aplicar o script duas vezes sem duplicar dados
- rejeitar categoria duplicada no mesmo lote

#### H2.2 Script idempotente de templates
Entregaveis:
- script de upsert de templates
- validacao de `service_desk_id`
Testavel:
- atualizar template existente sem duplicar registro
- rejeitar template inconsistente

#### H2.3 Script idempotente de campos de template
Entregaveis:
- script de upsert de campos
- suporte a obrigatorio, tipo e aliases
Testavel:
- reexecutar carga mantendo consistencia
- listar campos corretos por template

#### H2.4 Script de associacao categoria-template
Entregaveis:
- script de associacao
- suporte a template padrao
Testavel:
- categoria resolver template correto
- impedir vinculo inconsistente

#### H2.5 Script de carga de endpoints
Entregaveis:
- script de carga dos endpoints monitorados
- vinculo com categoria
Testavel:
- cadastrar endpoint com categoria
- consultar endpoint por URL/metodo

#### H2.6 APIs read-only de catalogo
Entregaveis:
- endpoints de consulta de categorias, templates, campos e endpoints
Testavel:
- listar catalogo sem permitir alteracao

#### H2.7 Controle de versao do catalogo
Entregaveis:
- persistencia da versao aplicada
- registro de data/hora da ultima atualizacao
Testavel:
- apos executar script/pipeline, a versao aplicada ficar registrada

### Epico 3: Ingestao de Dados

#### H3.1 Endpoint de ingestao HTTP
Entregaveis:
- rota de ingestao autenticada
- validacao de payload minimo
Testavel:
- aceitar payload valido
- rejeitar payload sem endpoint ou contexto minimo

#### H3.2 Importador CSV
Entregaveis:
- parser CSV
- relatorio por linha processada
Testavel:
- importar arquivo valido
- reportar linhas invalidas sem abortar tudo

#### H3.3 Normalizador de evento
Entregaveis:
- contrato canonico de evento
- mapper API -> evento canonico
- mapper CSV -> evento canonico
Testavel:
- duas fontes diferentes gerarem mesmo shape interno

#### H3.4 Persistencia de evento bruto e normalizado
Entregaveis:
- armazenamento do bruto
- armazenamento do normalizado
- correlacao entre ambos
Testavel:
- reprocessar evento a partir do payload bruto

#### H3.5 Deteccao basica de duplicidade
Entregaveis:
- regra configuravel de deduplicacao
- marcacao de evento duplicado
Testavel:
- mesmo erro dentro da janela nao gerar novo fluxo

### Epico 4: Motor de Validacao Regulatoria

#### H4.1 Definir modelo de regra
Entregaveis:
- estrutura de regra
- severidade
- justificativa
- acao recomendada
Testavel:
- carregar regra e validar contrato minimo

#### H4.2 Implementar executor de regras
Entregaveis:
- servico de avaliacao multipla
- resultado consolidado
Testavel:
- executar conjunto de regras em evento fixture

#### H4.3 Classificar resultado da validacao
Entregaveis:
- status `aprovado automaticamente`
- status `necessita triagem`
- status `rejeitado automaticamente`
Testavel:
- fixtures cobrirem os 3 resultados

#### H4.4 Auditar regras avaliadas
Entregaveis:
- persistencia da regra executada
- evidencia e justificativa
Testavel:
- consulta mostrar quais regras passaram/falharam

#### H4.5 Externalizar configuracao de regras
Entregaveis:
- leitura de regras fora do core
- mecanismo de versao
Testavel:
- alterar regra sem modificar servico principal

### Epico 5: Motor de Criacao de Tickets

#### H5.1 Resolver categoria do evento
Entregaveis:
- classificador por endpoint e metadados
Testavel:
- evento fixture resolver categoria esperada

#### H5.2 Resolver template da categoria
Entregaveis:
- lookup categoria -> template
Testavel:
- categoria vinculada retornar template correto

#### H5.3 Resolver campos obrigatorios
Entregaveis:
- consulta do catalogo local
- fallback opcional ao portal
Testavel:
- template retornar lista correta de obrigatorios

#### H5.4 Montar payload final do ticket
Entregaveis:
- mapper evento/categoria/template -> payload do service desk
Testavel:
- payload final conter todos os obrigatorios

#### H5.5 Validar payload antes do envio
Entregaveis:
- validador final de criacao
Testavel:
- bloquear envio com campo obrigatorio ausente

#### H5.6 Executar criacao com retry
Entregaveis:
- retry com backoff
- classificacao de erro temporario/permanente
Testavel:
- falha temporaria gerar nova tentativa
- falha permanente nao entrar em loop

#### H5.7 Persistir request e response
Entregaveis:
- trilha da tentativa de criacao
Testavel:
- consulta operacional mostrar request/response e status final

### Epico 6: Triagem Manual

#### H6.1 Definir workflow operacional
Entregaveis:
- estados e transicoes do fluxo
Testavel:
- nao permitir transicao invalida entre estados

#### H6.2 Criar fila de triagem
Entregaveis:
- API de listagem e detalhe
Testavel:
- listar itens pendentes e abrir detalhe

#### H6.3 Implementar aprovacao
Entregaveis:
- endpoint de aprovacao
- justificativa opcional/configuravel
Testavel:
- item aprovado seguir para criacao automatica

#### H6.4 Implementar rejeicao
Entregaveis:
- endpoint de rejeicao
- justificativa obrigatoria
Testavel:
- item rejeitado nao seguir para criacao

#### H6.5 Auditar a decisao
Entregaveis:
- persistencia de responsavel, data e motivo
Testavel:
- historico da triagem mostrar autor e justificativa

### Epico 7: Frontend Operacional

#### H7.1 Consolidar tela de consulta de tickets
Entregaveis:
- filtros
- paginacao
- persistencia de consulta
Testavel:
- consultar, paginar e voltar para lista sem perder estado

#### H7.2 Consolidar detalhe do ticket
Entregaveis:
- renderizacao completa do payload formatado
Testavel:
- abrir ticket por id e visualizar todos os blocos

#### H7.3 Criar tela de triagem
Entregaveis:
- lista de pendencias
- detalhe do caso
- botoes de aprovar/rejeitar
Testavel:
- aprovar/rejeitar pela UI com reflexo no backend

#### H7.4 Criar telas de consulta do catalogo
Entregaveis:
- telas de leitura de categorias, templates, campos e endpoints
Testavel:
- consultar catalogo completo pela UI

#### H7.5 Criar fluxo assistido de criacao manual
Entregaveis:
- wizard ou formulario assistido
Testavel:
- operador conseguir montar ticket com validacao visual

### Epico 8: Seguranca e Controle de Acesso

#### H8.1 Definir papeis e permissoes
Entregaveis:
- matriz de acesso
Testavel:
- documentacao e regras implementadas por perfil

#### H8.2 Implementar autorizacao backend
Entregaveis:
- middleware RBAC
Testavel:
- usuario sem permissao receber 403

#### H8.3 Remover segredos do frontend
Entregaveis:
- login sem credenciais hardcoded na UI
- configuracao segura no backend
Testavel:
- nenhum segredo sensivel versionado no frontend

#### H8.4 Sanear logs e sessao
Entregaveis:
- filtros de campos sensiveis
- expiracao e invalidacao de sessao
Testavel:
- senha/cookie nao aparecerem em log

### Epico 9: Observabilidade e Governanca

#### H9.1 Correlacionar logs ponta a ponta
Entregaveis:
- `requestId`, `eventId`, `ticketExecutionId`
Testavel:
- localizar todo o fluxo de um evento via ids

#### H9.2 Coletar metricas operacionais
Entregaveis:
- contadores e tempos por etapa
Testavel:
- metricas refletirem execucoes reais

#### H9.3 Dashboard operacional
Entregaveis:
- painel com funil e falhas
Testavel:
- operador visualizar status do pipeline

#### H9.4 Auditoria de acoes humanas
Entregaveis:
- trilha de quem aprovou, rejeitou ou executou atualizacao de catalogo
Testavel:
- consulta de auditoria por usuario e periodo

### Epico 10: Resiliencia e Processamento Assincrono

#### H10.1 Introduzir fila de processamento
Entregaveis:
- produtor e consumidor
Testavel:
- ingestao enfileirar e worker consumir

#### H10.2 Separar workers por etapa
Entregaveis:
- worker de validacao
- worker de criacao
Testavel:
- cada worker processar sua etapa isoladamente

#### H10.3 Criar dead-letter e reprocessamento
Entregaveis:
- fila de falha
- acao de reprocessar
Testavel:
- mensagem falha ir para DLQ e voltar ao fluxo quando reprocessada

#### H10.4 Garantir idempotencia
Entregaveis:
- chave idempotente por evento
Testavel:
- reprocessar o mesmo evento sem criar ticket duplicado

### Epico 11: Qualidade e Testes

#### H11.1 Cobrir motores de regra
Entregaveis:
- testes unitarios por regra
Testavel:
- regras criticas com cobertura automatizada

#### H11.2 Cobrir pipeline de integracao
Entregaveis:
- testes integrando ingestao, validacao, triagem e criacao
Testavel:
- fluxo feliz e fluxo de erro passarem

#### H11.3 Criar fixtures reais
Entregaveis:
- payloads reais anonimizados do portal
Testavel:
- testes usarem fixtures fieis ao ambiente real

#### H11.4 Testes de contrato frontend/backend
Entregaveis:
- asserts sobre payloads compartilhados
Testavel:
- quebra de contrato falhar CI

### Epico 12: IA, Auto-Classificacao e RAG

#### H12.1 Estruturar base de conhecimento
Entregaveis:
- base versionada de regras, exemplos e playbooks
Testavel:
- consulta recuperar documentos relevantes

#### H12.2 Preparar busca semantica
Entregaveis:
- chunks, embeddings e indice
Testavel:
- perguntas semelhantes retornarem contexto coerente

#### H12.3 Sugerir categoria e template
Entregaveis:
- servico de recomendacao
Testavel:
- sugestao ser apresentada com score e justificativa

#### H12.4 Sugerir preenchimento do ticket
Entregaveis:
- geracao assistida de descricao e contexto
Testavel:
- operador aceitar ou editar sugestao antes do envio

#### H12.5 Criar feedback loop
Entregaveis:
- captura de aceite/rejeicao das sugestoes
Testavel:
- decisao humana ficar registrada para evolucao futura
