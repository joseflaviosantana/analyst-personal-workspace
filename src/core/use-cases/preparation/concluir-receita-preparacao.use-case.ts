import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';

export interface ConcluirReceitaPreparacaoInput {
  receitaId: string;
  justificativa?: string;
  autorTipo?: 'HUMANO' | 'IA';
}

/**
 * ConcluirReceitaPreparacaoUseCase (Subunidade 3.5C)
 *
 * Promove uma ReceitaPreparacao de EM_EXECUCAO para CONCLUIDA.
 * Invariante Inegociável: Não permite conclusão meramente declarativa.
 * Exige que todas as etapas estejam VALIDADA ou CANCELADA (ao menos uma VALIDADA),
 * sem etapas PLANEJADA ou EXECUTADA pendentes, e que todos os problemas com
 * TRATAR_NO_PIPELINE da demanda tenham sido empiricamente resolvidos.
 */
export class ConcluirReceitaPreparacaoUseCase {
  constructor(
    private receitaRepo: IReceitaPreparacaoRepository,
    private etapaRepo: IEtapaTransformacaoRepository,
    private problemasRepo: IProblemasQualidadeRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: ConcluirReceitaPreparacaoInput): Promise<ReceitaPreparacao> {
    const receita = await this.receitaRepo.findById(input.receitaId);
    if (!receita) {
      throw new Error(`Receita de preparação com ID '${input.receitaId}' não encontrada.`);
    }

    if (receita.status === StatusReceitaPreparacao.CONCLUIDA) {
      return receita;
    }

    if (receita.status !== StatusReceitaPreparacao.EM_EXECUCAO) {
      throw new Error(
        `Apenas receitas no status EM_EXECUCAO podem ser concluídas. Status atual: ${receita.status}.`
      );
    }

    // 1. Verificar etapas da receita
    const etapas = await this.etapaRepo.findByReceitaId(receita.id);
    if (etapas.length === 0) {
      throw new Error(`Não é possível concluir uma receita de preparação que não possui etapas cadastradas.`);
    }

    const etapasValidadas = etapas.filter((e) => e.status === StatusEtapaTransformacao.VALIDADA);
    if (etapasValidadas.length === 0) {
      throw new Error(
        `Não é possível concluir a receita: nenhuma etapa de transformação foi validada por diagnóstico.`
      );
    }

    const etapasPendentes = etapas.filter(
      (e) =>
        e.status === StatusEtapaTransformacao.PLANEJADA ||
        e.status === StatusEtapaTransformacao.EXECUTADA
    );

    if (etapasPendentes.length > 0) {
      throw new Error(
        `Não é possível concluir a receita: existem ${etapasPendentes.length} etapa(s) ainda não validadas (status: ${etapasPendentes.map((e) => e.status).join(', ')}).`
      );
    }

    // 2. Verificar se todos os problemas com TRATAR_NO_PIPELINE da demanda foram resolvidos
    const problemasDemanda = await this.problemasRepo.findByDemandId(receita.demanda_id);
    const problemasTratarNaoResolvidos = problemasDemanda.filter(
      (p) =>
        p.acao_deliberada === AcaoProblemaQualidade.TRATAR_NO_PIPELINE &&
        p.status !== StatusProblemaQualidade.TRATADO &&
        p.status !== StatusProblemaQualidade.ACEITO_COMO_RESTRICAO
    );

    if (problemasTratarNaoResolvidos.length > 0) {
      throw new Error(
        `Não é possível concluir a receita: existem ${problemasTratarNaoResolvidos.length} problema(s) com plano de tratamento no pipeline que ainda não foram empiricamente resolvidos.`
      );
    }

    // 3. Atualizar status da receita para CONCLUIDA
    const agora = new Date().toISOString();
    const atualizada = await this.receitaRepo.update(receita.id, {
      status: StatusReceitaPreparacao.CONCLUIDA,
      atualizado_em: agora,
    });

    if (!atualizada) {
      throw new Error(`Falha ao atualizar receita '${receita.id}' para status CONCLUIDA.`);
    }

    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: receita.demanda_id,
        entidade: 'ReceitaPreparacao',
        entidade_id: receita.id,
        tipo_evento: 'TRANSICAO_ESTADO',
        autor_tipo: input.autorTipo ?? 'HUMANO',
        dados_anteriores: JSON.stringify({ status: receita.status }),
        dados_novos: JSON.stringify({ status: StatusReceitaPreparacao.CONCLUIDA }),
        justificativa:
          input.justificativa?.trim() ||
          `Receita de preparação '${receita.titulo}' concluída com sucesso com ${etapasValidadas.length} etapa(s) validada(s).`,
        timestamp: agora,
      });
    }

    return atualizada;
  }
}
