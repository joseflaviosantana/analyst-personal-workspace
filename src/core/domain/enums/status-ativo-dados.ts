/**
 * StatusAtivoDados (V1 — FSD CF-06 e v1-domain-model.md Seção 3.6)
 * Ciclo de acompanhamento e disponibilidade do ativo de dados na demanda.
 */
export enum StatusAtivoDados {
  CADASTRADO = 'CADASTRADO',
  EM_INSPECAO = 'EM_INSPECAO',
  ATIVO = 'ATIVO',
  SUBSTITUIDO = 'SUBSTITUIDO',
}

export const ROTULOS_STATUS_ATIVO_DADOS: Record<StatusAtivoDados, string> = {
  [StatusAtivoDados.CADASTRADO]: 'Cadastrado',
  [StatusAtivoDados.EM_INSPECAO]: 'Em Inspeção',
  [StatusAtivoDados.ATIVO]: 'Ativo',
  [StatusAtivoDados.SUBSTITUIDO]: 'Substituído / Obsoleto',
};

export function normalizarStatusAtivoDados(status: string | StatusAtivoDados): StatusAtivoDados {
  if (!status) return StatusAtivoDados.CADASTRADO;
  const upper = status.toUpperCase().trim();
  if (upper in StatusAtivoDados) {
    return StatusAtivoDados[upper as keyof typeof StatusAtivoDados];
  }
  if (upper === 'OBSOLETO' || upper === 'SUBSTITUIDO/OBSOLETO') {
    return StatusAtivoDados.SUBSTITUIDO;
  }
  return StatusAtivoDados.CADASTRADO;
}
