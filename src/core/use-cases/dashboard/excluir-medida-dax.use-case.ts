/**
 * src/core/use-cases/dashboard/excluir-medida-dax.use-case.ts
 *
 * Caso de Uso: Exclusão de Medida DAX (Subgate 3.4C)
 *
 * Responsabilidade:
 * - Localizar a medida existente e verificar sua pertinência;
 * - Executar a remoção física no SQLite Local-First;
 * - Retornar confirmação determinística de remoção.
 */

import { IMedidaDaxRepository } from '@/core/domain/repositories/medida-dax-repository.interface';

export interface ExcluirMedidaDaxInput {
  id: string;
}

export interface ExcluirMedidaDaxOutput {
  success: boolean;
  id: string;
}

export class ExcluirMedidaDaxUseCase {
  constructor(private medidaDaxRepo: IMedidaDaxRepository) {}

  async execute(input: ExcluirMedidaDaxInput): Promise<ExcluirMedidaDaxOutput> {
    if (!input.id || input.id.trim().length === 0) {
      throw new Error('ID da medida DAX é obrigatório para exclusão.');
    }

    const existente = await this.medidaDaxRepo.findById(input.id);
    if (!existente) {
      throw new Error(`Medida DAX com ID "${input.id}" não encontrada.`);
    }

    await this.medidaDaxRepo.delete(input.id);

    return {
      success: true,
      id: input.id,
    };
  }
}
