type StateChipColor = 'default' | 'success' | 'danger' | 'warning' | 'primary';

export const ELECTION_STATE_OPTIONS = [
  { value: 'PROGRAMADA', label: 'PROGRAMADA' },
  { value: 'ABERTA', label: 'ABERTA' },
  { value: 'CONCLUIDA', label: 'CONCLUÍDA' },
] as const;

export function getStateChipColor(value: string): StateChipColor {
  const normalized = value.trim().toUpperCase();

  if (['ABERTA', 'APROVADO', 'ATIVO', 'TRUE', 'JA_VOTOU', 'EM_USO'].includes(normalized)) {
    return 'success';
  }

  if (['CONCLUIDA', 'HISTORICO'].includes(normalized)) {
    return 'primary';
  }

  if (['CANCELADA', 'REJEITADO', 'INATIVO', 'FALSE'].includes(normalized)) {
    return 'danger';
  }

  if (['PROGRAMADA', 'PENDENTE', 'SUSPENSO', 'PLANEADO', 'SEM_ELEICOES'].includes(normalized)) {
    return 'warning';
  }

  return 'default';
}

export function formatStateLabel(value: string) {
  const labels: Record<string, string> = {
    ATIVO: 'ACTIVO',
    INATIVO: 'INACTIVO',
    CONCLUIDA: 'CONCLUÍDA',
    JA_VOTOU: 'JÁ VOTOU',
    SEM_ELEICOES: 'SEM ELEIÇÕES',
    EM_USO: 'EM USO',
    HISTORICO: 'HISTÓRICO',
  };

  return labels[value] ?? value.replaceAll('_', ' ');
}
