import { ValidacaoConciliacao } from '../entities/validacao-conciliacao';

export interface IValidacaoConciliacaoRepository {
  create(validacao: ValidacaoConciliacao): Promise<ValidacaoConciliacao>;
  findById(id: string): Promise<ValidacaoConciliacao | null>;
  findByDemandId(demandaId: string): Promise<ValidacaoConciliacao[]>;
  update(id: string, partial: Partial<ValidacaoConciliacao>): Promise<ValidacaoConciliacao | null>;
  delete(id: string): Promise<boolean>;
  countByDemandId(demandaId: string): Promise<number>;
}
