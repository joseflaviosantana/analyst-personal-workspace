'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { SqliteAtivoDadosRepository } from '@/infrastructure/db/repositories/ativo-dados-repository';
import { SqliteDiagnosticosQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-diagnosticos-qualidade-repository';
import { SqliteProblemasQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-problemas-qualidade-repository';
import { SqliteRegrasQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-regras-qualidade-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';

import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDiagnosticosQualidadeRepository } from '@/core/domain/repositories/diagnosticos-qualidade-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { IRegrasQualidadeRepository } from '@/core/domain/repositories/regras-qualidade-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';

import { ResultadoQualityGate } from '@/core/domain/rules/quality-gate';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { RegraQualidade } from '@/core/domain/entities/regra-qualidade';

import { AvaliarQualityGateUseCase } from '@/core/use-cases/quality/avaliar-quality-gate.use-case';
import { DeliberarProblemaQualidadeUseCase } from '@/core/use-cases/quality/deliberar-problema-qualidade.use-case';
import { AtualizarStatusProblemaUseCase } from '@/core/use-cases/quality/atualizar-status-problema.use-case';
import {
  ExecutarDiagnosticoQualidadeUseCase,
  ExecutarDiagnosticoOutput,
} from '@/core/use-cases/quality/executar-diagnostico-qualidade.use-case';
import {
  ObterDiagnosticoAtivoUseCase,
  ObterDiagnosticoAtivoOutput,
} from '@/core/use-cases/quality/obter-diagnostico-ativo.use-case';
import { ListarProblemasQualidadeUseCase } from '@/core/use-cases/quality/listar-problemas-qualidade.use-case';
import { RegistrarProblemaManualUseCase } from '@/core/use-cases/quality/registrar-problema-manual.use-case';
import { CriarRegraQualidadeUseCase } from '@/core/use-cases/quality/criar-regra-qualidade.use-case';
import { AtualizarRegraQualidadeUseCase } from '@/core/use-cases/quality/atualizar-regra-qualidade.use-case';
import { AlternarStatusRegraQualidadeUseCase } from '@/core/use-cases/quality/alternar-status-regra-qualidade.use-case';
import { ListarRegrasQualidadeUseCase } from '@/core/use-cases/quality/listar-regras-qualidade.use-case';

import {
  evaluateQualityGateSchema,
  deliberateQualityProblemSchema,
  updateQualityProblemStatusSchema,
  runQualityDiagnosticSchema,
  listQualityProblemsSchema,
  registerManualProblemSchema,
  listQualityRulesSchema,
  createQualityRuleSchema,
  updateQualityRuleSchema,
  toggleQualityRuleStatusSchema,
  EvaluateQualityGateInput,
  DeliberateQualityProblemInput,
  UpdateQualityProblemStatusInput,
  RunQualityDiagnosticInput,
  ListQualityProblemsInput,
  RegisterManualProblemInput,
  ListQualityRulesInput,
  CreateQualityRuleInput,
  UpdateQualityRuleInput,
  ToggleQualityRuleStatusInput,
} from '@/lib/validations/quality-schema';

export type QualityActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface QualityActionDeps {
  ativoDadosRepo: IAtivoDadosRepository;
  diagnosticosRepo: IDiagnosticosQualidadeRepository;
  problemasRepo: IProblemasQualidadeRepository;
  regrasRepo: IRegrasQualidadeRepository;
  auditRepo: IAuditRepository;
}

// Singletons padrão para execução em produção no servidor Next.js
const defaultAtivoDadosRepo = new SqliteAtivoDadosRepository();
const defaultDiagnosticosRepo = new SqliteDiagnosticosQualidadeRepository();
const defaultProblemasRepo = new SqliteProblemasQualidadeRepository();
const defaultRegrasRepo = new SqliteRegrasQualidadeRepository();
const defaultAuditRepo = new SqliteAuditRepository();

function resolveDeps(customDeps?: Partial<QualityActionDeps>): QualityActionDeps {
  return {
    ativoDadosRepo: customDeps?.ativoDadosRepo ?? defaultAtivoDadosRepo,
    diagnosticosRepo: customDeps?.diagnosticosRepo ?? defaultDiagnosticosRepo,
    problemasRepo: customDeps?.problemasRepo ?? defaultProblemasRepo,
    regrasRepo: customDeps?.regrasRepo ?? defaultRegrasRepo,
    auditRepo: customDeps?.auditRepo ?? defaultAuditRepo,
  };
}

function revalidateQualityPaths(demandaId?: string) {
  revalidatePath('/cockpit');
  revalidatePath('/demands');
  revalidatePath('/pipeline');
  if (demandaId) {
    revalidatePath(`/demands/${demandaId}`);
  }
}

function formatErrorMessage(error: any, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues.map((i) => i.message).join(' ');
  }
  return error?.message || fallback;
}

/**
 * Server Action: Avaliar o Quality Gate da Demanda
 * Consulta determinística pura baseada no diagnóstico recente e anomalias do universo ativo.
 */
export async function evaluateQualityGateAction(
  data: EvaluateQualityGateInput,
  _deps?: Partial<QualityActionDeps>
): Promise<QualityActionResult<ResultadoQualityGate>> {
  try {
    const parsed = evaluateQualityGateSchema.parse(data);
    const deps = resolveDeps(_deps);
    const useCase = new AvaliarQualityGateUseCase(
      deps.ativoDadosRepo,
      deps.diagnosticosRepo,
      deps.problemasRepo
    );

    const resultado = await useCase.execute({
      demandaId: parsed.demandaId,
      ativoDadosId: parsed.ativoDadosId,
    });

    return { success: true, data: resultado };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao avaliar o Quality Gate da demanda.'),
    };
  }
}

/**
 * Server Action: Deliberação Humana Soberana sobre Problema de Qualidade
 * Registra severidade definitiva, ação deliberada, justificativa formal >= 15 caracteres e auditoria.
 */
export async function deliberateQualityProblemAction(
  data: DeliberateQualityProblemInput,
  _deps?: Partial<QualityActionDeps>
): Promise<QualityActionResult<ProblemaQualidade>> {
  try {
    const parsed = deliberateQualityProblemSchema.parse(data);
    const deps = resolveDeps(_deps);
    const useCase = new DeliberarProblemaQualidadeUseCase(
      deps.problemasRepo,
      deps.auditRepo
    );

    const problemaAtualizado = await useCase.execute({
      problemaId: parsed.problemaId,
      severidade: parsed.severidade,
      acaoDeliberada: parsed.acaoDeliberada,
      justificativa: parsed.justificativa,
      status: parsed.status,
      impactoCalculo: parsed.impactoCalculo,
      autorTipo: 'HUMANO',
    });

    revalidateQualityPaths(parsed.demandaId);
    return { success: true, data: problemaAtualizado };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao deliberar sobre o problema de qualidade.'),
    };
  }
}

/**
 * Server Action: Atualizar Status Operacional de um Problema de Qualidade
 * Permite alteração de status com justificativa formal >= 15 caracteres e auditoria.
 */
export async function updateQualityProblemStatusAction(
  data: UpdateQualityProblemStatusInput,
  _deps?: Partial<QualityActionDeps>
): Promise<QualityActionResult<ProblemaQualidade>> {
  try {
    const parsed = updateQualityProblemStatusSchema.parse(data);
    const deps = resolveDeps(_deps);
    const useCase = new AtualizarStatusProblemaUseCase(
      deps.problemasRepo,
      deps.auditRepo
    );

    const problemaAtualizado = await useCase.execute({
      problemaId: parsed.problemaId,
      novoStatus: parsed.novoStatus,
      justificativa: parsed.justificativa,
      autorTipo: 'HUMANO',
    });

    revalidateQualityPaths(parsed.demandaId);
    return { success: true, data: problemaAtualizado };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao atualizar o status do problema de qualidade.'),
    };
  }
}

/**
 * Server Action: Executar Diagnóstico Determinístico de Qualidade
 * Dispara scanner e avaliador de regras R1-R5, gerando problemas com severidade PENDENTE.
 */
export async function runQualityDiagnosticAction(
  data: RunQualityDiagnosticInput,
  _deps?: Partial<QualityActionDeps>
): Promise<QualityActionResult<ExecutarDiagnosticoOutput>> {
  try {
    const parsed = runQualityDiagnosticSchema.parse(data);
    const deps = resolveDeps(_deps);
    const useCase = new ExecutarDiagnosticoQualidadeUseCase(
      deps.ativoDadosRepo,
      deps.diagnosticosRepo,
      deps.problemasRepo,
      deps.regrasRepo
    );

    const resultado = await useCase.execute({
      ativoDadosId: parsed.ativoDadosId,
      abaAlvoXlsx: parsed.abaAlvoXlsx ?? undefined,
    });

    revalidateQualityPaths(parsed.demandaId);
    return { success: true, data: resultado };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao executar o diagnóstico de qualidade.'),
    };
  }
}

/**
 * Server Action: Obter Diagnóstico Vigente, Achados e Histórico do Ativo
 */
export async function getAssetQualityDiagnosticAction(
  ativoDadosId: string,
  _deps?: Partial<QualityActionDeps>
): Promise<QualityActionResult<ObterDiagnosticoAtivoOutput>> {
  try {
    if (!ativoDadosId || ativoDadosId.trim() === '') {
      return { success: false, error: 'O ID do ativo de dados é obrigatório.' };
    }
    const deps = resolveDeps(_deps);
    const useCase = new ObterDiagnosticoAtivoUseCase(
      deps.diagnosticosRepo,
      deps.problemasRepo
    );

    const output = await useCase.execute(ativoDadosId.trim());
    return { success: true, data: output };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao carregar o diagnóstico de qualidade do ativo.'),
    };
  }
}

/**
 * Server Action: Listar Problemas de Qualidade com Filtros
 */
export async function listQualityProblemsAction(
  data: ListQualityProblemsInput,
  _deps?: Partial<QualityActionDeps>
): Promise<QualityActionResult<ProblemaQualidade[]>> {
  try {
    const parsed = listQualityProblemsSchema.parse(data);
    const deps = resolveDeps(_deps);
    const useCase = new ListarProblemasQualidadeUseCase(deps.problemasRepo);

    const problemas = await useCase.execute(parsed);
    return { success: true, data: problemas };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao listar problemas de qualidade.'),
    };
  }
}

/**
 * Server Action: Registrar Anomalia Manualmente
 * Registra anomalia informada pelo analista. Severidade nasce sempre PENDENTE.
 */
export async function registerManualProblemAction(
  data: RegisterManualProblemInput,
  _deps?: Partial<QualityActionDeps>
): Promise<QualityActionResult<ProblemaQualidade>> {
  try {
    const parsed = registerManualProblemSchema.parse(data);
    const deps = resolveDeps(_deps);
    const useCase = new RegistrarProblemaManualUseCase(
      deps.ativoDadosRepo,
      deps.problemasRepo
    );

    const problema = await useCase.execute({
      ativoDadosId: parsed.ativoDadosId,
      demandaId: parsed.demandaId,
      diagnosticoId: parsed.diagnosticoId,
      categoria: parsed.categoria,
      titulo: parsed.titulo,
      descricao: parsed.descricao,
      tabelaAfetada: parsed.tabelaAfetada,
      colunaAfetada: parsed.colunaAfetada,
      totalLinhasAfetadas: parsed.totalLinhasAfetadas,
      percentualLinhasAfetadas: parsed.percentualLinhasAfetadas,
    });

    revalidateQualityPaths(parsed.demandaId);
    return { success: true, data: problema };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao registrar anomalia manual de qualidade.'),
    };
  }
}

/**
 * Server Action: Listar Regras de Qualidade do Ativo
 */
export async function listQualityRulesAction(
  data: ListQualityRulesInput,
  _deps?: Partial<QualityActionDeps>
): Promise<QualityActionResult<RegraQualidade[]>> {
  try {
    const parsed = listQualityRulesSchema.parse(data);
    const deps = resolveDeps(_deps);
    const useCase = new ListarRegrasQualidadeUseCase(deps.regrasRepo);

    const regras = await useCase.execute(parsed);
    return { success: true, data: regras };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao listar regras de qualidade do ativo.'),
    };
  }
}

/**
 * Server Action: Criar Regra de Qualidade (R1 a R5)
 */
export async function createQualityRuleAction(
  data: CreateQualityRuleInput,
  _deps?: Partial<QualityActionDeps>
): Promise<QualityActionResult<RegraQualidade>> {
  try {
    const parsed = createQualityRuleSchema.parse(data);
    const deps = resolveDeps(_deps);
    const useCase = new CriarRegraQualidadeUseCase(
      deps.ativoDadosRepo,
      deps.regrasRepo
    );

    const regra = await useCase.execute({
      ativoDadosId: parsed.ativoDadosId,
      tipo: parsed.tipo,
      nome: parsed.nome,
      descricao: parsed.descricao,
      coluna: parsed.coluna,
      colunas: parsed.colunas,
      parametros: parsed.parametros,
    });

    revalidateQualityPaths(parsed.demandaId);
    return { success: true, data: regra };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao criar regra de qualidade.'),
    };
  }
}

/**
 * Server Action: Atualizar Regra de Qualidade
 */
export async function updateQualityRuleAction(
  data: UpdateQualityRuleInput,
  _deps?: Partial<QualityActionDeps>
): Promise<QualityActionResult<RegraQualidade>> {
  try {
    const parsed = updateQualityRuleSchema.parse(data);
    const deps = resolveDeps(_deps);
    const useCase = new AtualizarRegraQualidadeUseCase(deps.regrasRepo);

    const regraAtualizada = await useCase.execute({
      id: parsed.id,
      nome: parsed.nome,
      descricao: parsed.descricao,
      tipo: parsed.tipo,
      coluna: parsed.coluna,
      colunas: parsed.colunas,
      parametros: parsed.parametros,
    });

    revalidateQualityPaths(parsed.demandaId);
    return { success: true, data: regraAtualizada };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao atualizar regra de qualidade.'),
    };
  }
}

/**
 * Server Action: Alternar Status de Regra de Qualidade (ATIVA <-> INATIVA)
 * Invariante normativa: Zero deleção física.
 */
export async function toggleQualityRuleStatusAction(
  data: ToggleQualityRuleStatusInput,
  _deps?: Partial<QualityActionDeps>
): Promise<QualityActionResult<RegraQualidade>> {
  try {
    const parsed = toggleQualityRuleStatusSchema.parse(data);
    const deps = resolveDeps(_deps);
    const useCase = new AlternarStatusRegraQualidadeUseCase(deps.regrasRepo);

    const regraAtualizada = await useCase.execute({
      id: parsed.id,
      novoStatus: parsed.novoStatus,
    });

    revalidateQualityPaths(parsed.demandaId);
    return { success: true, data: regraAtualizada };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao alternar status da regra de qualidade.'),
    };
  }
}
