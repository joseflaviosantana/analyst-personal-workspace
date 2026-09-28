import { PapelEntidadeAnalitica } from '../enums/papel-entidade-analitica';
import { TipoEntidadeAnalitica } from '../enums/tipo-entidade-analitica';
import { TipoOrigemEntidade } from '../enums/tipo-origem-entidade';
import { AtributoAnalitico } from './atributo-analitico';

/**
 * EntidadeAnalitica (V1 — Subunidade 3.6A / Domínio de Modelagem)
 * Representa uma tabela conceitual no modelo analítico (Fato ou Dimensão).
 */
export interface EntidadeAnalitica {
  id: string;
  modelo_id: string;
  ativo_dados_id: string | null;
  nome: string;
  tipo: TipoEntidadeAnalitica;
  papel: PapelEntidadeAnalitica;
  origem_tipo: TipoOrigemEntidade;
  descricao: string | null;
  ordem_apresentacao: number;
  criado_em: string;
  atualizado_em: string;
}

/**
 * EntidadeAnaliticaComAtributos
 * Entidade analítica acompanhada da coleção de seus atributos mapeados.
 */
export interface EntidadeAnaliticaComAtributos extends EntidadeAnalitica {
  atributos: AtributoAnalitico[];
}
