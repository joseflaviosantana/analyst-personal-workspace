/**
 * src/core/domain/repositories/ativo-aprendizado-repository.interface.ts
 *
 * Contrato de repositório para Ativos de Aprendizado (Subgate 3.9 — Aba 11).
 */

import { AtivoAprendizado } from '../entities/ativo-aprendizado';
import { CategoriaAtivoAprendizado } from '../enums/categoria-ativo-aprendizado';

export interface FiltrosConsultaAtivosAprendizado {
  categoria?: CategoriaAtivoAprendizado;
  busca?: string;
  demandaId?: string;
}

export interface IAtivoAprendizadoRepository {
  findByDemandId(demandaId: string): Promise<AtivoAprendizado[]>;
  findAll(filtros?: FiltrosConsultaAtivosAprendizado): Promise<AtivoAprendizado[]>;
  findById(id: string): Promise<AtivoAprendizado | null>;
  save(ativo: AtivoAprendizado): Promise<AtivoAprendizado>;
  delete(id: string): Promise<void>;
}
