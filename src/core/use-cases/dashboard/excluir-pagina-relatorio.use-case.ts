/**
 * src/core/use-cases/dashboard/excluir-pagina-relatorio.use-case.ts
 *
 * Caso de Uso: Exclusão de Página de Relatório (Subgate 3.4D)
 */

import { IPaginaRelatorioRepository } from '@/core/domain/repositories/pagina-relatorio-repository.interface';

export interface ExcluirPaginaRelatorioInput {
  id: string;
}

export interface ExcluirPaginaRelatorioOutput {
  success: boolean;
  id: string;
}

export class ExcluirPaginaRelatorioUseCase {
  constructor(private paginaRepo: IPaginaRelatorioRepository) {}

  async execute(input: ExcluirPaginaRelatorioInput): Promise<ExcluirPaginaRelatorioOutput> {
    if (!input.id || input.id.trim().length === 0) {
      throw new Error('ID da página é obrigatório para exclusão.');
    }

    const existente = await this.paginaRepo.findById(input.id);
    if (!existente) {
      throw new Error(`Página com ID "${input.id}" não encontrada.`);
    }

    await this.paginaRepo.delete(input.id);
    return { success: true, id: input.id };
  }
}
