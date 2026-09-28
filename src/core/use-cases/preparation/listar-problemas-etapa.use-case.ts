import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';

/**
 * Caso de Uso: Listar Problemas Associados a uma Etapa (Subunidade 3.5B)
 * Retorna as entidades completas dos problemas de qualidade associados à etapa.
 */
export class ListarProblemasEtapaUseCase {
  constructor(
    private etapaRepo: IEtapaTransformacaoRepository,
    private problemasRepo: IProblemasQualidadeRepository
  ) {}

  async execute(etapaId: string): Promise<ProblemaQualidade[]> {
    if (!etapaId || etapaId.trim() === '') {
      throw new Error('ID da etapa é obrigatório.');
    }

    const problemaIds = await this.etapaRepo.listarProblemasPorEtapa(etapaId);
    if (problemaIds.length === 0) {
      return [];
    }

    const problemas: ProblemaQualidade[] = [];
    for (const pid of problemaIds) {
      const p = await this.problemasRepo.findById(pid);
      if (p) {
        problemas.push(p);
      }
    }

    return problemas;
  }
}
