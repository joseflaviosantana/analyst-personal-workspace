/**
 * Utilitário Centralizado de Precisão Numérica Determinística (V1 — Subunidade 3.7A)
 * Mitiga anomalias clássicas de representação de ponto flutuante binário (IEEE 754)
 * como 0.1 + 0.2 !== 0.3 e previne divisões por zero em divergências percentuais.
 */

export const PRECISAO_DECIMAIS_PADRAO = 4;
export const EPSILON_COMPARACAO = 1e-6;

export interface ResultadoCalculoDivergencia {
  divergencia_absoluta: number;
  divergencia_percentual: number;
  dentro_da_tolerancia: boolean;
}

/**
 * Arredonda deterministicamente um número para N casas decimais,
 * evitando discrepâncias de representação binária de floating point.
 */
export function roundToPrecision(valor: number, casasDecimais: number = PRECISAO_DECIMAIS_PADRAO): number {
  if (!Number.isFinite(valor)) return 0;
  // Utiliza notação exponencial para arredondamento preciso livre de artefatos binários
  return Number(Math.round(Number(`${valor}e${casasDecimais}`)) + `e-${casasDecimais}`);
}

/**
 * Avalia se a divergência apurada está dentro da tolerância permitida,
 * aplicando margem epsilon para evitar falsos divergentes gerados por imprecisão residual.
 */
export function isDentroDaTolerancia(
  divergenciaAbsoluta: number,
  toleranciaPermitida: number,
  epsilon: number = EPSILON_COMPARACAO
): boolean {
  const divRound = roundToPrecision(divergenciaAbsoluta, PRECISAO_DECIMAIS_PADRAO);
  const tolRound = roundToPrecision(toleranciaPermitida, PRECISAO_DECIMAIS_PADRAO);
  return divRound <= tolRound + epsilon;
}

/**
 * Calcula deterministicamente a divergência absoluta, percentual e aderência à tolerância.
 *
 * Regras Documentadas:
 * 1. divergencia_absoluta = round(|valor_obtido - valor_esperado|, 4)
 * 2. Quando valor_esperado === 0 e valor_obtido === 0 -> divergência percentual = 0.0%
 * 3. Quando valor_esperado === 0 e valor_obtido !== 0 -> divergência percentual = 100.0% (desvio total de baseline zero sem divisão por zero)
 * 4. Quando valor_esperado !== 0 -> divergência percentual = round((|divergencia_absoluta| / |valor_esperado|) * 100, 4)
 */
export function calcularDivergenciaNumerica(
  valorEsperado: number,
  valorObtido: number,
  toleranciaPermitida: number = 0
): ResultadoCalculoDivergencia {
  const esperadoNorm = roundToPrecision(valorEsperado, PRECISAO_DECIMAIS_PADRAO);
  const obtidoNorm = roundToPrecision(valorObtido, PRECISAO_DECIMAIS_PADRAO);
  const tolNorm = Math.max(0, roundToPrecision(toleranciaPermitida, PRECISAO_DECIMAIS_PADRAO));

  const divergenciaAbsoluta = roundToPrecision(Math.abs(obtidoNorm - esperadoNorm), PRECISAO_DECIMAIS_PADRAO);

  let divergenciaPercentual: number;

  if (esperadoNorm === 0) {
    if (divergenciaAbsoluta === 0) {
      divergenciaPercentual = 0;
    } else {
      // Baseline zero com valor apurado não-zero: definido deterministicamente como 100%
      divergenciaPercentual = 100;
    }
  } else {
    const ratio = (divergenciaAbsoluta / Math.abs(esperadoNorm)) * 100;
    divergenciaPercentual = roundToPrecision(ratio, PRECISAO_DECIMAIS_PADRAO);
  }

  const dentroDaTolerancia = isDentroDaTolerancia(divergenciaAbsoluta, tolNorm);

  return {
    divergencia_absoluta: divergenciaAbsoluta,
    divergencia_percentual: divergenciaPercentual,
    dentro_da_tolerancia: dentroDaTolerancia,
  };
}
