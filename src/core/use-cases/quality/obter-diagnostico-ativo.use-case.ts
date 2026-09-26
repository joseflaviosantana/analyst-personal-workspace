import { IDiagnosticosQualidadeRepository } from '@/core/domain/repositories/diagnosticos-qualidade-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { DiagnosticoQualidade } from '@/core/domain/entities/diagnostico-qualidade';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';

export interface ObterDiagnosticoAtivoOutput {
  diagnostico: DiagnosticoQualidade | null;
  problemas: ProblemaQualidade[];
  historicoDiagnosticos: DiagnosticoQualidade[];
}

export class ObterDiagnosticoAtivoUseCase {
  constructor(
    private diagnosticosRepo: IDiagnosticosQualidadeRepository,
    private problemasRepo: IProblemasQualidadeRepository
  ) {}

  async execute(ativoDadosId: string): Promise<ObterDiagnosticoAtivoOutput> {
    const historico = await this.diagnosticosRepo.findByAssetId(ativoDadosId);
    const diagnosticoMaisRecente = historico.length > 0 ? historico[0] : null;

    let problemas: ProblemaQualidade[] = [];
    if (diagnosticoMaisRecente) {
      problemas = await this.problemasRepo.findByDiagnosticId(diagnosticoMaisRecente.id);
    }

    return {
      diagnostico: diagnosticoMaisRecente,
      problemas,
      historicoDiagnosticos: historico,
    };
  }
}
