/**
 * Estados da Demanda (V1 — ADR-002 e v1-domain-model.md)
 * 8 Estados Normais + 2 Estados Excepcionais
 */
export enum EstadoDemanda {
  BACKLOG = 'BACKLOG',
  ENTENDIMENTO = 'ENTENDIMENTO',
  PREPARACAO_DADOS = 'PREPARACAO_DADOS',
  MODELAGEM_DAX = 'MODELAGEM_DAX',
  ANALISE_EXPLORATORIA = 'ANALISE_EXPLORATORIA',
  RECONCILIACAO = 'RECONCILIACAO',
  DOCUMENTACAO_PORTFOLIO = 'DOCUMENTACAO_PORTFOLIO',
  CONCLUIDA = 'CONCLUIDA',
  // Estados Excepcionais
  EM_REVISAO_HOMOLOGACAO = 'EM_REVISAO_HOMOLOGACAO',
  CANCELADA = 'CANCELADA',
}

/**
 * Validador puro de transições permitidas no workflow (exemplo do Core Domain)
 */
export function isTransicaoPermitida(origem: EstadoDemanda, destino: EstadoDemanda): boolean {
  if (origem === destino) return false;
  if (origem === EstadoDemanda.CANCELADA || origem === EstadoDemanda.CONCLUIDA) return false;
  return true;
}
