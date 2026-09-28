import { RelacionamentoAnalitico } from '../entities/relacionamento-analitico';

/**
 * Contrato de repositório para Relacionamentos Analíticos (Subunidade 3.6A)
 */
export interface IRelacionamentoAnaliticoRepository {
  findById(id: string): Promise<RelacionamentoAnalitico | null>;
  findByModeloId(modeloId: string): Promise<RelacionamentoAnalitico[]>;
  create(relacionamento: RelacionamentoAnalitico): Promise<RelacionamentoAnalitico>;
  update(relacionamento: RelacionamentoAnalitico): Promise<RelacionamentoAnalitico>;
  delete(id: string): Promise<void>;
}
