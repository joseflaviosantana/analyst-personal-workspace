import { PerguntaClarificacao } from '../entities/pergunta-clarificacao';

export interface IPerguntaClarificacaoRepository {
  create(pergunta: PerguntaClarificacao): Promise<PerguntaClarificacao>;
  findById(id: string): Promise<PerguntaClarificacao | null>;
  findByDemandId(demandaId: string): Promise<PerguntaClarificacao[]>;
  update(id: string, partial: Partial<PerguntaClarificacao>): Promise<PerguntaClarificacao | null>;
  delete(id: string): Promise<boolean>;
  countByDemandId(demandaId: string): Promise<number>;
  countBloqueantesPendentes(demandaId: string): Promise<number>;
}
