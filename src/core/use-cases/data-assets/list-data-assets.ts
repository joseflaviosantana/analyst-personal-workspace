import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';

/**
 * Caso de Uso: Listar Ativos de Dados por Demanda
 */
export class ListDataAssetsUseCase {
  constructor(private ativoDadosRepo: IAtivoDadosRepository) {}

  async execute(demandaId: string): Promise<AtivoDados[]> {
    return this.ativoDadosRepo.findByDemandId(demandaId);
  }
}
