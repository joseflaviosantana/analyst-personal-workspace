/**
 * src/core/use-cases/evidence/alterar-exposicao-evidencia.use-case.ts
 *
 * Caso de uso: Alterar Classificação de Exposição e Elegibilidade para Portfólio.
 *
 * Garante que dados confidenciais nunca sejam marcados inadvertidamente para exibição pública.
 */

import { EvidenciaAnalitica } from '@/core/domain/entities/evidencia-analitica';
import { ClassificacaoExposicaoEvidencia } from '@/core/domain/enums/classificacao-exposicao-evidencia';
import { IEvidenciaAnaliticaRepository } from '@/core/domain/repositories/evidencia-analitica-repository.interface';

export interface AlterarExposicaoEvidenciaInput {
  id: string;
  classificacao_exposicao: ClassificacaoExposicaoEvidencia;
  elegibilidade_portfolio?: boolean;
}

export class AlterarExposicaoEvidenciaUseCase {
  constructor(private readonly evidenciaRepo: IEvidenciaAnaliticaRepository) {}

  async execute(input: AlterarExposicaoEvidenciaInput): Promise<EvidenciaAnalitica> {
    if (!input.id || typeof input.id !== 'string') {
      throw new Error('ID da evidência é obrigatório para alterar classificação de exposição.');
    }

    const evidencia = await this.evidenciaRepo.findById(input.id);
    if (!evidencia) {
      throw new Error(`Evidência com ID "${input.id}" não encontrada.`);
    }

    const classificacaoValida = Object.values(ClassificacaoExposicaoEvidencia).includes(
      input.classificacao_exposicao
    );
    if (!classificacaoValida) {
      throw new Error(`Classificação de exposição inválida: "${input.classificacao_exposicao}".`);
    }

    // Regra de segurança inegociável
    let elegibilidadePortfolio =
      input.elegibilidade_portfolio !== undefined
        ? Boolean(input.elegibilidade_portfolio)
        : evidencia.elegibilidade_portfolio;

    if (
      input.classificacao_exposicao === ClassificacaoExposicaoEvidencia.CONFIDENCIAL &&
      elegibilidadePortfolio
    ) {
      throw new Error(
        'Evidência classificada como CONFIDENCIAL não pode ser elegível para portfólio.'
      );
    }

    const now = new Date().toISOString();

    const evidenciaAtualizada: EvidenciaAnalitica = {
      ...evidencia,
      classificacao_exposicao: input.classificacao_exposicao,
      elegibilidade_portfolio: elegibilidadePortfolio,
      atualizado_em: now,
    };

    return this.evidenciaRepo.update(evidenciaAtualizada);
  }
}
