-- AlterTable
ALTER TABLE "candidatos" ADD COLUMN "utilizador_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "candidatos_eleicao_id_utilizador_id_key" ON "candidatos"("eleicao_id", "utilizador_id");

-- AddForeignKey
ALTER TABLE "candidatos"
ADD CONSTRAINT "candidatos_utilizador_id_fkey"
FOREIGN KEY ("utilizador_id") REFERENCES "utilizadores"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
