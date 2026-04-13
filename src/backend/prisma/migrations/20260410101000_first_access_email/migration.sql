-- AlterTable
ALTER TABLE "utilizadores"
ADD COLUMN "email" VARCHAR(255),
ADD COLUMN "must_set_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "password_setup_token_hash" TEXT,
ADD COLUMN "password_setup_token_expires_at" TIMESTAMPTZ;

-- CreateIndex
CREATE UNIQUE INDEX "utilizadores_email_key" ON "utilizadores"("email");
