/**
 * src/core/domain/evidence-events/snapshot-delta-types.ts
 *
 * Contratos para representação de Snapshots e Deltas Analíticos (Antes × Depois).
 * Base para futuras evidências de transformação e mensuração de impacto.
 */

export type TipoVariacaoDelta =
  | 'AUMENTO'
  | 'REDUCAO'
  | 'NEUTRO'
  | 'MODIFICADO'
  | 'INALTERADO';

/**
 * Representação pontual do estado/métricas de um artefato analítico
 */
export interface SnapshotAnalitico {
  timestamp: string; // ISO 8601 UTC
  artefato_id: string;
  artefato_tipo: string;
  metricas: Record<string, number | string | boolean | null>;
  metadados?: Record<string, unknown> | null;
}

/**
 * Diferença determinística calculada entre dois snapshots
 */
export interface DeltaAnalitico {
  campo_metrica: string;
  valor_anterior: number | string | boolean | null;
  valor_posterior: number | string | boolean | null;
  variacao_absoluta?: number | null; // Delta numérico direto (posterior - anterior)
  variacao_percentual?: number | null; // Delta percentual ((posterior - anterior) / anterior * 100)
  tipo_variacao: TipoVariacaoDelta;
  descricao_impacto: string;
}
