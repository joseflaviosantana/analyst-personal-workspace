import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';

export interface ListarProblemasFiltro {
  diagnosticoId?: string;
  ativoDadosId?: string;
  demandaId?: string;
}

export class ListarProblemasQualidadeUseCase {
  constructor(private problemasRepo: IProblemasQualidadeRepository) {}

  async execute(filtro: ListarProblemasFiltro): Promise<ProblemaQualidade[]> {
    if (filtro.diagnosticoId) {
      return this.problemasRepo.findByDiagnosticId(filtro.diagnosticoId);
    }
    if (filtro.ativoDadosId) {
      return this.problemasRepo.findByAssetId(filtro.ativoDadosId);
    }
    if (filtro.demandaId) {
      return this.problemasRepo.findByDemandId(filtro.demandaId);
    }
    return [];
  }
}
