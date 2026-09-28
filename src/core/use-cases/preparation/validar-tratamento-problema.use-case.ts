import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { ILinhagemAtivosRepository } from '@/core/domain/repositories/linhagem-ativos-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDiagnosticosQualidadeRepository } from '@/core/domain/repositories/diagnosticos-qualidade-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { StatusVerificacaoQualidade } from '@/core/domain/enums/status-verificacao-qualidade';

export interface ValidarTratamentoProblemaInput {
  problemaId: string;
  autorTipo?: 'HUMANO' | 'IA';
}

export interface ValidarTratamentoProblemaOutput {
  resolvido: boolean;
  problema: ProblemaQualidade;
  etapaId: string;
  ativoDerivadoId: string;
  diagnosticoId: string;
  motivo: string;
  etapaValidada?: boolean;
}

/**
 * ValidarTratamentoProblemaUseCase (Subunidade 3.5C)
 *
 * Responsável pela validação empírica de problemas deliberados com TRATAR_NO_PIPELINE.
 * Invariante Inegociável: Nenhum problema pode transicionar para TRATADO por declaração humana textual.
 * Exige comprovação determinística através do diagnóstico pós-preparação do ativo derivado.
 */
export class ValidarTratamentoProblemaUseCase {
  constructor(
    private problemasRepo: IProblemasQualidadeRepository,
    private etapaRepo: IEtapaTransformacaoRepository,
    private linhagemRepo: ILinhagemAtivosRepository,
    private ativoDadosRepo: IAtivoDadosRepository,
    private diagnosticosRepo: IDiagnosticosQualidadeRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: ValidarTratamentoProblemaInput): Promise<ValidarTratamentoProblemaOutput> {
    const problema = await this.problemasRepo.findById(input.problemaId);
    if (!problema) {
      throw new Error(`Problema de qualidade com ID '${input.problemaId}' não encontrado.`);
    }

    if (problema.status === StatusProblemaQualidade.TRATADO) {
      throw new Error(`O problema '${problema.id}' já se encontra no status TRATADO.`);
    }

    if (problema.acao_deliberada !== AcaoProblemaQualidade.TRATAR_NO_PIPELINE) {
      throw new Error(
        `Apenas problemas com ação deliberada TRATAR_NO_PIPELINE podem ser validados por revalidação do pipeline. Ação atual: ${problema.acao_deliberada || 'NENHUMA'}.`
      );
    }

    // 1. Localizar etapas associadas ao problema
    const etapaIds = await this.etapaRepo.listarEtapasPorProblema(problema.id);
    if (etapaIds.length === 0) {
      throw new Error(
        `O problema '${problema.id}' não possui nenhuma etapa de transformação vinculada para tratamento.`
      );
    }

    // Busca as etapas vinculadas
    const etapas = (
      await Promise.all(etapaIds.map((id) => this.etapaRepo.findById(id)))
    ).filter((e): e is NonNullable<typeof e> => e !== null);

    const etapasAtivas = etapas.filter((e) => e.status !== StatusEtapaTransformacao.CANCELADA);
    if (etapasAtivas.length === 0) {
      throw new Error(
        `Todas as etapas de transformação vinculadas ao problema '${problema.id}' foram canceladas.`
      );
    }

    // Considera a etapa executada ou validada associada
    const etapaAlvo = etapasAtivas.find(
      (e) =>
        e.status === StatusEtapaTransformacao.EXECUTADA ||
        e.status === StatusEtapaTransformacao.VALIDADA
    );

    if (!etapaAlvo) {
      throw new Error(
        `Nenhuma etapa vinculada ao problema '${problema.id}' foi executada ainda. Status atual das etapas: ${etapasAtivas.map((e) => e.status).join(', ')}.`
      );
    }

    // 2. Localizar ativo derivado correspondente à etapa via lineage
    const arestas = await this.linhagemRepo.obterArestasPorEtapa(etapaAlvo.id);
    if (arestas.length === 0) {
      throw new Error(
        `A etapa de transformação '${etapaAlvo.id}' não possui ativo de dados derivado registrado no lineage.`
      );
    }

    const ativoDerivadoId = arestas[0].ativo_destino_id;
    const ativoDerivado = await this.ativoDadosRepo.findById(ativoDerivadoId);
    if (!ativoDerivado) {
      throw new Error(`Ativo de dados derivado com ID '${ativoDerivadoId}' não encontrado.`);
    }

    // 3. Localizar diagnóstico pós-preparação do ativo derivado
    const diagnosticoRecente = await this.diagnosticosRepo.findLatestByAssetId(ativoDerivado.id);
    if (!diagnosticoRecente) {
      throw new Error(
        `O ativo derivado '${ativoDerivado.id}' ainda não possui diagnóstico de qualidade pós-preparação executado.`
      );
    }

    if (diagnosticoRecente.status_execucao === StatusExecucaoDiagnostico.FALHA) {
      throw new Error(
        `O diagnóstico de qualidade mais recente do ativo derivado falhou (${diagnosticoRecente.erro_mensagem || 'erro desconhecido'}). Não há evidência válida para fechamento.`
      );
    }

    if (diagnosticoRecente.status_execucao === StatusExecucaoDiagnostico.EM_ANDAMENTO) {
      throw new Error(
        `O diagnóstico de qualidade do ativo derivado ainda está em execução. Aguarde a conclusão da varredura.`
      );
    }

    // 4. Se o diagnóstico foi parcial, verificar se a verificação da anomalia foi limitada
    if (diagnosticoRecente.status_execucao === StatusExecucaoDiagnostico.CONCLUIDO_PARCIALMENTE) {
      if (Array.isArray(diagnosticoRecente.verificacoes_executadas)) {
        const verifLimitada = diagnosticoRecente.verificacoes_executadas.find(
          (v) =>
            v.status === StatusVerificacaoQualidade.LIMITADA_POR_GUARDRAIL &&
            (v.categoria === problema.categoria || (problema.coluna_afetada && v.nome.includes(problema.coluna_afetada)))
        );

        if (verifLimitada) {
          throw new Error(
            `O diagnóstico pós-preparação foi concluído parcialmente com limitação por guardrail na verificação '${verifLimitada.nome}'. A evidência é insuficiente para atesto determinístico.`
          );
        }
      }
    }

    // 5. Comparação empírica estrutural: verificar se a anomalia persiste no diagnóstico pós-preparação
    const problemasPosPreparacao = await this.problemasRepo.findByDiagnosticId(diagnosticoRecente.id);

    let anomaliaPersiste = false;
    let motivoPersistencia = '';

    // A) Se originou de regra de negócio (3.4B)
    if (problema.regra_id) {
      const regraViolada = problemasPosPreparacao.find(
        (p) => p.regra_id === problema.regra_id
      );
      if (regraViolada && regraViolada.total_linhas_afetadas > 0) {
        anomaliaPersiste = true;
        motivoPersistencia = `A regra de negócio continua violada no ativo derivado com ${regraViolada.total_linhas_afetadas} ocorrência(s).`;
      }
    } else {
      // B) Anomalias estruturais do scanner (nulos, duplicidade, tipo, etc.)
      const anomaliaCorrespondente = problemasPosPreparacao.find(
        (p) =>
          p.categoria === problema.categoria &&
          (problema.coluna_afetada ? p.coluna_afetada === problema.coluna_afetada : true)
      );

      if (anomaliaCorrespondente && anomaliaCorrespondente.total_linhas_afetadas > 0) {
        anomaliaPersiste = true;
        motivoPersistencia = `A anomalia '${problema.categoria}' ainda foi detectada no ativo derivado afetando ${anomaliaCorrespondente.total_linhas_afetadas} linha(s)${problema.coluna_afetada ? ` na coluna '${problema.coluna_afetada}'` : ''}.`;
      }
    }

    // Se a anomalia persistir, REJEITA O FECHAMENTO e mantém o status atual
    if (anomaliaPersiste) {
      return {
        resolvido: false,
        problema,
        etapaId: etapaAlvo.id,
        ativoDerivadoId: ativoDerivado.id,
        diagnosticoId: diagnosticoRecente.id,
        motivo: motivoPersistencia,
      };
    }

    // 6. Resolução Empírica Comprovada: Transiciona o problema para TRATADO
    const agora = new Date().toISOString();
    const problemaAtualizado = await this.problemasRepo.update(problema.id, {
      status: StatusProblemaQualidade.TRATADO,
      atualizado_em: agora,
    });

    if (!problemaAtualizado) {
      throw new Error(`Falha ao atualizar o problema '${problema.id}' para status TRATADO.`);
    }

    // Grava na trilha de auditoria
    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: problema.demanda_id,
        entidade: 'ProblemaQualidade',
        entidade_id: problema.id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: input.autorTipo ?? 'HUMANO',
        dados_anteriores: JSON.stringify({ status: problema.status }),
        dados_novos: JSON.stringify({
          status: StatusProblemaQualidade.TRATADO,
          etapa_id: etapaAlvo.id,
          ativo_derivado_id: ativoDerivado.id,
          diagnostico_id: diagnosticoRecente.id,
        }),
        justificativa: `Tratamento comprovado empiricamente pelo diagnóstico '${diagnosticoRecente.id}' no ativo derivado '${ativoDerivado.id}'.`,
        timestamp: agora,
      });
    }

    // 7. Verifica se todos os problemas vinculados à etapa foram resolvidos para promovê-la a VALIDADA
    let etapaValidada = false;
    const problemasEtapaIds = await this.etapaRepo.listarProblemasPorEtapa(etapaAlvo.id);
    const problemasDaEtapa = (
      await Promise.all(problemasEtapaIds.map((id) => this.problemasRepo.findById(id)))
    ).filter((p): p is NonNullable<typeof p> => p !== null);

    const todosResolvidos = problemasDaEtapa.every(
      (p) =>
        p.id === problema.id || // O atual acabou de ser tratado
        p.status === StatusProblemaQualidade.TRATADO ||
        p.status === StatusProblemaQualidade.ACEITO_COMO_RESTRICAO
    );

    if (todosResolvidos && etapaAlvo.status !== StatusEtapaTransformacao.VALIDADA) {
      await this.etapaRepo.update(etapaAlvo.id, {
        status: StatusEtapaTransformacao.VALIDADA,
        atualizado_em: agora,
      });
      etapaValidada = true;

      if (this.auditRepo) {
        await this.auditRepo.record({
          demanda_id: problema.demanda_id,
          entidade: 'EtapaTransformacao',
          entidade_id: etapaAlvo.id,
          tipo_evento: 'TRANSICAO_ESTADO',
          autor_tipo: input.autorTipo ?? 'HUMANO',
          dados_anteriores: JSON.stringify({ status: etapaAlvo.status }),
          dados_novos: JSON.stringify({ status: StatusEtapaTransformacao.VALIDADA }),
          justificativa: `Etapa promovida a VALIDADA após comprovação empírica de tratamento de todos os problemas vinculados.`,
          timestamp: agora,
        });
      }
    }

    return {
      resolvido: true,
      problema: problemaAtualizado,
      etapaId: etapaAlvo.id,
      ativoDerivadoId: ativoDerivado.id,
      diagnosticoId: diagnosticoRecente.id,
      motivo: `Anomalia eliminada com sucesso. Comprovada ausência da anomalia no diagnóstico pós-preparação '${diagnosticoRecente.id}'.`,
      etapaValidada,
    };
  }
}
