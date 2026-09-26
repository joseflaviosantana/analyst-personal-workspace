import { IRegrasQualidadeRepository } from '@/core/domain/repositories/regras-qualidade-repository.interface';
import { RegraQualidade } from '@/core/domain/entities/regra-qualidade';
import { StatusRegraQualidade } from '@/core/domain/enums/status-regra-qualidade';

export interface ListarRegrasQualidadeInput {
  ativoDadosId: string;
  status?: StatusRegraQualidade;
}

export class ListarRegrasQualidadeUseCase {
  constructor(private regrasRepo: IRegrasQualidadeRepository) {}

  async execute(input: ListarRegrasQualidadeInput): Promise<RegraQualidade[]> {
    if (!input.ativoDadosId || input.ativoDadosId.trim() === '') {
      throw new Error('O ID do ativo de dados é obrigatório para listar as regras de qualidade.');
    }

    return await this.regrasRepo.findByAssetId(input.ativoDadosId, input.status);
  }
}
