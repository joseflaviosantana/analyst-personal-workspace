import { IRegrasQualidadeRepository } from '@/core/domain/repositories/regras-qualidade-repository.interface';
import { RegraQualidade } from '@/core/domain/entities/regra-qualidade';
import { StatusRegraQualidade } from '@/core/domain/enums/status-regra-qualidade';

export interface AlternarStatusRegraQualidadeInput {
  id: string;
  novoStatus?: StatusRegraQualidade; // Se omitido, alterna (toggle) para o status inverso
}

/**
 * AlternarStatusRegraQualidadeUseCase (V1 — Subunidade 3.4B)
 *
 * Gerencia o ciclo de vida formal da regra:
 * ATIVA --desativar--> INATIVA
 * INATIVA --reativar--> ATIVA
 *
 * Regra inegociável da V1: Não existe exclusão física de regras.
 * A transição de status preserva a versão atual e o histórico imutável.
 */
export class AlternarStatusRegraQualidadeUseCase {
  constructor(private regrasRepo: IRegrasQualidadeRepository) {}

  async execute(input: AlternarStatusRegraQualidadeInput): Promise<RegraQualidade> {
    const regra = await this.regrasRepo.findById(input.id);
    if (!regra) {
      throw new Error(`Regra de qualidade com ID "${input.id}" não encontrada.`);
    }

    const destinoStatus = input.novoStatus ?? (
      regra.status === StatusRegraQualidade.ATIVA
        ? StatusRegraQualidade.INATIVA
        : StatusRegraQualidade.ATIVA
    );

    if (destinoStatus === regra.status) {
      return regra;
    }

    const agora = new Date().toISOString();
    const regraAtualizada: RegraQualidade = {
      ...regra,
      status: destinoStatus,
      atualizado_em: agora,
    };

    await this.regrasRepo.update(regraAtualizada);
    return regraAtualizada;
  }
}
