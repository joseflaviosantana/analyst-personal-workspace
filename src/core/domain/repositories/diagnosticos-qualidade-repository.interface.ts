import { DiagnosticoQualidade } from '../entities/diagnostico-qualidade';
import { ProblemaQualidade } from '../entities/problema-qualidade';

/**
 * Contrato de repositório para persistência de Diagnósticos de Qualidade (Subunidade 3.4A)
 */
export interface IDiagnosticosQualidadeRepository {
  create(diagnostico: DiagnosticoQualidade): Promise<DiagnosticoQualidade>;
  update(id: string, data: Partial<DiagnosticoQualidade>): Promise<DiagnosticoQualidade | null>;
  findById(id: string): Promise<DiagnosticoQualidade | null>;
  findLatestByAssetId(ativoDadosId: string): Promise<DiagnosticoQualidade | null>;
  findByAssetId(ativoDadosId: string): Promise<DiagnosticoQualidade[]>;
  findByDemandId(demandaId: string): Promise<DiagnosticoQualidade[]>;
  salvarConclusaoTransacional(
    diagnosticoId: string,
    dadosUpdate: Partial<DiagnosticoQualidade>,
    problemas: ProblemaQualidade[]
  ): Promise<{ diagnostico: DiagnosticoQualidade; problemas: ProblemaQualidade[] }>;
}

