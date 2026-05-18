CREATE TABLE "team" (
  "id" TEXT NOT NULL,
  "utilizador_id" TEXT NOT NULL,
  "nome" VARCHAR(150) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "perfil" "perfil" NOT NULL,
  "codigo" VARCHAR(50) NOT NULL,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "team_utilizador_id_key" ON "team"("utilizador_id");
CREATE UNIQUE INDEX "team_email_key" ON "team"("email");
CREATE UNIQUE INDEX "team_codigo_key" ON "team"("codigo");

ALTER TABLE "team"
  ADD CONSTRAINT "team_utilizador_id_fkey"
  FOREIGN KEY ("utilizador_id") REFERENCES "utilizadores"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
