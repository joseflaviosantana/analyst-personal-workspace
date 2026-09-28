import { AtributoAnalitico } from '../entities/atributo-analitico';

/**
 * Contrato de repositório para Atributos Analíticos (Subunidade 3.6A)
 */
export interface IAtributoAnaliticoRepository {
  findById(id: string): Promise<AtributoAnalitico | null>;
  findByEntidadeId(entidadeId: string): Promise<AtributoAnalitico[]>;
  create(atributo: AtributoAnalitico): Promise<AtributoAnalitico>;
  update(atributo: AtributoAnalitico): Promise<AtributoAnalitico>;
  delete(id: string): Promise<void>;
  createBatch(atributos: AtributoAnalitico[]): Promise<AtributoAnalitico[]>;
}
