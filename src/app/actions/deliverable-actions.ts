'use server';

/**
 * src/app/actions/deliverable-actions.ts
 *
 * Server Actions para a etapa de Entregáveis & Aceite Formal (Aba 10 / Subgate 3.7C).
 * Conecta a interface aos casos de uso de entregáveis, ao avaliador de regras V-03/V-04,
 * à geração de documentação para o contratante e ao despacho pós-persistência determinístico
 * para o Evidence Event Engine.
 */

import { revalidatePath } from 'next/cache';
import { IEntregavelDemandaRepository } from '@/core/domain/repositories/entregavel-demanda-repository.interface';
import { IValidacaoConciliacaoRepository } from '@/core/domain/repositories/validacao-conciliacao-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';

import { SqliteEntregavelDemandaRepository } from '@/infrastructure/db/repositories/sqlite-entregavel-demanda-repository';
import { SqliteValidacaoConciliacaoRepository } from '@/infrastructure/db/repositories/sqlite-validacao-conciliacao-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';

import {
  RegistrarEntregavelDemandaUseCase,
  AtualizarEntregavelDemandaUseCase,
  RemoverEntregavelDemandaUseCase,
  ListarEntregaveisDemandaUseCase,
  RegistrarAceiteEntregaUseCase,
} from '@/core/use-cases/validation';

import {
  createEntregavelDemandaSchema,
  updateEntregavelDemandaSchema,
  registrarAceiteEntregaSchema,
  CreateEntregavelDemandaInput,
  UpdateEntregavelDemandaInput,
  RegistrarAceiteEntregaInput,
} from '@/lib/validations/validation-schema';

import { EntregavelDemanda } from '@/core/domain/entities/entregavel-demanda';
import { StatusEntregavel } from '@/core/domain/enums/status-entregavel';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';
import { ValidationRulesEvaluator, ResultadoAvaliacaoValidacao } from '@/core/domain/rules/validation-rules-evaluator';
import { WorkflowEngine } from '@/core/domain/rules/workflow-engine';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { ContractorDocumentationGenerator } from '@/core/domain/delivery/contractor-documentation-generator';

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

export type DeliverableActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface DeliverableActionDeps {
  entregavelRepo: IEntregavelDemandaRepository;
  validacaoRepo: IValidacaoConciliacaoRepository;
  demandRepo: IDemandRepository;
  auditRepo: IAuditRepository;
  processarEventoUseCase: ProcessarEventoAnaliticoUseCase;
}

const defaultEntregavelRepo = new SqliteEntregavelDemandaRepository();
const defaultValidacaoRepo = new SqliteValidacaoConciliacaoRepository();
const defaultDemandRepo = new SqliteDemandRepository();
const defaultAuditRepo = new SqliteAuditRepository();

export function resolveDeliverableDeps(customDeps?: Partial<DeliverableActionDeps>): DeliverableActionDeps {
  const entregavelRepo = customDeps?.entregavelRepo ?? defaultEntregavelRepo;
  const validacaoRepo = customDeps?.validacaoRepo ?? defaultValidacaoRepo;
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
    entregavelRepo,
    validacaoRepo,
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
 * 1. Lista todos os entregáveis cadastrados para a demanda
 */
export async function listarEntregaveisAction(
  demandaId: string,
  customDeps?: Partial<DeliverableActionDeps>
): Promise<DeliverableActionResult<EntregavelDemanda[]>> {
  try {
    const { entregavelRepo } = resolveDeliverableDeps(customDeps);
    const useCase = new ListarEntregaveisDemandaUseCase(entregavelRepo);
    const entregaveis = await useCase.execute(demandaId);
    return { success: true, data: entregaveis };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao listar entregáveis da demanda.';
    return { success: false, error: msg };
  }
}

/**
 * 2. Cadastra novo entregável profissional com despacho determinístico
 */
export async function registrarEntregavelAction(
  input: CreateEntregavelDemandaInput,
  customDeps?: Partial<DeliverableActionDeps>
): Promise<DeliverableActionResult<EntregavelDemanda>> {
  try {
    const { entregavelRepo, auditRepo, demandRepo, processarEventoUseCase } = resolveDeliverableDeps(customDeps);
    const validatedData = createEntregavelDemandaSchema.parse(input);

    const useCase = new RegistrarEntregavelDemandaUseCase(entregavelRepo, auditRepo);
    const criado = await useCase.execute(validatedData);

    // Despacho determinístico para o Evidence Event Engine com contenção de falhas
    try {
      const demanda = await demandRepo.findById(criado.demanda_id);
      const evento: EventoAnalitico = {
        id_evento: `evt_ent_reg_${criado.id}`,
        demanda_id: criado.demanda_id,
        projeto_id: demanda?.projeto_id || null,
        etapa_origem: EtapaOrigemEvidencia.ENTREGA,
        categoria: 'ENTREGA',
        tipo_evento: 'ENTREGA_ARTEFATO_REGISTRADO',
        ocorrido_em: criado.criado_em,
        executor: 'ANALISTA',
        artefato_origem_tipo: 'ENTREGAVEL_DEMANDA',
        artefato_origem_id: criado.id,
        payload: {
          entregavelId: criado.id,
          demandaId: criado.demanda_id,
          titulo: criado.titulo,
          tipo: criado.tipo,
          versao: criado.versao,
          obrigatorio: criado.obrigatorio,
          status: criado.status,
          criadoEm: criado.criado_em,
        },
        versao_contrato: '1.0',
      };

      await processarEventoUseCase.execute(evento);
    } catch (evtErr: unknown) {
      console.warn('[EvidenceEventEngine] Falha ao despachar evento ENTREGA_ARTEFATO_REGISTRADO:', evtErr);
    }

    revalidateAllPaths(criado.demanda_id);
    return { success: true, data: criado };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao cadastrar entregável profissional.';
    return { success: false, error: msg };
  }
}

/**
 * 3. Atualiza dados de entregável profissional existente
 */
export async function atualizarEntregavelAction(
  input: UpdateEntregavelDemandaInput,
  customDeps?: Partial<DeliverableActionDeps>
): Promise<DeliverableActionResult<EntregavelDemanda>> {
  try {
    const { entregavelRepo, auditRepo } = resolveDeliverableDeps(customDeps);
    const validatedData = updateEntregavelDemandaSchema.parse(input);

    const useCase = new AtualizarEntregavelDemandaUseCase(entregavelRepo, auditRepo);
    const atualizado = await useCase.execute(validatedData);

    revalidateAllPaths(atualizado.demanda_id);
    return { success: true, data: atualizado };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao atualizar entregável profissional.';
    return { success: false, error: msg };
  }
}

/**
 * 4. Remove entregável profissional
 */
export async function removerEntregavelAction(
  id: string,
  customDeps?: Partial<DeliverableActionDeps>
): Promise<DeliverableActionResult<{ id: string }>> {
  try {
    const { entregavelRepo, auditRepo } = resolveDeliverableDeps(customDeps);
    const existente = await entregavelRepo.findById(id);
    if (!existente) {
      return { success: false, error: `Entregável com ID '${id}' não encontrado.` };
    }

    const useCase = new RemoverEntregavelDemandaUseCase(entregavelRepo, auditRepo);
    await useCase.execute(id);

    revalidateAllPaths(existente.demanda_id);
    return { success: true, data: { id } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao remover entregável.';
    return { success: false, error: msg };
  }
}

/**
 * 5. Disponibiliza entregável formalmente (transição RASCUNHO -> DISPONIVEL)
 */
export async function disponibilizarEntregavelAction(
  id: string,
  customDeps?: Partial<DeliverableActionDeps>
): Promise<DeliverableActionResult<EntregavelDemanda>> {
  try {
    const { entregavelRepo, auditRepo, demandRepo, processarEventoUseCase } = resolveDeliverableDeps(customDeps);
    const existente = await entregavelRepo.findById(id);
    if (!existente) {
      return { success: false, error: `Entregável com ID '${id}' não encontrado.` };
    }

    const useCase = new AtualizarEntregavelDemandaUseCase(entregavelRepo, auditRepo);
    const atualizado = await useCase.execute({
      id,
      status: StatusEntregavel.DISPONIVEL,
    });

    // Despacho determinístico para o Evidence Event Engine
    try {
      const demanda = await demandRepo.findById(atualizado.demanda_id);
      const evento: EventoAnalitico = {
        id_evento: `evt_ent_disp_${atualizado.demanda_id}_${atualizado.id}_v${atualizado.versao}`,
        demanda_id: atualizado.demanda_id,
        projeto_id: demanda?.projeto_id || null,
        etapa_origem: EtapaOrigemEvidencia.ENTREGA,
        categoria: 'ENTREGA',
        tipo_evento: 'ENTREGA_PACOTE_DISPONIBILIZADO',
        ocorrido_em: atualizado.atualizado_em,
        executor: 'ANALISTA',
        artefato_origem_tipo: 'ENTREGAVEL_DEMANDA',
        artefato_origem_id: atualizado.id,
        payload: {
          demandaId: atualizado.demanda_id,
          entregavelId: atualizado.id,
          titulo: atualizado.titulo,
          versao: atualizado.versao,
          disponibilizadoEm: atualizado.atualizado_em,
        },
        versao_contrato: '1.0',
      };

      await processarEventoUseCase.execute(evento);
    } catch (evtErr: unknown) {
      console.warn('[EvidenceEventEngine] Falha ao despachar evento ENTREGA_PACOTE_DISPONIBILIZADO:', evtErr);
    }

    revalidateAllPaths(atualizado.demanda_id);
    return { success: true, data: atualizado };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao disponibilizar entregável.';
    return { success: false, error: msg };
  }
}

/**
 * 6. Registra deliberação formal de aceite (ACEITO, REJEITADO ou AJUSTES_SOLICITADOS)
 */
export async function registrarAceiteEntregaAction(
  input: RegistrarAceiteEntregaInput,
  customDeps?: Partial<DeliverableActionDeps>
): Promise<DeliverableActionResult<EntregavelDemanda>> {
  try {
    const { entregavelRepo, auditRepo, demandRepo, processarEventoUseCase } = resolveDeliverableDeps(customDeps);
    const validatedData = registrarAceiteEntregaSchema.parse(input);

    const useCase = new RegistrarAceiteEntregaUseCase(entregavelRepo, auditRepo);
    const homologado = await useCase.execute(validatedData);

    // Despacho determinístico para o Evidence Event Engine
    try {
      const demanda = await demandRepo.findById(homologado.demanda_id);
      const timestampAceite = homologado.aceite_em || homologado.atualizado_em;

      let tipoEvento = 'ENTREGA_ACEITE_FORMALIZADO';
      let idEvento = `evt_ent_aceito_${homologado.id}_${timestampAceite}`;

      if (homologado.aceite_status === StatusAceiteEntrega.AJUSTES_SOLICITADOS) {
        tipoEvento = 'ENTREGA_AJUSTE_SOLICITADO';
        idEvento = `evt_ent_ajustes_${homologado.id}_${timestampAceite}`;
      } else if (homologado.aceite_status === StatusAceiteEntrega.REJEITADO) {
        tipoEvento = 'ENTREGA_REJEITADA';
        idEvento = `evt_ent_rejeitado_${homologado.id}_${timestampAceite}`;
      }

      const evento: EventoAnalitico = {
        id_evento: idEvento,
        demanda_id: homologado.demanda_id,
        projeto_id: demanda?.projeto_id || null,
        etapa_origem: EtapaOrigemEvidencia.ENTREGA,
        categoria: 'ENTREGA',
        tipo_evento: tipoEvento,
        ocorrido_em: timestampAceite,
        executor: homologado.aceite_por || 'STAKEHOLDER',
        artefato_origem_tipo: 'ENTREGAVEL_DEMANDA',
        artefato_origem_id: homologado.id,
        payload: {
          entregavelId: homologado.id,
          demandaId: homologado.demanda_id,
          titulo: homologado.titulo,
          versao: homologado.versao,
          aceitePor: homologado.aceite_por,
          aceiteEm: timestampAceite,
          aceiteJustificativa: homologado.aceite_justificativa,
          solicitadoPor: homologado.aceite_por,
          dataSolicitacao: timestampAceite,
          ajustesDescricao: homologado.aceite_justificativa,
          rejeitadoPor: homologado.aceite_por,
          dataRejeicao: timestampAceite,
          motivoRejeicao: homologado.aceite_justificativa,
        },
        versao_contrato: '1.0',
      };

      await processarEventoUseCase.execute(evento);
    } catch (evtErr: unknown) {
      console.warn('[EvidenceEventEngine] Falha ao despachar evento de aceite formal:', evtErr);
    }

    revalidateAllPaths(homologado.demanda_id);
    return { success: true, data: homologado };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao registrar deliberação de aceite.';
    return { success: false, error: msg };
  }
}

/**
 * 7. Avalia prontidão completa da etapa de entrega (regras V-03 e V-04)
 */
export async function obterProntidaoEntregaAction(
  demandaId: string,
  customDeps?: Partial<DeliverableActionDeps>
): Promise<DeliverableActionResult<ResultadoAvaliacaoValidacao>> {
  try {
    const { validacaoRepo, entregavelRepo } = resolveDeliverableDeps(customDeps);
    const [validacoes, entregaveis] = await Promise.all([
      validacaoRepo.findByDemandId(demandaId),
      entregavelRepo.findByDemandId(demandaId),
    ]);

    const resultado = ValidationRulesEvaluator.avaliar(validacoes, entregaveis);
    return { success: true, data: resultado };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao avaliar prontidão de entrega.';
    return { success: false, error: msg };
  }
}

/**
 * 8. Gera documento profissional para o contratante em Markdown
 */
export async function gerarDocumentacaoContratanteAction(
  demandaId: string,
  customDeps?: Partial<DeliverableActionDeps>
): Promise<DeliverableActionResult<string>> {
  try {
    const { demandRepo, entregavelRepo, validacaoRepo } = resolveDeliverableDeps(customDeps);
    const demanda = await demandRepo.findById(demandaId);
    if (!demanda) {
      return { success: false, error: `Demanda com ID '${demandaId}' não encontrada.` };
    }

    const [entregaveis, validacoes] = await Promise.all([
      entregavelRepo.findByDemandId(demandaId),
      validacaoRepo.findByDemandId(demandaId),
    ]);

    const markdown = ContractorDocumentationGenerator.gerar({
      demanda,
      entregaveis,
      validacoes,
    });

    return { success: true, data: markdown };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao gerar documentação para contratante.';
    return { success: false, error: msg };
  }
}

/**
 * 9. Formaliza o encerramento da demanda (transição para CONCLUIDA)
 */
export async function formalizarEncerramentoDemandaAction(
  demandaId: string,
  justificativa?: string,
  customDeps?: Partial<DeliverableActionDeps>
): Promise<DeliverableActionResult<{ id: string; estado: EstadoDemanda }>> {
  try {
    const { demandRepo, entregavelRepo, validacaoRepo, auditRepo, processarEventoUseCase } = resolveDeliverableDeps(customDeps);
    const demanda = await demandRepo.findById(demandaId);
    if (!demanda) {
      return { success: false, error: `Demanda com ID '${demandaId}' não encontrada.` };
    }

    const [validacoes, entregaveis] = await Promise.all([
      validacaoRepo.findByDemandId(demandaId),
      entregavelRepo.findByDemandId(demandaId),
    ]);

    // Avaliação canônica de integridade
    const avaliacao = ValidationRulesEvaluator.avaliar(validacoes, entregaveis);
    WorkflowEngine.validarTransicao(demanda.estado, EstadoDemanda.CONCLUIDA, {
      justificativa,
      avaliacaoValidacao: avaliacao,
    });

    const now = new Date().toISOString();
    const atualizada = await demandRepo.update(demandaId, {
      estado: EstadoDemanda.CONCLUIDA,
      estado_anterior: demanda.estado,
      data_conclusao: now,
    });

    if (!atualizada) {
      return { success: false, error: 'Falha ao atualizar estado da demanda no banco de dados.' };
    }

    // Registro na trilha de auditoria
    await auditRepo.record({
      demanda_id: demandaId,
      entidade: 'demandas',
      entidade_id: demandaId,
      tipo_evento: 'TRANSICAO_ESTADO',
      autor_tipo: 'HUMANO',
      dados_anteriores: JSON.stringify({ estado: demanda.estado }),
      dados_novos: JSON.stringify({ estado: EstadoDemanda.CONCLUIDA, data_conclusao: now }),
      justificativa: justificativa || 'Encerramento formal soberano após aceite integral dos entregáveis.',
      timestamp: now,
    });

    // Despacho determinístico para o Evidence Event Engine
    try {
      const timestampConclusao = atualizada.data_conclusao || now;
      const aceitos = entregaveis.filter((e) => e.aceite_status === StatusAceiteEntrega.ACEITO);
      const evento: EventoAnalitico = {
        id_evento: `evt_ent_concluida_${demandaId}_${timestampConclusao}`,
        demanda_id: demandaId,
        projeto_id: demanda.projeto_id || null,
        etapa_origem: EtapaOrigemEvidencia.ENTREGA,
        categoria: 'ENTREGA',
        tipo_evento: 'ENTREGA_ENCERRAMENTO_FORMALIZADO',
        ocorrido_em: now,
        executor: 'ANALISTA',
        artefato_origem_tipo: 'DEMANDA',
        artefato_origem_id: demandaId,
        payload: {
          demandaId,
          demandaTitulo: demanda.titulo,
          dataConclusao: now,
          totalEntregaveisHomologados: aceitos.length,
        },
        versao_contrato: '1.0',
      };

      await processarEventoUseCase.execute(evento);
    } catch (evtErr: unknown) {
      console.warn('[EvidenceEventEngine] Falha ao despachar evento ENTREGA_ENCERRAMENTO_FORMALIZADO:', evtErr);
    }

    revalidateAllPaths(demandaId);
    return { success: true, data: { id: demandaId, estado: EstadoDemanda.CONCLUIDA } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao formalizar encerramento da demanda.';
    return { success: false, error: msg };
  }
}
