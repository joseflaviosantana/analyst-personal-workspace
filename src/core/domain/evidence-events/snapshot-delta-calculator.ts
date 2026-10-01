/**
 * src/core/domain/evidence-events/snapshot-delta-calculator.ts
 *
 * Utilitários determinísticos para cálculo e comparação de Snapshots e Deltas Analíticos.
 */

import {
  SnapshotAnalitico,
  DeltaAnalitico,
  TipoVariacaoDelta,
} from './snapshot-delta-types';

export class SnapshotDeltaCalculator {
  /**
   * Constrói um Snapshot determinístico com timestamp ISO atual
   */
  static criarSnapshot(
    artefatoId: string,
    artefatoTipo: string,
    metricas: Record<string, number | string | boolean | null>,
    metadados?: Record<string, unknown> | null,
    timestamp?: string
  ): SnapshotAnalitico {
    return {
      timestamp: timestamp || new Date().toISOString(),
      artefato_id: artefatoId,
      artefato_tipo: artefatoTipo,
      metricas: { ...metricas },
      metadados: metadados ? { ...metadados } : null,
    };
  }

  /**
   * Calcula deterministicamente a lista de Deltas entre dois snapshots
   */
  static calcularDeltas(
    antes: SnapshotAnalitico,
    depois: SnapshotAnalitico
  ): DeltaAnalitico[] {
    const chavesMetricas = Array.from(
      new Set([...Object.keys(antes.metricas), ...Object.keys(depois.metricas)])
    ).sort();

    const deltas: DeltaAnalitico[] = [];

    for (const chave of chavesMetricas) {
      const vAntes = antes.metricas[chave] ?? null;
      const vDepois = depois.metricas[chave] ?? null;

      let variacaoAbsoluta: number | null = null;
      let variacaoPercentual: number | null = null;
      let tipoVariacao: TipoVariacaoDelta = 'INALTERADO';
      let descricaoImpacto = `Métrica "${chave}" inalterada (${String(vAntes)}).`;

      if (vAntes === vDepois) {
        tipoVariacao = 'INALTERADO';
      } else if (typeof vAntes === 'number' && typeof vDepois === 'number') {
        variacaoAbsoluta = Number((vDepois - vAntes).toFixed(4));

        if (vAntes !== 0) {
          variacaoPercentual = Number(
            (((vDepois - vAntes) / Math.abs(vAntes)) * 100).toFixed(2)
          );
        } else {
          variacaoPercentual = vDepois > 0 ? 100 : vDepois < 0 ? -100 : 0;
        }

        if (variacaoAbsoluta > 0) {
          tipoVariacao = 'AUMENTO';
          descricaoImpacto = `Métrica "${chave}" aumentou de ${vAntes} para ${vDepois} (+${variacaoAbsoluta}${
            variacaoPercentual !== null ? `, +${variacaoPercentual}%` : ''
          }).`;
        } else if (variacaoAbsoluta < 0) {
          tipoVariacao = 'REDUCAO';
          descricaoImpacto = `Métrica "${chave}" reduziu de ${vAntes} para ${vDepois} (${variacaoAbsoluta}${
            variacaoPercentual !== null ? `, ${variacaoPercentual}%` : ''
          }).`;
        } else {
          tipoVariacao = 'NEUTRO';
          descricaoImpacto = `Métrica "${chave}" sem variação líquida (${vAntes} -> ${vDepois}).`;
        }
      } else {
        tipoVariacao = 'MODIFICADO';
        descricaoImpacto = `Métrica "${chave}" alterada de "${String(vAntes)}" para "${String(
          vDepois
        )}".`;
      }

      deltas.push({
        campo_metrica: chave,
        valor_anterior: vAntes,
        valor_posterior: vDepois,
        variacao_absoluta: variacaoAbsoluta,
        variacao_percentual: variacaoPercentual,
        tipo_variacao: tipoVariacao,
        descricao_impacto: descricaoImpacto,
      });
    }

    return deltas;
  }
}
