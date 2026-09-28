import { EntidadeAnalitica } from '../entities/entidade-analitica';

/**
 * Contrato de repositório para Entidades Analíticas (Subunidade 3.6A)
 */
export interface IEntidadeAnaliticaRepository {
  findById(id: string): Promise<EntidadeAnalitica | null>;
  findByModeloId(modeloId: string): Promise<EntidadeAnalitica[]>;
  create(entidade: EntidadeAnalitica): Promise<EntidadeAnalitica>;
  update(entidade: EntidadeAnalitica): Promise<EntidadeAnalitica>;
  delete(id: string): Promise<void>;
  createBatch(entidades: EntidadeAnalitica[]): Promise<EntidadeAnalitica[]>;
}
