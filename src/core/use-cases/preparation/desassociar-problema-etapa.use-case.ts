import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { DesassociarProblemaEtapaInput, desassociarProblemaEtapaSchema } from '@/lib/validations/preparation-schema';

/**
 * Caso de Uso: Desassociar Problema de Qualidade da Etapa (Subunidade 3.5B)
 * Remove o vínculo N:M entre a etapa e a anomalia.
 * Bloqueia desassociação se a etapa já estiver com status VALIDADA.
 */
export class DesassociarProblemaEtapaUseCase {
  constructor(
    private etapaRepo: IEtapaTransformacaoRepository,
    private receitaRepo: IReceitaPreparacaoRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: DesassociarProblemaEtapaInput): Promise<void> {
    const validated = desassociarProblemaEtapaSchema.parse(input);

    const etapa = await this.etapaRepo.findById(validated.etapa_id);
    if (!etapa) {
      throw new Error(`Etapa de transformação '${validated.etapa_id}' não encontrada.`);
    }

    if (etapa.status === StatusEtapaTransformacao.VALIDADA) {
      throw new Error(
        'Não é permitido desassociar problemas de etapas com status VALIDADA para preservar o histórico comprobatório de qualidade.'
      );
    }

    const receita = await this.receitaRepo.findById(etapa.receita_id);

    await this.etapaRepo.desvincularProblema(validated.etapa_id, validated.problema_id);

    if (this.auditRepo && receita) {
      await this.auditRepo.record({
        demanda_id: receita.demanda_id,
        entidade: 'EtapaProblemaQualidade',
        entidade_id: `${validated.etapa_id}_${validated.problema_id}`,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: JSON.stringify({
          etapa_id: validated.etapa_id,
          problema_id: validated.problema_id,
        }),
        dados_novos: null,
        justificativa: 'Desassociação de problema de qualidade da etapa de transformação.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
