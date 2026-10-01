'use server';

import { revalidatePath } from 'next/cache';
import { SqliteAtivoDadosRepository } from '@/infrastructure/db/repositories/ativo-dados-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { SqliteDiagnosticosQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-diagnosticos-qualidade-repository';
import { SqliteProblemasQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-problemas-qualidade-repository';
import { SqliteReceitaPreparacaoRepository } from '@/infrastructure/db/repositories/sqlite-receita-preparacao-repository';
import { SqliteEtapaTransformacaoRepository } from '@/infrastructure/db/repositories/sqlite-etapa-transformacao-repository';
import { SqliteLinhagemAtivosRepository } from '@/infrastructure/db/repositories/sqlite-linhagem-ativos-repository';
import { SqliteDatasetAutorizadoRepository } from '@/infrastructure/db/repositories/sqlite-dataset-autorizado-repository';

import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { IDiagnosticosQualidadeRepository } from '@/core/domain/repositories/diagnosticos-qualidade-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { ILinhagemAtivosRepository } from '@/core/domain/repositories/linhagem-ativos-repository.interface';
import { IDatasetAutorizadoRepository } from '@/core/domain/repositories/dataset-autorizado-repository.interface';

import {
  CriarReceitaPreparacaoUseCase,
  AtualizarReceitaPreparacaoUseCase,
  ObterReceitaPreparacaoUseCase,
  ListarReceitasDemandaUseCase,
  AdicionarEtapaTransformacaoUseCase,
  AtualizarEtapaTransformacaoUseCase,
  ReordenarEtapasTransformacaoUseCase,
  ExcluirEtapaTransformacaoUseCase,
  CancelarEtapaTransformacaoUseCase,
  AssociarProblemaEtapaUseCase,
  DesassociarProblemaEtapaUseCase,
  ListarProblemasEtapaUseCase,
  RegistrarAtivoDerivadoUseCase,
  ConsultarLinhagemUseCase,
  ValidarTratamentoProblemaUseCase,
  ValidarEtapaPreparacaoUseCase,
  ConcluirReceitaPreparacaoUseCase,
  AutorizarDatasetAnaliseUseCase,
  RevogarAutorizacaoDatasetUseCase,
  VerificarProntidaoParaModelagemUseCase,
  ProntidaoModelagemOutput,
  ValidarTratamentoProblemaOutput,
} from '@/core/use-cases/preparation';

import {
  criarReceitaPreparacaoSchema,
  atualizarReceitaPreparacaoSchema,
  adicionarEtapaTransformacaoSchema,
  atualizarEtapaTransformacaoSchema,
  reordenarEtapasSchema,
  cancelarEtapaSchema,
  associarProblemaEtapaSchema,
  desassociarProblemaEtapaSchema,
  registrarAtivoDerivadoSchema,
  validarTratamentoProblemaSchema,
  validarEtapaPreparacaoSchema,
  concluirReceitaPreparacaoSchema,
  autorizarDatasetAnaliseSchema,
  revogarAutorizacaoDatasetSchema,
  CriarReceitaPreparacaoInput,
  AtualizarReceitaPreparacaoInput,
  AdicionarEtapaTransformacaoInput,
  AtualizarEtapaTransformacaoInput,
  ReordenarEtapasInput,
  CancelarEtapaInput,
  AssociarProblemaEtapaInput,
  DesassociarProblemaEtapaInput,
  RegistrarAtivoDerivadoInput,
  ValidarTratamentoProblemaSchemaInput,
  ValidarEtapaPreparacaoSchemaInput,
  ConcluirReceitaPreparacaoSchemaInput,
  AutorizarDatasetAnaliseSchemaInput,
  RevogarAutorizacaoDatasetSchemaInput,
} from '@/lib/validations/preparation-schema';

import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';
import { LinhagemAtivos } from '@/core/domain/entities/linhagem-ativos';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';

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
import { PapelEntradaLinhagem } from '@/core/domain/enums/papel-entrada-linhagem';

export type PreparationActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface PreparationActionDeps {
  demandRepo: IDemandRepository;
  ativoDadosRepo: IAtivoDadosRepository;
  receitaRepo: IReceitaPreparacaoRepository;
  etapaRepo: IEtapaTransformacaoRepository;
  linhagemRepo: ILinhagemAtivosRepository;
  datasetAutorizadoRepo: IDatasetAutorizadoRepository;
  diagnosticosRepo: IDiagnosticosQualidadeRepository;
  problemasRepo: IProblemasQualidadeRepository;
  auditRepo: IAuditRepository;
  processarEventoUseCase?: ProcessarEventoAnaliticoUseCase;
}

// Singletons para execução em produção no servidor Next.js
const defaultDemandRepo = new SqliteDemandRepository();
const defaultAtivoDadosRepo = new SqliteAtivoDadosRepository();
const defaultReceitaRepo = new SqliteReceitaPreparacaoRepository();
const defaultEtapaRepo = new SqliteEtapaTransformacaoRepository();
const defaultLinhagemRepo = new SqliteLinhagemAtivosRepository();
const defaultDatasetAutorizadoRepo = new SqliteDatasetAutorizadoRepository();
const defaultDiagnosticosRepo = new SqliteDiagnosticosQualidadeRepository();
const defaultProblemasRepo = new SqliteProblemasQualidadeRepository();
const defaultAuditRepo = new SqliteAuditRepository();

const defaultEventLogRepo = new SqliteEventoAnaliticoLogRepository();
const defaultEvidenciaRepo = new SqliteEvidenciaAnaliticaRepository();
const defaultRegistrarEvidenciaUseCase = new RegistrarEvidenciaUseCase(defaultEvidenciaRepo, defaultDemandRepo);
const defaultEventEngine = criarEvidenceEventEnginePadrao();
const defaultProcessarEventoUseCase = new ProcessarEventoAnaliticoUseCase(
  defaultEventEngine,
  defaultEventLogRepo,
  defaultRegistrarEvidenciaUseCase
);

function resolvePreparationDeps(customDeps?: Partial<PreparationActionDeps>): PreparationActionDeps & {
  processarEventoUseCase: ProcessarEventoAnaliticoUseCase;
} {
  return {
    demandRepo: customDeps?.demandRepo ?? defaultDemandRepo,
    ativoDadosRepo: customDeps?.ativoDadosRepo ?? defaultAtivoDadosRepo,
    receitaRepo: customDeps?.receitaRepo ?? defaultReceitaRepo,
    etapaRepo: customDeps?.etapaRepo ?? defaultEtapaRepo,
    linhagemRepo: customDeps?.linhagemRepo ?? defaultLinhagemRepo,
    datasetAutorizadoRepo: customDeps?.datasetAutorizadoRepo ?? defaultDatasetAutorizadoRepo,
    diagnosticosRepo: customDeps?.diagnosticosRepo ?? defaultDiagnosticosRepo,
    problemasRepo: customDeps?.problemasRepo ?? defaultProblemasRepo,
    auditRepo: customDeps?.auditRepo ?? defaultAuditRepo,
    processarEventoUseCase: customDeps?.processarEventoUseCase ?? defaultProcessarEventoUseCase,
  };
}

function revalidatePreparationPaths(demandaId?: string) {
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
// 1. Receitas de Preparação
// ==========================================

export async function criarReceitaPreparacaoAction(
  data: CriarReceitaPreparacaoInput,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<ReceitaPreparacao>> {
  try {
    const validated = criarReceitaPreparacaoSchema.parse(data);
    const deps = resolvePreparationDeps(_deps);
    const useCase = new CriarReceitaPreparacaoUseCase(deps.receitaRepo, deps.demandRepo, deps.auditRepo);
    const created = await useCase.execute(validated);
    revalidatePreparationPaths(validated.demanda_id);
    return { success: true, data: created };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao criar receita de preparação.'),
    };
  }
}

export async function atualizarReceitaPreparacaoAction(
  data: AtualizarReceitaPreparacaoInput,
  demandaId?: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<ReceitaPreparacao>> {
  try {
    const validated = atualizarReceitaPreparacaoSchema.parse(data);
    const deps = resolvePreparationDeps(_deps);
    const useCase = new AtualizarReceitaPreparacaoUseCase(deps.receitaRepo, deps.auditRepo);
    const updated = await useCase.execute(validated);
    revalidatePreparationPaths(demandaId);
    return { success: true, data: updated };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao atualizar metadados da receita.'),
    };
  }
}

export async function obterReceitaPreparacaoAction(
  receitaId: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<{ receita: ReceitaPreparacao; etapas: EtapaTransformacao[] }>> {
  try {
    if (!receitaId || receitaId.trim() === '') {
      return { success: false, error: 'ID da receita é obrigatório.' };
    }
    const deps = resolvePreparationDeps(_deps);
    const useCase = new ObterReceitaPreparacaoUseCase(deps.receitaRepo, deps.etapaRepo);
    const result = await useCase.execute(receitaId);
    if (!result) {
      return { success: false, error: 'Receita não encontrada.' };
    }
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao obter dados da receita de preparação.'),
    };
  }
}

export async function listarReceitasDemandaAction(
  demandaId: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<ReceitaPreparacao[]>> {
  try {
    if (!demandaId || demandaId.trim() === '') {
      return { success: false, error: 'ID da demanda é obrigatório.' };
    }
    const deps = resolvePreparationDeps(_deps);
    const useCase = new ListarReceitasDemandaUseCase(deps.receitaRepo);
    const receitas = await useCase.execute(demandaId);
    return { success: true, data: receitas };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao listar receitas da demanda.'),
    };
  }
}

export async function obterReceitaAtivaDemandaAction(
  demandaId: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<ReceitaPreparacao | null>> {
  try {
    if (!demandaId || demandaId.trim() === '') {
      return { success: false, error: 'ID da demanda é obrigatório.' };
    }
    const deps = resolvePreparationDeps(_deps);
    const ativa = await deps.receitaRepo.findActiveByDemandId(demandaId);
    return { success: true, data: ativa };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao consultar receita ativa da demanda.'),
    };
  }
}

export async function concluirReceitaPreparacaoAction(
  data: ConcluirReceitaPreparacaoSchemaInput,
  demandaId?: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<ReceitaPreparacao>> {
  try {
    const validated = concluirReceitaPreparacaoSchema.parse(data);
    const deps = resolvePreparationDeps(_deps);
    const useCase = new ConcluirReceitaPreparacaoUseCase(
      deps.receitaRepo,
      deps.etapaRepo,
      deps.problemasRepo,
      deps.auditRepo
    );
    const concluida = await useCase.execute({
      receitaId: validated.receita_id,
      justificativa: validated.justificativa ?? undefined,
      autorTipo: validated.autor_tipo,
    });

    // Emissão Determinística de Evento Analítico (Subgate 3.5B.3)
    try {
      const idEvento = `evt_prep_rec_${concluida.id}_${concluida.atualizado_em}`;
      const demand = await deps.demandRepo.findById(concluida.demanda_id);
      const etapas = await deps.etapaRepo.findByReceitaId(concluida.id);
      const totalValidadas = etapas.filter((e) => e.status === 'VALIDADA').length;
      const totalCanceladas = etapas.filter((e) => e.status === 'CANCELADA').length;

      const evento: EventoAnalitico = {
        id_evento: idEvento,
        demanda_id: concluida.demanda_id,
        projeto_id: demand?.projeto_id ?? null,
        etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
        categoria: 'PREPARACAO',
        tipo_evento: 'PREPARACAO_RECEITA_CONCLUIDA',
        ocorrido_em: concluida.atualizado_em,
        executor: 'ANALISTA',
        artefato_origem_tipo: 'RECEITA_PREPARACAO',
        artefato_origem_id: concluida.id,
        payload: {
          receitaId: concluida.id,
          titulo: concluida.titulo,
          totalEtapasValidadas: totalValidadas,
          totalEtapasCanceladas: totalCanceladas,
          justificativa: validated.justificativa ?? null,
          concluidaEm: concluida.atualizado_em,
          autorTipo: validated.autor_tipo,
        },
        versao_contrato: '1.0',
      };
      await deps.processarEventoUseCase.execute(evento);
    } catch {
      // Isolamento de falha no motor de eventos
    }

    revalidatePreparationPaths(demandaId);
    return { success: true, data: concluida };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao concluir receita de preparação.'),
    };
  }
}

// ==========================================
// 2. Etapas de Transformação
// ==========================================

export async function adicionarEtapaTransformacaoAction(
  data: AdicionarEtapaTransformacaoInput,
  demandaId?: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<EtapaTransformacao>> {
  try {
    const validated = adicionarEtapaTransformacaoSchema.parse(data);
    const deps = resolvePreparationDeps(_deps);
    const useCase = new AdicionarEtapaTransformacaoUseCase(deps.etapaRepo, deps.receitaRepo, deps.auditRepo);
    const etapa = await useCase.execute(validated);
    revalidatePreparationPaths(demandaId);
    return { success: true, data: etapa };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao adicionar etapa de transformação.'),
    };
  }
}

export async function atualizarEtapaTransformacaoAction(
  data: AtualizarEtapaTransformacaoInput,
  demandaId?: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<EtapaTransformacao>> {
  try {
    const validated = atualizarEtapaTransformacaoSchema.parse(data);
    const deps = resolvePreparationDeps(_deps);
    const useCase = new AtualizarEtapaTransformacaoUseCase(deps.etapaRepo, deps.receitaRepo, deps.auditRepo);
    const etapa = await useCase.execute(validated);
    revalidatePreparationPaths(demandaId);
    return { success: true, data: etapa };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao atualizar etapa de transformação.'),
    };
  }
}

export async function reordenarEtapasTransformacaoAction(
  data: ReordenarEtapasInput,
  demandaId?: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<EtapaTransformacao[]>> {
  try {
    const validated = reordenarEtapasSchema.parse(data);
    const deps = resolvePreparationDeps(_deps);
    const useCase = new ReordenarEtapasTransformacaoUseCase(deps.etapaRepo, deps.receitaRepo, deps.auditRepo);
    await useCase.execute(validated);
    const reordenadas = await deps.etapaRepo.findByReceitaId(validated.receita_id);
    revalidatePreparationPaths(demandaId);
    return { success: true, data: reordenadas };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao reordenar etapas de transformação.'),
    };
  }
}

export async function excluirEtapaTransformacaoAction(
  etapaId: string,
  demandaId?: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<boolean>> {
  try {
    if (!etapaId || etapaId.trim() === '') {
      return { success: false, error: 'ID da etapa é obrigatório.' };
    }
    const deps = resolvePreparationDeps(_deps);
    const useCase = new ExcluirEtapaTransformacaoUseCase(deps.etapaRepo, deps.receitaRepo, deps.auditRepo);
    const ok = await useCase.execute(etapaId);
    revalidatePreparationPaths(demandaId);
    return { success: true, data: ok };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao excluir etapa de transformação.'),
    };
  }
}

export async function cancelarEtapaTransformacaoAction(
  data: CancelarEtapaInput,
  demandaId?: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<EtapaTransformacao>> {
  try {
    const validated = cancelarEtapaSchema.parse(data);
    const deps = resolvePreparationDeps(_deps);
    const useCase = new CancelarEtapaTransformacaoUseCase(deps.etapaRepo, deps.receitaRepo, deps.auditRepo);
    const cancelada = await useCase.execute(validated);
    revalidatePreparationPaths(demandaId);
    return { success: true, data: cancelada };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao cancelar etapa de transformação.'),
    };
  }
}

// ==========================================
// 3. Vínculo com Problemas de Qualidade
// ==========================================

export async function associarProblemaEtapaAction(
  data: AssociarProblemaEtapaInput,
  demandaId?: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<boolean>> {
  try {
    const validated = associarProblemaEtapaSchema.parse(data);
    const deps = resolvePreparationDeps(_deps);
    const useCase = new AssociarProblemaEtapaUseCase(deps.etapaRepo, deps.problemasRepo, deps.receitaRepo, deps.auditRepo);
    await useCase.execute(validated);
    revalidatePreparationPaths(demandaId);
    return { success: true, data: true };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao associar problema de qualidade à etapa.'),
    };
  }
}

export async function desassociarProblemaEtapaAction(
  data: DesassociarProblemaEtapaInput,
  demandaId?: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<boolean>> {
  try {
    const validated = desassociarProblemaEtapaSchema.parse(data);
    const deps = resolvePreparationDeps(_deps);
    const useCase = new DesassociarProblemaEtapaUseCase(deps.etapaRepo, deps.receitaRepo, deps.auditRepo);
    await useCase.execute(validated);
    revalidatePreparationPaths(demandaId);
    return { success: true, data: true };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao desassociar problema de qualidade da etapa.'),
    };
  }
}

export async function listarProblemasEtapaAction(
  etapaId: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<ProblemaQualidade[]>> {
  try {
    if (!etapaId || etapaId.trim() === '') {
      return { success: false, error: 'ID da etapa é obrigatório.' };
    }
    const deps = resolvePreparationDeps(_deps);
    const useCase = new ListarProblemasEtapaUseCase(deps.etapaRepo, deps.problemasRepo);
    const problemas = await useCase.execute(etapaId);
    return { success: true, data: problemas };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao listar problemas vinculados à etapa.'),
    };
  }
}

// ==========================================
// 4. Ativos Derivados e Linhagem
// ==========================================

export async function registrarAtivoDerivadoAction(
  data: RegistrarAtivoDerivadoInput,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<{ ativo: AtivoDados; arestas: LinhagemAtivos[] }>> {
  try {
    const validated = registrarAtivoDerivadoSchema.parse(data);
    const deps = resolvePreparationDeps(_deps);
    const useCase = new RegistrarAtivoDerivadoUseCase(
      deps.linhagemRepo,
      deps.ativoDadosRepo,
      deps.receitaRepo,
      deps.etapaRepo,
      deps.demandRepo
    );
    const result = await useCase.execute(validated);

    // Emissão Determinística de Evento Analítico (Subgate 3.5B.3)
    try {
      const idEvento = `evt_prep_deriv_${result.ativo.id}`;
      const demand = await deps.demandRepo.findById(validated.demanda_id);
      const etapa = await deps.etapaRepo.findById(validated.etapa_id);

      const fontePrincipal = validated.fontes_entrada.find(
        (f) => f.papel === PapelEntradaLinhagem.FONTE_PRINCIPAL || f.papel === PapelEntradaLinhagem.ORIGEM_UNICA
      ) ?? validated.fontes_entrada[0];
      let ativoOrigemPrincipal = null;
      if (fontePrincipal) {
        ativoOrigemPrincipal = await deps.ativoDadosRepo.findById(fontePrincipal.ativo_origem_id);
      }

      const evento: EventoAnalitico = {
        id_evento: idEvento,
        demanda_id: validated.demanda_id,
        projeto_id: demand?.projeto_id ?? null,
        etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
        categoria: 'PREPARACAO',
        tipo_evento: 'PREPARACAO_ATIVO_DERIVADO_REGISTRADO',
        ocorrido_em: result.ativo.criado_em,
        executor: 'ANALISTA',
        artefato_origem_tipo: 'ATIVO_DADOS',
        artefato_origem_id: result.ativo.id,
        payload: {
          ativoId: result.ativo.id,
          nomeArquivo: result.ativo.nome_arquivo,
          caminhoLocal: result.ativo.caminho_local,
          formato: result.ativo.formato,
          tamanhoBytes: result.ativo.tamanho_bytes,
          totalLinhas: result.ativo.total_linhas,
          totalColunas: result.ativo.total_colunas,
          hashSha256: result.ativo.hash_sha256,
          receitaId: validated.receita_id,
          etapaId: validated.etapa_id,
          tipoOperacao: etapa?.tipo_operacao ?? 'TRANSFORMACAO',
          ferramentaNome: etapa?.ferramenta_nome ?? 'Power Query M',
          fontesEntradaIds: validated.fontes_entrada.map((f) => f.ativo_origem_id),
          linhasOrigemPrincipal: ativoOrigemPrincipal?.total_linhas ?? null,
          colunasOrigemPrincipal: ativoOrigemPrincipal?.total_colunas ?? null,
          bytesOrigemPrincipal: ativoOrigemPrincipal?.tamanho_bytes ?? null,
        },
        versao_contrato: '1.0',
      };
      await deps.processarEventoUseCase.execute(evento);
    } catch {
      // Isolamento de falha no motor de eventos
    }

    revalidatePreparationPaths(validated.demanda_id);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao registrar ativo de dados derivado.'),
    };
  }
}

export async function consultarLinhagemDemandaAction(
  demandaId: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<LinhagemAtivos[]>> {
  try {
    if (!demandaId || demandaId.trim() === '') {
      return { success: false, error: 'ID da demanda é obrigatório.' };
    }
    const deps = resolvePreparationDeps(_deps);
    const arestas = await deps.linhagemRepo.obterArestasPorDemanda(demandaId);
    return { success: true, data: arestas };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao consultar linhagem da demanda.'),
    };
  }
}

export async function consultarCaminhoTransformacaoAction(
  ativoId: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<any>> {
  try {
    if (!ativoId || ativoId.trim() === '') {
      return { success: false, error: 'ID do ativo é obrigatório.' };
    }
    const deps = resolvePreparationDeps(_deps);
    const useCase = new ConsultarLinhagemUseCase(deps.linhagemRepo, deps.ativoDadosRepo, deps.etapaRepo);
    const caminho = await useCase.reconstruirCaminhoTransformacao(ativoId);
    return { success: true, data: caminho };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao reconstruir caminho de transformação.'),
    };
  }
}

export async function consultarLinhagemAction(
  ativoId: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<any>> {
  return consultarCaminhoTransformacaoAction(ativoId, _deps);
}

// ==========================================
// 5. Governança, Validação e Prontidão
// ==========================================

export async function validarTratamentoProblemaAction(
  data: ValidarTratamentoProblemaSchemaInput,
  demandaId?: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<ValidarTratamentoProblemaOutput>> {
  try {
    const validated = validarTratamentoProblemaSchema.parse(data);
    const deps = resolvePreparationDeps(_deps);
    const useCase = new ValidarTratamentoProblemaUseCase(
      deps.problemasRepo,
      deps.etapaRepo,
      deps.linhagemRepo,
      deps.ativoDadosRepo,
      deps.diagnosticosRepo,
      deps.auditRepo
    );
    const result = await useCase.execute({
      problemaId: validated.problema_id,
      autorTipo: validated.autor_tipo,
    });

    // Emissão Determinística de Evento Analítico quando resolvido empiricamente (Subgate 3.5B.3)
    if (result.resolvido) {
      try {
        const idEvento = `evt_prep_trat_${result.problema.id}_${result.problema.atualizado_em}`;
        const demand = await deps.demandRepo.findById(demandaId || result.problema.demanda_id);

        const evento: EventoAnalitico = {
          id_evento: idEvento,
          demanda_id: result.problema.demanda_id,
          projeto_id: demand?.projeto_id ?? null,
          etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
          categoria: 'PREPARACAO',
          tipo_evento: 'PREPARACAO_TRATAMENTO_VALIDADO',
          ocorrido_em: result.problema.atualizado_em,
          executor: 'SISTEMA_DETERMINISTICO',
          artefato_origem_tipo: 'PROBLEMA_QUALIDADE',
          artefato_origem_id: result.problema.id,
          payload: {
            problemaId: result.problema.id,
            titulo: result.problema.titulo,
            colunaAfetada: result.problema.coluna_afetada,
            etapaId: result.etapaId,
            ativoDerivadoId: result.ativoDerivadoId,
            diagnosticoId: result.diagnosticoId,
            motivo: result.motivo,
            linhasAfetadasAntes: result.problema.total_linhas_afetadas ?? null,
            linhasAfetadasDepois: 0,
            percentualReducao: result.problema.total_linhas_afetadas ? 100 : null,
            validadoEm: result.problema.atualizado_em,
          },
          versao_contrato: '1.0',
        };
        await deps.processarEventoUseCase.execute(evento);
      } catch {
        // Isolamento de falha no motor de eventos
      }
    }

    revalidatePreparationPaths(demandaId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao validar tratamento de problema no pipeline.'),
    };
  }
}

export async function validarEtapaPreparacaoAction(
  data: ValidarEtapaPreparacaoSchemaInput,
  demandaId?: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<EtapaTransformacao>> {
  try {
    const validated = validarEtapaPreparacaoSchema.parse(data);
    const deps = resolvePreparationDeps(_deps);
    const useCase = new ValidarEtapaPreparacaoUseCase(
      deps.etapaRepo,
      deps.linhagemRepo,
      deps.ativoDadosRepo,
      deps.diagnosticosRepo,
      deps.problemasRepo,
      deps.auditRepo
    );
    const etapa = await useCase.execute({
      etapaId: validated.etapa_id,
      justificativa: validated.justificativa ?? undefined,
      autorTipo: validated.autor_tipo,
    });
    revalidatePreparationPaths(demandaId);
    return { success: true, data: etapa };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao validar etapa de preparação.'),
    };
  }
}

export async function autorizarDatasetAnaliseAction(
  data: AutorizarDatasetAnaliseSchemaInput,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<DatasetAutorizadoAnalise>> {
  try {
    const validated = autorizarDatasetAnaliseSchema.parse(data);
    const deps = resolvePreparationDeps(_deps);
    const useCase = new AutorizarDatasetAnaliseUseCase(
      deps.datasetAutorizadoRepo,
      deps.ativoDadosRepo,
      deps.demandRepo,
      deps.diagnosticosRepo,
      deps.receitaRepo,
      deps.problemasRepo,
      deps.auditRepo
    );
    const autorizacao = await useCase.execute({
      demandaId: validated.demanda_id,
      ativoDadosId: validated.ativo_dados_id,
      receitaPreparacaoId: validated.receita_preparacao_id,
      versaoRotulo: validated.versao_rotulo,
      justificativa: validated.justificativa_autorizacao,
      autorTipo: 'HUMANO',
    });

    // Emissão Determinística de Evento Analítico (Subgate 3.5B.3)
    try {
      const idEvento = `evt_prep_aut_${autorizacao.id}`;
      const demand = await deps.demandRepo.findById(autorizacao.demanda_id);
      const ativo = await deps.ativoDadosRepo.findById(autorizacao.ativo_dados_id);

      let totalRestricoes = 0;
      try {
        const restricoes = JSON.parse(autorizacao.restricoes_aceitas_snapshot || '[]');
        totalRestricoes = Array.isArray(restricoes) ? restricoes.length : 0;
      } catch {
        totalRestricoes = 0;
      }

      const evento: EventoAnalitico = {
        id_evento: idEvento,
        demanda_id: autorizacao.demanda_id,
        projeto_id: demand?.projeto_id ?? null,
        etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
        categoria: 'PREPARACAO',
        tipo_evento: 'PREPARACAO_DATASET_HOMOLOGADO',
        ocorrido_em: autorizacao.autorizado_em,
        executor: 'ANALISTA',
        artefato_origem_tipo: 'DATASET_AUTORIZADO',
        artefato_origem_id: autorizacao.id,
        payload: {
          autorizacaoId: autorizacao.id,
          ativoDadosId: autorizacao.ativo_dados_id,
          nomeArquivo: ativo?.nome_arquivo ?? 'Ativo Homologado',
          versaoRotulo: autorizacao.versao_rotulo,
          hashSha256Snapshot: autorizacao.hash_sha256_snapshot,
          diagnosticoId: autorizacao.diagnostico_qualidade_id,
          receitaId: autorizacao.receita_preparacao_id,
          justificativa: autorizacao.justificativa_autorizacao,
          totalRestricoesAceitas: totalRestricoes,
          autorTipo: 'HUMANO',
          autorizadoEm: autorizacao.autorizado_em,
        },
        versao_contrato: '1.0',
      };
      await deps.processarEventoUseCase.execute(evento);
    } catch {
      // Isolamento de falha no motor de eventos
    }

    revalidatePreparationPaths(validated.demanda_id);
    return { success: true, data: autorizacao };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao autorizar dataset para análise.'),
    };
  }
}

export async function revogarAutorizacaoDatasetAction(
  data: RevogarAutorizacaoDatasetSchemaInput,
  demandaId?: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<DatasetAutorizadoAnalise>> {
  try {
    const validated = revogarAutorizacaoDatasetSchema.parse(data);
    const deps = resolvePreparationDeps(_deps);
    const useCase = new RevogarAutorizacaoDatasetUseCase(deps.datasetAutorizadoRepo, deps.auditRepo);
    const revogada = await useCase.execute({
      autorizacaoId: validated.autorizacao_id,
      motivo: validated.motivo_revogacao,
      autorTipo: validated.autor_tipo,
    });
    revalidatePreparationPaths(demandaId);
    return { success: true, data: revogada };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao revogar autorização do dataset.'),
    };
  }
}

export async function verificarProntidaoParaModelagemAction(
  demandaId: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<ProntidaoModelagemOutput>> {
  try {
    if (!demandaId || demandaId.trim() === '') {
      return { success: false, error: 'ID da demanda é obrigatório.' };
    }
    const deps = resolvePreparationDeps(_deps);
    const useCase = new VerificarProntidaoParaModelagemUseCase(
      deps.datasetAutorizadoRepo,
      deps.ativoDadosRepo,
      deps.demandRepo,
      deps.diagnosticosRepo,
      deps.receitaRepo,
      deps.problemasRepo
    );
    const output = await useCase.execute({ demandaId });
    return { success: true, data: output };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao verificar prontidão para modelagem.'),
    };
  }
}

export async function obterDatasetAutorizadoVigenteAction(
  demandaId: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<DatasetAutorizadoAnalise | null>> {
  try {
    if (!demandaId || demandaId.trim() === '') {
      return { success: false, error: 'ID da demanda é obrigatório.' };
    }
    const deps = resolvePreparationDeps(_deps);
    const vigente = await deps.datasetAutorizadoRepo.findVigenteByDemandId(demandaId);
    return { success: true, data: vigente };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao obter dataset autorizado vigente.'),
    };
  }
}

export async function consultarDatasetAutorizadoVigenteAction(
  demandaId: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<DatasetAutorizadoAnalise | null>> {
  return obterDatasetAutorizadoVigenteAction(demandaId, _deps);
}

export async function listarHistoricoAutorizacoesAction(
  demandaId: string,
  _deps?: Partial<PreparationActionDeps>
): Promise<PreparationActionResult<DatasetAutorizadoAnalise[]>> {
  try {
    if (!demandaId || demandaId.trim() === '') {
      return { success: false, error: 'ID da demanda é obrigatório.' };
    }
    const deps = resolvePreparationDeps(_deps);
    const historico = await deps.datasetAutorizadoRepo.listarHistorico(demandaId);
    return { success: true, data: historico };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, 'Erro ao listar histórico de autorizações.'),
    };
  }
}
