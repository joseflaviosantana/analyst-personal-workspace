/**
 * src/core/domain/repositories/estudo-caso-portfolio-repository.interface.ts
 *
 * Contrato de repositório para Estudos de Caso de Portfólio (Subgate 3.9 — Aba 11).
 */

import { EstudoCasoPortfolio } from '../entities/estudo-caso-portfolio';

export interface IEstudoCasoPortfolioRepository {
  findByDemandId(demandaId: string): Promise<EstudoCasoPortfolio | null>;
  findById(id: string): Promise<EstudoCasoPortfolio | null>;
  save(casePortfolio: EstudoCasoPortfolio): Promise<EstudoCasoPortfolio>;
  update(id: string, partial: Partial<EstudoCasoPortfolio>): Promise<EstudoCasoPortfolio>;
  delete(id: string): Promise<void>;
}
