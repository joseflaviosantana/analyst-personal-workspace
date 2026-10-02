import { TrilhaAuditoria } from '../entities/trilha-auditoria';

export interface IAuditRepository {
  record(evento: Omit<TrilhaAuditoria, 'id'> & { id?: string }): Promise<TrilhaAuditoria>;
  findByDemandaId(demandaId: string): Promise<TrilhaAuditoria[]>;
  findByEntidade?(entidade: string, entidadeId: string): Promise<TrilhaAuditoria[]>;
}
