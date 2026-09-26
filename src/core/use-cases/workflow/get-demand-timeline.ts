import { TrilhaAuditoria } from '@/core/domain/entities/trilha-auditoria';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';

export class GetDemandTimelineUseCase {
  constructor(private auditRepo: IAuditRepository) {}

  async execute(demandaId: string): Promise<TrilhaAuditoria[]> {
    return this.auditRepo.findByDemandaId(demandaId);
  }
}
