# 🚀 Como Iniciar o Gerador Ticket OpenFinance

## Ambientes Disponíveis

- **PRODUÇÃO**: `https://servicedesk.openfinancebrasil.org.br`
- **SANDBOX**: `https://servicedesksandbox.openfinancebrasil.org.br`

---

## Scripts NPM

### 🏢 PRODUÇÃO

```bash
# Modo production (usa .env)
npm start
# ou
npm run start:prod

# Modo desenvolvimento com auto-reload
npm run dev:prod
```

### 🧪 SANDBOX

```bash
# Modo sandbox (usa .env.sandbox)
npm run start:sandbox

# Modo desenvolvimento com auto-reload
npm run dev:sandbox
```

### 🧪 TESTES

```bash
npm test
```

---

## Variáveis de Ambiente

### Produção (`.env`)
```
OPEN_FINANCE_API_BASE_URL=https://servicedesk.openfinancebrasil.org.br
```

### Sandbox (`.env.sandbox`)
```
OPEN_FINANCE_API_BASE_URL=https://servicedesksandbox.openfinancebrasil.org.br
```

---

## Como Verificar Qual Ambiente Está Rodando

Ao iniciar a aplicação, procure nos logs por:

```json
{
  "message": "Open Finance API Request",
  "environment": "PRODUCTION",
  "endpoint": "https://servicedesk.openfinancebrasil.org.br/api/v1/..."
}
```

ou

```json
{
  "message": "Open Finance API Request",
  "environment": "SANDBOX/STAGING",
  "endpoint": "https://servicedesksandbox.openfinancebrasil.org.br/api/v1/..."
}
```

---

## Troubleshooting

### ❌ Erro: "Conectando em produção quando deveria ser sandbox"

**Solução**: Certifique-se de usar o comando correto:
- ✅ Correto: `npm run start:sandbox`
- ❌ Errado: `npm start` (isso usa produção)

### ❌ Erro: "Variáveis de ambiente não carregadas"

**Solução**: Verifique se os arquivos `.env` e `.env.sandbox` existem na raiz do projeto:
```bash
ls -la .env*
```

---

## Resumo Rápido

| Objetivo | Comando |
|----------|---------|
| Produção - production | `npm start` |
| Produção - dev | `npm run dev:prod` |
| Sandbox - production | `npm run start:sandbox` |
| Sandbox - dev | `npm run dev:sandbox` |
| Testes | `npm test` |
