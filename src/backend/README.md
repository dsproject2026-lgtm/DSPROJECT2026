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

| Variável                         | Obrigatória | Descrição                                    |
| -------------------------------- | ----------- | -------------------------------------------- |
| `NODE_ENV`                       | não         | `development`, `test` ou `production`        |
| `PORT`                           | não         | Porta HTTP da API                            |
| `API_PREFIX`                     | não         | Prefixo das rotas HTTP                       |
| `CLIENT_URL`                     | não         | Origem permitida para CORS                   |
| `DATABASE_URL`                   | sim         | String de conexão PostgreSQL                 |
| `JWT_SECRET`                     | sim         | Segredo usado para assinar tokens JWT        |
| `SALT_ROUNDS`                    | não         | Custo do bcrypt para hash de senha           |
| `RATE_LIMIT_GLOBAL_MAX_REQUESTS` | não         | Limite global por IP                         |
| `RATE_LIMIT_GLOBAL_WINDOW_MS`    | não         | Janela do limite global em milissegundos     |
| `RATE_LIMIT_GLOBAL_BLOCK_MS`     | não         | Tempo de bloqueio global ao exceder o limite |
| `RATE_LIMIT_AUTH_MAX_REQUESTS`   | não         | Limite para rotas sensíveis de auth          |
| `RATE_LIMIT_AUTH_WINDOW_MS`      | não         | Janela para rotas de auth                    |
| `RATE_LIMIT_AUTH_BLOCK_MS`       | não         | Bloqueio para rotas de auth                  |
| `RATE_LIMIT_SSE_MAX_REQUESTS`    | não         | Limite de abertura de stream SSE por IP      |
| `RATE_LIMIT_SSE_WINDOW_MS`       | não         | Janela de rate limit para SSE                |
| `RATE_LIMIT_SSE_BLOCK_MS`        | não         | Bloqueio para abuso do stream SSE            |

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

## Base de dados e migrations

O schema Prisma está em [`prisma/schema.prisma`](./prisma/schema.prisma).

Fluxo recomendado:

1. Ajuste a `DATABASE_URL` no [`.env`](./.env).
2. Edite o schema em [`prisma/schema.prisma`](./prisma/schema.prisma).
3. Rode `npm run prisma:migrate:dev`.
4. Rode `npm run prisma:generate`.

O cliente Prisma gerado fica em [`src/generated/prisma`](./src/generated/prisma). Nao edite esses ficheiros manualmente.

## Endpoints atuais

| Método | Rota                        | Descrição          |
| ------ | --------------------------- | ------------------ |
| `GET`  | `/`                         | Root do backend    |
| `GET`  | `/api/v1`                   | Root da API        |
| `POST` | `/api/v1/auth/register`     | Registo de users   |
| `POST` | `/api/v1/auth/login/start`  | Início do login    |
| `POST` | `/api/v1/auth/login/finish` | Conclusão do login |
| `GET`  | `/api/v1/events/stream`     | Stream SSE         |
| `GET`  | `/api/v1/events/stats`      | Estatísticas SSE   |
| `GET`  | `/api/v1/health`            | Health overview    |
| `GET`  | `/api/v1/health/live`       | Liveness           |
| `GET`  | `/api/v1/health/ready`      | Readiness          |

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
2. `POST /api/v1/auth/login/finish` com `codigo`, `senha` e `loginFlowToken`

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
  "message": "Login flow started successfully.",
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
  "senha": "123456",
  "loginFlowToken": "..."
}
```

## Segurança

- `helmet` ativo por padrão
- `cors` configurado com `CLIENT_URL`
- `compression` ativo, com bypass para `text/event-stream`
- `morgan` ativo
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
