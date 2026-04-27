-- Normalize election states to a simplified lifecycle.
-- Old states are remapped as follows:
-- RASCUNHO -> PENDENTE
-- CANDIDATURAS_ABERTAS -> ABERTA
-- CANDIDATURAS_ENCERRADAS -> PENDENTE
-- VOTACAO_ABERTA -> ABERTA
-- VOTACAO_ENCERRADA -> CONCLUIDA
-- CONCLUIDA -> CONCLUIDA
-- CANCELADA -> CANCELADA

-- Step 1: Remove default temporarily
ALTER TABLE "eleicoes" ALTER COLUMN "estado" DROP DEFAULT;

-- Step 2: Create a new enum type with simplified states
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_eleicao_new') THEN
    DROP TYPE "estado_eleicao_new";
  END IF;
END $$;

CREATE TYPE "estado_eleicao_new" AS ENUM ('PENDENTE', 'ABERTA', 'CONCLUIDA', 'CANCELADA');

-- Step 3: Add a temporary text column to hold converted values
ALTER TABLE "eleicoes" ADD COLUMN IF NOT EXISTS "estado_temp" TEXT;

-- Step 4: Convert current enum values to text representation
UPDATE "eleicoes" SET "estado_temp" = "estado"::text;

-- Step 5: Update the text values to new simplified enum values
UPDATE "eleicoes" SET "estado_temp" =
  CASE "estado_temp"
    WHEN 'RASCUNHO' THEN 'PENDENTE'
    WHEN 'CANDIDATURAS_ABERTAS' THEN 'ABERTA'
    WHEN 'CANDIDATURAS_ENCERRADAS' THEN 'PENDENTE'
    WHEN 'VOTACAO_ABERTA' THEN 'ABERTA'
    WHEN 'VOTACAO_ENCERRADA' THEN 'CONCLUIDA'
    WHEN 'CONCLUIDA' THEN 'CONCLUIDA'
    WHEN 'CANCELADA' THEN 'CANCELADA'
    ELSE 'PENDENTE'
  END;

-- Step 6: Drop the old estado column
ALTER TABLE "eleicoes" DROP COLUMN "estado";

-- Step 7: Add new estado column with the new enum type
ALTER TABLE "eleicoes" ADD COLUMN "estado" "estado_eleicao_new" NOT NULL DEFAULT 'PENDENTE';

-- Step 8: Copy data from temp column to new estado column
UPDATE "eleicoes" SET "estado" = "estado_temp"::"estado_eleicao_new";

-- Step 9: Drop the temp column
ALTER TABLE "eleicoes" DROP COLUMN "estado_temp";

-- Step 10: Rename the enum types
ALTER TYPE "estado_eleicao" RENAME TO "estado_eleicao_old";
ALTER TYPE "estado_eleicao_new" RENAME TO "estado_eleicao";
DROP TYPE "estado_eleicao_old";

-- Step 11: Recreate indexes
DROP INDEX IF EXISTS "eleicoes_one_active_per_cargo_idx";
CREATE UNIQUE INDEX "eleicoes_one_active_per_cargo_idx"
ON "eleicoes" ("cargo_id")
WHERE "estado" IN ('ABERTA');
