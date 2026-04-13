-- Add suspended status to candidate state enum.
ALTER TYPE "estado_candidato" ADD VALUE IF NOT EXISTS 'SUSPENSO';
