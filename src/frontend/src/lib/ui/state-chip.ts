type StateChipColor = 'default' | 'success' | 'danger' | 'warning' | 'primary';

export const ELECTION_STATE_OPTIONS = [
  { value: 'PENDENTE', label: 'PENDENTE' },
  { value: 'ABERTA', label: 'ABERTA' },
  { value: 'CONCLUIDA', label: 'CONCLUIDA' },
  { value: 'CANCELADA', label: 'CANCELADA' },
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

  if (['PENDENTE', 'SUSPENSO', 'PLANEADO', 'SEM_ELEICOES'].includes(normalized)) {
    return 'warning';
  }

  return 'default';
}

export function formatStateLabel(value: string) {
  return value.replaceAll('_', ' ');
}
