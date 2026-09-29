import { randomUUID } from 'crypto';
import { IEntregavelDemandaRepository } from '@/core/domain/repositories/entregavel-demanda-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { EntregavelDemanda } from '@/core/domain/entities/entregavel-demanda';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';
import {
  createEntregavelDemandaSchema,
  CreateEntregavelDemandaInput,
} from '@/lib/validations/validation-schema';

export class RegistrarEntregavelDemandaUseCase {
  constructor(
    private entregavelRepo: IEntregavelDemandaRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: CreateEntregavelDemandaInput): Promise<EntregavelDemanda> {
    const data = createEntregavelDemandaSchema.parse(input);

    const now = new Date().toISOString();
    const entregavel: EntregavelDemanda = {
      id: `ent_${randomUUID()}`,
      demanda_id: data.demanda_id,
      titulo: data.titulo,
      tipo: data.tipo,
      versao: data.versao,
      caminho_arquivo_ou_link: data.caminho_arquivo_ou_link,
      descricao_sumario: data.descricao_sumario ?? null,
      obrigatorio: data.obrigatorio,
      status: data.status,
      aceite_status: StatusAceiteEntrega.PENDENTE,
      aceite_justificativa: null,
      aceite_por: null,
      aceite_em: null,
      criado_em: now,
      atualizado_em: now,
    };

    const criado = await this.entregavelRepo.create(entregavel);

    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: criado.demanda_id,
        entidade: 'entregaveis_demanda',
        entidade_id: criado.id,
        tipo_evento: 'ENTREGAVEL_REGISTRADO',
        autor_tipo: 'HUMANO',
        dados_anteriores: null,
        dados_novos: JSON.stringify(criado),
        justificativa: null,
        timestamp: now,
      });
    }

    return criado;
  }
}
