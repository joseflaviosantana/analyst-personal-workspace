import { IEntidadeAnaliticaRepository } from '@/core/domain/repositories/entidade-analitica-repository.interface';
import { IRelacionamentoAnaliticoRepository } from '@/core/domain/repositories/relacionamento-analitico-repository.interface';
import { IMetricaAnaliticaRepository } from '@/core/domain/repositories/metrica-analitica-repository.interface';

export class RemoverEntidadeAnaliticaUseCase {
  constructor(
    private entidadeRepo: IEntidadeAnaliticaRepository,
    private relacionamentoRepo: IRelacionamentoAnaliticoRepository,
    private metricaRepo: IMetricaAnaliticaRepository
  ) {}

  async execute(entidadeId: string): Promise<void> {
    const entidade = await this.entidadeRepo.findById(entidadeId);
    if (!entidade) {
      throw new Error(`Entidade analítica com ID '${entidadeId}' não encontrada.`);
    }

    // 1. Limpar relacionamentos que referenciem a entidade
    const relacionamentos = await this.relacionamentoRepo.findByModeloId(entidade.modelo_id);
    for (const rel of relacionamentos) {
      if (rel.entidade_origem_id === entidadeId || rel.entidade_destino_id === entidadeId) {
        await this.relacionamentoRepo.delete(rel.id);
      }
    }

    // 2. Desvincular métricas associadas a esta entidade
    const metricas = await this.metricaRepo.findByModeloId(entidade.modelo_id);
    for (const met of metricas) {
      if (met.entidade_id === entidadeId) {
        await this.metricaRepo.update({
          ...met,
          entidade_id: null,
          atualizado_em: new Date().toISOString(),
        });
      }
    }

    // 3. Deletar entidade (e cascata de atributos)
    await this.entidadeRepo.delete(entidadeId);
  }
}
