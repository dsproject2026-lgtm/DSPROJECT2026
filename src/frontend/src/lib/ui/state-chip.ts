type StateChipColor = 'default' | 'success' | 'danger' | 'warning' | 'primary';

export function getStateChipColor(value: string): StateChipColor {
  const normalized = value.trim().toUpperCase();

  if (['ABERTA', 'APROVADO', 'ATIVO', 'TRUE', 'JA_VOTOU', 'EM_USO'].includes(normalized)) {
    return 'success';
  }

  if (['CONCLUIDA', 'ENCERRADA', 'HISTORICO'].includes(normalized)) {
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
