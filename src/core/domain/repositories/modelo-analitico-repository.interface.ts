import { ModeloAnalitico, ModeloAnaliticoCompleto } from '../entities/modelo-analitico';

/**
 * Contrato de repositório para Modelos Analíticos (Subunidade 3.6A)
 */
export interface IModeloAnaliticoRepository {
  findById(id: string): Promise<ModeloAnalitico | null>;
  findByDemandaId(demandaId: string): Promise<ModeloAnalitico[]>;
  findHomologadoByDemandaId(demandaId: string): Promise<ModeloAnalitico | null>;
  findCompletoById(id: string): Promise<ModeloAnaliticoCompleto | null>;
  create(modelo: ModeloAnalitico): Promise<ModeloAnalitico>;
  update(modelo: ModeloAnalitico): Promise<ModeloAnalitico>;
  delete(id: string): Promise<void>;
  // Operação atômica transacional: revoga qualquer modelo homologado anterior e homologa o especificado
  homologarTransacional(
    id: string,
    homologadoPor: string,
    justificativa: string,
    timestamp: string
  ): Promise<ModeloAnalitico>;
  revogar(id: string, motivo: string, timestamp: string): Promise<ModeloAnalitico | null>;
}
