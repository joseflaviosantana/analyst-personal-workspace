import crypto from 'node:crypto';
import { IDatasetAutorizadoRepository } from '@/core/domain/repositories/dataset-autorizado-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IDiagnosticosQualidadeRepository } from '@/core/domain/repositories/diagnosticos-qualidade-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { AvaliarQualityGateUseCase } from '@/core/use-cases/quality/avaliar-quality-gate.use-case';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { CategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';

export interface AutorizarDatasetAnaliseInput {
  demandaId: string;
  ativoDadosId: string;
  receitaPreparacaoId?: string | null;
  versaoRotulo: string;
  justificativa: string; // Mínimo 15 caracteres
  autorTipo?: 'HUMANO';
}

/**
 * AutorizarDatasetAnaliseUseCase (Subunidade 3.5C)
 *
 * Homologação formal e atesto persistente do conjunto de dados liberado
 * para alimentar a Fase de Modelagem e Análise.
 *
 * Invariantes Inegociáveis:
 * 1. Justificativa formal obrigatória com no mínimo 15 caracteres;
 * 2. Suporta ativo bruto (quando não há preparação) ou ativo preparado derivado;
 * 3. Se preparado, a receita associada DEVE estar CONCLUIDA;
 * 4. O Quality Gate do ativo a ser homologado NÃO pode estar BLOQUEADO;
 * 5. Nenhum problema de qualidade pode estar com severidade PENDENTE;
 * 6. Nenhum problema com TRATAR_NO_PIPELINE pode permanecer sem resolução empírica;
 * 7. Congela snapshot criptográfico do hash SHA-256 e das restrições formalmente aceitas;
 * 8. Substituição atômica da autorização anterior (no máximo 1 VIGENTE por demanda).
 */
export class AutorizarDatasetAnaliseUseCase {
  private avaliarQualityGateUseCase: AvaliarQualityGateUseCase;

  constructor(
    private datasetAutorizadoRepo: IDatasetAutorizadoRepository,
    private ativoDadosRepo: IAtivoDadosRepository,
    private demandRepo: IDemandRepository,
    private diagnosticosRepo: IDiagnosticosQualidadeRepository,
    private receitaRepo: IReceitaPreparacaoRepository,
    private problemasRepo: IProblemasQualidadeRepository,
    private auditRepo?: IAuditRepository
  ) {
    this.avaliarQualityGateUseCase = new AvaliarQualityGateUseCase(
      this.ativoDadosRepo,
      this.diagnosticosRepo,
      this.problemasRepo
    );
  }

  async execute(input: AutorizarDatasetAnaliseInput): Promise<DatasetAutorizadoAnalise> {
    const justificativaLimpa = input.justificativa ? input.justificativa.trim() : '';
    if (justificativaLimpa.length < 15) {
      throw new Error(
        'A justificativa de homologação do dataset deve conter no mínimo 15 caracteres explicativos.'
      );
    }

    // 1. Validar existência da demanda
    const demanda = await this.demandRepo.findById(input.demandaId);
    if (!demanda) {
      throw new Error(`Demanda com ID '${input.demandaId}' não encontrada.`);
    }

    // 2. Validar existência e vigência do ativo de dados
    const ativo = await this.ativoDadosRepo.findById(input.ativoDadosId);
    if (!ativo) {
      throw new Error(`Ativo de dados com ID '${input.ativoDadosId}' não encontrado.`);
    }

    if (ativo.demanda_id !== input.demandaId) {
      throw new Error(`O ativo de dados '${ativo.id}' não pertence à demanda '${input.demandaId}'.`);
    }

    if (ativo.status !== StatusAtivoDados.ATIVO) {
      throw new Error(
        `Apenas ativos com status ATIVO podem ser autorizados para análise. Status atual: ${ativo.status}.`
      );
    }

    // 3. Validar diagnóstico mais recente do ativo
    const diagnosticoRecente = await this.diagnosticosRepo.findLatestByAssetId(ativo.id);
    if (!diagnosticoRecente) {
      throw new Error(
        `O ativo de dados '${ativo.id}' não possui nenhum diagnóstico de qualidade executado. A homologação é bloqueada.`
      );
    }

    if (
      diagnosticoRecente.status_execucao !== StatusExecucaoDiagnostico.CONCLUIDO &&
      diagnosticoRecente.status_execucao !== StatusExecucaoDiagnostico.CONCLUIDO_PARCIALMENTE
    ) {
      throw new Error(
        `O diagnóstico mais recente do ativo '${ativo.id}' não foi concluído com sucesso (status: ${diagnosticoRecente.status_execucao}).`
      );
    }

    // 4. Avaliar Quality Gate do ativo
    const qualityGateResult = await this.avaliarQualityGateUseCase.execute({
      demandaId: input.demandaId,
      ativoDadosId: ativo.id,
    });

    if (!qualityGateResult.liberado) {
      throw new Error(
        `Não é permitido autorizar dataset com Quality Gate bloqueado: ${qualityGateResult.motivo}`
      );
    }

    // 5. Validar problemas com severidade PENDENTE e TRATAR_NO_PIPELINE
    const problemasDemanda = await this.problemasRepo.findByDemandId(input.demandaId);

    const problemasPendentes = problemasDemanda.filter((p) => p.severidade === 'PENDENTE');
    if (problemasPendentes.length > 0) {
      throw new Error(
        `Existem ${problemasPendentes.length} problema(s) com severidade PENDENTE de deliberação humana na demanda.`
      );
    }

    const problemasTratarNaoResolvidos = problemasDemanda.filter(
      (p) =>
        p.acao_deliberada === AcaoProblemaQualidade.TRATAR_NO_PIPELINE &&
        p.status !== StatusProblemaQualidade.TRATADO &&
        p.status !== StatusProblemaQualidade.ACEITO_COMO_RESTRICAO
    );

    if (problemasTratarNaoResolvidos.length > 0) {
      throw new Error(
        `Não é possível autorizar o dataset: existem ${problemasTratarNaoResolvidos.length} problema(s) deliberados para TRATAR_NO_PIPELINE que não foram resolvidos.`
      );
    }

    // 6. Diferenciação: Ativo Bruto vs Ativo Derivado (Preparado)
    const isAtivoDerivado =
      ativo.categoria_ativo === CategoriaAtivoDados.PREPARADO_DERIVADO ||
      Boolean(input.receitaPreparacaoId);

    let receitaIdHomologada: string | null = null;

    if (isAtivoDerivado) {
      const receitaId = input.receitaPreparacaoId;
      if (!receitaId) {
        throw new Error(
          `Para autorização de ativo derivado (${ativo.id}), a identificação da receita de preparação concluída é obrigatória.`
        );
      }

      const receita = await this.receitaRepo.findById(receitaId);
      if (!receita) {
        throw new Error(`Receita de preparação com ID '${receitaId}' não encontrada.`);
      }

      if (receita.demanda_id !== input.demandaId) {
        throw new Error(`A receita de preparação '${receita.id}' não pertence à demanda '${input.demandaId}'.`);
      }

      if (receita.status !== StatusReceitaPreparacao.CONCLUIDA) {
        throw new Error(
          `A receita de preparação '${receita.id}' associada ao ativo derivado deve estar no status CONCLUIDA. Status atual: ${receita.status}.`
        );
      }

      receitaIdHomologada = receita.id;
    } else {
      // Ativo bruto original: não pode haver receita ativa em execução concorrente
      const receitaAtiva = await this.receitaRepo.findActiveByDemandId(input.demandaId);
      if (receitaAtiva && receitaAtiva.status === StatusReceitaPreparacao.EM_EXECUCAO) {
        throw new Error(
          `Existe uma receita de preparação em execução ('${receitaAtiva.titulo}') para a demanda. Conclua a preparação ou encerre a receita antes de autorizar o ativo bruto.`
        );
      }
    }

    // 7. Congelar Snapshot de Restrições Formalmente Aceitas
    const restricoesAceitas = problemasDemanda
      .filter((p) => p.status === StatusProblemaQualidade.ACEITO_COMO_RESTRICAO)
      .map((p) => ({
        id: p.id,
        categoria: p.categoria,
        coluna_afetada: p.coluna_afetada,
        descricao: p.descricao,
        severidade: p.severidade,
        justificativa_deliberacao: p.justificativa_deliberacao,
      }));

    const restricoesSnapshot = JSON.stringify(restricoesAceitas);

    // 8. Montar a entidade de autorização
    const agora = new Date().toISOString();
    const novaAutorizacao: DatasetAutorizadoAnalise = {
      id: crypto.randomUUID(),
      demanda_id: input.demandaId,
      ativo_dados_id: ativo.id,
      diagnostico_qualidade_id: diagnosticoRecente.id,
      receita_preparacao_id: receitaIdHomologada,
      versao_rotulo: input.versaoRotulo.trim(),
      hash_sha256_snapshot: ativo.hash_sha256,
      status: StatusAutorizacaoDataset.VIGENTE,
      justificativa_autorizacao: justificativaLimpa,
      autorizado_por_tipo: 'HUMANO',
      restricoes_aceitas_snapshot: restricoesSnapshot,
      autorizado_em: agora,
      revogado_em: null,
      motivo_revogacao: null,
    };

    // 9. Delegar persistência atômica ao repositório
    const autorizacaoCriada = await this.datasetAutorizadoRepo.autorizarTransacional(novaAutorizacao);

    // 10. Gravar auditoria
    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: input.demandaId,
        entidade: 'DatasetAutorizadoAnalise',
        entidade_id: autorizacaoCriada.id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: null,
        dados_novos: JSON.stringify({
          versao_rotulo: autorizacaoCriada.versao_rotulo,
          ativo_dados_id: autorizacaoCriada.ativo_dados_id,
          diagnostico_qualidade_id: autorizacaoCriada.diagnostico_qualidade_id,
          receita_preparacao_id: autorizacaoCriada.receita_preparacao_id,
          hash_sha256_snapshot: autorizacaoCriada.hash_sha256_snapshot,
          status: autorizacaoCriada.status,
          total_restricoes_aceitas: restricoesAceitas.length,
        }),
        justificativa: justificativaLimpa,
        timestamp: agora,
      });
    }

    return autorizacaoCriada;
  }
}
