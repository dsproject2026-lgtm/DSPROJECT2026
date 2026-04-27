export type ElectorElectionStatus = 'ACTIVA' | 'PROGRAMADA' | 'PARTICIPOU';

export interface ElectorElectionSummary {
  id: string;
  status: ElectorElectionStatus;
  title: string;
  desc: string;
  date: string;
  local: string;
  eleitorado: string;
  fase: string;
}

export const electorElectionsData: ElectorElectionSummary[] = [
  {
    id: '1',
    status: 'ACTIVA',
    title: 'Eleições AEUP 2026',
    desc: 'Associação de Estudantes da Universidade Pedagógica - Mandato Bienal.',
    date: '12 MAI - 14 MAI, 2026',
    local: 'Universidade Pedagógica de Maputo',
    eleitorado: 'Estudantes regulares elegíveis',
    fase: 'Votação em curso',
  },
  {
    id: '2',
    status: 'PROGRAMADA',
    title: 'Eleições AEUP 2026',
    desc: 'Associação de Estudantes da Universidade Pedagógica - Mandato Bienal.',
    date: '12 MAI - 14 MAI, 2026',
    local: 'Universidade Pedagógica de Maputo',
    eleitorado: 'Estudantes regulares elegíveis',
    fase: 'Aguardando início',
  },
  {
    id: '3',
    status: 'PARTICIPOU',
    title: 'Conselho Universitário',
    desc: 'Representantes de curso para o Conselho Geral da Gestão Universitária.',
    date: '20 JUN - 22 JUN, 2026',
    local: 'Faculdade de Ciências da Terra',
    eleitorado: 'Estudantes da faculdade',
    fase: 'Finalizada',
  },
];
