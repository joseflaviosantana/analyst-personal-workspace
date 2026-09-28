import { CardinalidadeRelacionamento } from '../enums/cardinalidade-relacionamento';
import { DirecaoFiltroRelacionamento } from '../enums/direcao-filtro-relacionamento';

/**
 * RelacionamentoAnalitico (V1 — Subunidade 3.6A / Domínio de Modelagem)
 * Define a conexão relacional entre duas entidades analíticas através de atributos chave.
 * Suporta relacionamentos N:M e filtros bidirecionais armazenando a devida justificativa técnica (M-03),
 * mantendo o desacoplamento em relação à severidade avaliada pelo motor determinístico.
 */
export interface RelacionamentoAnalitico {
  id: string;
  modelo_id: string;
  entidade_origem_id: string;
  atributo_origem_id: string;
  entidade_destino_id: string;
  atributo_destino_id: string;
  tipo_relacionamento: CardinalidadeRelacionamento;
  direcao_filtro: DirecaoFiltroRelacionamento;
  ativo: boolean;
  justificativa: string | null;
  criado_em: string;
  atualizado_em: string;
}
