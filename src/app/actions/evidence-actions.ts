'use server';

/**
 * src/app/actions/evidence-actions.ts
 *
 * Server Actions para o Evidence Core (Aba 8 — Evidências / Subgate 3.5A).
 */

import { revalidatePath } from 'next/cache';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteEvidenciaAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-evidencia-analitica-repository';
import {
  RegistrarEvidenciaUseCase,
  ConsultarEvidenciasDemandaUseCase,
  ConsultarEvidenciasDemandaOutput,
  DeliberarEvidenciaUseCase,
  AlterarExposicaoEvidenciaUseCase,
} from '@/core/use-cases/evidence';
import { EvidenciaAnalitica } from '@/core/domain/entities/evidencia-analitica';
import {
  registrarEvidenciaSchema,
  RegistrarEvidenciaInputSchema,
  deliberarEvidenciaSchema,
  DeliberarEvidenciaInputSchema,
  alterarExposicaoEvidenciaSchema,
  AlterarExposicaoEvidenciaInputSchema,
  consultarEvidenciasDemandaSchema,
  ConsultarEvidenciasDemandaInputSchema,
} from '@/lib/validations/evidence-schema';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function registrarEvidenciaAction(
  rawInput: RegistrarEvidenciaInputSchema
): Promise<ActionResult<EvidenciaAnalitica>> {
  try {
    const parseResult = registrarEvidenciaSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(' | '),
      };
    }

    const data = parseResult.data;
    const evidenciaRepo = new SqliteEvidenciaAnaliticaRepository();
    const demandRepo = new SqliteDemandRepository();
    const useCase = new RegistrarEvidenciaUseCase(evidenciaRepo, demandRepo);

    const evidencia = await useCase.execute({
      demanda_id: data.demandaId,
      projeto_id: data.projetoId,
      tipo: data.tipo,
      etapa_origem: data.etapaOrigem,
      artefato_origem_tipo: data.artefatoOrigemTipo,
      artefato_origem_id: data.artefatoOrigemId,
      titulo: data.titulo,
      descricao: data.descricao,
      fato_observado: data.fatoObservado,
      estado_anterior: data.estadoAnterior,
      acao_registrada: data.acaoRegistrada,
      estado_posterior: data.estadoPosterior,
      resultado_mensuravel: data.resultadoMensuravel,
      inferencia_recomendacao: data.inferenciaRecomendacao,
      decisao_humana: data.decisaoHumana,
      metodo_captura: data.metodoCaptura,
      status_validacao: data.statusValidacao,
      classificacao_exposicao: data.classificacaoExposicao,
      elegibilidade_portfolio: data.elegibilidadePortfolio,
      executor: data.executor,
      metadados: data.metadados,
    });

    revalidatePath(`/demands/${data.demandaId}`);
    return { success: true, data: evidencia };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao registrar evidência analítica.';
    return { success: false, error: message };
  }
}

export async function listarEvidenciasDemandaAction(
  rawInput: ConsultarEvidenciasDemandaInputSchema
): Promise<ActionResult<ConsultarEvidenciasDemandaOutput>> {
  try {
    const parseResult = consultarEvidenciasDemandaSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(' | '),
      };
    }

    const data = parseResult.data;
    const evidenciaRepo = new SqliteEvidenciaAnaliticaRepository();
    const demandRepo = new SqliteDemandRepository();
    const useCase = new ConsultarEvidenciasDemandaUseCase(evidenciaRepo, demandRepo);

    const resultado = await useCase.execute({
      demanda_id: data.demandaId,
      filtros: {
        tipo: data.tipo,
        etapa_origem: data.etapaOrigem,
        status_validacao: data.statusValidacao,
        classificacao_exposicao: data.classificacaoExposicao,
        elegibilidade_portfolio: data.elegibilidadePortfolio,
      },
    });

    return { success: true, data: resultado };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao consultar evidências da demanda.';
    return { success: false, error: message };
  }
}

export async function deliberarEvidenciaAction(
  rawInput: DeliberarEvidenciaInputSchema,
  demandaId?: string
): Promise<ActionResult<EvidenciaAnalitica>> {
  try {
    const parseResult = deliberarEvidenciaSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(' | '),
      };
    }

    const data = parseResult.data;
    const evidenciaRepo = new SqliteEvidenciaAnaliticaRepository();
    const useCase = new DeliberarEvidenciaUseCase(evidenciaRepo);

    const evidenciaAtualizada = await useCase.execute({
      id: data.id,
      status: data.status,
      decisao_humana: data.decisaoHumana,
      revisor: data.revisor,
    });

    if (demandaId) {
      revalidatePath(`/demands/${demandaId}`);
    }
    return { success: true, data: evidenciaAtualizada };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao deliberar evidência.';
    return { success: false, error: message };
  }
}

export async function alterarExposicaoEvidenciaAction(
  rawInput: AlterarExposicaoEvidenciaInputSchema,
  demandaId?: string
): Promise<ActionResult<EvidenciaAnalitica>> {
  try {
    const parseResult = alterarExposicaoEvidenciaSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(' | '),
      };
    }

    const data = parseResult.data;
    const evidenciaRepo = new SqliteEvidenciaAnaliticaRepository();
    const useCase = new AlterarExposicaoEvidenciaUseCase(evidenciaRepo);

    const evidenciaAtualizada = await useCase.execute({
      id: data.id,
      classificacao_exposicao: data.classificacaoExposicao,
      elegibilidade_portfolio: data.elegibilidadePortfolio,
    });

    if (demandaId) {
      revalidatePath(`/demands/${demandaId}`);
    }
    return { success: true, data: evidenciaAtualizada };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao alterar exposição da evidência.';
    return { success: false, error: message };
  }
}
