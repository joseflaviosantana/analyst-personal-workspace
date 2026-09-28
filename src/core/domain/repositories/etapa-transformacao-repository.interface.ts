import { EtapaTransformacao } from '../entities/etapa-transformacao';

/**
 * Contrato de repositório para persistência de Etapas de Transformação e Vínculos de Qualidade (Subunidade 3.5A)
 */
export interface IEtapaTransformacaoRepository {
  findById(id: string): Promise<EtapaTransformacao | null>;
  findByReceitaId(receitaId: string): Promise<EtapaTransformacao[]>;
  create(etapa: EtapaTransformacao): Promise<EtapaTransformacao>;
  update(id: string, dados: Partial<EtapaTransformacao>): Promise<EtapaTransformacao | null>;
  reordenar(receitaId: string, ordens: { id: string; ordem: number }[]): Promise<void>;

  // Anti-Deleção Histórica:
  // Se for rascunho (PLANEJADA) e sem dependências downstream, permite remoção física.
  // Se já foi EXECUTADA ou VALIDADA, deve ser cancelada auditadamente.
  deleteDraftOnly(id: string): Promise<boolean>;
  cancelar(id: string, justificativa: string): Promise<EtapaTransformacao | null>;

  // Associação N:M com Problemas de Qualidade
  vincularProblema(etapaId: string, problemaId: string): Promise<void>;
  desvincularProblema(etapaId: string, problemaId: string): Promise<void>;
  listarProblemasPorEtapa(etapaId: string): Promise<string[]>; // Retorna IDs dos problemas
  listarEtapasPorProblema(problemaId: string): Promise<string[]>; // Retorna IDs das etapas
}
