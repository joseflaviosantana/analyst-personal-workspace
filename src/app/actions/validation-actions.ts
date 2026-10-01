'use server';

/**
 * src/app/actions/validation-actions.ts
 *
 * Server Actions para a etapa de Validação & Conciliação Multicamadas (Aba 9 / Subgate 3.7B).
 * Conecta a UI aos use cases de validação, motor de regras V-01/V-02 e
 * integração pós-persistência determinística com o Evidence Event Engine.
 */

import { revalidatePath } from 'next/cache';
import { IValidacaoConciliacaoRepository } from '@/core/domain/repositories/validacao-conciliacao-repository.interface';
import { IEntregavelDemandaRepository } from '@/core/domain/repositories/entregavel-demanda-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';

import { SqliteValidacaoConciliacaoRepository } from '@/infrastructure/db/repositories/sqlite-validacao-conciliacao-repository';
import { SqliteEntregavelDemandaRepository } from '@/infrastructure/db/repositories/sqlite-entregavel-demanda-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';

import {
  RegistrarValidacaoConciliacaoUseCase,
  AtualizarValidacaoConciliacaoUseCase,
  RetestarValidacaoConciliacaoUseCase,
  ListarValidacoesDemandaUseCase,
  RemoverValidacaoConciliacaoUseCase,
  AvaliarProntidaoValidacaoUseCase,
} from '@/core/use-cases/validation';

import {
  CreateValidacaoConciliacaoInput,
  UpdateValidacaoConciliacaoInput,
  RetestValidacaoConciliacaoInput,
} from '@/lib/validations/validation-schema';

import { ValidacaoConciliacao } from '@/core/domain/entities/validacao-conciliacao';
import { ResultadoAvaliacaoValidacao } from '@/core/domain/rules/validation-rules-evaluator';

import { SqliteEventoAnaliticoLogRepository } from '@/infrastructure/db/repositories/sqlite-evento-analitico-log-repository';
import { SqliteEvidenciaAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-evidencia-analitica-repository';
import {
  RegistrarEvidenciaUseCase,
  ProcessarEventoAnaliticoUseCase,
} from '@/core/use-cases/evidence';
import {
  criarEvidenceEventEnginePadrao,
  EventoAnalitico,
} from '@/core/domain/evidence-events';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';

export type ValidationActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface ValidationActionDeps {
  validacaoRepo: IValidacaoConciliacaoRepository;
  entregavelRepo: IEntregavelDemandaRepository;
  demandRepo: IDemandRepository;
  auditRepo: IAuditRepository;
  processarEventoUseCase: ProcessarEventoAnaliticoUseCase;
}

const defaultValidacaoRepo = new SqliteValidacaoConciliacaoRepository();
const defaultEntregavelRepo = new SqliteEntregavelDemandaRepository();
const defaultDemandRepo = new SqliteDemandRepository();
const defaultAuditRepo = new SqliteAuditRepository();

function resolveValidationDeps(customDeps?: Partial<ValidationActionDeps>): ValidationActionDeps {
  const validacaoRepo = customDeps?.validacaoRepo ?? defaultValidacaoRepo;
  const entregavelRepo = customDeps?.entregavelRepo ?? defaultEntregavelRepo;
  const demandRepo = customDeps?.demandRepo ?? defaultDemandRepo;
  const auditRepo = customDeps?.auditRepo ?? defaultAuditRepo;

  let processarEventoUseCase = customDeps?.processarEventoUseCase;
  if (!processarEventoUseCase) {
    const eventoLogRepo = new SqliteEventoAnaliticoLogRepository();
    const evidenciaRepo = new SqliteEvidenciaAnaliticaRepository();
    const engine = criarEvidenceEventEnginePadrao();
    const registrarEvidenciaUseCase = new RegistrarEvidenciaUseCase(evidenciaRepo, demandRepo);
    processarEventoUseCase = new ProcessarEventoAnaliticoUseCase(
      engine,
      eventoLogRepo,
      registrarEvidenciaUseCase
    );
  }

  return {
    validacaoRepo,
    entregavelRepo,
    demandRepo,
    auditRepo,
    processarEventoUseCase,
  };
}

function revalidateAllPaths(demandaId: string) {
  revalidatePath('/cockpit');
  revalidatePath('/demands');
  revalidatePath('/pipeline');
  revalidatePath(`/demands/${demandaId}`);
}

/**
 * Consulta todas as validações e conciliações vinculadas à demanda.
 */
export async function listarValidacoesAction(
  demandaId: string,
  _deps?: Partial<ValidationActionDeps>
): Promise<ValidationActionResult<ValidacaoConciliacao[]>> {
  try {
    const deps = resolveValidationDeps(_deps);
    const useCase = new ListarValidacoesDemandaUseCase(deps.validacaoRepo);
    const validacoes = await useCase.execute(demandaId);
    return { success: true, data: validacoes };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao listar validações da demanda.',
    };
  }
}

/**
 * Avalia deterministicamente as regras V-01/V-02 e prontidão para a etapa de Entrega.
 */
export async function obterProntidaoValidacaoAction(
  demandaId: string,
  _deps?: Partial<ValidationActionDeps>
): Promise<ValidationActionResult<ResultadoAvaliacaoValidacao>> {
  try {
    const deps = resolveValidationDeps(_deps);
    const useCase = new AvaliarProntidaoValidacaoUseCase(deps.validacaoRepo, deps.entregavelRepo);
    const resultado = await useCase.execute(demandaId);
    return { success: true, data: resultado };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao avaliar prontidão da etapa de validação.',
    };
  }
}

/**
 * Cadastra e executa um novo teste de conciliação / validação analítica.
 */
export async function registrarValidacaoAction(
  input: CreateValidacaoConciliacaoInput,
  demandaId: string,
  _deps?: Partial<ValidationActionDeps>
): Promise<ValidationActionResult<ValidacaoConciliacao>> {
  try {
    const deps = resolveValidationDeps(_deps);
    const useCase = new RegistrarValidacaoConciliacaoUseCase(deps.validacaoRepo, deps.auditRepo);
    const validacao = await useCase.execute(input);

    // Emissão Determinística de Evento Analítico (Subgate 3.7B)
    try {
      const demand = await deps.demandRepo.findById(demandaId);
      const idEvento = `evt_val_reg_${validacao.id}_${validacao.criado_em}`;
      const evento: EventoAnalitico = {
        id_evento: idEvento,
        demanda_id: demandaId,
        projeto_id: demand?.projeto_id ?? null,
        etapa_origem: EtapaOrigemEvidencia.VALIDACAO,
        categoria: 'VALIDACAO',
        tipo_evento: 'VALIDACAO_CONCILIACAO_REGISTRADA',
        ocorrido_em: validacao.criado_em,
        executor: validacao.executado_por || 'ANALISTA',
        artefato_origem_tipo: 'VALIDACAO_CONCILIACAO',
        artefato_origem_id: validacao.id,
        payload: {
          validacaoId: validacao.id,
          demandaId: validacao.demanda_id,
          titulo: validacao.titulo,
          camada: validacao.camada,
          metodoVerificacao: validacao.metodo_verificacao,
          baseReferencia: validacao.base_referencia,
          metricaId: validacao.metrica_id,
          valorEsperado: validacao.valor_esperado,
          valorObtido: validacao.valor_obtido,
          divergenciaAbsoluta: validacao.divergencia_absoluta,
          divergenciaPercentual: validacao.divergencia_percentual,
          toleranciaPermitida: validacao.tolerancia_permitida,
          unidadeMedida: validacao.unidade_medida,
          resultado: validacao.resultado,
          obrigatoria: validacao.obrigatoria,
          executadoPor: validacao.executado_por,
          executadoEm: validacao.executado_em,
          criadoEm: validacao.criado_em,
        },
        versao_contrato: '1.0',
      };
      await deps.processarEventoUseCase.execute(evento);
    } catch {
      // Contenção de falhas: o fluxo profissional nunca é interrompido por falha no motor de evidências
    }

    revalidateAllPaths(demandaId);
    return { success: true, data: validacao };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao registrar check de validação.',
    };
  }
}

/**
 * Executa reteste ágil de uma validação após ajustes em fórmulas, modelos ou dados.
 */
export async function retestarValidacaoAction(
  input: RetestValidacaoConciliacaoInput,
  demandaId: string,
  _deps?: Partial<ValidationActionDeps>
): Promise<ValidationActionResult<ValidacaoConciliacao>> {
  try {
    const deps = resolveValidationDeps(_deps);
    const useCase = new RetestarValidacaoConciliacaoUseCase(deps.validacaoRepo, deps.auditRepo);
    const validacao = await useCase.execute(input);

    // Emissão Determinística de Evento de Reteste (Subgate 3.7B)
    try {
      const demand = await deps.demandRepo.findById(demandaId);
      const idEvento = `evt_val_ret_${validacao.id}_${validacao.atualizado_em}`;
      const evento: EventoAnalitico = {
        id_evento: idEvento,
        demanda_id: demandaId,
        projeto_id: demand?.projeto_id ?? null,
        etapa_origem: EtapaOrigemEvidencia.VALIDACAO,
        categoria: 'VALIDACAO',
        tipo_evento: 'VALIDACAO_CONCILIACAO_RETESTADA',
        ocorrido_em: validacao.atualizado_em,
        executor: input.executado_por || 'ANALISTA',
        artefato_origem_tipo: 'VALIDACAO_CONCILIACAO',
        artefato_origem_id: validacao.id,
        payload: {
          validacaoId: validacao.id,
          demandaId: validacao.demanda_id,
          titulo: validacao.titulo,
          camada: validacao.camada,
          baseReferencia: validacao.base_referencia,
          valorEsperado: validacao.valor_esperado,
          novoValorObtido: input.valor_obtido,
          novaDivergenciaAbsoluta: validacao.divergencia_absoluta,
          novaDivergenciaPercentual: validacao.divergencia_percentual,
          toleranciaPermitida: validacao.tolerancia_permitida,
          novoResultado: validacao.resultado,
          executadoPor: input.executado_por,
          executadoEm: validacao.executado_em || validacao.atualizado_em,
          notasEvidencia: input.notas_evidencia,
          atualizadoEm: validacao.atualizado_em,
        },
        versao_contrato: '1.0',
      };
      await deps.processarEventoUseCase.execute(evento);
    } catch {
      // Contenção de falhas
    }

    revalidateAllPaths(demandaId);
    return { success: true, data: validacao };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao retestar validação.',
    };
  }
}

/**
 * Atualiza campos cadastrais de uma validação existente.
 */
export async function atualizarValidacaoAction(
  input: UpdateValidacaoConciliacaoInput,
  demandaId: string,
  _deps?: Partial<ValidationActionDeps>
): Promise<ValidationActionResult<ValidacaoConciliacao>> {
  try {
    const deps = resolveValidationDeps(_deps);
    const useCase = new AtualizarValidacaoConciliacaoUseCase(deps.validacaoRepo, deps.auditRepo);
    const validacao = await useCase.execute(input);

    revalidateAllPaths(demandaId);
    return { success: true, data: validacao };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao atualizar validação.',
    };
  }
}

/**
 * Remove um check de validação da demanda.
 */
export async function removerValidacaoAction(
  id: string,
  demandaId: string,
  _deps?: Partial<ValidationActionDeps>
): Promise<ValidationActionResult<{ id: string }>> {
  try {
    const deps = resolveValidationDeps(_deps);
    const useCase = new RemoverValidacaoConciliacaoUseCase(deps.validacaoRepo, deps.auditRepo);
    await useCase.execute(id);

    revalidateAllPaths(demandaId);
    return { success: true, data: { id } };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao remover validação.',
    };
  }
}
