
# 🛠️ PLANO DE IMPLEMENTAÇÃO - PREPARAR PARA TESTE DE CARGA

## 1️⃣ IMPLEMENTAR LOCK PESSIMISTA (CRÍTICO)

### Problema Atual
```typescript
// ❌ INSEGURO: race condition entre check e update
const eligibleVoter = await votingRepository.findEligibleVoter(...);
if (eligibleVoter.jaVotou) throw new Error('Already voted');
// AQUI outro thread pode votuar antes da transação!
```

### Solução: FOR UPDATE Lock

**Arquivo:** `src/backend/src/repositories/voting.repository.ts`

```typescript
async castVote(params: { 
  electionId: string; 
  userId: string; 
  eligibleId: string; 
  candidateId: string 
}) {
  const receiptCode = `RCPT-${generateSecureToken().slice(0, 16).toUpperCase()}`;

  return prisma.$transaction(
    async (tx) => {
      // ✅ NOVO: Lock pessimista - garante que ninguém mais pode escrever
      const eligible = await tx.$queryRaw<any[]>`
        SELECT id, ja_votou FROM elegiveis 
        WHERE id = ${params.eligibleId} 
        AND eleicao_id = ${params.electionId}
        AND utilizador_id = ${params.userId}
        FOR UPDATE;
      `;

      if (!eligible || eligible.length === 0) {
        throw new Error('Eligible voter not found or removed');
      }

      if (eligible[0].ja_votou) {
        throw new Error('User already voted');
      }

      // Agora é seguro - lock garante exclusividade
      const vote = await tx.voto.create({
        data: {
          candidatoId: params.candidateId,
          tokenAnonimo: generateSecureToken(),
        },
        select: {
          id: true,
          candidatoId: true,
          dataHora: true,
        },
      });

      await tx.elegivel.update({
        where: { id: params.eligibleId },
        data: { jaVotou: true },
      });

      const receipt = await tx.comprovativo.create({
        data: {
          utilizadorId: params.userId,
          eleicaoId: params.electionId,
          codigoVerificacao: receiptCode,
        },
        select: {
          codigoVerificacao: true,
          emitidoEm: true,
        },
      });

      return { vote, receipt };
    },
    {
      isolationLevel: 'Serializable', // Máxima segurança
      maxWait: 5000,                   // Timeout 5s
      timeout: 30000,                  // Abort após 30s
    }
  );
}
```

---

## 2️⃣ ADICIONAR INDICES DE PERFORMANCE

**Arquivo:** `src/backend/prisma/schema.prisma`

```prisma
model Elegivel {
  id           String   @id @default(uuid())
  eleicaoId    String   @map("eleicao_id")
  utilizadorId String   @map("utilizador_id")
  jaVotou      Boolean  @default(false) @map("ja_votou")
  importadoEm  DateTime @default(now()) @map("importado_em") @db.Timestamptz

  eleicao    Eleicao    @relation(fields: [eleicaoId], references: [id])
  utilizador Utilizador @relation(fields: [utilizadorId], references: [id])

  @@unique([eleicaoId, utilizadorId])
  @@index([jaVotou])           // ✅ NEW: Para verificar votos rápido
  @@index([eleicaoId])         // ✅ NEW: Para queries por eleição
  @@index([utilizadorId])      // ✅ NEW: Para auditoria
  @@map("elegiveis")
}

model Voto {
  id           String   @id @default(uuid())
  candidatoId  String   @map("candidato_id")
  tokenAnonimo String   @unique @map("token_anonimo") @db.Text
  dataHora     DateTime @default(now()) @map("data_hora") @db.Timestamptz

  candidato Candidato @relation(fields: [candidatoId], references: [id])

  @@index([candidatoId])       // ✅ NEW: Contar votos por candidato
  @@index([dataHora])          // ✅ NEW: Queries por período
  @@map("votos")
}

model Candidato {
  id           String          @id @default(uuid())
  eleicaoId    String          @map("eleicao_id")
  utilizadorId String          @map("utilizador_id")
  registadoPor String?         @map("registado_por")
  nome         String          @db.VarChar(150)
  fotoUrl      String?         @map("foto_url") @db.Text
  biografia    String?         @db.Text
  proposta     String?         @db.Text
  estado       EstadoCandidato @default(PENDENTE)

  eleicao    Eleicao    @relation(fields: [eleicaoId], references: [id])
  utilizador Utilizador @relation("CandidaturaDoUtilizador", fields: [utilizadorId], references: [id])
  registador Utilizador? @relation("RegistadoPor", fields: [registadoPor], references: [id])
  votos      Voto[]

  @@unique([eleicaoId, utilizadorId])
  @@index([eleicaoId, estado])  // ✅ NEW: Buscar aprovados rápido
  @@map("candidatos")
}
```

### Criar Migration:
```bash
cd src/backend
npm run prisma:migrate:dev -- --name add_performance_indexes
```

---

## 3️⃣ CONFIGURAR POOL DE CONEXÕES

**Arquivo:** `src/backend/.env`

```env
# Adicionar estas variáveis:
DATABASE_URL="postgresql://postgres:admin@localhost:5432/dsproject2026?schema=public&pool_size=20"
POSTGRESQL_POOL_MIN=5
POSTGRESQL_POOL_MAX=20
POSTGRESQL_POOL_IDLE_TIMEOUT=30000
```

**Arquivo:** `src/backend/src/lib/prisma.ts`

```typescript
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { env } from '../config/env.js';

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalWithPrisma;

// ✅ NOVO: Pool explícito
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/postgres?schema=public&pool_size=20',
  // Pool strategy: 'optimized' (for production)
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

## 4️⃣ AUMENTAR RATE LIMITS PARA TESTE

**Arquivo:** `src/backend/.env` (TEMPORÁRIO - para testes)

```env
# Antes do teste, aumentar:
RATE_LIMIT_GLOBAL_MAX_REQUESTS=10000
RATE_LIMIT_GLOBAL_WINDOW_MS=60000
RATE_LIMIT_AUTH_MAX_REQUESTS=500
RATE_LIMIT_AUTH_WINDOW_MS=60000

# Depois de validar, voltar aos originais:
RATE_LIMIT_GLOBAL_MAX_REQUESTS=120
RATE_LIMIT_AUTH_MAX_REQUESTS=5
```

---

## 5️⃣ CRIAR TESTE DE CONCORRÊNCIA

**Arquivo:** `src/backend/tests/integration/voting-concurrent.test.ts`

```typescript
import { describe, it, beforeEach, expect } from 'vitest';
import { votingService } from '../../src/services/voting.service.js';
import { prisma } from '../../src/lib/prisma.js';

describe('Voting Concurrency Tests', () => {
  let electionId: string;
  let candidateId: string;
  let userIds: string[] = [];

  beforeEach(async () => {
    // Setup test data
    // ... criar eleição, candidatos, utilizadores
  });

  it('deve impedir voto duplo com 100 requisições simultâneas', async () => {
    const userId = 'test-user-1';
    
    // Simular 100 requisições do MESMO utilizador tentando votar
    const promises = Array(100).fill(0).map(() =>
      votingService.castVote(electionId, userId, { candidatoId })
        .catch(e => ({ error: e.message }))
    );

    const results = await Promise.all(promises);
    
    // Apenas 1 deve ter sucesso
    const successCount = results.filter(r => !r.error).length;
    const errorCount = results.filter(r => r.error).length;

    expect(successCount).toBe(1);
    expect(errorCount).toBe(99);

    // Verificar BD - apenas 1 voto criado
    const votes = await prisma.voto.findMany({
      where: {
        candidato: {
          eleicaoId,
        },
      },
    });

    const userVotes = votes.filter(v => 
      v.candidatoId === candidateId
    );
    
    expect(userVotes.length).toBe(1);
  });

  it('deve processar 1000 utilizadores diferentes votando', async () => {
    const votePromises = Array(1000).fill(0).map((_, i) =>
      votingService.castVote(electionId, `user-${i}`, { candidatoId })
        .catch(e => ({ error: e.message }))
    );

    const results = await Promise.all(votePromises);

    // Todos devem ter sucesso
    const successCount = results.filter(r => !r.error).length;
    expect(successCount).toBe(1000);

    // Verificar contagem em BD
    const totalVotes = await prisma.voto.count({
      where: {
        candidato: {
          eleicaoId,
        },
      },
    });

    expect(totalVotes).toBe(1000);
  });

  it('deve ter performance aceitável (<500ms por voto)', async () => {
    const startTime = Date.now();
    
    const promises = Array(100).fill(0).map((_, i) =>
      votingService.castVote(electionId, `perf-user-${i}`, { candidatoId })
    );

    await Promise.all(promises);
    
    const duration = Date.now() - startTime;
    const avgPerVote = duration / 100;

    console.log(`Total time: ${duration}ms, Avg per vote: ${avgPerVote}ms`);
    
    // Accept 500ms average
    expect(avgPerVote).toBeLessThan(500);
  });
});
```

### Executar teste:
```bash
npm run test:integration -- voting-concurrent
```

---

## 6️⃣ CRIAR TESTE DE CARGA COM K6

**Arquivo:** `src/backend/load-test.js` (ou `.ts` com transpilador)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuração do teste
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp-up a 100 usuarios
    { duration: '5m', target: 100 },   // Manter 100 usuarios
    { duration: '2m', target: 200 },   // Ramp-up a 200
    { duration: '5m', target: 200 },   // Manter 200
    { duration: '2m', target: 0 },     // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% das requisições < 500ms
    http_req_failed: ['rate<0.1'],     // Taxa de erro < 10%
  },
};

const BASE_URL = 'http://localhost:4000/api/v1';
const ELECTION_ID = 'test-election-id';
const CANDIDATE_ID = 'candidate-id';

export default function () {
  // 1. Autenticar
  const loginRes = http.post(`${BASE_URL}/auth/login/start`, {
    codigo: `user-${__VU}`,
    senha: 'password123',
  });

  const auth = JSON.parse(loginRes.body);
  const accessToken = auth.data.accessToken;

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  sleep(1);

  // 2. Obter boletim de voto
  const ballotRes = http.get(
    `${BASE_URL}/voting/${ELECTION_ID}/ballot`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  check(ballotRes, {
    'get ballot successful': (r) => r.status === 200,
  });

  sleep(1);

  // 3. Votar
  const voteRes = http.post(
    `${BASE_URL}/voting/${ELECTION_ID}/vote`,
    JSON.stringify({ candidatoId: CANDIDATE_ID }),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  check(voteRes, {
    'vote successful': (r) => r.status === 201,
    'vote response valid': (r) => {
      const body = JSON.parse(r.body);
      return body.data.receiptCode !== undefined;
    },
  });

  sleep(2);
}
```

### Executar teste:
```bash
# Instalar k6 (em Linux):
# sudo apt-get install k6

k6 run src/backend/load-test.js
```

---

## 7️⃣ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Implementar `FOR UPDATE` lock em `voting.repository.ts`
- [ ] Adicionar indices ao `schema.prisma`
- [ ] Executar migration: `npm run prisma:migrate:dev`
- [ ] Configurar pool de conexões no `.env`
- [ ] Criar teste de concorrência
- [ ] Executar testes: `npm run test:integration -- voting-concurrent`
- [ ] Criar script de teste de carga (k6)
- [ ] Executar teste de carga com 100 users
- [ ] Validar tempo de resposta < 500ms
- [ ] Validar taxa de erro < 10%
- [ ] Voltar limits de rate limit aos originais
- [ ] Deploy em staging para teste final

---

## 📋 Sequência Recomendada

### **Dia 1: Setup**
1. Implementar FOR UPDATE lock ✅
2. Adicionar indexes ✅
3. Executar migrations ✅

### **Dia 2: Unit Tests**
1. Rodar testes de concorrência ✅
2. Validar 0 votos duplos ✅
3. Validar performance ✅

### **Dia 3: Load Test**
1. Começar com 100 utilizadores ✅
2. Aumentar para 500 ✅
3. Validar até 2000 ✅

### **Dia 4: Stress Test**
1. Teste de limite máximo ✅
2. Monitorar recursos ✅
3. Documentar resultados ✅

---

