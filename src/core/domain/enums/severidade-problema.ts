/**
 * SeveridadeProblema (V1 — FSD RF-019 e v1-domain-model.md Seção 3.7)
 * Nível de severidade e risco analítico da anomalia de qualidade.
 *
 * Separação Epistêmica:
 * O valor PENDENTE é atribuído por padrão aos achados determinísticos automáticos da 3.4A,
 * garantindo que a severidade contextual não seja imposta de forma arbitrária pela máquina
 * sem validação humana ou regra explícita configurada.
 */
export enum SeveridadeProblema {
  PENDENTE = 'PENDENTE',
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA',
}

export const ROTULOS_SEVERIDADE_PROBLEMA: Record<SeveridadeProblema, string> = {
  [SeveridadeProblema.PENDENTE]: 'Pendente de Classificação',
  [SeveridadeProblema.BAIXA]: 'Baixa',
  [SeveridadeProblema.MEDIA]: 'Média',
  [SeveridadeProblema.ALTA]: 'Alta',
  [SeveridadeProblema.CRITICA]: 'Crítica (Bloqueante)',
};
