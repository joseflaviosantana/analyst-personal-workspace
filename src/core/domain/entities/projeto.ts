export type StatusProjeto = 'ATIVO' | 'PAUSADO' | 'CONCLUIDO' | 'CANCELADO';

export interface Projeto {
  id: string;
  nome: string;
  descricao: string | null;
  status: StatusProjeto;
  data_inicio: string | null;
  data_conclusao_prevista: string | null;
  data_conclusao_real: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface ProjetoComContadores extends Projeto {
  totalDemandas: number;
  demandasAtivas: number;
}
