import { ModeloPowerBi, ModeloPowerBiCompleto } from '../entities/modelo-powerbi';

/**
 * Contrato de repositório para Modelos Power BI (Subunidade 3.7 / Bloco 7)
 */
export interface IModeloPowerBiRepository {
  findById(id: string): Promise<ModeloPowerBi | null>;
  findByDemandaId(demandaId: string): Promise<ModeloPowerBi[]>;
  findCompletoById(id: string): Promise<ModeloPowerBiCompleto | null>;
  create(modelo: ModeloPowerBi): Promise<ModeloPowerBi>;
  update(modelo: ModeloPowerBi): Promise<ModeloPowerBi>;
  delete(id: string): Promise<void>;
}
