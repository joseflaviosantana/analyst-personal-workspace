/**
 * src/core/use-cases/portfolio/obter-estudo-caso-demanda.use-case.ts
 *
 * Consulta o estudo de caso de portfólio associado a uma demanda (Subgate 3.9 — Aba 11).
 */

import { IEstudoCasoPortfolioRepository } from '@/core/domain/repositories/estudo-caso-portfolio-repository.interface';
import { EstudoCasoPortfolio } from '@/core/domain/entities/estudo-caso-portfolio';

export interface ObterEstudoCasoDemandaInput {
  demandaId: string;
}

export class ObterEstudoCasoDemandaUseCase {
  constructor(private caseRepo: IEstudoCasoPortfolioRepository) {}

  async execute(input: string | ObterEstudoCasoDemandaInput): Promise<EstudoCasoPortfolio | null> {
    const demandaId = typeof input === 'string' ? input : input.demandaId;
    return this.caseRepo.findByDemandId(demandaId);
  }
}
