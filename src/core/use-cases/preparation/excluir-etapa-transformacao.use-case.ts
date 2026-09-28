import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';

/**
 * Caso de Uso: Excluir Etapa de Transformação (Subunidade 3.5B)
 * Salvaguarda Anti-Deleção Histórica:
 * Permite exclusão física APENAS se a etapa estiver no status PLANEJADA
 * e não possuir arestas de linhagem associadas.
 */
export class ExcluirEtapaTransformacaoUseCase {
  constructor(
    private etapaRepo: IEtapaTransformacaoRepository,
    private receitaRepo: IReceitaPreparacaoRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(etapaId: string): Promise<boolean> {
    if (!etapaId || etapaId.trim() === '') {
      throw new Error('ID da etapa é obrigatório.');
    }

    const etapa = await this.etapaRepo.findById(etapaId);
    if (!etapa) {
      throw new Error(`Etapa de transformação '${etapaId}' não encontrada.`);
    }

    if (etapa.status !== StatusEtapaTransformacao.PLANEJADA) {
      throw new Error(
        `Apenas etapas no status PLANEJADA podem ser excluídas fisicamente. O status atual é '${etapa.status}'. Para etapas já executadas ou validadas, utilize o cancelamento formal auditado.`
      );
    }

    const receita = await this.receitaRepo.findById(etapa.receita_id);

    const deleted = await this.etapaRepo.deleteDraftOnly(etapaId);

    if (deleted && this.auditRepo && receita) {
      await this.auditRepo.record({
        demanda_id: receita.demanda_id,
        entidade: 'EtapaTransformacao',
        entidade_id: etapaId,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: JSON.stringify({
          id: etapa.id,
          descricao: etapa.descricao,
          tipo_operacao: etapa.tipo_operacao,
        }),
        dados_novos: null,
        justificativa: 'Exclusão física de etapa de transformação em rascunho (PLANEJADA).',
        timestamp: new Date().toISOString(),
      });
    }

    return deleted;
  }
}
