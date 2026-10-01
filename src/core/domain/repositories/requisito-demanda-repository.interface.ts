import { RequisitoDemanda } from '../entities/requisito-demanda';

export interface IRequisitoDemandaRepository {
  create(requisito: RequisitoDemanda): Promise<RequisitoDemanda>;
  findById(id: string): Promise<RequisitoDemanda | null>;
  findByDemandId(demandaId: string): Promise<RequisitoDemanda[]>;
  update(id: string, partial: Partial<RequisitoDemanda>): Promise<RequisitoDemanda | null>;
  delete(id: string): Promise<boolean>;
  countByDemandId(demandaId: string): Promise<number>;
}
