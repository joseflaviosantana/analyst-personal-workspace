'use server';

import { revalidatePath } from 'next/cache';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDatasetAutorizadoRepository } from '@/core/domain/repositories/dataset-autorizado-repository.interface';
import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IEntidadeAnaliticaRepository } from '@/core/domain/repositories/entidade-analitica-repository.interface';
import { IAtributoAnaliticoRepository } from '@/core/domain/repositories/atributo-analitico-repository.interface';
import { IRelacionamentoAnaliticoRepository } from '@/core/domain/repositories/relacionamento-analitico-repository.interface';
import { IMetricaAnaliticaRepository } from '@/core/domain/repositories/metrica-analitica-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';

import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAtivoDadosRepository } from '@/infrastructure/db/repositories/ativo-dados-repository';
import { SqliteDatasetAutorizadoRepository } from '@/infrastructure/db/repositories/sqlite-dataset-autorizado-repository';
import { SqliteModeloAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-modelo-analitico-repository';
import { SqliteEntidadeAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-entidade-analitica-repository';
import { SqliteAtributoAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-atributo-analitico-repository';
import { SqliteRelacionamentoAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-relacionamento-analitico-repository';
import { SqliteMetricaAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-metrica-analitica-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';

import {
  CriarModeloAnaliticoUseCase,
  CriarModeloAnaliticoOutput,
  AtualizarModeloAnaliticoUseCase,
  AdicionarEntidadeAnaliticaUseCase,
  ConfigurarAtributosEntidadeUseCase,
  RemoverEntidadeAnaliticaUseCase,
  EspecificarDimensaoCalendarioUseCase,
  AdicionarRelacionamentoAnaliticoUseCase,
  RemoverRelacionamentoAnaliticoUseCase,
  CadastrarMetricaAnaliticaUseCase,
  AtualizarMetricaAnaliticaUseCase,
  RemoverMetricaAnaliticaUseCase,
  AvaliarConformidadeModeloUseCase,
  VerificarProntidaoModeloUseCase,
  ProntidaoModeloOutput,
  HomologarModeloAnaliticoUseCase,
  RevogarHomologacaoModeloUseCase,
  ObterModeloHomologadoVigenteUseCase,
} from '@/core/use-cases/modeling';

import {
  criarModeloSchema,
  atualizarModeloSchema,
  adicionarEntidadeSchema,
  configurarAtributosSchema,
  especificarCalendarioSchema,
  adicionarRelacionamentoSchema,
  cadastrarMetricaSchema,
  atualizarMetricaSchema,
  removerMetricaAnaliticaSchema,
  homologarModeloSchema,
  revogarHomologacaoModeloSchema,
  verificarProntidaoModeloSchema,
  HomologarModeloInput,
  RevogarHomologacaoModeloInput,
  VerificarProntidaoModeloInput,
} from '@/lib/validations/modeling-schema';

import {
  ModeloAnalitico,
  ModeloAnaliticoCompleto,
} from '@/core/domain/entities/modelo-analitico';
import { EntidadeAnalitica, EntidadeAnaliticaComAtributos } from '@/core/domain/entities/entidade-analitica';
import { AtributoAnalitico } from '@/core/domain/entities/atributo-analitico';
import { RelacionamentoAnalitico } from '@/core/domain/entities/relacionamento-analitico';
import { MetricaAnalitica } from '@/core/domain/entities/metrica-analitica';
import { ResultadoAvaliacaoConformidade } from '@/core/domain/rules/modeling-rules-evaluator';
import { z } from 'zod';

export type ModelingActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface ModelingActionDeps {
  demandRepo: IDemandRepository;
  ativoDadosRepo: IAtivoDadosRepository;
  datasetAutorizadoRepo: IDatasetAutorizadoRepository;
  modeloRepo: IModeloAnaliticoRepository;
  entidadeRepo: IEntidadeAnaliticaRepository;
  atributoRepo: IAtributoAnaliticoRepository;
  relacionamentoRepo: IRelacionamentoAnaliticoRepository;
  metricaRepo: IMetricaAnaliticaRepository;
  auditRepo: IAuditRepository;
}

const defaultDemandRepo = new SqliteDemandRepository();
const defaultAtivoDadosRepo = new SqliteAtivoDadosRepository();
const defaultDatasetAutorizadoRepo = new SqliteDatasetAutorizadoRepository();
const defaultModeloRepo = new SqliteModeloAnaliticoRepository();
const defaultEntidadeRepo = new SqliteEntidadeAnaliticaRepository();
const defaultAtributoRepo = new SqliteAtributoAnaliticoRepository();
const defaultRelacionamentoRepo = new SqliteRelacionamentoAnaliticoRepository();
const defaultMetricaRepo = new SqliteMetricaAnaliticaRepository();
const defaultAuditRepo = new SqliteAuditRepository();

function resolveModelingDeps(customDeps?: Partial<ModelingActionDeps>): ModelingActionDeps {
  return {
    demandRepo: customDeps?.demandRepo ?? defaultDemandRepo,
    ativoDadosRepo: customDeps?.ativoDadosRepo ?? defaultAtivoDadosRepo,
    datasetAutorizadoRepo: customDeps?.datasetAutorizadoRepo ?? defaultDatasetAutorizadoRepo,
    modeloRepo: customDeps?.modeloRepo ?? defaultModeloRepo,
    entidadeRepo: customDeps?.entidadeRepo ?? defaultEntidadeRepo,
    atributoRepo: customDeps?.atributoRepo ?? defaultAtributoRepo,
    relacionamentoRepo: customDeps?.relacionamentoRepo ?? defaultRelacionamentoRepo,
    metricaRepo: customDeps?.metricaRepo ?? defaultMetricaRepo,
    auditRepo: customDeps?.auditRepo ?? defaultAuditRepo,
  };
}

function revalidateModelingPaths(demandaId?: string) {
  revalidatePath('/cockpit');
  revalidatePath('/demands');
  revalidatePath('/pipeline');
  if (demandaId) {
    revalidatePath(`/demands/${demandaId}`);
  }
}

function formatErrorMessage(error: any, fallback: string): string {
  if (error && typeof error.message === 'string' && error.message.trim() !== '') {
    return error.message;
  }
  return fallback;
}

// ==========================================
// 1. Modelos Analíticos (Consultas e Ciclo de Vida)
// ==========================================

export async function listarModelosDemandaAction(
  demandaId: string,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<ModeloAnalitico[]>> {
  try {
    const deps = resolveModelingDeps(_deps);
    const modelos = await deps.modeloRepo.findByDemandaId(demandaId);
    return { success: true, data: modelos };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao listar modelos analíticos da demanda.'),
    };
  }
}

export async function obterModeloCompletoAction(
  modeloId: string,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<ModeloAnaliticoCompleto | null>> {
  try {
    const deps = resolveModelingDeps(_deps);
    const modeloCompleto = await deps.modeloRepo.findCompletoById(modeloId);
    return { success: true, data: modeloCompleto };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao obter modelo analítico completo.'),
    };
  }
}

export async function obterModeloAtivoDemandaAction(
  demandaId: string,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<ModeloAnaliticoCompleto | null>> {
  try {
    const deps = resolveModelingDeps(_deps);
    const modelos = await deps.modeloRepo.findByDemandaId(demandaId);
    if (modelos.length === 0) {
      return { success: true, data: null };
    }

    // Prioriza o modelo homologado vigente ou o mais recentemente atualizado
    const homologado = modelos.find((m) => m.status === 'HOMOLOGADO');
    const modeloAlvo = homologado ?? modelos[modelos.length - 1];

    const modeloCompleto = await deps.modeloRepo.findCompletoById(modeloAlvo.id);
    return { success: true, data: modeloCompleto };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao obter modelo analítico ativo da demanda.'),
    };
  }
}

export async function criarModeloAnaliticoAction(
  input: z.input<typeof criarModeloSchema>,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<CriarModeloAnaliticoOutput>> {
  try {
    const deps = resolveModelingDeps(_deps);
    const useCase = new CriarModeloAnaliticoUseCase(
      deps.modeloRepo,
      deps.datasetAutorizadoRepo,
      deps.ativoDadosRepo,
      deps.entidadeRepo,
      deps.atributoRepo
    );

    const result = await useCase.execute(input as any);
    revalidateModelingPaths(input.demandaId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao criar modelo analítico.'),
    };
  }
}

export async function atualizarModeloAnaliticoAction(
  input: z.input<typeof atualizarModeloSchema>,
  demandaId: string,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<ModeloAnalitico>> {
  try {
    const deps = resolveModelingDeps(_deps);
    const useCase = new AtualizarModeloAnaliticoUseCase(deps.modeloRepo);
    const result = await useCase.execute(input);
    revalidateModelingPaths(demandaId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao atualizar modelo analítico.'),
    };
  }
}

// ==========================================
// 2. Entidades Analíticas e Atributos
// ==========================================

export async function adicionarEntidadeAnaliticaAction(
  input: z.input<typeof adicionarEntidadeSchema>,
  demandaId: string,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<EntidadeAnalitica>> {
  try {
    const deps = resolveModelingDeps(_deps);
    const useCase = new AdicionarEntidadeAnaliticaUseCase(
      deps.modeloRepo,
      deps.entidadeRepo,
      deps.ativoDadosRepo
    );

    const result = await useCase.execute(input as any);
    revalidateModelingPaths(demandaId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao adicionar entidade analítica.'),
    };
  }
}

export async function configurarAtributosEntidadeAction(
  input: z.input<typeof configurarAtributosSchema>,
  demandaId: string,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<AtributoAnalitico[]>> {
  try {
    const deps = resolveModelingDeps(_deps);
    const useCase = new ConfigurarAtributosEntidadeUseCase(
      deps.entidadeRepo,
      deps.atributoRepo
    );

    const result = await useCase.execute(input as any);
    revalidateModelingPaths(demandaId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao configurar atributos da entidade.'),
    };
  }
}

export async function removerEntidadeAnaliticaAction(
  entidadeId: string,
  demandaId: string,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<boolean>> {
  try {
    const deps = resolveModelingDeps(_deps);
    const useCase = new RemoverEntidadeAnaliticaUseCase(
      deps.entidadeRepo,
      deps.relacionamentoRepo,
      deps.metricaRepo
    );

    await useCase.execute(entidadeId);
    revalidateModelingPaths(demandaId);
    return { success: true, data: true };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao remover entidade analítica.'),
    };
  }
}

export async function especificarDimensaoCalendarioAction(
  input: z.input<typeof especificarCalendarioSchema>,
  demandaId: string,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<EntidadeAnaliticaComAtributos>> {
  try {
    const deps = resolveModelingDeps(_deps);
    const useCase = new EspecificarDimensaoCalendarioUseCase(
      deps.modeloRepo,
      deps.entidadeRepo,
      deps.atributoRepo
    );

    const result = await useCase.execute(input as any);
    revalidateModelingPaths(demandaId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao especificar dimensão calendário.'),
    };
  }
}

// ==========================================
// 3. Relacionamentos Analíticos
// ==========================================

export async function adicionarRelacionamentoAnaliticoAction(
  input: z.input<typeof adicionarRelacionamentoSchema>,
  demandaId: string,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<RelacionamentoAnalitico>> {
  try {
    const deps = resolveModelingDeps(_deps);
    const useCase = new AdicionarRelacionamentoAnaliticoUseCase(
      deps.modeloRepo,
      deps.entidadeRepo,
      deps.atributoRepo,
      deps.relacionamentoRepo
    );

    const result = await useCase.execute(input as any);
    revalidateModelingPaths(demandaId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao adicionar relacionamento analítico.'),
    };
  }
}

export async function removerRelacionamentoAnaliticoAction(
  relacionamentoId: string,
  demandaId: string,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<boolean>> {
  try {
    const deps = resolveModelingDeps(_deps);
    const useCase = new RemoverRelacionamentoAnaliticoUseCase(
      deps.relacionamentoRepo
    );

    await useCase.execute(relacionamentoId);
    revalidateModelingPaths(demandaId);
    return { success: true, data: true };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao remover relacionamento analítico.'),
    };
  }
}

// ==========================================
// 4. Métricas Analíticas
// ==========================================

export async function cadastrarMetricaAnaliticaAction(
  input: z.input<typeof cadastrarMetricaSchema>,
  demandaId: string,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<MetricaAnalitica>> {
  try {
    const deps = resolveModelingDeps(_deps);
    const useCase = new CadastrarMetricaAnaliticaUseCase(
      deps.modeloRepo,
      deps.entidadeRepo,
      deps.atributoRepo,
      deps.metricaRepo
    );

    const result = await useCase.execute(input as any);
    revalidateModelingPaths(demandaId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao cadastrar métrica analítica.'),
    };
  }
}

export async function atualizarMetricaAnaliticaAction(
  input: z.input<typeof atualizarMetricaSchema>,
  demandaId: string,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<MetricaAnalitica>> {
  try {
    const deps = resolveModelingDeps(_deps);
    const useCase = new AtualizarMetricaAnaliticaUseCase(
      deps.metricaRepo,
      deps.entidadeRepo,
      deps.atributoRepo
    );

    const result = await useCase.execute(input as any);
    revalidateModelingPaths(demandaId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao atualizar métrica analítica.'),
    };
  }
}

export async function removerMetricaAnaliticaAction(
  input: z.infer<typeof removerMetricaAnaliticaSchema>,
  demandaId: string,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<boolean>> {
  try {
    const deps = resolveModelingDeps(_deps);
    const useCase = new RemoverMetricaAnaliticaUseCase(
      deps.metricaRepo,
      deps.modeloRepo
    );

    await useCase.execute(input);
    revalidateModelingPaths(demandaId);
    return { success: true, data: true };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao remover métrica analítica.'),
    };
  }
}

// ==========================================
// 5. Avaliação de Conformidade e Prontidão
// ==========================================

export async function avaliarConformidadeModeloAction(
  modeloId: string,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<ResultadoAvaliacaoConformidade>> {
  try {
    const deps = resolveModelingDeps(_deps);
    const useCase = new AvaliarConformidadeModeloUseCase(
      deps.modeloRepo,
      deps.datasetAutorizadoRepo
    );

    const result = await useCase.execute({ modelo_id: modeloId });
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao avaliar conformidade do modelo analítico.'),
    };
  }
}

export async function verificarProntidaoModeloAction(
  rawInput: VerificarProntidaoModeloInput,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<ProntidaoModeloOutput>> {
  try {
    const validated = verificarProntidaoModeloSchema.parse(rawInput);
    const deps = resolveModelingDeps(_deps);
    const useCase = new VerificarProntidaoModeloUseCase(
      deps.modeloRepo,
      deps.datasetAutorizadoRepo
    );

    const result = await useCase.execute(validated);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao verificar prontidão do modelo analítico.'),
    };
  }
}

// ==========================================
// 6. Governança: Homologação e Revogação
// ==========================================

export async function homologarModeloAnaliticoAction(
  rawInput: HomologarModeloInput,
  demandaId: string,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<ModeloAnalitico>> {
  try {
    const validated = homologarModeloSchema.parse(rawInput);
    const deps = resolveModelingDeps(_deps);
    const useCase = new HomologarModeloAnaliticoUseCase(
      deps.modeloRepo,
      deps.datasetAutorizadoRepo,
      deps.auditRepo
    );

    const result = await useCase.execute(validated);
    revalidateModelingPaths(demandaId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao homologar modelo analítico.'),
    };
  }
}

export async function revogarHomologacaoModeloAction(
  rawInput: RevogarHomologacaoModeloInput,
  demandaId: string,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<ModeloAnalitico>> {
  try {
    const validated = revogarHomologacaoModeloSchema.parse(rawInput);
    const deps = resolveModelingDeps(_deps);
    const useCase = new RevogarHomologacaoModeloUseCase(
      deps.modeloRepo,
      deps.auditRepo
    );

    const result = await useCase.execute(validated);
    revalidateModelingPaths(demandaId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao revogar homologação do modelo analítico.'),
    };
  }
}

export async function obterModeloHomologadoVigenteAction(
  demandaId: string,
  _deps?: Partial<ModelingActionDeps>
): Promise<ModelingActionResult<{ modelo: ModeloAnaliticoCompleto | null; vigente: boolean; motivoInvalidacao?: string }>> {
  try {
    const deps = resolveModelingDeps(_deps);
    const useCase = new ObterModeloHomologadoVigenteUseCase(
      deps.modeloRepo,
      deps.datasetAutorizadoRepo
    );

    const result = await useCase.execute({ demandaId });
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao obter modelo homologado vigente.'),
    };
  }
}
