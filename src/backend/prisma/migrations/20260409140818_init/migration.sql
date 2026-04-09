-- CreateEnum
CREATE TYPE "estado_eleicao" AS ENUM ('RASCUNHO', 'CANDIDATURAS_ABERTAS', 'CANDIDATURAS_ENCERRADAS', 'VOTACAO_ABERTA', 'VOTACAO_ENCERRADA', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "perfil" AS ENUM ('ADMIN', 'GESTOR_ELEITORAL', 'AUDITOR', 'ELEITOR');

-- CreateEnum
CREATE TYPE "estado_candidato" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');

-- CreateTable
CREATE TABLE "cargos" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eleicoes" (
    "id" TEXT NOT NULL,
    "cargo_id" TEXT NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "estado" "estado_eleicao" NOT NULL DEFAULT 'RASCUNHO',
    "data_inicio_candidatura" TIMESTAMPTZ,
    "data_fim_candidatura" TIMESTAMPTZ,
    "data_inicio_votacao" TIMESTAMPTZ,
    "data_fim_votacao" TIMESTAMPTZ,

    CONSTRAINT "eleicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilizadores" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil" "perfil" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilizadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidatos" (
    "id" TEXT NOT NULL,
    "eleicao_id" TEXT NOT NULL,
    "registado_por" TEXT,
    "nome" VARCHAR(150) NOT NULL,
    "foto_url" TEXT,
    "biografia" TEXT,
    "proposta" TEXT,
    "estado" "estado_candidato" NOT NULL DEFAULT 'PENDENTE',

    CONSTRAINT "candidatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elegiveis" (
    "id" TEXT NOT NULL,
    "eleicao_id" TEXT NOT NULL,
    "utilizador_id" TEXT NOT NULL,
    "ja_votou" BOOLEAN NOT NULL DEFAULT false,
    "importado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "elegiveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votos" (
    "id" TEXT NOT NULL,
    "candidato_id" TEXT NOT NULL,
    "token_anonimo" TEXT NOT NULL,
    "data_hora" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comprovativos" (
    "id" TEXT NOT NULL,
    "utilizador_id" TEXT NOT NULL,
    "eleicao_id" TEXT NOT NULL,
    "codigo_verificacao" TEXT NOT NULL,
    "emitido_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comprovativos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "utilizador_id" TEXT,
    "accao" VARCHAR(100) NOT NULL,
    "entidade" VARCHAR(100),
    "entidade_id" UUID,
    "ip" VARCHAR(45),
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilizadores_codigo_key" ON "utilizadores"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "elegiveis_eleicao_id_utilizador_id_key" ON "elegiveis"("eleicao_id", "utilizador_id");

-- CreateIndex
CREATE UNIQUE INDEX "votos_token_anonimo_key" ON "votos"("token_anonimo");

-- CreateIndex
CREATE UNIQUE INDEX "comprovativos_codigo_verificacao_key" ON "comprovativos"("codigo_verificacao");

-- AddForeignKey
ALTER TABLE "eleicoes" ADD CONSTRAINT "eleicoes_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "cargos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidatos" ADD CONSTRAINT "candidatos_eleicao_id_fkey" FOREIGN KEY ("eleicao_id") REFERENCES "eleicoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidatos" ADD CONSTRAINT "candidatos_registado_por_fkey" FOREIGN KEY ("registado_por") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elegiveis" ADD CONSTRAINT "elegiveis_eleicao_id_fkey" FOREIGN KEY ("eleicao_id") REFERENCES "eleicoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elegiveis" ADD CONSTRAINT "elegiveis_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "utilizadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos" ADD CONSTRAINT "votos_candidato_id_fkey" FOREIGN KEY ("candidato_id") REFERENCES "candidatos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprovativos" ADD CONSTRAINT "comprovativos_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "utilizadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprovativos" ADD CONSTRAINT "comprovativos_eleicao_id_fkey" FOREIGN KEY ("eleicao_id") REFERENCES "eleicoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "utilizadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
