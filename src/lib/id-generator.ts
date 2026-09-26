import crypto from 'crypto';

/**
 * Utilitário de geração de IDs únicos para entidades de domínio
 */
export function generateId(prefix?: string): string {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}
