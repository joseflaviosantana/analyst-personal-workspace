/**
 * src/core/domain/entities/evidencia-analitica.ts
 *
 * Entidade Canônica do Evidence Core (Subgate 3.5A).
 *
 * Representa fatos e artefatos verificáveis do trabalho profissional analítico,
 * preservando a proveniência e separando rigorosamente:
 * - Fato observado (constatação factual dos dados ou artefatos)
 * - Ação registrada (o que foi executado)
 * - Resultado observado/mensurável (delta, métrica ou impacto)
 * - Inferência / recomendação (análise ou sugestão técnica)
 * - Decisão humana (deliberação e homologação pelo analista)
 */

import { TipoEvidenciaAnalitica } from '../enums/tipo-evidencia-analitica';
import { EtapaOrigemEvidencia } from '../enums/etapa-origem-evidencia';
import { MetodoCapturaEvidencia } from '../enums/metodo-captura-evidencia';
import { StatusValidacaoEvidencia } from '../enums/status-validacao-evidencia';
import { ClassificacaoExposicaoEvidencia } from '../enums/classificacao-exposicao-evidencia';

export interface EvidenciaAnalitica {
  id: string;
  demanda_id: string;
  projeto_id?: string | null;
  tipo: TipoEvidenciaAnalitica;
  etapa_origem: EtapaOrigemEvidencia;
  artefato_origem_tipo?: string | null;
  artefato_origem_id?: string | null;
  titulo: string;
  descricao: string;

  // Rigor Epistêmico Obrigatório
  fato_observado: string;
  estado_anterior?: string | null;
  acao_registrada: string;
  estado_posterior?: string | null;
  resultado_mensuravel?: string | null;
  inferencia_recomendacao?: string | null;
  decisao_humana?: string | null;

  // Governança, Proveniência e Auditoria
  metodo_captura: MetodoCapturaEvidencia;
  status_validacao: StatusValidacaoEvidencia;
  classificacao_exposicao: ClassificacaoExposicaoEvidencia;
  elegibilidade_portfolio: boolean;
  executor: string;
  metadados?: Record<string, unknown> | null;

  // Timestamps ISO 8601
  criado_em: string;
  atualizado_em: string;
}

export interface ResumoMetricasEvidencias {
  total: number;
  por_status: Record<StatusValidacaoEvidencia, number>;
  por_classificacao: Record<ClassificacaoExposicaoEvidencia, number>;
  por_tipo: Partial<Record<TipoEvidenciaAnalitica, number>>;
  total_elegiveis_portfolio: number;
}
