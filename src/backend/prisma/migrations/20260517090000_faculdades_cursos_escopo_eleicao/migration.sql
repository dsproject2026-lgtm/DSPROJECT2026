CREATE TABLE "faculdades" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    CONSTRAINT "faculdades_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "faculdade_id" TEXT NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "faculdades_nome_key" ON "faculdades"("nome");
CREATE UNIQUE INDEX "cursos_faculdade_id_nome_key" ON "cursos"("faculdade_id", "nome");

ALTER TABLE "cursos"
ADD CONSTRAINT "cursos_faculdade_id_fkey"
FOREIGN KEY ("faculdade_id") REFERENCES "faculdades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "utilizadores"
ADD COLUMN "faculdade_id" TEXT,
ADD COLUMN "curso_id" TEXT,
ADD COLUMN "ano" INTEGER;

ALTER TABLE "utilizadores"
ADD CONSTRAINT "utilizadores_faculdade_id_fkey"
FOREIGN KEY ("faculdade_id") REFERENCES "faculdades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "utilizadores"
ADD CONSTRAINT "utilizadores_curso_id_fkey"
FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "escopo_eleitores" AS ENUM ('TODOS', 'FACULDADE');

ALTER TABLE "eleicoes"
ADD COLUMN "faculdade_id" TEXT,
ADD COLUMN "escopo_eleitores" "escopo_eleitores" NOT NULL DEFAULT 'TODOS';

ALTER TABLE "eleicoes"
ADD CONSTRAINT "eleicoes_faculdade_id_fkey"
FOREIGN KEY ("faculdade_id") REFERENCES "faculdades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "eleicoes" ALTER COLUMN "estado" DROP DEFAULT;

CREATE TYPE "estado_eleicao_new" AS ENUM ('PROGRAMADA', 'ABERTA', 'CONCLUIDA');

ALTER TABLE "eleicoes" ADD COLUMN "estado_temp" TEXT;

UPDATE "eleicoes"
SET "estado_temp" =
  CASE "estado"::text
    WHEN 'PENDENTE' THEN 'PROGRAMADA'
    WHEN 'CANCELADA' THEN 'CONCLUIDA'
    ELSE "estado"::text
  END;

ALTER TABLE "eleicoes" DROP COLUMN "estado";
ALTER TABLE "eleicoes" ADD COLUMN "estado" "estado_eleicao_new" NOT NULL DEFAULT 'PROGRAMADA';
UPDATE "eleicoes" SET "estado" = "estado_temp"::"estado_eleicao_new";
ALTER TABLE "eleicoes" DROP COLUMN "estado_temp";

ALTER TYPE "estado_eleicao" RENAME TO "estado_eleicao_old";
ALTER TYPE "estado_eleicao_new" RENAME TO "estado_eleicao";
DROP TYPE "estado_eleicao_old";

DROP INDEX IF EXISTS "eleicoes_one_active_per_cargo_idx";
CREATE UNIQUE INDEX "eleicoes_one_active_per_cargo_idx"
ON "eleicoes" ("cargo_id")
WHERE "estado" IN ('ABERTA');
