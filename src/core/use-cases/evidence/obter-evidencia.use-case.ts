/**
 * src/core/use-cases/evidence/obter-evidencia.use-case.ts
 *
 * Caso de uso: Consultar Evidência Individual por ID.
 */

import { EvidenciaAnalitica } from '@/core/domain/entities/evidencia-analitica';
import { IEvidenciaAnaliticaRepository } from '@/core/domain/repositories/evidencia-analitica-repository.interface';

export class ObterEvidenciaUseCase {
  constructor(private readonly evidenciaRepo: IEvidenciaAnaliticaRepository) {}

  async execute(id: string): Promise<EvidenciaAnalitica | null> {
    if (!id || typeof id !== 'string') {
      throw new Error('ID da evidência é obrigatório.');
    }

    return this.evidenciaRepo.findById(id);
  }
}
