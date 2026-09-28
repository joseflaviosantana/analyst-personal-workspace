/**
 * CategoriaAtivoDados (V1 — Subunidade 3.5A / Domínio de Preparação)
 * Distingue semanticamente o insumo bruto original do artefato preparado/derivado,
 * permitindo que ambos compartilhem a infraestrutura canônica de AtivoDados.
 */
export enum CategoriaAtivoDados {
  BRUTO_RECEBIDO = 'BRUTO_RECEBIDO',
  PREPARADO_DERIVADO = 'PREPARADO_DERIVADO',
}

export const ROTULOS_CATEGORIA_ATIVO_DADOS: Record<CategoriaAtivoDados, string> = {
  [CategoriaAtivoDados.BRUTO_RECEBIDO]: 'Insumo Bruto Recebido',
  [CategoriaAtivoDados.PREPARADO_DERIVADO]: 'Ativo Preparado / Derivado',
};

export function normalizarCategoriaAtivoDados(valor?: string | null): CategoriaAtivoDados {
  if (valor === CategoriaAtivoDados.PREPARADO_DERIVADO) {
    return CategoriaAtivoDados.PREPARADO_DERIVADO;
  }
  return CategoriaAtivoDados.BRUTO_RECEBIDO;
}
