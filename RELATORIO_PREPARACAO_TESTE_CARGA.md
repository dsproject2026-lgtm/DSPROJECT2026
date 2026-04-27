
# ✅ RELATÓRIO DE PREPARAÇÃO PARA TESTE DE CARGA
**Data:** 15 Abril 2026  
**Projeto:** SIVOUP - Sistema de Votação Online  
**Status:** ⚠️ **PARCIALMENTE PREPARADO**

---

## 📊 RESUMO EXECUTIVO

| Aspecto | Status | Nota |
|--------|--------|------|
| **Transações Atômicas** | ✅ **SIM** | `prisma.$transaction` implementado para voto |
| **Rate Limiting** | ✅ **SIM** | Configurado globalmente |
| **Validações** | ✅ **SIM** | Zod + Service Layer |
| **Constrains BD** | ✅ **PARCIAL** | Índices presentes, faltam alguns |
| **Connection Pooling** | ⚠️ **REQUER CONFIG** | PrismaPg ativo, mas sem pool explícito |
| **Testes de Carga** | ❌ **NÃO** | Não está implementado |
| **Monitoramento** | ⚠️ **BÁSICO** | Morgan + logs de erro apenas |

**Recomendação:** ✅ **PROSSEGUIR COM CAUTELA** - O sistema tem proteções base, mas faltam otimizações.

---

## ✅ O QUE ESTÁ PRONTO

### 1. **Transações Atômicas para Votação**
```typescript
// ✅ CORRETO - Em votingRepository.ts:68
prisma.$transaction(async (tx) => {
  const vote = await tx.voto.create({...});      // 1. Criar voto
  await tx.elegivel.update({...});               // 2. Marcar votado
  const receipt = await tx.comprovativo.create({...}); // 3. Gerar recibo
  return { vote, receipt };
});
```
**Proteção contra:** Race conditions, voto duplo

---

### 2. **Rate Limiting Multi-Nível**

#### 🔴 **Global API**
- Limite: **120 requisições/minuto** por IP
- Bloqueio: **5 minutos**
- Proteção: DDoS básico

#### 🔴 **Auth** (Mais Restritivo)
- Limite: **5 requisições por 10 minutos** por IP
- Bloqueio: **30 minutos**
- Proteção: Força bruta em login

#### 🔴 **SSE Streaming**
- Limite: **10 requisições/minuto**
- Proteção: Evita sobrecarga de conexões

**Implementação:** 
```typescript
// middlewares/rate-limit.middleware.ts
export const apiRateLimitMiddleware = createRateLimitMiddleware(apiRateLimitConfig);
// Aplicado em app.ts:
app.use(env.API_PREFIX, apiRateLimitMiddleware, apiRoutes);
```

---

### 3. **Validação em Camadas**

#### Layer 1: Zod Schema (Input)
```typescript
const castVoteSchema = z.object({
  candidatoId: z.string().uuid('O candidatoId deve ser um UUID válido.'),
});
```

#### Layer 2: Service Rules
```typescript
// votingService.castVote():
✓ Eleição existe?
✓ Eleição está VOTACAO_ABERTA?
✓ Utilizador é elegível?
✓ Utilizador já votou? (critical)
✓ Candidato existe nesta eleição?
✓ Candidato é APROVADO?
```

#### Layer 3: BD Constraints
```prisma
model Elegivel {
  @@unique([eleicaoId, utilizadorId])  // 1 voting per user per election
}
model Voto {
  tokenAnonimo String @unique  // Cada voto é único
}
```

---

### 4. **Infraestrutura Express**

✅ **Helmet** - Headers de segurança
✅ **CORS** - Controle de origem
✅ **Compression** - Compressão gzip/brotli
✅ **Morgan** - Request logging
✅ **Error Handler** - Gestão centralizada de erros
✅ **Trust Proxy** - Para load balancers

```typescript
app.use(helmet());
app.use(compression({...}));
app.set('trust proxy', 1);
```

---

### 5. **Estrutura de Dados**

```
ELEICAO ──┬─→ CANDIDATO (estado: APROVADO)
          ├─→ ELEGIVEL (jaVotou: boolean) ◄─ KEY
          └─→ VOTO (tokenAnonimo: unique)
                  └─→ COMPROVATIVO (recibo anónimo)
```

**Indices presentes:**
```prisma
@@unique([eleicaoId, utilizadorId])    // Elegivel
@unique                                // tokenAnonimo (Voto)
@unique                                // codigoVerificacao (Comprovativo)
```

---

## ⚠️ O QUE FALTA OU NECESSITA MELHORIAS

### 1. **Connection Pooling Não Explícito**
```typescript
// ❌ ATUAL - sem pool explícito:
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL
});

// ✅ RECOMENDADO - com pool:
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL + '?schema=public&pool_size=20&max_lifetime=600'
  // Adicionar variáveis:
  // POSTGRES_POOL_MIN=5
  // POSTGRES_POOL_MAX=20
  // POSTGRES_POOL_IDLE_TIMEOUT=30000
});
```

**Impacto:** Sem pool explícito, com carga alta → **conexões exauridas**

---

### 2. **Indices de BD Incompletos**

#### ❌ Faltam otimizações críticas:
```sql
-- Adicionar ao schema:
model Elegivel {
  @@index([jaVotou])                    -- Verificar "já votou" rápido
  @@index([importadoEm])
}

model Voto {
  @@index([candidatoId])                -- Contar votos por candidato
  @@index([dataHora])                   -- Queries por período
}

model Candidato {
  @@index([eleicaoId, estado])          -- Buscar aprovados
}
```

**Impacto:** Sem índices → queries de contagem do resultado = **SLOW QUERIES**

---

### 3. **Falta Testes de Carga**
```
❌ Não existe:
- Testes de concorrência
- Simulação de múltiplos votos simultâneos
- Testes de stress
- Benchmark de resposta
```

**Impacto:** Não sabe qual é a capacidade real do sistema

---

### 4. **Monitoramento Limitado**
```typescript
// ⚠️ APENAS LOG de ERRO:
log: env.NODE_ENV === 'development' 
  ? ['warn', 'error'] 
  : ['error']

// ❌ FALTAM:
- Métricas de performance
- Alertas de contention
- Timeout configuráveis
- Circuit breaker pattern
```

---

### 5. **Falta Tratar Race Conditions em Campos Críticos**

### ❌ **PROBLEMA: Field "jaVotou" pode ter race condition ao verificar + atualizar**

O código atual está **inseguro** em cenário de **EXTREME concurrence**:

```typescript
// Sequência perigosa:
const eligibleVoter = await votingRepository.findEligibleVoter(electionId, userId);
if (eligibleVoter.jaVotou) {  // ← CHECK
  throw new AppError('Já votou');
}
// ← Entre aqui e o INSERT, outro request pode votar!

return prisma.$transaction(async (tx) => {
  const vote = await tx.voto.create({...});
  await tx.elegivel.update({...});  // ← UPDATE
});
```

**Solução:** Usar PostgreSQL `FOR UPDATE` lock:

```typescript
// ✅ CORRETO - Lock pessimista:
prisma.$transaction(async (tx) => {
  const eligible = await tx.$queryRaw`
    SELECT * FROM elegiveis 
    WHERE eleicao_id = ${electionId} 
    AND utilizador_id = ${userId} 
    FOR UPDATE;  -- LOCK!
  `;
  
  if (eligible.ja_votou) {
    throw new Error('Already voted');
  }
  
  // Agora é seguro:
  await tx.voto.create({...});
  await tx.elegivel.update({...});
});
```

---

### 6. **Sem Limite de Recursos por Utilizador**
```typescript
// ❌ Não há controle de:
- Máximo de requisições por utilizador em simultâneo
- Timeout de conexão
- Memory per request
- Query timeout
```

---

## 🚀 CHECKLIST PRE-TESTE DE CARGA

### Preparação (ANTES de testar)

- [ ] **1. Aumentar Pool de Conexões PostgreSQL**
  ```env
  DATABASE_URL="postgresql://user:pass@localhost/db?pool_size=25"
  ```

- [ ] **2. Adicionar Indices à BD**
  ```prisma
  model Elegivel {
    @@unique([eleicaoId, utilizadorId])
    @@index([jaVotou])
  }
  ```

- [ ] **3. Implementar Lock Pessimista**
  ```typescript
  // Em votingRepository.ts:
  prisma.$transaction(async (tx) => {
    const eligible = await tx.$queryRaw`
      SELECT * FROM elegiveis WHERE id = ${id} FOR UPDATE
    `;
    // ... resto do código
  });
  ```

- [ ] **4. Aumentar Limites de Rate Limit Para Teste**
  ```env
  # Temporário para teste:
  RATE_LIMIT_GLOBAL_MAX_REQUESTS=10000
  RATE_LIMIT_GLOBAL_WINDOW_MS=60000
  ```

- [ ] **5. Adicionar Metrics/Monitoramento**
  ```typescript
  // TODO: Integrar prometheus ou similar
  ```

- [ ] **6. Criar Script de Teste**
  ```bash
  # Simular N utilizadores votando
  npm run test:load
  ```

---

## 📈 TESTE DE CARGA RECOMENDADO

### **Fase 1: Teste Unitário de Concorrência**
```typescript
// Testar com múltiplos votos simultâneos
const testConcurrentVotes = async () => {
  const promises = Array(100).fill(0).map((_, i) =>
    votingService.castVote(electionId, `user-${i}`, { candidatoId })
  );
  
  const results = await Promise.all(promises);
  
  assert.equal(results.filter(r => r.data).length, 100, 'All 100 votes should be registered');
  
  // Verificar BD - não deve ter votos duplos
  const votosDuplicados = await prisma.$queryRaw`
    SELECT utilizador_id, COUNT(*) as cnt 
    FROM comprovativos 
    GROUP BY utilizador_id 
    HAVING COUNT(*) > 1
  `;
  
  assert.equal(votosDuplicados.length, 0, 'No duplicate votes allowed');
};
```

### **Fase 2: Teste com API HTTP**
```bash
# Usar k6, Artillery ou Apache Bench
k6 run load-test.js
# Simular 100 utilizadores simultâneos durante 30 segundos
```

### **Fase 3: Teste de Stress**
```bash
# Aumentar para 1000 utilizadores
# Monitorar:
# - CPU PostgreSQL
# - Memory leak em Node.js
# - Tempo de resposta
# - Taxa de erro
```

---

## 🔒 Checksum de Segurança

| Item | Status | Prioridade |
|------|--------|-----------|
| Transações atômicas | ✅ Implementado | - |
| Rate Limiting | ✅ Sim | - |
| Validação input | ✅ Sim | - |
| Lock pessimista | ❌ **CRÍTICO** | 🔴 **ALTA** |
| Pool de conexões | ⚠️ Padrão | 🟠 **MÉDIA** |
| Indices BD | ⚠️ Parcial | 🟠 **MÉDIA** |
| Monitoramento | ❌ Básico | 🟡 **BAIXA** |
| Timeout queries | ❌ Falta | 🟡 **BAIXA** |

---

## 📋 Conclusão

**Status Geral:** ⚠️ **PREPARE-SE PARA TESTE COM CAUTELA**

### ✅ **O sistema TEM:**
- Validações robustas
- Rate limiting
- Transações base
- Estrutura correta

### ❌ **O sistema PRECISA DE:**
1. **URGENTE:** Lock pessimista (FOR UPDATE)
2. **IMPORTANTE:** Pool de conexões aumentado
3. **IMPORTANTE:** Testes de concorrência
4. **DESEJÁVEL:** Índices otimizados

### Recomendação Final:
🔴 **NÃO FAZER teste com 1000+ utilizadores simultâneos até implementar o lock pessimista**

---

