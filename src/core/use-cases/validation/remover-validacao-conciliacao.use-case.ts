import { IValidacaoConciliacaoRepository } from '@/core/domain/repositories/validacao-conciliacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';

export class RemoverValidacaoConciliacaoUseCase {
  constructor(
    private validacaoRepo: IValidacaoConciliacaoRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(id: string): Promise<boolean> {
    const existente = await this.validacaoRepo.findById(id);
    if (!existente) {
      throw new Error(`Validação com ID '${id}' não encontrada.`);
    }

    const removido = await this.validacaoRepo.delete(id);

    if (removido && this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: existente.demanda_id,
        entidade: 'validacoes_conciliacao',
        entidade_id: id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: JSON.stringify(existente),
        dados_novos: null,
        justificativa: `Exclusão de validação / conciliação: "${existente.titulo}"`,
        timestamp: new Date().toISOString(),
      });
    }

    return removido;
  }
}
