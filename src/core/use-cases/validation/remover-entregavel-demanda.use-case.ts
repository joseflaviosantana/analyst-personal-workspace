import { IEntregavelDemandaRepository } from '@/core/domain/repositories/entregavel-demanda-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';

export class RemoverEntregavelDemandaUseCase {
  constructor(
    private entregavelRepo: IEntregavelDemandaRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(id: string): Promise<boolean> {
    const existente = await this.entregavelRepo.findById(id);
    if (!existente) {
      throw new Error(`Entregável com ID '${id}' não encontrado.`);
    }

    if (existente.aceite_status === StatusAceiteEntrega.ACEITO) {
      throw new Error(
        `Não é permitido excluir diretamente o entregável "${existente.titulo}" pois ele já possui aceite formal ACEITO.`
      );
    }

    const removido = await this.entregavelRepo.delete(id);

    if (removido && this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: existente.demanda_id,
        entidade: 'entregaveis_demanda',
        entidade_id: id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: JSON.stringify(existente),
        dados_novos: null,
        justificativa: `Exclusão de entregável de demanda: "${existente.titulo}"`,
        timestamp: new Date().toISOString(),
      });
    }

    return removido;
  }
}
