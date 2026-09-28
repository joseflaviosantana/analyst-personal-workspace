import { PapelAtributoAnalitico } from '../enums/papel-atributo-analitico';
import { TipoDadoAnalitico } from '../enums/tipo-dado-analitico';

/**
 * AtributoAnalitico (V1 — Subunidade 3.6A / Domínio de Modelagem)
 * Representa uma coluna/campo de uma entidade analítica com sua tipagem,
 * função dimensional e formato de exibição.
 */
export interface AtributoAnalitico {
  id: string;
  entidade_id: string;
  nome_original: string;
  nome_amigavel: string;
  tipo_dado: TipoDadoAnalitico;
  papel: PapelAtributoAnalitico;
  ordem: number;
  oculto: boolean;
  descricao: string | null;
  formato_exibicao: string | null;
  criado_em: string;
  atualizado_em: string;
}
