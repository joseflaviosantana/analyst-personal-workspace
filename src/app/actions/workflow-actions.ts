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

import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDiagnosticosQualidadeRepository } from '@/core/domain/repositories/diagnosticos-qualidade-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';

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
}

const defaultDemandRepo = new SqliteDemandRepository();
const defaultAuditRepo = new SqliteAuditRepository();
const defaultAtivoDadosRepo = new SqliteAtivoDadosRepository();
const defaultDiagnosticosRepo = new SqliteDiagnosticosQualidadeRepository();
const defaultProblemasRepo = new SqliteProblemasQualidadeRepository();

function resolveWorkflowDeps(customDeps?: Partial<WorkflowActionDeps>): WorkflowActionDeps {
  return {
    demandRepo: customDeps?.demandRepo ?? defaultDemandRepo,
    auditRepo: customDeps?.auditRepo ?? defaultAuditRepo,
    ativoDadosRepo: customDeps?.ativoDadosRepo ?? defaultAtivoDadosRepo,
    diagnosticosRepo: customDeps?.diagnosticosRepo ?? defaultDiagnosticosRepo,
    problemasRepo: customDeps?.problemasRepo ?? defaultProblemasRepo,
  };
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

    const proximoEstado = WorkflowEngine.proximoEstadoNormal(demand.estado);
    if (!proximoEstado) {
      return { success: false, error: 'Não há próximo estado sequencial disponível a partir do estado atual.' };
    }

    let contextoExtra: any = undefined;

    // Regra de Governança 3.4C.1 / 3.4C.2:
    // Transição da etapa 2 (Em Qualidade) para etapa 3 (Em Modelagem e Análise)
    // exige avaliação factual do Quality Gate no servidor. Proibido confiar em dados do cliente.
    if (
      demand.estado === EstadoDemanda.EM_QUALIDADE_E_PREPARACAO &&
      proximoEstado === EstadoDemanda.EM_MODELAGEM_E_ANALISE
    ) {
      const qualityGateResult = await avaliarQualityGateUseCase.execute({ demandaId });
      contextoExtra = { ...contextoExtra, qualityGate: qualityGateResult };
    }

    // Validação da etapa 1 para etapa 2: exige verificação de ativos de dados cadastrados
    if (proximoEstado === EstadoDemanda.EM_QUALIDADE_E_PREPARACAO) {
      const assets = await deps.ativoDadosRepo.findByDemandId(demandaId);
      contextoExtra = { ...contextoExtra, totalAtivosDados: assets.length };
    }

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

    let contextoExtra: any = undefined;

    // Avaliação factual no servidor do Quality Gate na transição da etapa 2 para etapa 3
    if (
      demand.estado === EstadoDemanda.EM_QUALIDADE_E_PREPARACAO &&
      parsed.novoEstado === EstadoDemanda.EM_MODELAGEM_E_ANALISE
    ) {
      const qualityGateResult = await avaliarQualityGateUseCase.execute({ demandaId: parsed.demandaId });
      contextoExtra = { ...contextoExtra, qualityGate: qualityGateResult };
    }

    if (parsed.novoEstado === EstadoDemanda.EM_QUALIDADE_E_PREPARACAO) {
      const assets = await deps.ativoDadosRepo.findByDemandId(parsed.demandaId);
      contextoExtra = { ...contextoExtra, totalAtivosDados: assets.length };
    }

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
