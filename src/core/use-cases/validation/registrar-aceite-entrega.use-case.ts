import { IEntregavelDemandaRepository } from '@/core/domain/repositories/entregavel-demanda-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { EntregavelDemanda } from '@/core/domain/entities/entregavel-demanda';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';
import { StatusEntregavel } from '@/core/domain/enums/status-entregavel';
import {
  registrarAceiteEntregaSchema,
  RegistrarAceiteEntregaInput,
} from '@/lib/validations/validation-schema';

export class RegistrarAceiteEntregaUseCase {
  constructor(
    private entregavelRepo: IEntregavelDemandaRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: RegistrarAceiteEntregaInput): Promise<EntregavelDemanda> {
    const data = registrarAceiteEntregaSchema.parse(input);

    const existente = await this.entregavelRepo.findById(data.id);
    if (!existente) {
      throw new Error(`Entregável com ID '${data.id}' não encontrado.`);
    }

    if (existente.status === StatusEntregavel.SUBSTITUIDO) {
      throw new Error(`Não é permitido registrar aceite em entregável SUBSTITUÍDO (ID: '${data.id}').`);
    }

    const now = new Date().toISOString();
    let novoStatusEntregavel = existente.status;

    if (data.aceite_status === StatusAceiteEntrega.ACEITO) {
      novoStatusEntregavel = StatusEntregavel.HOMOLOGADO;
    }

    const partial: Partial<EntregavelDemanda> = {
      aceite_status: data.aceite_status,
      aceite_por: data.aceite_por,
      aceite_em: now,
      aceite_justificativa: data.aceite_justificativa ?? null,
      status: novoStatusEntregavel,
      atualizado_em: now,
    };

    const atualizado = await this.entregavelRepo.update(data.id, partial);
    if (!atualizado) {
      throw new Error(`Falha ao registrar aceite do entregável '${data.id}'.`);
    }

    if (this.auditRepo) {
      const tipoEvento = data.aceite_status === StatusAceiteEntrega.ACEITO
        ? 'ENTREGA_ACEITA'
        : 'ENTREGA_REJEITADA';

      await this.auditRepo.record({
        demanda_id: atualizado.demanda_id,
        entidade: 'entregaveis_demanda',
        entidade_id: atualizado.id,
        tipo_evento: tipoEvento,
        autor_tipo: 'HUMANO',
        dados_anteriores: JSON.stringify(existente),
        dados_novos: JSON.stringify(atualizado),
        justificativa: data.aceite_justificativa ?? `Aceite formal ${data.aceite_status} por ${data.aceite_por}`,
        timestamp: now,
      });
    }

    return atualizado;
  }
}
