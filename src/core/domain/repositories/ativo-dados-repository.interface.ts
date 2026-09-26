import { AtivoDados } from '../entities/ativo-dados';

/**
 * Contrato de repositório para persistência de Ativos de Dados (Clean Architecture)
 */
export interface IAtivoDadosRepository {
  create(asset: AtivoDados): Promise<AtivoDados>;
  findById(id: string): Promise<AtivoDados | null>;
  findByDemandId(demandaId: string): Promise<AtivoDados[]>;
  findByPath(caminhoLocal: string): Promise<AtivoDados | null>;
  update(id: string, data: Partial<AtivoDados>): Promise<AtivoDados | null>;
  countByDemandId(demandaId: string): Promise<number>;
}
