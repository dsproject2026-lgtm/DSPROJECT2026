# Backend

Backend em `Express + TypeScript + Prisma + SSE`, preparado para crescer com separação por camadas.

## Pré-requisitos

- Node.js `>= 20.19.0`
- PostgreSQL local ou remoto
- `npm`

## Stack

- Express 5
- TypeScript em modo `strict`
- Prisma 7 com `@prisma/adapter-pg`
- SSE para eventos em tempo real
- Morgan, Helmet, CORS e Compression
- Rate limiter próprio com sliding window e bloqueio temporário
- ESLint + Prettier + EditorConfig

## Estrutura

```text
backend/
  prisma/
  src/
    config/
    controllers/
    generated/
    lib/
    middlewares/
    repositories/
    routes/
    services/
    sse/
    types/
    utils/
```

## Variáveis de ambiente

Exemplo base em [`.env.example`](./.env.example).

| Variável                                | Obrigatória | Descrição                                    |
| --------------------------------------- | ----------- | -------------------------------------------- |
| `NODE_ENV`                              | não         | `development`, `test` ou `production`        |
| `PORT`                                  | não         | Porta HTTP da API                            |
| `API_PREFIX`                            | não         | Prefixo das rotas HTTP                       |
| `CLIENT_URL`                            | não         | Origem permitida para CORS                   |
| `DATABASE_URL`                          | sim         | String de conexão PostgreSQL                 |
| `JWT_SECRET`                            | sim         | Segredo usado para assinar tokens JWT        |
| `SALT_ROUNDS`                           | não         | Custo do bcrypt para hash de senha           |
| `SMTP_HOST`                             | não         | Host SMTP para envio de emails               |
| `SMTP_PORT`                             | não         | Porta SMTP                                   |
| `SMTP_SECURE`                           | não         | Usa TLS direto (`true`/`false`)              |
| `SMTP_USER`                             | não         | Utilizador SMTP                              |
| `SMTP_PASS`                             | não         | Senha/chave SMTP                             |
| `SMTP_FROM`                             | não         | Remetente padrão dos emails                  |
| `FIRST_ACCESS_TOKEN_EXPIRES_IN_SECONDS` | não         | Expiração do token de primeiro acesso        |
| `FIRST_ACCESS_URL`                      | não         | URL frontend para concluir primeiro acesso   |
| `PASSWORD_RECOVERY_URL`                 | não         | URL frontend para recuperação de senha       |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS`         | não         | Expiração do refresh token em dias           |
| `RATE_LIMIT_GLOBAL_MAX_REQUESTS`        | não         | Limite global por IP                         |
| `RATE_LIMIT_GLOBAL_WINDOW_MS`           | não         | Janela do limite global em milissegundos     |
| `RATE_LIMIT_GLOBAL_BLOCK_MS`            | não         | Tempo de bloqueio global ao exceder o limite |
| `RATE_LIMIT_AUTH_MAX_REQUESTS`          | não         | Limite para rotas sensíveis de auth          |
| `RATE_LIMIT_AUTH_WINDOW_MS`             | não         | Janela para rotas de auth                    |
| `RATE_LIMIT_AUTH_BLOCK_MS`              | não         | Bloqueio para rotas de auth                  |
| `RATE_LIMIT_SSE_MAX_REQUESTS`           | não         | Limite de abertura de stream SSE por IP      |
| `RATE_LIMIT_SSE_WINDOW_MS`              | não         | Janela de rate limit para SSE                |
| `RATE_LIMIT_SSE_BLOCK_MS`               | não         | Bloqueio para abuso do stream SSE            |

Notas:

- Se a senha do PostgreSQL tiver caracteres especiais como `@`, eles devem ser codificados na URL.
- Em desenvolvimento, o backend carrega o `.env` com override para evitar conflito com variáveis globais do sistema.

## Setup rápido

```bash
npm install
npm run prisma:generate
npm run prisma:migrate:dev
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run test
npm run test:unit
npm run test:integration
npm run test:watch
npm run lint
npm run lint:fix
npm run format
npm run format:write
npm run check
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:push
npm run prisma:pull
npm run prisma:studio
```

## Testes

O backend usa `Vitest` para testes unitários e de integração.

```bash
npm run test
npm run test:unit
npm run test:integration
```

Estrutura:

- `tests/unit`: testes unitários (ex.: utilitários de token e regras de serviço)
- `tests/integration`: testes de integração HTTP com `supertest` (rotas e middleware)

## Base de dados e migrations

O schema Prisma está em [`prisma/schema.prisma`](./prisma/schema.prisma).

Fluxo recomendado:

1. Ajuste a `DATABASE_URL` no [`.env`](./.env).
2. Edite o schema em [`prisma/schema.prisma`](./prisma/schema.prisma).
3. Rode `npm run prisma:migrate:dev`.
4. Rode `npm run prisma:generate`.

O cliente Prisma gerado fica em [`src/generated/prisma`](./src/generated/prisma). Nao edite esses ficheiros manualmente.

## Current Endpoints (Implemented)

### Authentication & Health

| Method | Route                              | Description                        |
| ------ | ---------------------------------- | ---------------------------------- |
| `GET`  | `/`                                | Raiz do backend                    |
| `GET`  | `/api/v1`                          | Raiz da API                        |
| `POST` | `/api/v1/auth/register`            | Registar utilizador                |
| `POST` | `/api/v1/auth/login/start`         | Iniciar fluxo de login             |
| `POST` | `/api/v1/auth/login/finish`        | Concluir fluxo de login            |
| `POST` | `/api/v1/auth/refresh`             | Renovar access token               |
| `POST` | `/api/v1/auth/logout`              | Revogar refresh token              |
| `GET`  | `/api/v1/auth/me`                  | Obter utilizador autenticado       |
| `POST` | `/api/v1/auth/first-access/start`  | Iniciar primeiro acesso            |
| `POST` | `/api/v1/auth/first-access/finish` | Concluir primeiro acesso           |
| `POST` | `/api/v1/auth/password-recovery/start`  | Iniciar recuperação de senha       |
| `POST` | `/api/v1/auth/password-recovery/finish` | Concluir recuperação de senha      |
| `GET`  | `/api/v1/events/stream`            | Abrir stream SSE                   |
| `GET`  | `/api/v1/events/stats`             | Obter estatísticas SSE (protegido) |
| `GET`  | `/api/v1/health`                   | Visão geral de saúde               |
| `GET`  | `/api/v1/health/live`              | Verificação de liveness            |
| `GET`  | `/api/v1/health/ready`             | Verificação de readiness           |

### Eleitores Elegíveis

| Method | Route                              | Description                        | Auth |
| ------ | ---------------------------------- | ---------------------------------- | ---- |
| `GET`  | `/api/v1/elections/:electionId/eligible-voters` | Listar eleitores elegíveis | ADMIN, GESTOR_ELEITORAL, AUDITOR |
| `POST` | `/api/v1/elections/:electionId/eligible-voters/import-csv` | Importar eleitores elegíveis (CSV) | ADMIN, GESTOR_ELEITORAL |

### Votação

| Method | Route                              | Description                        | Auth |
| ------ | ---------------------------------- | ---------------------------------- | ---- |
| `GET`  | `/api/v1/elections/:electionId/ballot` | Obter boletim de voto (candidatos) | ELEITOR, CANDIDATO |
| `POST` | `/api/v1/elections/:electionId/votes` | Registar voto | ELEITOR, CANDIDATO |
| `GET`  | `/api/v1/elections/:electionId/votes/me/status` | Verificar estado de voto do utilizador | ELEITOR, CANDIDATO |
| `GET`  | `/api/v1/elections/:electionId/results` | Obter resultados da eleição* | Autenticado |


### Cargos (Positions)

| Method | Route                              | Description                        | Auth |
| ------ | ---------------------------------- | ---------------------------------- | ---- |
| `GET`  | `/api/v1/positions`                | Listar cargos (todos)              | Público |
| `GET`  | `/api/v1/positions/:id`            | Obter cargo por ID                 | Público |
| `POST` | `/api/v1/positions`                | Criar cargo                        | ADMIN, GESTOR_ELEITORAL |
| `PUT`  | `/api/v1/positions/:id`            | Atualizar cargo                    | ADMIN, GESTOR_ELEITORAL |
| `DELETE` | `/api/v1/positions/:id`          | Remover cargo                      | ADMIN |

### Eleições (Elections)

| Method | Route                              | Description                        | Auth |
| ------ | ---------------------------------- | ---------------------------------- | ---- |
| `GET`  | `/api/v1/elections`                | Listar eleições (com filtros opcionais) | Público |
| `GET`  | `/api/v1/elections/:id`            | Obter eleição por ID               | Público |
| `POST` | `/api/v1/elections`                | Criar eleição                      | GESTOR_ELEITORAL |
| `PATCH`| `/api/v1/elections/:id`            | Atualizar eleição                  | GESTOR_ELEITORAL |
| `DELETE` | `/api/v1/elections/:id`          | Remover eleição                    | GESTOR_ELEITORAL |

### Candidatos (Candidates)

| Method   | Route                                                      | Description                        | Auth |
| -------- | ---------------------------------------------------------- | ---------------------------------- | ---- |
| `GET`    | `/api/v1/elections/:electionId/candidates`                 | Listar candidatos (com filtros)    | Público |
| `GET`    | `/api/v1/elections/:electionId/candidates/:id`             | Obter candidato por ID             | Público |
| `POST`   | `/api/v1/elections/:electionId/candidates`                 | Criar candidatura                  | GESTOR_ELEITORAL |
| `PATCH`  | `/api/v1/elections/:electionId/candidates/:id`             | Atualizar candidato                | GESTOR_ELEITORAL |
| `PATCH`  | `/api/v1/elections/:electionId/candidates/:id/approve`     | Aprovar candidato                  | GESTOR_ELEITORAL |
| `PATCH`  | `/api/v1/elections/:electionId/candidates/:id/reject`      | Rejeitar candidato                 | GESTOR_ELEITORAL |
| `PATCH`  | `/api/v1/elections/:electionId/candidates/:id/suspend`     | Suspender candidato                | GESTOR_ELEITORAL |
| `DELETE` | `/api/v1/elections/:electionId/candidates/:id`             | Remover candidato                  | GESTOR_ELEITORAL |

## Planned Domain Endpoints

| Method   | Route                                                      | Description                        |
| -------- | ---------------------------------------------------------- | ---------------------------------- |
| `PATCH`  | `/api/v1/elections/:id/status`                             | Atualizar estado da eleição        |
| `GET`    | `/api/v1/elections/:electionId/participation`              | Obter estatísticas de participação |
| `GET`    | `/api/v1/elections/:electionId/results/export`             | Exportar resultados (pdf/xlsx)     |
| `GET`    | `/api/v1/receipts/:verificationCode`                       | Verificar comprovativo de voto     |
| `GET`    | `/api/v1/audit-logs`                                       | Listar logs de auditoria           |
| `GET`    | `/api/v1/audit-logs/:id`                                   | Obter detalhe do log de auditoria  |
| `GET`    | `/api/v1/audit-logs/export`                                | Exportar logs de auditoria         |

## Contrato de sucesso

Todas as respostas HTTP de sucesso seguem este formato:

```json
{
  "success": true,
  "message": "Health overview loaded successfully.",
  "data": {
    "status": "ok"
  },
  "meta": {
    "method": "GET",
    "path": "/api/v1/health",
    "timestamp": "2026-04-09T16:41:38.932Z",
    "statusCode": 200
  }
}
```

Notas:

- `data` contém o payload real da rota.
- `meta.statusCode` replica o status HTTP devolvido.
- Em endpoints como readiness, o payload pode indicar estado degradado mesmo com resposta tratada pelo backend.

## Contrato de erro

Todas as respostas de erro seguem este formato:

```json
{
  "success": false,
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "Route /api/v1/x not found.",
    "statusCode": 404,
    "details": {},
    "stack": "..."
  },
  "meta": {
    "method": "GET",
    "path": "/api/v1/x",
    "timestamp": "2026-04-09T16:41:38.932Z"
  }
}
```

Notas:

- `details` só aparece quando existir contexto adicional, como validação.
- `stack` só aparece fora de produção.
- `INVALID_JSON`, `VALIDATION_ERROR`, `ROUTE_NOT_FOUND`, `RATE_LIMIT_EXCEEDED` e `INTERNAL_SERVER_ERROR` já estão tratados.

## Fluxo de login

O login é feito em dois passos:

1. `POST /api/v1/auth/login/start` com `codigo`
2. Se `nextStep = PASSWORD`, use `POST /api/v1/auth/login/finish` com `codigo`, `senha` e `loginFlowToken`
3. Se `nextStep = EMAIL_TOKEN`, use `POST /api/v1/auth/first-access/finish` com `codigo`, `token` e `novaSenha`

Exemplo de início:

```json
{
  "codigo": "2026001"
}
```

Resposta:

```json
{
  "success": true,
  "message": "Login flow initiated. Please provide your password.",
  "data": {
    "loginFlowToken": "...",
    "nextStep": "PASSWORD",
    "expiresInSeconds": 300
  },
  "meta": {}
}
```

Exemplo de conclusão:

```json
{
  "codigo": "2026001",
  "senha": "12345678",
  "loginFlowToken": "..."
}
```

Resposta de login concluído (ou primeiro acesso concluído):

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "accessTokenExpiresInSeconds": 43200,
    "refreshTokenExpiresInSeconds": 1209600,
    "user": {}
  },
  "meta": {}
}
```

## Fluxo de primeiro acesso por email

Para utilizadores importados (ex.: CSV), use:

1. `POST /api/v1/auth/first-access/start` com `codigo`
2. `POST /api/v1/auth/first-access/finish` com `codigo`, `token` e `novaSenha`

Pré-condições no utilizador:

- `mustSetPassword = true`
- `email` preenchido

Exemplo de início:

```json
{
  "codigo": "2026001"
}
```

Exemplo de conclusão:

```json
{
  "codigo": "2026001",
  "token": "token-recebido-no-email",
  "novaSenha": "SenhaForte123"
}
```

## Fluxo de recuperação de senha por email

Para utilizadores com senha já configurada:

1. `POST /api/v1/auth/password-recovery/start` com `codigo`
2. `POST /api/v1/auth/password-recovery/finish` com `codigo`, `token` e `novaSenha`

Exemplo de início:

```json
{
  "codigo": "2026001"
}
```

Exemplo de conclusão:

```json
{
  "codigo": "2026001",
  "token": "token-recebido-no-email",
  "novaSenha": "SenhaForte123"
}
```

## Refresh token

Renovação de sessão com rotação de refresh token:

1. `POST /api/v1/auth/refresh` com `refreshToken`
2. Guardar o novo `accessToken` e o novo `refreshToken`

Exemplo:

```json
{
  "refreshToken": "..."
}
```

Para terminar sessão:

1. `POST /api/v1/auth/logout` com `refreshToken`

## Fluxo de Votação

O processo de votação é dividido em 4 passos:

### 1. Importar Eleitores Elegíveis (ADMIN/GESTOR_ELEITORAL)

```bash
POST /api/v1/elections/:electionId/eligible-voters/import-csv
Authorization: Bearer <accessToken>
Content-Type: text/csv

codigo,nome
2026001,João Silva
2026002,Maria Santos
```

Resposta:

```json
{
  "success": true,
  "message": "Eleitores elegíveis importados com sucesso.",
  "data": {
    "imported": 2,
    "skipped": 0,
    "skippedItems": []
  },
  "meta": {}
}
```

### 2. Obter Boletim de Voto (ELEITOR/CANDIDATO)

Quando a eleição está em `VOTACAO_ABERTA`, o eleitor pode obter a lista de candidatos aprovados:

```bash
GET /api/v1/elections/:electionId/ballot
Authorization: Bearer <accessToken>
```

Resposta:

```json
{
  "success": true,
  "message": "Boletim de voto carregado com sucesso.",
  "data": {
    "election": {
      "id": "11111111-1111-4111-8111-111111111111",
      "titulo": "Eleição de Presidente",
      "estado": "VOTACAO_ABERTA",
      "dataInicioVotacao": "2026-04-13T10:00:00Z",
      "dataFimVotacao": "2026-04-13T18:00:00Z"
    },
    "candidates": [
      {
        "id": "22222222-2222-4222-8222-222222222222",
        "nome": "Candidato A",
        "estado": "APROVADO"
      },
      {
        "id": "33333333-3333-4333-8333-333333333333",
        "nome": "Candidato B",
        "estado": "APROVADO"
      }
    ]
  },
  "meta": {}
}
```

### 3. Registar Voto (ELEITOR/CANDIDATO)

O eleitor escolhe um candidato e registra o voto:

```bash
POST /api/v1/elections/:electionId/votes
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "candidatoId": "22222222-2222-4222-8222-222222222222"
}
```

Resposta:

```json
{
  "success": true,
  "message": "Voto registado com sucesso.",
  "data": {
    "receiptCode": "RCP-2026-01-ABC123",
    "votedAt": "2026-04-13T15:30:45.123Z",
    "electionId": "11111111-1111-4111-8111-111111111111",
    "candidateId": "22222222-2222-4222-8222-222222222222"
  },
  "meta": {}
}
```

### 4. Verificar Estado de Voto (ELEITOR/CANDIDATO)

Para confirmar que o voto foi registado:

```bash
GET /api/v1/elections/:electionId/votes/me/status
Authorization: Bearer <accessToken>
```

Resposta:

```json
{
  "success": true,
  "message": "Estado de voto carregado com sucesso.",
  "data": {
    "electionId": "11111111-1111-4111-8111-111111111111",
    "hasVoted": true,
    "votedAt": "2026-04-13T15:30:45.123Z",
    "receiptCode": "RCP-2026-01-ABC123"
  },
  "meta": {}
}
```

### 5. Obter Resultados da Eleição (Autenticado)

Os resultados apenas estão disponíveis quando a eleição está em estado `VOTACAO_ENCERRADA` ou `CONCLUIDA`:

```bash
GET /api/v1/elections/:electionId/results
Authorization: Bearer <accessToken>
```

Resposta de sucesso:

```json
{
  "success": true,
  "message": "Resultados da eleição carregados com sucesso.",
  "data": {
    "election": {
      "id": "11111111-1111-4111-8111-111111111111",
      "titulo": "Eleição de Presidente",
      "estado": "VOTACAO_ENCERRADA"
    },
    "summary": {
      "totalEligibleVoters": 150,
      "totalVotes": 120,
      "turnoutPercentage": 80.0
    },
    "candidates": [
      {
        "id": "22222222-2222-4222-8222-222222222222",
        "nome": "Candidato A",
        "estado": "APROVADO",
        "votes": 75,
        "percentage": 62.5
      },
      {
        "id": "33333333-3333-4333-8333-333333333333",
        "nome": "Candidato B",
        "estado": "APROVADO",
        "votes": 45,
        "percentage": 37.5
      }
    ],
    "winner": {
      "candidateId": "22222222-2222-4222-8222-222222222222",
      "nome": "Candidato A",
      "votes": 75
    }
  },
  "meta": {}
}
```

Resposta de erro (eleição ainda aberta):

```json
{
  "success": false,
  "error": {
    "code": "ELECTION_RESULTS_NOT_AVAILABLE",
    "message": "Os resultados desta eleição ainda não estão disponíveis.",
    "statusCode": 409,
    "details": {
      "electionId": "11111111-1111-4111-8111-111111111111",
      "estado": "VOTACAO_ABERTA"
    }
  },
  "meta": {}
}
```

## - Eleitores Elegíveis

Para testar a importação e listagem de eleitores elegíveis:

1. **Importe a collection**: [docs/postman/eligible-voters.postman_collection.json](./docs/postman/eligible-voters.postman_collection.json)
2. **Importe o environment**: [docs/postman/eligible-voters.postman_environment.json](./docs/postman/eligible-voters.postman_environment.json)

Variáveis do environment:

| Variável | Valor Padrão | Descrição |
| ---- | ---- | ---- |
| `baseUrl` | `http://localhost:4000` | URL base do backend |
| `accessToken` | `<placeholder>` | Access token obtido após login bem-sucedido |
| `electionId` | `11111111-1111-4111-8111-111111111111` | ID de uma eleição existente |

Exemplo com `curl`:

```bash
# Listar eleitores elegíveis
curl -X GET "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111/eligible-voters" \
  -H "Authorization: Bearer <accessToken>"

# Importar eleitores do CSV
curl -X POST "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111/eligible-voters/import-csv" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: text/csv" \
  --data-binary @- <<EOF
codigo,nome
2026001,João Silva
2026002,Maria Santos
EOF
```

## - Votação

Para testar o fluxo completo de votação:

Exemplos com `curl`:

```bash
# 1. Obter boletim de voto
curl -X GET "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111/ballot" \
  -H "Authorization: Bearer <accessToken>"

# 2. Registar voto
curl -X POST "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111/votes" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "candidatoId": "22222222-2222-4222-8222-222222222222"
  }'

# 3. Verificar estado de voto
curl -X GET "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111/votes/me/status" \
  -H "Authorization: Bearer <accessToken>"

# 4. Obter resultados (apenas quando eleição fechada)
curl -X GET "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111/results" \
  -H "Authorization: Bearer <accessToken>"
```

##  Cargos (Positions)

Para testar os endpoints de cargos:

```bash
# Listar todos os cargos
curl -X GET "http://localhost:4000/api/v1/positions"

# Obter cargo por ID
curl -X GET "http://localhost:4000/api/v1/positions/11111111-1111-4111-8111-111111111111"

# Criar cargo (requer autenticação)
curl -X POST "http://localhost:4000/api/v1/positions" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Presidente",
    "descricao": "Presidente da associação de estudantes"
  }'

# Atualizar cargo (requer autenticação)
curl -X PUT "http://localhost:4000/api/v1/positions/11111111-1111-4111-8111-111111111111" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Presidente",
    "descricao": "Presidente da associação de estudantes - mandato 2026"
  }'

# Remover cargo (requer autenticação - ADMIN)
curl -X DELETE "http://localhost:4000/api/v1/positions/11111111-1111-4111-8111-111111111111" \
  -H "Authorization: Bearer <accessToken>"
```

## - Eleições (Elections)

Para testar os endpoints de eleições:

```bash
# Listar todas as eleições (com filtros opcionais)
curl -X GET "http://localhost:4000/api/v1/elections"
curl -X GET "http://localhost:4000/api/v1/elections?estado=VOTACAO_ABERTA"
curl -X GET "http://localhost:4000/api/v1/elections?cargoId=11111111-1111-4111-8111-111111111111"

# Obter eleição por ID
curl -X GET "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111"

# Criar eleição (requer GESTOR_ELEITORAL)
curl -X POST "http://localhost:4000/api/v1/elections" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "cargoId": "11111111-1111-4111-8111-111111111111",
    "titulo": "Eleição para Presidente 2026",
    "descricao": "Eleição anual para presidente da associação",
    "dataInicioCandidatura": "2026-04-15T08:00:00Z",
    "dataFimCandidatura": "2026-04-20T18:00:00Z",
    "dataInicioVotacao": "2026-04-25T08:00:00Z",
    "dataFimVotacao": "2026-04-25T18:00:00Z"
  }'

# Atualizar eleição (requer GESTOR_ELEITORAL)
curl -X PATCH "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Eleição para Presidente 2026 - Atualizado",
    "estado": "CANDIDATURAS_ABERTAS"
  }'

# Remover eleição (requer GESTOR_ELEITORAL)
curl -X DELETE "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111" \
  -H "Authorization: Bearer <accessToken>"
```

## Postman - Candidatos (Candidates)

Para testar os endpoints de candidatos:

```bash
# Listar candidatos de uma eleição
curl -X GET "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111/candidates"
curl -X GET "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111/candidates?estado=APROVADO"

# Obter candidato por ID
curl -X GET "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111/candidates/22222222-2222-4222-8222-222222222222"

# Criar candidatura (requer GESTOR_ELEITORAL)
curl -X POST "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111/candidates" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "utilizadorId": "33333333-3333-4333-8333-333333333333",
    "nome": "João Silva",
    "biografia": "Estudante do 3º ano, dedicado à representação estudantil",
    "proposta": "Melhorar a qualidade das refeições no refeitório e ampliar o horário da biblioteca"
  }'

# Atualizar candidato (requer GESTOR_ELEITORAL)
curl -X PATCH "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111/candidates/22222222-2222-4222-8222-222222222222" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "biografia": "Estudante do 3º ano de Engenharia Informática",
    "proposta": "Melhorar a qualidade das refeições no refeitório"
  }'

# Aprovar candidato (requer GESTOR_ELEITORAL)
curl -X PATCH "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111/candidates/22222222-2222-4222-8222-222222222222/approve" \
  -H "Authorization: Bearer <accessToken>"

# Rejeitar candidato (requer GESTOR_ELEITORAL)
curl -X PATCH "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111/candidates/22222222-2222-4222-8222-222222222222/reject" \
  -H "Authorization: Bearer <accessToken>"

# Suspender candidato (requer GESTOR_ELEITORAL)
curl -X PATCH "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111/candidates/22222222-2222-4222-8222-222222222222/suspend" \
  -H "Authorization: Bearer <accessToken>"

# Remover candidato (requer GESTOR_ELEITORAL)
curl -X DELETE "http://localhost:4000/api/v1/elections/11111111-1111-4111-8111-111111111111/candidates/22222222-2222-4222-8222-222222222222" \
  -H "Authorization: Bearer <accessToken>"
```

## Segurança

- `helmet` ativo por padrão
- `cors` configurado com `CLIENT_URL`
- `compression` ativo, com bypass para `text/event-stream`
- `morgan` ativo
- middleware JWT bearer para rotas protegidas
- access token de curta duração + refresh token com rotação
- rate limiting próprio com algoritmo de sliding window
- bloqueio temporário após exceder o limite
- headers `RateLimit-*`, `X-RateLimit-*` e `Retry-After`
- políticas separadas para API global, auth e SSE

Notas:

- O limiter atual é em memória e funciona muito bem em instância única.
- Se o backend for escalado horizontalmente, o armazenamento do limiter deve ser movido para Redis ou outro store partilhado.

## SSE

O backend usa Server-Sent Events via HTTP. O stream principal está em `GET /api/v1/events/stream`.

Comportamento atual:

- abre uma conexão `text/event-stream`
- envia `retry: 10000`
- envia um evento inicial `connected`
- mantém a conexão viva com heartbeat em comentário SSE
- expõe estatísticas em `GET /api/v1/events/stats`

Implementação em [`src/sse/sse.service.ts`](./src/sse/sse.service.ts).

Exemplo no frontend:

```ts
const eventSource = new EventSource('http://localhost:4000/api/v1/events/stream', {
  withCredentials: true,
});

eventSource.addEventListener('connected', (event) => {
  const payload = JSON.parse(event.data);
  console.log(payload);
});

eventSource.onerror = (error) => {
  console.error('SSE connection error', error);
};
```

Exemplo de evento inicial:

```text
event: connected
data: {"success":true,"message":"SSE stream connected successfully.","data":{"clientId":"...","connectedAt":"...","retryInMs":10000,"transport":"sse"},"meta":{"method":"GET","path":"/api/v1/events/stream","timestamp":"...","statusCode":200}}
```

## Validação local

Para validar o backend localmente:

```bash
npm run check
npm run dev
```

Se quiser validar o estado da base:

```bash
npx prisma migrate status
```
