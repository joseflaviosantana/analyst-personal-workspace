import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';
import { AssociarProblemaEtapaInput, associarProblemaEtapaSchema } from '@/lib/validations/preparation-schema';

/**
 * Caso de Uso: Associar Problema de Qualidade à Etapa de Transformação (Subunidade 3.5B)
 * Regra Estrita Decisão 3:
 * Apenas problemas previamente deliberados por humano com ação TRATAR_NO_PIPELINE
 * podem ser associados formalmente a uma etapa.
 * A associação NÃO altera o status do problema para TRATADO e NÃO altera o Quality Gate.
 */
export class AssociarProblemaEtapaUseCase {
  constructor(
    private etapaRepo: IEtapaTransformacaoRepository,
    private problemasRepo: IProblemasQualidadeRepository,
    private receitaRepo: IReceitaPreparacaoRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: AssociarProblemaEtapaInput): Promise<void> {
    const validated = associarProblemaEtapaSchema.parse(input);

    const etapa = await this.etapaRepo.findById(validated.etapa_id);
    if (!etapa) {
      throw new Error(`Etapa de transformação '${validated.etapa_id}' não encontrada.`);
    }

    if (etapa.status === StatusEtapaTransformacao.CANCELADA) {
      throw new Error('Não é permitido associar problemas de qualidade a etapas canceladas.');
    }

    const receita = await this.receitaRepo.findById(etapa.receita_id);
    if (!receita) {
      throw new Error(`Receita '${etapa.receita_id}' não encontrada.`);
    }

    const problema = await this.problemasRepo.findById(validated.problema_id);
    if (!problema) {
      throw new Error(`Problema de qualidade '${validated.problema_id}' não encontrado.`);
    }

    // 1. Integridade de Demanda: ambos devem pertencer à mesma demanda
    if (problema.demanda_id !== receita.demanda_id) {
      throw new Error(
        `O problema de qualidade (demanda '${problema.demanda_id}') e a receita (demanda '${receita.demanda_id}') devem pertencer à mesma demanda.`
      );
    }

    // 2. Deliberação Humana Prévia Obrigatória
    if (!problema.deliberado_por_humano || problema.severidade === SeveridadeProblema.PENDENTE) {
      throw new Error(
        'Apenas problemas formalmente deliberados por humano podem ser associados a uma etapa de transformação. Delibere a anomalia na Aba de Qualidade antes de associá-la ao pipeline.'
      );
    }

    // 3. Regra Estrita Decisão 3: Ação deve ser exclusivamente TRATAR_NO_PIPELINE
    if (problema.acao_deliberada !== AcaoProblemaQualidade.TRATAR_NO_PIPELINE) {
      throw new Error(
        `Apenas problemas com a ação deliberada '${AcaoProblemaQualidade.TRATAR_NO_PIPELINE}' podem ser associados a etapas de transformação. Ação atual: '${problema.acao_deliberada}'.`
      );
    }

    await this.etapaRepo.vincularProblema(validated.etapa_id, validated.problema_id);

    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: receita.demanda_id,
        entidade: 'EtapaProblemaQualidade',
        entidade_id: `${validated.etapa_id}_${validated.problema_id}`,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: null,
        dados_novos: JSON.stringify({
          etapa_id: validated.etapa_id,
          problema_id: validated.problema_id,
          acao_deliberada: problema.acao_deliberada,
        }),
        justificativa: 'Associação de problema de qualidade a ser tratado pela etapa de transformação.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
