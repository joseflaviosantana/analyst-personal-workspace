import { StatusMetricaAnalitica } from '../enums/status-metrica-analitica';
import { TipoAditividadeMetrica } from '../enums/tipo-aditividade-metrica';
import { TipoAgregacaoMetrica } from '../enums/tipo-agregacao-metrica';
import { UnidadeMedidaMetrica } from '../enums/unidade-medida-metrica';

/**
 * MetricaAnalitica (V1 — Subunidade 3.6A / Domínio de Modelagem)
 * Especificação semântica e declarativa de indicadores analíticos (KPIs/Métricas).
 * Possui rastreabilidade formal com perguntas e objetivos de negócio da demanda (Ajuste 6)
 * e linhagem semântica explícita com atributos e outras métricas dependentes (Ajuste 5).
 */
export interface MetricaAnalitica {
  id: string;
  modelo_id: string;
  entidade_id: string | null;
  nome: string;
  descricao: string | null;
  tipo_agregacao: TipoAgregacaoMetrica;
  tipo_aditividade: TipoAditividadeMetrica;
  formula_declarativa: string;
  unidade_medida: UnidadeMedidaMetrica;
  formato_exibicao: string | null;
  status: StatusMetricaAnalitica;
  // Linhagem semântica explícita (Ajuste 5)
  atributos_dependentes_ids: string[];
  metricas_dependentes_ids: string[];
  // Rastreabilidade com negócio (Ajuste 6)
  pergunta_negocio_associada: string | null;
  objetivo_negocio_associado: string | null;
  ordem: number;
  criado_em: string;
  atualizado_em: string;
}
