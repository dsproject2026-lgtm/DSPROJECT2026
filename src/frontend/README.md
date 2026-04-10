# Frontend

Estrutura base com React + TailwindCSS + componentes no padrão shadcn/ui, organizada para ser simples de manter e reutilizar com o backend atual.

Documentação detalhada da arquitetura:

- `docs/ARCHITECTURE.md`

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
npm run typecheck
```

## Paleta Aplicada

Configuração feita com os tons fornecidos:

- `primary`: `#1A56DB`
- `primary-hover`: `#1647C0`
- `primary-light`: `#EBF2FF`
- `success`: `#057A55`
- `success-light`: `#DEF7EC`
- `danger`: `#C81E1E`
- `warning`: `#C27803`
- `text-primary`: `#111827`
- `text-secondary`: `#4B5563`
- `text-tertiary`: `#9CA3AF`
- `border`: `#E5E7EB`
- `bg-subtle`: `#F3F4F6`
- `bg`: `#F9FAFB`

## Estrutura

- `src/app`: providers e roteamento
- `src/api`: chamadas HTTP agrupadas por módulo
- `src/lib/http`: cliente único para `GET/POST/PATCH/DELETE`
- `src/lib/storage`: sessão (access token/refresh token/user)
- `src/components/ui`: componentes UI locais (`Button`, `Card`, `Chip`, `Spinner`, `Toast`)
- `src/features/auth`: telas de login por código, senha e primeiro acesso
- `src/features/dashboard`: tela inicial autenticada
- `src/features/elections`: listagem de eleições
- `src/components`: layouts e componentes comuns
- `src/styles`: CSS global e variáveis de tema
- `public/images`: imagens estáticas (ex.: `logo.svg`)

## UI No Projeto

Os componentes UI ficam centralizados em `src/components/ui`:

```ts
import { Button, Card, Chip, Spinner, toast } from '@/components/ui';
```

## Padronização Das APIs

Todas as chamadas usam `ApiClient`:

- injeta token automaticamente quando `auth: true`
- trata contrato de erro/sucesso padronizado do backend
- lança `ApiError` com `code`, `message`, `statusCode` e `details`

## Fluxo De Autenticação (Backend Atual)

1. `POST /auth/login/start` com `codigo`
2. se `nextStep = PASSWORD`, chama `POST /auth/login/finish`
3. se `nextStep = EMAIL_TOKEN`, chama `POST /auth/first-access/start`
4. conclui com `POST /auth/first-access/finish`
5. sessão autenticada com `accessToken + refreshToken`
