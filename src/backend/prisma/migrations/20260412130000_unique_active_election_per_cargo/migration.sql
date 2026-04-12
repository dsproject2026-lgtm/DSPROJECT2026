-- Ensure only one active election can exist per cargo at any moment.
CREATE UNIQUE INDEX "eleicoes_one_active_per_cargo_idx"
ON "eleicoes" ("cargo_id")
WHERE "estado" IN ('CANDIDATURAS_ABERTAS', 'VOTACAO_ABERTA');
