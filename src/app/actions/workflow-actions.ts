'use server';

import { revalidatePath } from 'next/cache';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { TrilhaAuditoria } from '@/core/domain/entities/trilha-auditoria';

import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { SqliteAtivoDadosRepository } from '@/infrastructure/db/repositories/ativo-dados-repository';
import { SqliteDiagnosticosQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-diagnosticos-qualidade-repository';
import { SqliteProblemasQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-problemas-qualidade-repository';
import { SqliteDatasetAutorizadoRepository } from '@/infrastructure/db/repositories/sqlite-dataset-autorizado-repository';
import { SqliteReceitaPreparacaoRepository } from '@/infrastructure/db/repositories/sqlite-receita-preparacao-repository';
import { SqliteModeloAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-modelo-analitico-repository';
import { SqliteValidacaoConciliacaoRepository } from '@/infrastructure/db/repositories/sqlite-validacao-conciliacao-repository';
import { SqliteEntregavelDemandaRepository } from '@/infrastructure/db/repositories/sqlite-entregavel-demanda-repository';

import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDiagnosticosQualidadeRepository } from '@/core/domain/repositories/diagnosticos-qualidade-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { IDatasetAutorizadoRepository } from '@/core/domain/repositories/dataset-autorizado-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IValidacaoConciliacaoRepository } from '@/core/domain/repositories/validacao-conciliacao-repository.interface';
import { IEntregavelDemandaRepository } from '@/core/domain/repositories/entregavel-demanda-repository.interface';
import { ModelingRulesEvaluator } from '@/core/domain/rules/modeling-rules-evaluator';
import { ValidationRulesEvaluator } from '@/core/domain/rules/validation-rules-evaluator';
import { FormalizarEncerramentoDemandaUseCase } from '@/core/use-cases/validation';
import { SqliteEventoAnaliticoLogRepository } from '@/infrastructure/db/repositories/sqlite-evento-analitico-log-repository';
import { SqliteEvidenciaAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-evidencia-analitica-repository';
import {
  RegistrarEvidenciaUseCase,
  ProcessarEventoAnaliticoUseCase,
} from '@/core/use-cases/evidence';
import { criarEvidenceEventEnginePadrao } from '@/core/domain/evidence-events';

import { 
  TransitionDemandStateUseCase,
  SuspendDemandUseCase,
  ResumeDemandUseCase,
  CancelDemandUseCase,
  GetDemandTimelineUseCase,
} from '@/core/use-cases/workflow';
import { AvaliarQualityGateUseCase } from '@/core/use-cases/quality/avaliar-quality-gate.use-case';
import { WorkflowEngine } from '@/core/domain/rules/workflow-engine';
import { 
  transitionDemandSchema,
  suspendDemandSchema,
  resumeDemandSchema,
  cancelDemandSchema,
  TransitionDemandInput,
  SuspendDemandInput,
  ResumeDemandInput,
  CancelDemandInput,
} from '@/lib/validations/demand-schema';

export type WorkflowActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface WorkflowActionDeps {
  demandRepo: IDemandRepository;
  auditRepo: IAuditRepository;
  ativoDadosRepo: IAtivoDadosRepository;
  diagnosticosRepo: IDiagnosticosQualidadeRepository;
  problemasRepo: IProblemasQualidadeRepository;
  datasetAutorizadoRepo?: IDatasetAutorizadoRepository;
  receitaRepo?: IReceitaPreparacaoRepository;
  modeloRepo?: IModeloAnaliticoRepository;
  validacaoRepo?: IValidacaoConciliacaoRepository;
  entregavelRepo?: IEntregavelDemandaRepository;
  processarEventoUseCase?: ProcessarEventoAnaliticoUseCase;
}

const defaultDemandRepo = new SqliteDemandRepository();
const defaultAuditRepo = new SqliteAuditRepository();
const defaultAtivoDadosRepo = new SqliteAtivoDadosRepository();
const defaultDiagnosticosRepo = new SqliteDiagnosticosQualidadeRepository();
const defaultProblemasRepo = new SqliteProblemasQualidadeRepository();
const defaultDatasetAutorizadoRepo = new SqliteDatasetAutorizadoRepository();
const defaultReceitaRepo = new SqliteReceitaPreparacaoRepository();
const defaultModeloRepo = new SqliteModeloAnaliticoRepository();
const defaultValidacaoRepo = new SqliteValidacaoConciliacaoRepository();
const defaultEntregavelRepo = new SqliteEntregavelDemandaRepository();

function resolveWorkflowDeps(customDeps?: Partial<WorkflowActionDeps>): WorkflowActionDeps {
  return {
    demandRepo: customDeps?.demandRepo ?? defaultDemandRepo,
    auditRepo: customDeps?.auditRepo ?? defaultAuditRepo,
    ativoDadosRepo: customDeps?.ativoDadosRepo ?? defaultAtivoDadosRepo,
    diagnosticosRepo: customDeps?.diagnosticosRepo ?? defaultDiagnosticosRepo,
    problemasRepo: customDeps?.problemasRepo ?? defaultProblemasRepo,
    datasetAutorizadoRepo: customDeps ? customDeps.datasetAutorizadoRepo : defaultDatasetAutorizadoRepo,
    receitaRepo: customDeps ? customDeps.receitaRepo : defaultReceitaRepo,
    modeloRepo: customDeps ? customDeps.modeloRepo : defaultModeloRepo,
    validacaoRepo: customDeps ? customDeps.validacaoRepo : defaultValidacaoRepo,
    entregavelRepo: customDeps ? customDeps.entregavelRepo : defaultEntregavelRepo,
    processarEventoUseCase: customDeps?.processarEventoUseCase,
  };
}

function getProcessarEventoUseCase(deps: WorkflowActionDeps): ProcessarEventoAnaliticoUseCase {
  if (deps.processarEventoUseCase) {
    return deps.processarEventoUseCase;
  }
  const eventoLogRepo = new SqliteEventoAnaliticoLogRepository();
  const evidenciaRepo = new SqliteEvidenciaAnaliticaRepository();
  const engine = criarEvidenceEventEnginePadrao();
  const registrarEvidenciaUseCase = new RegistrarEvidenciaUseCase(evidenciaRepo, deps.demandRepo);
  return new ProcessarEventoAnaliticoUseCase(
    engine,
    eventoLogRepo,
    registrarEvidenciaUseCase
  );
}

function revalidateAllPaths(demandaId: string, projetoId?: string) {
  revalidatePath('/cockpit');
  revalidatePath('/demands');
  revalidatePath('/pipeline');
  revalidatePath(`/demands/${demandaId}`);
  if (projetoId) {
    revalidatePath(`/projects/${projetoId}`);
  }
}

async function buildFactualTransitionContext(
  demandaId: string,
  origem: EstadoDemanda,
  destino: EstadoDemanda,
  deps: WorkflowActionDeps,
  avaliarQualityGateUseCase: AvaliarQualityGateUseCase
): Promise<any> {
  const contextoExtra: any = {};

  // 1. Validação da etapa 1 para etapa 2: exige verificação de ativos de dados cadastrados
  if (destino === EstadoDemanda.EM_QUALIDADE_E_PREPARACAO) {
    const assets = await deps.ativoDadosRepo.findByDemandId(demandaId);
    contextoExtra.totalAtivosDados = assets.length;
  }

  // 2. Regra de Governança 3.4C.1 / 3.4C.2 / 3.5C:
  // Transição da etapa 2 (Em Qualidade e Preparação) para etapa 3 (Em Modelagem e Análise)
  // exige avaliação factual do Quality Gate e de Dataset Autorizado no servidor. Proibido confiar em dados do cliente.
  if (
    origem === EstadoDemanda.EM_QUALIDADE_E_PREPARACAO &&
    destino === EstadoDemanda.EM_MODELAGEM_E_ANALISE
  ) {
    const qualityGateResult = await avaliarQualityGateUseCase.execute({ demandaId });
    contextoExtra.qualityGate = qualityGateResult;

    if (deps.datasetAutorizadoRepo) {
      const datasetVigente = await deps.datasetAutorizadoRepo.findVigenteByDemandId(demandaId);
      if (datasetVigente) {
        const ativoAutorizado = await deps.ativoDadosRepo.findById(datasetVigente.ativo_dados_id);
        let receitaConcluida: any = null;
        if (datasetVigente.receita_preparacao_id && deps.receitaRepo) {
          receitaConcluida = await deps.receitaRepo.findById(datasetVigente.receita_preparacao_id);
        }
        const problemasDemanda = await deps.problemasRepo.findByDemandId(demandaId);
        const problemasPendentesDeTratamento = problemasDemanda.filter(
          (p) =>
            p.acao_deliberada === 'TRATAR_NO_PIPELINE' &&
            p.status !== 'TRATADO' &&
            p.status !== 'ACEITO_COMO_RESTRICAO'
        ).length;

        contextoExtra.datasetAutorizado = datasetVigente;
        contextoExtra.ativoAutorizado = ativoAutorizado;
        contextoExtra.receitaPreparacao = receitaConcluida;
        contextoExtra.problemasPendentesDeTratamento = problemasPendentesDeTratamento;
      }
    }
  }

  // 3. Regra de Governança 3.6C:
  // Transição da etapa 3 (Em Modelagem e Análise) para etapa 4 (Em Validação)
  // exige verificação factual de Modelo Analítico Homologado no servidor.
  if (
    origem === EstadoDemanda.EM_MODELAGEM_E_ANALISE &&
    destino === EstadoDemanda.EM_VALIDACAO
  ) {
    if (deps.modeloRepo) {
      const modeloHomologado = await deps.modeloRepo.findHomologadoByDemandaId(demandaId);
      if (modeloHomologado) {
        const modeloCompleto = await deps.modeloRepo.findCompletoById(modeloHomologado.id);
        let temAlteracaoPosterior = false;
        let totalBloqueios = 0;
        if (modeloCompleto && modeloCompleto.homologado_em) {
          const tsHomologado = new Date(modeloCompleto.homologado_em).getTime();
          for (const ent of modeloCompleto.entidades) {
            if (new Date(ent.atualizado_em).getTime() > tsHomologado) temAlteracaoPosterior = true;
            for (const a of ent.atributos) {
              if (new Date(a.atualizado_em).getTime() > tsHomologado) temAlteracaoPosterior = true;
            }
          }
          for (const r of modeloCompleto.relacionamentos) {
            if (new Date(r.atualizado_em).getTime() > tsHomologado) temAlteracaoPosterior = true;
          }
          for (const m of modeloCompleto.metricas) {
            if (new Date(m.atualizado_em).getTime() > tsHomologado) temAlteracaoPosterior = true;
          }

          const dataset = deps.datasetAutorizadoRepo
            ? await deps.datasetAutorizadoRepo.findById(modeloCompleto.dataset_autorizado_id)
            : null;
          const conformidade = ModelingRulesEvaluator.avaliar(modeloCompleto, dataset);
          totalBloqueios = conformidade.total_bloqueios;
        }

        contextoExtra.modeloHomologado = {
          id: modeloHomologado.id,
          demanda_id: modeloHomologado.demanda_id,
          dataset_autorizado_id: modeloHomologado.dataset_autorizado_id,
          status: modeloHomologado.status,
          homologado_em: modeloHomologado.homologado_em,
          revogado_em: modeloHomologado.revogado_em,
          temAlteracaoPosterior,
          totalBloqueios,
        };
      } else {
        contextoExtra.modeloHomologado = null;
      }
    }
  }

  // 4. Regra de Governança 3.7A:
  // Transições para PRONTA_PARA_ENTREGA e CONCLUIDA
  // Consulta factual e direta aos dados persistidos em SQLite (validações e entregáveis).
  // Proibido confiar em payload do cliente.
  if (
    destino === EstadoDemanda.PRONTA_PARA_ENTREGA ||
    destino === EstadoDemanda.CONCLUIDA
  ) {
    const validacoes = deps.validacaoRepo ? await deps.validacaoRepo.findByDemandId(demandaId) : [];
    const entregaveis = deps.entregavelRepo ? await deps.entregavelRepo.findByDemandId(demandaId) : [];
    const avaliacaoVal = ValidationRulesEvaluator.avaliar(validacoes, entregaveis);

    contextoExtra.validacoesContexto = validacoes;
    contextoExtra.entregaveisContexto = entregaveis;
    contextoExtra.avaliacaoValidacao = avaliacaoVal;
  }

  return contextoExtra;
}

export async function advanceDemandAction(
  demandaId: string,
  justificativa?: string,
  _deps?: Partial<WorkflowActionDeps>
): Promise<WorkflowActionResult<DemandaComProjeto>> {
  try {
    const deps = resolveWorkflowDeps(_deps);
    const transitionUseCase = new TransitionDemandStateUseCase(deps.demandRepo, deps.auditRepo);
    const avaliarQualityGateUseCase = new AvaliarQualityGateUseCase(
      deps.ativoDadosRepo,
      deps.diagnosticosRepo,
      deps.problemasRepo
    );

    const demand = await deps.demandRepo.findById(demandaId);
    if (!demand) {
      return { success: false, error: 'Demanda não encontrada.' };
    }

    // Idempotência canônica: se já estiver concluída, retorna com sucesso
    if (demand.estado === EstadoDemanda.CONCLUIDA) {
      return { success: true, data: demand };
    }

    const proximoEstado = WorkflowEngine.proximoEstadoNormal(demand.estado);
    if (!proximoEstado) {
      return { success: false, error: 'Não há próximo estado sequencial disponível a partir do estado atual.' };
    }

    // Interceptação canônica: encerramento soberano para CONCLUIDA via use case unificado
    if (proximoEstado === EstadoDemanda.CONCLUIDA) {
      const processarEvento = getProcessarEventoUseCase(deps);
      const formalizarUseCase = new FormalizarEncerramentoDemandaUseCase(
        deps.demandRepo,
        deps.entregavelRepo ?? defaultEntregavelRepo,
        deps.validacaoRepo ?? defaultValidacaoRepo,
        deps.auditRepo,
        processarEvento
      );

      const updated = await formalizarUseCase.execute({
        demandaId,
        justificativa: justificativa ?? null,
        autorTipo: 'HUMANO',
      });

      revalidateAllPaths(demandaId, updated.projeto_id);
      return { success: true, data: updated };
    }

    const contextoExtra = await buildFactualTransitionContext(
      demandaId,
      demand.estado as EstadoDemanda,
      proximoEstado,
      deps,
      avaliarQualityGateUseCase
    );

    const updated = await transitionUseCase.execute({
      demandaId,
      novoEstado: proximoEstado,
      justificativa: justificativa ?? null,
      autorTipo: 'HUMANO',
      contextoExtra,
    });

    revalidateAllPaths(demandaId, updated.projeto_id);
    return { success: true, data: updated };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao avançar estado da demanda.',
    };
  }
}

export async function transitionDemandAction(
  data: TransitionDemandInput,
  _deps?: Partial<WorkflowActionDeps>
): Promise<WorkflowActionResult<DemandaComProjeto>> {
  try {
    const parsed = transitionDemandSchema.parse(data);
    const deps = resolveWorkflowDeps(_deps);
    const transitionUseCase = new TransitionDemandStateUseCase(deps.demandRepo, deps.auditRepo);
    const avaliarQualityGateUseCase = new AvaliarQualityGateUseCase(
      deps.ativoDadosRepo,
      deps.diagnosticosRepo,
      deps.problemasRepo
    );

    const demand = await deps.demandRepo.findById(parsed.demandaId);
    if (!demand) {
      return { success: false, error: 'Demanda não encontrada.' };
    }

    // Interceptação canônica: encerramento soberano para CONCLUIDA via use case unificado
    if (parsed.novoEstado === EstadoDemanda.CONCLUIDA) {
      const processarEvento = getProcessarEventoUseCase(deps);
      const formalizarUseCase = new FormalizarEncerramentoDemandaUseCase(
        deps.demandRepo,
        deps.entregavelRepo ?? defaultEntregavelRepo,
        deps.validacaoRepo ?? defaultValidacaoRepo,
        deps.auditRepo,
        processarEvento
      );

      const updated = await formalizarUseCase.execute({
        demandaId: parsed.demandaId,
        justificativa: parsed.justificativa ?? null,
        autorTipo: 'HUMANO',
      });

      revalidateAllPaths(parsed.demandaId, updated.projeto_id);
      return { success: true, data: updated };
    }

    const contextoExtra = await buildFactualTransitionContext(
      parsed.demandaId,
      demand.estado as EstadoDemanda,
      parsed.novoEstado as EstadoDemanda,
      deps,
      avaliarQualityGateUseCase
    );

    const updated = await transitionUseCase.execute({
      demandaId: parsed.demandaId,
      novoEstado: parsed.novoEstado,
      justificativa: parsed.justificativa,
      autorTipo: 'HUMANO',
      contextoExtra,
    });

    revalidateAllPaths(parsed.demandaId, updated.projeto_id);
    return { success: true, data: updated };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao realizar transição de estado.',
    };
  }
}

export async function suspendDemandAction(
  data: SuspendDemandInput,
  _deps?: Partial<WorkflowActionDeps>
): Promise<WorkflowActionResult<DemandaComProjeto>> {
  try {
    const parsed = suspendDemandSchema.parse(data);
    const deps = resolveWorkflowDeps(_deps);
    const suspendUseCase = new SuspendDemandUseCase(deps.demandRepo, deps.auditRepo);

    const updated = await suspendUseCase.execute(parsed);

    revalidateAllPaths(parsed.demandaId, updated.projeto_id);
    return { success: true, data: updated };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao suspender demanda.',
    };
  }
}

export async function resumeDemandAction(
  data: ResumeDemandInput,
  _deps?: Partial<WorkflowActionDeps>
): Promise<WorkflowActionResult<DemandaComProjeto>> {
  try {
    const parsed = resumeDemandSchema.parse(data);
    const deps = resolveWorkflowDeps(_deps);
    const resumeUseCase = new ResumeDemandUseCase(deps.demandRepo, deps.auditRepo);

    const updated = await resumeUseCase.execute(parsed);

    revalidateAllPaths(parsed.demandaId, updated.projeto_id);
    return { success: true, data: updated };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao retomar demanda.',
    };
  }
}

export async function cancelDemandAction(
  data: CancelDemandInput,
  _deps?: Partial<WorkflowActionDeps>
): Promise<WorkflowActionResult<DemandaComProjeto>> {
  try {
    const parsed = cancelDemandSchema.parse(data);
    const deps = resolveWorkflowDeps(_deps);
    const cancelUseCase = new CancelDemandUseCase(deps.demandRepo, deps.auditRepo);

    const updated = await cancelUseCase.execute(parsed);

    revalidateAllPaths(parsed.demandaId, updated.projeto_id);
    return { success: true, data: updated };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao cancelar demanda.',
    };
  }
}

export async function getDemandTimelineAction(
  demandaId: string,
  _deps?: Partial<WorkflowActionDeps>
): Promise<WorkflowActionResult<TrilhaAuditoria[]>> {
  try {
    const deps = resolveWorkflowDeps(_deps);
    const timelineUseCase = new GetDemandTimelineUseCase(deps.auditRepo);

    const timeline = await timelineUseCase.execute(demandaId);
    return { success: true, data: timeline };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao carregar linha do tempo de auditoria.',
    };
  }
}
