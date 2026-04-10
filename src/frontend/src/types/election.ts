export interface ElectionSummary {
  id: string;
  titulo: string;
  estado: string;
  dataInicioVotacao?: string | null;
  dataFimVotacao?: string | null;
}
