import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { ModeloAnalitico } from '@/core/domain/entities/modelo-analitico';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import {
  revogarHomologacaoModeloSchema,
  RevogarHomologacaoModeloInput,
} from '@/lib/validations/modeling-schema';

export class RevogarHomologacaoModeloUseCase {
  constructor(
    private modeloRepo: IModeloAnaliticoRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(rawInput: RevogarHomologacaoModeloInput): Promise<ModeloAnalitico> {
    const input = revogarHomologacaoModeloSchema.parse(rawInput);

    const modelo = await this.modeloRepo.findById(input.modeloId);
    if (!modelo) {
      throw new Error(`Modelo analítico com ID '${input.modeloId}' não encontrado.`);
    }

    if (modelo.status !== StatusModeloAnalitico.HOMOLOGADO) {
      throw new Error(
        `O modelo analítico '${modelo.nome}' não está homologado (status atual: ${modelo.status}). Apenas modelos HOMOLOGADOS podem ser revogados.`
      );
    }

    const now = new Date().toISOString();
    const motivoLimpo = input.motivo.trim();

    const modeloRevogado = await this.modeloRepo.revogar(modelo.id, motivoLimpo, now);
    if (!modeloRevogado) {
      throw new Error(`Falha ao revogar o modelo analítico '${modelo.id}'.`);
    }

    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: modelo.demanda_id,
        entidade: 'ModeloAnalitico',
        entidade_id: modelo.id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: JSON.stringify({
          status: modelo.status,
          homologado_em: modelo.homologado_em,
        }),
        dados_novos: JSON.stringify({
          status: modeloRevogado.status,
          revogado_em: modeloRevogado.revogado_em,
          motivo_revogacao: modeloRevogado.motivo_revogacao,
        }),
        justificativa: motivoLimpo,
        timestamp: now,
      });
    }

    return modeloRevogado;
  }
}
