import { ReceitaPreparacao } from '../entities/receita-preparacao';

/**
 * Contrato de repositório para persistência de Receitas de Preparação (Subunidade 3.5A)
 */
export interface IReceitaPreparacaoRepository {
  findById(id: string): Promise<ReceitaPreparacao | null>;
  findByDemandId(demandaId: string): Promise<ReceitaPreparacao[]>;
  findActiveByDemandId(demandaId: string): Promise<ReceitaPreparacao | null>;
  create(receita: ReceitaPreparacao): Promise<ReceitaPreparacao>;
  update(id: string, dados: Partial<ReceitaPreparacao>): Promise<ReceitaPreparacao | null>;
  // Permite remoção física APENAS se a receita estiver em RASCUNHO e sem etapas executadas
  deleteDraftOnly(id: string): Promise<boolean>;
}
