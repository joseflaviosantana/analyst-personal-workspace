/**
 * PapelEntradaLinhagem (V1 — Subunidade 3.5A / Domínio de Preparação)
 * Define a função semântica do ativo de entrada na aresta do grafo de linhagem,
 * eliminando duplicidade semântica com o tipo de operação da etapa.
 */
export enum PapelEntradaLinhagem {
  ORIGEM_UNICA = 'ORIGEM_UNICA',
  FONTE_PRINCIPAL = 'FONTE_PRINCIPAL',
  LOOKUP_SECUNDARIA = 'LOOKUP_SECUNDARIA',
  UNION_PARTE = 'UNION_PARTE',
}

export const ROTULOS_PAPEL_ENTRADA_LINHAGEM: Record<PapelEntradaLinhagem, string> = {
  [PapelEntradaLinhagem.ORIGEM_UNICA]: 'Origem Única Direta',
  [PapelEntradaLinhagem.FONTE_PRINCIPAL]: 'Fonte Principal / Tabela Base',
  [PapelEntradaLinhagem.LOOKUP_SECUNDARIA]: 'Tabela Secundária / Lookup de Cruzamento',
  [PapelEntradaLinhagem.UNION_PARTE]: 'Parte Integrante de União',
};
