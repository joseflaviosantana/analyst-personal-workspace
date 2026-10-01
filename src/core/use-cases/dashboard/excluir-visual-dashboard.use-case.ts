/**
 * src/core/use-cases/dashboard/excluir-visual-dashboard.use-case.ts
 *
 * Caso de Uso: Exclusão de Visual do Dashboard (Subgate 3.4D)
 */

import { IVisualDashboardRepository } from '@/core/domain/repositories/visual-dashboard-repository.interface';

export interface ExcluirVisualDashboardInput {
  id: string;
}

export interface ExcluirVisualDashboardOutput {
  success: boolean;
  id: string;
}

export class ExcluirVisualDashboardUseCase {
  constructor(private visualRepo: IVisualDashboardRepository) {}

  async execute(input: ExcluirVisualDashboardInput): Promise<ExcluirVisualDashboardOutput> {
    if (!input.id || input.id.trim().length === 0) {
      throw new Error('ID do visual é obrigatório para exclusão.');
    }

    const existente = await this.visualRepo.findById(input.id);
    if (!existente) {
      throw new Error(`Visual do Dashboard com ID "${input.id}" não encontrado.`);
    }

    await this.visualRepo.delete(input.id);
    return { success: true, id: input.id };
  }
}
