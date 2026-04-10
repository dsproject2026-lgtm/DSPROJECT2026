# Arquitetura Do Frontend

Este documento explica como o `src/frontend` funciona com foco profundo em:

- chamadas de API;
- gestão de sessão;
- fluxo de autenticação;
- pontos de falha e comportamento esperado.

## 1. Objetivo Da Estrutura

A estrutura foi desenhada para:

- separar responsabilidades por camada (`api`, `features`, `components`, `lib`);
- centralizar regras de HTTP/autorização/erro em um único ponto;
- manter autenticação previsível (código -> senha ou primeiro acesso);
- reduzir acoplamento entre UI e backend;
- facilitar manutenção e evolução com equipe.

## 2. Visão Geral De Pastas

```text
src/
  app/
    providers/
    router/
  api/
  components/
    common/
    layout/
    ui/
  config/
  features/
    auth/
    dashboard/
    elections/
  lib/
    http/
    storage/
  styles/
  types/
```

Responsabilidade por pasta:

- `app`: entrada da aplicação (providers e roteamento).
- `api`: clientes de domínio (auth, elections, health).
- `components/common`: UI reutilizável sem regra de negócio.
- `components/layout`: layout e guarda de rota.
- `components/ui`: componentes UI locais no padrão shadcn.
- `features`: páginas e fluxo de negócio.
- `lib/http`: núcleo da comunicação HTTP.
- `lib/storage`: persistência da sessão do usuário.
- `types`: contratos de payloads e respostas.

## 3. Inicialização Da Aplicação

Fluxo de boot:

1. `main.tsx` monta React + Router.
2. `App.tsx` renderiza `AppRouter`.
3. `AppRouter` decide rotas públicas/privadas.
4. `ProtectedRoute` protege páginas privadas usando sessão local.

Arquivos principais:

- `src/main.tsx`
- `src/App.tsx`
- `src/app/router/AppRouter.tsx`
- `src/components/layout/ProtectedRoute.tsx`

## 4. Como O Roteamento Está Organizado

Rotas públicas:

- `/login`
- `/login/password`
- `/login/first-access`

Rotas protegidas:

- `/dashboard`
- `/elections`

Regras:

- `/` redireciona para `/login`;
- rota inválida redireciona para `/login`;
- rota protegida exige `accessToken` local.

## 5. Sessão E Autenticação Em Profundidade

### 5.1 Modelo de sessão salvo no navegador

A sessão salva no `localStorage` segue o tipo `LoginResult`:

```ts
{
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
  refreshTokenExpiresInSeconds: number;
  user: {
    id: string;
    codigo: string;
    nome: string;
    email?: string | null;
    perfil: 'ADMIN' | 'GESTOR_ELEITORAL' | 'AUDITOR' | 'ELEITOR';
    activo: boolean;
    mustSetPassword: boolean;
    createdAt: string;
  };
}
```

Chave usada no armazenamento:

- `dsproject2026.session`

Arquivo:

- `src/lib/storage/session-storage.ts`

### 5.2 Ciclo de vida da sessão

1. Sessão nasce após `finishLogin` ou `finishFirstAccess`.
2. `sessionStorageService.saveSession(session)` persiste o JSON.
3. A cada chamada autenticada, o token é lido por `getAccessToken()`.
4. `ProtectedRoute` usa token para permitir/recusar rota privada.
5. No logout, `clearSession()` remove sessão local.

Comportamento de robustez:

- se o JSON no `localStorage` estiver corrompido, `getSession()` remove o valor inválido e retorna `null`;
- isso evita quebra da aplicação por parse inválido.

### 5.3 Fluxo 1: Login por código e senha

Sequência real:

1. `CodeLoginPage` envia `codigo` -> `authApi.startLogin(codigo)`.
2. Backend retorna `nextStep`.
3. Se `nextStep = PASSWORD`, frontend navega para `/login/password?code=...&flow=...`.
4. `PasswordLoginPage` envia `codigo + senha + loginFlowToken` -> `authApi.finishLogin(...)`.
5. Backend retorna tokens + usuário.
6. Front salva sessão em `localStorage`.
7. Front redireciona para `/dashboard`.

### 5.4 Fluxo 2: Primeiro acesso (sem senha)

Sequência real:

1. Usuário envia `codigo` -> `authApi.startFirstAccess(codigo)`.
2. Backend dispara token por e-mail.
3. Usuário informa `token + novaSenha`.
4. Front chama `authApi.finishFirstAccess(codigo, token, novaSenha)`.
5. Backend retorna sessão completa.
6. Front salva sessão e redireciona para `/dashboard`.

### 5.5 Fluxo 3: Logout

Sequência real:

1. `AppShell` lê `refreshToken` da sessão.
2. Se existir, chama `authApi.logout(refreshToken)` para revogação no backend.
3. Mesmo se a chamada falhar, `clearSession()` é executado.
4. Front redireciona para `/login`.

Esse comportamento garante logout local consistente, mesmo quando a rede falha.

## 6. Chamadas De API Em Profundidade

### 6.1 Arquitetura da chamada

Fluxo padrão de qualquer chamada:

1. Página/feature chama função do domínio em `src/api/*`.
2. Essa função usa `apiClient` compartilhado.
3. `ApiClient` monta URL, método, headers e body.
4. `fetch` é executado.
5. Resposta JSON é lida.
6. `ApiClient` normaliza sucesso/erro.
7. Página recebe `data` ou captura `ApiError`.

Exemplo de cadeia real:

`PasswordLoginPage.handleSubmit` -> `authApi.finishLogin` -> `apiClient.post` -> `ApiClient.request` -> `fetch`.

### 6.2 O que cada camada faz

`src/api/auth.api.ts`:

- define payload e tipo de retorno;
- não lida com detalhes de fetch/headers/erro.

`src/api/http.ts`:

- instancia `ApiClient` com `baseUrl`;
- injeta fornecedor de token (`getAccessToken`).

`src/lib/http/ApiClient.ts`:

- possui métodos `get/post/patch/delete`;
- injeta `Content-Type: application/json`;
- injeta `Authorization` quando `auth: true`;
- serializa body com `JSON.stringify`;
- interpreta contrato de resposta;
- lança `ApiError` padronizado em erro.

### 6.3 Contrato de resposta esperado

Sucesso:

```ts
{
  success: true,
  message: string,
  data: T,
  meta: { method, path, timestamp, statusCode }
}
```

Erro:

```ts
{
  success: false,
  error: { code, message, statusCode, details? },
  meta: { method, path, timestamp }
}
```

Se o backend retornar algo fora desse formato, o front gera:

- `ApiError('Unexpected server error.', 'UNEXPECTED_ERROR', statusCode)`

### 6.4 Diferença entre chamada pública e autenticada

Chamada pública:

- `apiClient.get('/health')`
- sem header `Authorization`

Chamada autenticada:

- `apiClient.get('/elections', { auth: true })`
- `ApiClient` pega token e adiciona `Authorization: Bearer ...`

Se não existir token e mesmo assim `auth: true`, a requisição é enviada sem `Authorization` e backend deve responder `401/403`.

### 6.5 Como o erro chega na tela

Exemplo:

1. Backend retorna erro de negócio (`success: false`).
2. `ApiClient` converte em `throw new ApiError(...)`.
3. Página captura no `catch`.
4. Se `cause instanceof ApiError`, mostra `cause.message`.
5. Se não for `ApiError`, mostra mensagem genérica.

Isso mantém UX consistente sem duplicar parsing de erro em cada tela.

## 7. Endpoint Mapping

`src/api/endpoints.ts` centraliza caminhos:

- evita string hardcoded espalhada;
- simplifica renomear rota;
- mantém domínio organizado.

Exemplos:

- `endpoints.auth.loginStart`
- `endpoints.auth.refresh`
- `endpoints.elections.list`

## 8. Camada De UI (shadcn)

Os componentes UI são organizados em:

- `src/components/ui/index.ts`

Padrão de import:

```ts
import { Button, Card, Chip, Spinner, toast } from '@/components/ui';
```

Vantagem:

- ponto único de entrada da UI;
- componentes simples e previsíveis;
- toasts padronizados com `sonner`.

## 9. Sobre O Trecho Do Dashboard (Perfil)

Trecho:

```tsx
<p className="mt-1 font-semibold text-text-primary">{session?.user.nome ?? '-'}</p>
<Chip className="mt-3" color="success" size="sm" variant="soft">
  {session?.user.perfil ?? 'SEM PERFIL'}
</Chip>
```

Como isso se conecta com sessão/API:

- `session` vem de `sessionStorageService.getSession()`;
- dados vêm do login concluído (`finishLogin` ou `finishFirstAccess`);
- se sessão não existir, fallback (`-` e `SEM PERFIL`) evita UI quebrada.

## 10. Convenções Para Novos Módulos

Para novo domínio (ex.: `voters`):

1. Definir rotas em `src/api/endpoints.ts`.
2. Criar `src/api/voters.api.ts`.
3. Criar tipos em `src/types/voter.ts`.
4. Criar páginas em `src/features/voters/pages`.
5. Adicionar rota no `AppRouter`.
6. Se privada, envolver com `ProtectedRoute`.

Regra de ouro:

- feature não chama `fetch` direto;
- feature chama módulo em `src/api`;
- `src/api` usa sempre `ApiClient`.

## 11. Pontos Críticos De Segurança E Sessão

Estado atual:

- sessão em `localStorage` é funcional e simples;
- risco principal é exposição por XSS.

Medidas recomendadas para endurecer:

1. Sanitizar e validar qualquer conteúdo dinâmico renderizado.
2. Evitar `dangerouslySetInnerHTML`.
3. Adotar CSP (Content Security Policy) restritiva.
4. Implementar renovação automática com refresh token.
5. Adicionar logout forçado em `401` persistente.

## 12. Refresh Token: O Que Existe E O Que Falta

Hoje:

- endpoint existe (`/auth/refresh`);
- função existe em `authApi.refresh(refreshToken)`.

Ainda não existe:

- interceptação automática no `ApiClient` para renovar token ao receber `401`.

Comportamento recomendado:

1. Requisição autenticada recebe `401`.
2. `ApiClient` chama `/auth/refresh` com `refreshToken`.
3. Salva nova sessão.
4. Repete a requisição original uma única vez.
5. Se refresh falhar, limpa sessão e redireciona para login.

## 13. Sequências De Referência

### 13.1 Requisição autenticada bem-sucedida

```text
Tela -> electionsApi.list()
electionsApi -> apiClient.get('/elections', { auth: true })
ApiClient -> sessionStorageService.getAccessToken()
ApiClient -> fetch(... Authorization: Bearer token ...)
Backend -> { success: true, data: [...] }
ApiClient -> retorna data para a tela
Tela -> renderiza lista
```

### 13.2 Requisição autenticada com erro de negócio

```text
Tela -> apiClient.post(...)
Backend -> { success: false, error: { code, message, statusCode } }
ApiClient -> throw ApiError
Tela catch(ApiError) -> setError(message)
UI -> mostra mensagem amigável
```

### 13.3 Sessão local inválida (JSON quebrado)

```text
ProtectedRoute -> getAccessToken()
getAccessToken -> getSession()
getSession -> JSON.parse falha
sessionStorageService -> remove item inválido
ProtectedRoute -> sem token -> redireciona /login
```

## 14. Resumo Executivo

O projeto já tem uma base sólida para APIs e sessão:

1. `ApiClient` centraliza protocolo HTTP e tratamento de erro.
2. `sessionStorageService` centraliza persistência de sessão.
3. `features` só orquestram interação da tela.
4. `api/*` define contratos por domínio.
5. fluxo de autenticação já cobre senha e primeiro acesso.

Próximo passo de robustez:

- automatizar refresh token dentro do `ApiClient`.
