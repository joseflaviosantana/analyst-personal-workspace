/**
 * src/core/use-cases/portfolio/listar-ativos-aprendizado-demanda.use-case.ts
 *
 * Lista os ativos de aprendizado vinculados a uma demanda (Subgate 3.9 — Aba 11).
 */

import { IAtivoAprendizadoRepository } from '@/core/domain/repositories/ativo-aprendizado-repository.interface';
import { AtivoAprendizado } from '@/core/domain/entities/ativo-aprendizado';

export interface ListarAtivosAprendizadoDemandaInput {
  demandaId: string;
}

export class ListarAtivosAprendizadoDemandaUseCase {
  constructor(private ativoRepo: IAtivoAprendizadoRepository) {}

  async execute(input: string | ListarAtivosAprendizadoDemandaInput): Promise<AtivoAprendizado[]> {
    const demandaId = typeof input === 'string' ? input : input.demandaId;
    return this.ativoRepo.findByDemandId(demandaId);
  }
}
