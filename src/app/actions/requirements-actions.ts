'use server';

/**
 * src/app/actions/requirements-actions.ts
 *
 * Server Actions para a etapa de Requisitos & Perguntas ao Contratante (Aba 2 / Bloco 3.8).
 */

import { revalidatePath } from 'next/cache';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteRequisitoDemandaRepository } from '@/infrastructure/db/repositories/sqlite-requisito-repository';
import { SqlitePerguntaClarificacaoRepository } from '@/infrastructure/db/repositories/sqlite-pergunta-clarificacao-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { SqliteEventoAnaliticoLogRepository } from '@/infrastructure/db/repositories/sqlite-evento-analitico-log-repository';
import { SqliteEvidenciaAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-evidencia-analitica-repository';

import {
  CriarRequisitoUseCase,
  AtualizarRequisitoUseCase,
  RemoverRequisitoUseCase,
  ListarRequisitosUseCase,
  CriarPerguntaClarificacaoUseCase,
  AtualizarPerguntaClarificacaoUseCase,
  DespacharPerguntaClarificacaoUseCase,
  RegistrarRespostaContratanteUseCase,
  RemoverPerguntaClarificacaoUseCase,
  ListarPerguntasClarificacaoUseCase,
  AtualizarBriefingDemandaUseCase,
  AvaliarProntidaoRequisitosUseCase,
  HomologarLevantamentoRequisitosUseCase,
} from '@/core/use-cases/requirements';

import { RequirementsCopilotEngine } from '@/core/domain/requirements-copilot';
import { RegistrarEvidenciaUseCase, ProcessarEventoAnaliticoUseCase } from '@/core/use-cases/evidence';
import { criarEvidenceEventEnginePadrao } from '@/core/domain/evidence-events';
import { CategoriaRequisito } from '@/core/domain/enums/categoria-requisito';
import { StatusRequisito } from '@/core/domain/enums/status-requisito';
import { StatusPerguntaClarificacao } from '@/core/domain/enums/status-pergunta-clarificacao';

function getDependencies() {
  const demandRepo = new SqliteDemandRepository();
  const requisitoRepo = new SqliteRequisitoDemandaRepository();
  const perguntaRepo = new SqlitePerguntaClarificacaoRepository();
  const auditRepo = new SqliteAuditRepository();

  const logRepo = new SqliteEventoAnaliticoLogRepository();
  const evidenciaRepo = new SqliteEvidenciaAnaliticaRepository();
  const registrarEvidenciaUseCase = new RegistrarEvidenciaUseCase(evidenciaRepo, demandRepo);
  const engine = criarEvidenceEventEnginePadrao();
  const processarEventoUseCase = new ProcessarEventoAnaliticoUseCase(
    engine,
    logRepo,
    registrarEvidenciaUseCase
  );

  return {
    demandRepo,
    requisitoRepo,
    perguntaRepo,
    auditRepo,
    processarEventoUseCase,
  };
}

export async function criarRequisitoAction(input: {
  demandaId: string;
  titulo: string;
  descricao?: string | null;
  categoria: CategoriaRequisito;
  prioridade?: 'OBRIGATORIO' | 'DESEJAVEL';
  origem?: 'MANUAL' | 'SUGERIDO_COPILOTO' | 'INTAKE';
}) {
  try {
    const { demandRepo, requisitoRepo } = getDependencies();
    const useCase = new CriarRequisitoUseCase(requisitoRepo, demandRepo);
    const result = await useCase.execute(input);
    revalidatePath(`/demands/${input.demandaId}`);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao criar requisito.' };
  }
}

export async function atualizarRequisitoAction(input: {
  id: string;
  demandaId: string;
  titulo?: string;
  descricao?: string | null;
  categoria?: CategoriaRequisito;
  prioridade?: 'OBRIGATORIO' | 'DESEJAVEL';
  status?: StatusRequisito;
}) {
  try {
    const { requisitoRepo, demandRepo } = getDependencies();
    const useCase = new AtualizarRequisitoUseCase(requisitoRepo, demandRepo);
    const result = await useCase.execute(input);
    revalidatePath(`/demands/${input.demandaId}`);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao atualizar requisito.' };
  }
}

export async function removerRequisitoAction(id: string, demandaId: string) {
  try {
    const { requisitoRepo, demandRepo } = getDependencies();
    const useCase = new RemoverRequisitoUseCase(requisitoRepo, demandRepo);
    const result = await useCase.execute(id);
    revalidatePath(`/demands/${demandaId}`);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao remover requisito.' };
  }
}

export async function listarRequisitosAction(demandaId: string) {
  try {
    const { requisitoRepo } = getDependencies();
    const useCase = new ListarRequisitosUseCase(requisitoRepo);
    const result = await useCase.execute(demandaId);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao listar requisitos.' };
  }
}

export async function criarPerguntaClarificacaoAction(input: {
  demandaId: string;
  requisitoId?: string | null;
  pergunta: string;
  motivacao?: string | null;
  bloqueante?: boolean;
}) {
  try {
    const { demandRepo, perguntaRepo } = getDependencies();
    const useCase = new CriarPerguntaClarificacaoUseCase(perguntaRepo, demandRepo);
    const result = await useCase.execute(input);
    revalidatePath(`/demands/${input.demandaId}`);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao criar pergunta de clarificação.' };
  }
}

export async function atualizarPerguntaClarificacaoAction(input: {
  id: string;
  demandaId: string;
  pergunta?: string;
  motivacao?: string | null;
  bloqueante?: boolean;
  status?: StatusPerguntaClarificacao;
}) {
  try {
    const { perguntaRepo, demandRepo } = getDependencies();
    const useCase = new AtualizarPerguntaClarificacaoUseCase(perguntaRepo, demandRepo);
    const result = await useCase.execute(input);
    revalidatePath(`/demands/${input.demandaId}`);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao atualizar pergunta.' };
  }
}

export async function despacharPerguntaClarificacaoAction(id: string, demandaId: string) {
  try {
    const { perguntaRepo, auditRepo, demandRepo } = getDependencies();
    const useCase = new DespacharPerguntaClarificacaoUseCase(perguntaRepo, auditRepo, demandRepo);
    const result = await useCase.execute(id);
    revalidatePath(`/demands/${demandaId}`);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao despachar pergunta.' };
  }
}

export async function registrarRespostaContratanteAction(input: {
  perguntaId: string;
  demandaId: string;
  resposta: string;
  respondidoPor: string;
  impactoDecisao?: string | null;
}) {
  try {
    const { perguntaRepo, auditRepo, processarEventoUseCase, demandRepo } = getDependencies();
    const useCase = new RegistrarRespostaContratanteUseCase(
      perguntaRepo,
      auditRepo,
      processarEventoUseCase,
      demandRepo
    );
    const result = await useCase.execute(input);
    revalidatePath(`/demands/${input.demandaId}`);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao registrar resposta do contratante.' };
  }
}

export async function removerPerguntaClarificacaoAction(id: string, demandaId: string) {
  try {
    const { perguntaRepo, demandRepo } = getDependencies();
    const useCase = new RemoverPerguntaClarificacaoUseCase(perguntaRepo, demandRepo);
    const result = await useCase.execute(id);
    revalidatePath(`/demands/${demandaId}`);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao remover pergunta.' };
  }
}

export async function listarPerguntasClarificacaoAction(demandaId: string) {
  try {
    const { perguntaRepo } = getDependencies();
    const useCase = new ListarPerguntasClarificacaoUseCase(perguntaRepo);
    const result = await useCase.execute(demandaId);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao listar perguntas.' };
  }
}

export async function atualizarBriefingDemandaAction(input: {
  demandaId: string;
  contexto?: string | null;
  objetivoInicial?: string | null;
  periodoAnalise?: string | null;
  granularidade?: string | null;
  formatoEntrega?: string | null;
  restricoesDeclaradas?: string | null;
  prazoEsperado?: string | null;
}) {
  try {
    const { demandRepo, auditRepo } = getDependencies();
    const useCase = new AtualizarBriefingDemandaUseCase(demandRepo, auditRepo);
    const result = await useCase.execute(input);
    revalidatePath(`/demands/${input.demandaId}`);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao atualizar briefing analítico.' };
  }
}

export async function avaliarProntidaoRequisitosAction(demandaId: string) {
  try {
    const { demandRepo, requisitoRepo, perguntaRepo } = getDependencies();
    const useCase = new AvaliarProntidaoRequisitosUseCase(
      demandRepo,
      requisitoRepo,
      perguntaRepo
    );
    const result = await useCase.execute(demandaId);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao avaliar prontidão de requisitos.' };
  }
}

export async function homologarLevantamentoRequisitosAction(input: {
  demandaId: string;
  justificativa: string;
  ressalvas?: string | null;
  homologadoPor?: string;
}) {
  try {
    const { demandRepo, requisitoRepo, perguntaRepo, auditRepo, processarEventoUseCase } =
      getDependencies();
    const useCase = new HomologarLevantamentoRequisitosUseCase(
      demandRepo,
      requisitoRepo,
      perguntaRepo,
      auditRepo,
      processarEventoUseCase
    );
    const result = await useCase.execute(input);
    revalidatePath(`/demands/${input.demandaId}`);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao homologar levantamento de requisitos.' };
  }
}

export async function obterDiagnosticoCopilotoRequisitosAction(demandaId: string) {
  try {
    const { demandRepo, requisitoRepo, perguntaRepo } = getDependencies();
    const demanda = await demandRepo.findById(demandaId);
    if (!demanda) {
      return { success: false, error: `Demanda '${demandaId}' não encontrada.` };
    }
    const requisitos = await requisitoRepo.findByDemandId(demandaId);
    const perguntas = await perguntaRepo.findByDemandId(demandaId);

    const diagnostico = RequirementsCopilotEngine.avaliar(demanda, requisitos, perguntas);
    return { success: true, data: diagnostico };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao gerar diagnóstico do copiloto.' };
  }
}
