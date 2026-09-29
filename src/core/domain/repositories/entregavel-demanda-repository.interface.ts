import { EntregavelDemanda } from '../entities/entregavel-demanda';

export interface IEntregavelDemandaRepository {
  create(entregavel: EntregavelDemanda): Promise<EntregavelDemanda>;
  findById(id: string): Promise<EntregavelDemanda | null>;
  findByDemandId(demandaId: string): Promise<EntregavelDemanda[]>;
  update(id: string, partial: Partial<EntregavelDemanda>): Promise<EntregavelDemanda | null>;
  delete(id: string): Promise<boolean>;
  countByDemandId(demandaId: string): Promise<number>;
}
