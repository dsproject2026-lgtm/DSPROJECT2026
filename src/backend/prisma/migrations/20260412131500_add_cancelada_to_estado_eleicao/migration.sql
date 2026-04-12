-- Add the new election state to the PostgreSQL enum.
ALTER TYPE "estado_eleicao" ADD VALUE IF NOT EXISTS 'CANCELADA';
