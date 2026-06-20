ALTER TABLE "eleicoes"
ADD COLUMN "em_desempate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "candidatos_desempate" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "numero_rodada" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "votos"
ADD COLUMN "numero_rodada" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "comprovativos"
ADD COLUMN "numero_rodada" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX "votos_numero_rodada_idx" ON "votos"("numero_rodada");
CREATE INDEX "comprovativos_eleicao_id_numero_rodada_idx"
ON "comprovativos"("eleicao_id", "numero_rodada");
