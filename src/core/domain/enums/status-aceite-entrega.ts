/**
 * Status do Aceite Formal da Entrega (V1 — FSD CF-17, CF-19 e v1-domain-model.md Seção 3.18)
 * Formaliza a deliberação soberana do analista/cliente sobre o pacote de entrega.
 */
export enum StatusAceiteEntrega {
  PENDENTE = 'PENDENTE',
  ACEITO = 'ACEITO',
  REJEITADO = 'REJEITADO',
  AJUSTES_SOLICITADOS = 'AJUSTES_SOLICITADOS',
}

export const ROTULOS_STATUS_ACEITE_ENTREGA: Record<StatusAceiteEntrega, string> = {
  [StatusAceiteEntrega.PENDENTE]: 'Aceite Pendente',
  [StatusAceiteEntrega.ACEITO]: 'Aceito Formalmente',
  [StatusAceiteEntrega.REJEITADO]: 'Rejeitado',
  [StatusAceiteEntrega.AJUSTES_SOLICITADOS]: 'Ajustes Solicitados',
};
