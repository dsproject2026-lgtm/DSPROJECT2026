# Guia de Uso da API

Este documento mostra como consumir a API do backend em ambiente local.

## Base URL

- Backend local: `http://localhost:4000`
- Prefixo da API: `/api/v1`
- Base final: `http://localhost:4000/api/v1`

## Pré-requisitos

1. Configurar variáveis de ambiente em `.env` (base em `.env.example`).
2. Iniciar API:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate:dev
npm run dev
```

## Formato de respostas

Sucesso:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {},
  "meta": {
    "method": "GET",
    "path": "/api/v1/health",
    "timestamp": "2026-04-13T07:00:00.000Z",
    "statusCode": 200
  }
}
```

Erro:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "statusCode": 400,
    "details": {}
  },
  "meta": {
    "method": "POST",
    "path": "/api/v1/auth/login/start",
    "timestamp": "2026-04-13T07:00:00.000Z"
  }
}
```

## Autenticação

A API usa JWT Bearer nas rotas protegidas.

Header:

```http
Authorization: Bearer <accessToken>
```

Fluxo comum:

1. `POST /auth/login/start`
2. `POST /auth/login/finish`
3. Usar `accessToken` nas rotas protegidas
4. Renovar com `POST /auth/refresh` quando necessário

## Endpoints

### Health e eventos

| Método | Rota | Proteção |
| --- | --- | --- |
| GET | `/health` | pública |
| GET | `/health/live` | pública |
| GET | `/health/ready` | pública |
| GET | `/events/stream` | pública (rate limit SSE) |
| GET | `/events/stats` | autenticado |

### Auth

| Método | Rota | Proteção |
| --- | --- | --- |
| POST | `/auth/register` | pública |
| POST | `/auth/login/start` | pública |
| POST | `/auth/login/finish` | pública |
| POST | `/auth/refresh` | pública |
| POST | `/auth/logout` | pública |
| GET | `/auth/me` | autenticado |
| POST | `/auth/first-access/start` | pública |
| POST | `/auth/first-access/finish` | pública |
| POST | `/auth/password-recovery/start` | pública |
| POST | `/auth/password-recovery/finish` | pública |

### Cargos (positions)

| Método | Rota | Proteção |
| --- | --- | --- |
| GET | `/positions` | pública |
| GET | `/positions/:id` | pública |
| POST | `/positions` | `ADMIN` ou `GESTOR_ELEITORAL` |
| PUT | `/positions/:id` | `ADMIN` ou `GESTOR_ELEITORAL` |
| DELETE | `/positions/:id` | `ADMIN` |

### Eleições e votação

| Método | Rota | Proteção |
| --- | --- | --- |
| GET | `/elections` | pública |
| GET | `/elections/:id` | pública |
| POST | `/elections` | `GESTOR_ELEITORAL` |
| PATCH | `/elections/:id` | pública (estado atual da rota) |
| DELETE | `/elections/:id` | `GESTOR_ELEITORAL` |
| GET | `/elections/:electionId/ballot` | autenticado |
| POST | `/elections/:electionId/votes` | `CANDIDATO` ou `ELEITOR` |
| GET | `/elections/:electionId/votes/me/status` | autenticado |
| GET | `/elections/:electionId/results` | autenticado |

### Candidatos

| Método | Rota | Proteção |
| --- | --- | --- |
| GET | `/elections/:electionId/candidates` | pública |
| GET | `/elections/:electionId/candidates/:id` | pública |
| POST | `/elections/:electionId/candidates` | `GESTOR_ELEITORAL` |
| PATCH | `/elections/:electionId/candidates/:id` | `GESTOR_ELEITORAL` |
| PATCH | `/elections/:electionId/candidates/:id/approve` | `GESTOR_ELEITORAL` |
| PATCH | `/elections/:electionId/candidates/:id/reject` | `GESTOR_ELEITORAL` |
| PATCH | `/elections/:electionId/candidates/:id/suspend` | `GESTOR_ELEITORAL` |
| DELETE | `/elections/:electionId/candidates/:id` | `GESTOR_ELEITORAL` |

### Eleitores elegíveis

| Método | Rota | Proteção |
| --- | --- | --- |
| GET | `/elections/:electionId/eligible-voters` | `ADMIN`, `GESTOR_ELEITORAL`, `AUDITOR` |
| POST | `/elections/:electionId/eligible-voters/import-csv` | `ADMIN` ou `GESTOR_ELEITORAL` |

## Exemplos com curl

Assumindo:

```bash
BASE_URL="http://localhost:4000/api/v1"
```

### 1. Login em 2 passos

Iniciar:

```bash
curl -X POST "$BASE_URL/auth/login/start" \
  -H "Content-Type: application/json" \
  -d '{"codigo":"2026001"}'
```

Concluir (modo senha):

```bash
curl -X POST "$BASE_URL/auth/login/finish" \
  -H "Content-Type: application/json" \
  -d '{"codigo":"2026001","senha":"SenhaForte123","loginFlowToken":"SEU_LOGIN_FLOW_TOKEN"}'
```

### 2. Ver utilizador autenticado

```bash
curl "$BASE_URL/auth/me" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

### 3. Criar cargo

```bash
curl -X POST "$BASE_URL/positions" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Presidente do Conselho","descricao":"Cargo principal"}'
```

### 4. Criar eleição

```bash
curl -X POST "$BASE_URL/elections" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Eleição 2026","descricao":"Mandato 2026-2028","positionId":"ID_DO_CARGO"}'
```

### 5. Listar candidatos da eleição

```bash
curl "$BASE_URL/elections/ID_DA_ELEICAO/candidates"
```

### 6. Importar eleitores elegíveis por CSV

O corpo deve ser CSV puro (`text/csv`), por exemplo:

```csv
codigo,nome,email
2026001,Joao Silva,joao@exemplo.com
2026002,Maria Santos,maria@exemplo.com
```

Requisição:

```bash
curl -X POST "$BASE_URL/elections/ID_DA_ELEICAO/eligible-voters/import-csv" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: text/csv" \
  --data-binary @eleitores.csv
```

### 7. Votar

```bash
curl -X POST "$BASE_URL/elections/ID_DA_ELEICAO/votes" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"candidatoId":"ID_DO_CANDIDATO"}'
```

### 8. Consultar resultados

```bash
curl "$BASE_URL/elections/ID_DA_ELEICAO/results" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

## SSE (tempo real)

Abrir stream:

```bash
curl -N "$BASE_URL/events/stream"
```

Evento emitido quando um voto e registado:

```text
event: vote_cast
data: {"electionId":"...","candidateId":"...","votedAt":"...","receiptCode":"..."}
```

Uso recomendado no frontend:

1. Abrir `EventSource` em `/events/stream`.
2. Escutar `vote_cast`.
3. Ao receber evento da eleicao ativa, refazer `GET /elections/:id/results`.

Consultar estatísticas do stream:

```bash
curl "$BASE_URL/events/stats" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

## Observações importantes

1. Rotas de autenticação possuem rate limit específico.
2. O endpoint `PATCH /elections/:id` está exposto sem middleware de autenticação no estado atual do código.
3. `POST /eligible-voters/import-csv` aceita `text/csv` ou `text/plain` e limite de 1 MB.
