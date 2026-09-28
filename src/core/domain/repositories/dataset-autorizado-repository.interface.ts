import { DatasetAutorizadoAnalise } from '../entities/dataset-autorizado-analise';

/**
 * Contrato de repositório para homologação e autorização de datasets para Modelagem e Análise (Subunidade 3.5A)
 */
export interface IDatasetAutorizadoRepository {
  findById(id: string): Promise<DatasetAutorizadoAnalise | null>;
  findVigenteByDemandId(demandaId: string): Promise<DatasetAutorizadoAnalise | null>;
  listarHistorico(demandaId: string): Promise<DatasetAutorizadoAnalise[]>;
  // Transação atômica SQLite: revoga a autorização VIGENTE anterior e insere a nova autorização
  autorizarTransacional(autorizacao: DatasetAutorizadoAnalise): Promise<DatasetAutorizadoAnalise>;
  revogar(id: string, motivo: string, timestamp: string): Promise<DatasetAutorizadoAnalise | null>;
}
