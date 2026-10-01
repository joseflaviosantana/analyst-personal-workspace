/**
 * src/core/domain/enums/classificacao-exposicao-evidencia.ts
 *
 * Classificação de sensibilidade e exposição da evidência para fins de governança,
 * proteção de segredos e eventual publicação em portfólio.
 */

export const ClassificacaoExposicaoEvidencia = {
  INTERNA: 'INTERNA',
  CONFIDENCIAL: 'CONFIDENCIAL',
  SANITIZAVEL: 'SANITIZAVEL',
  PUBLICA: 'PUBLICA',
} as const;

export type ClassificacaoExposicaoEvidencia =
  (typeof ClassificacaoExposicaoEvidencia)[keyof typeof ClassificacaoExposicaoEvidencia];

export const ROTULOS_CLASSIFICACAO_EXPOSICAO: Record<ClassificacaoExposicaoEvidencia, string> = {
  [ClassificacaoExposicaoEvidencia.INTERNA]: 'Uso Interno (Workspace Local)',
  [ClassificacaoExposicaoEvidencia.CONFIDENCIAL]: 'Confidencial (Proibida Exposição Externa)',
  [ClassificacaoExposicaoEvidencia.SANITIZAVEL]: 'Sanitizável (Requer Mascaramento Prévia)',
  [ClassificacaoExposicaoEvidencia.PUBLICA]: 'Pública (Pronta para Portfólio / Case)',
};
