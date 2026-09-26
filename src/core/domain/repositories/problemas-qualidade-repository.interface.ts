import { ProblemaQualidade } from '../entities/problema-qualidade';

/**
 * Contrato de repositório para persistência de Problemas de Qualidade (Subunidade 3.4A)
 */
export interface IProblemasQualidadeRepository {
  create(problema: ProblemaQualidade): Promise<ProblemaQualidade>;
  createMany(problemas: ProblemaQualidade[]): Promise<ProblemaQualidade[]>;
  findById(id: string): Promise<ProblemaQualidade | null>;
  findByDiagnosticId(diagnosticoId: string): Promise<ProblemaQualidade[]>;
  findByAssetId(ativoDadosId: string): Promise<ProblemaQualidade[]>;
  findByDemandId(demandaId: string): Promise<ProblemaQualidade[]>;
  update(id: string, data: Partial<ProblemaQualidade>): Promise<ProblemaQualidade | null>;
}
