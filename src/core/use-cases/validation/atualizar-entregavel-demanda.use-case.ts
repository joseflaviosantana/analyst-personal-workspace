import { IEntregavelDemandaRepository } from '@/core/domain/repositories/entregavel-demanda-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { EntregavelDemanda } from '@/core/domain/entities/entregavel-demanda';
import {
  updateEntregavelDemandaSchema,
  UpdateEntregavelDemandaInput,
} from '@/lib/validations/validation-schema';

export class AtualizarEntregavelDemandaUseCase {
  constructor(
    private entregavelRepo: IEntregavelDemandaRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: UpdateEntregavelDemandaInput): Promise<EntregavelDemanda> {
    const data = updateEntregavelDemandaSchema.parse(input);

    const existente = await this.entregavelRepo.findById(data.id);
    if (!existente) {
      throw new Error(`Entregável com ID '${data.id}' não encontrado.`);
    }

    const now = new Date().toISOString();
    const partial: Partial<EntregavelDemanda> = {
      ...data,
      atualizado_em: now,
    };

    const atualizado = await this.entregavelRepo.update(data.id, partial);
    if (!atualizado) {
      throw new Error(`Falha ao atualizar entregável '${data.id}'.`);
    }

    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: atualizado.demanda_id,
        entidade: 'entregaveis_demanda',
        entidade_id: atualizado.id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: JSON.stringify(existente),
        dados_novos: JSON.stringify(atualizado),
        justificativa: `Atualização de metadados do entregável "${atualizado.titulo}"`,
        timestamp: now,
      });
    }

    return atualizado;
  }
}
