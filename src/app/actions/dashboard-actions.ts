'use server';

/**
 * src/app/actions/dashboard-actions.ts
 *
 * Server Actions para a etapa de Dashboard, Power BI e DAX (Aba 7).
 * Orquestra a recuperação de contexto, execução determinística do Copiloto,
 * ações de Modelos Power BI (Subgates 3.3C - 3.4B), Gestão de Medidas DAX (Subgate 3.4C),
 * Automação de Telas e Visuais (Subgate 3.4D), Pacote de Entrega (Subgate 3.4E) e
 * Integração com o Evidence Event Engine (Subgate 3.5B.4).
 */

import { revalidatePath } from 'next/cache';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteModeloPowerBiRepository } from '@/infrastructure/db/repositories/sqlite-modelo-powerbi-repository';
import { SqliteMedidaDaxRepository } from '@/infrastructure/db/repositories/sqlite-medida-dax-repository';
import { SqlitePaginaRelatorioRepository } from '@/infrastructure/db/repositories/sqlite-pagina-relatorio-repository';
import { SqliteVisualDashboardRepository } from '@/infrastructure/db/repositories/sqlite-visual-dashboard-repository';
import { SqliteModeloAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-modelo-analitico-repository';
import { SqliteDatasetAutorizadoRepository } from '@/infrastructure/db/repositories/sqlite-dataset-autorizado-repository';

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
import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import { StatusModeloPowerBi } from '@/core/domain/enums/status-modelo-powerbi';

import {
  ExecutarCopilotoDashboardUseCase,
  ExecutarCopilotoDashboardOutput,
} from '@/core/use-cases/dashboard/executar-copiloto-dashboard.use-case';
import { CriarModeloPowerBiUseCase } from '@/core/use-cases/dashboard/criar-modelo-powerbi.use-case';
import { AtualizarModeloPowerBiUseCase } from '@/core/use-cases/dashboard/atualizar-modelo-powerbi.use-case';
import { CriarMedidaDaxUseCase } from '@/core/use-cases/dashboard/criar-medida-dax.use-case';
import { AtualizarMedidaDaxUseCase } from '@/core/use-cases/dashboard/atualizar-medida-dax.use-case';
import { ExcluirMedidaDaxUseCase } from '@/core/use-cases/dashboard/excluir-medida-dax.use-case';
import { GerarPropostaDashboardUseCase } from '@/core/use-cases/dashboard/gerar-proposta-dashboard.use-case';
import {
  AprovarPropostaDashboardUseCase,
  AprovarPropostaDashboardOutput,
} from '@/core/use-cases/dashboard/aprovar-proposta-dashboard.use-case';
import { CriarPaginaRelatorioUseCase } from '@/core/use-cases/dashboard/criar-pagina-relatorio.use-case';
import { ExcluirPaginaRelatorioUseCase } from '@/core/use-cases/dashboard/excluir-pagina-relatorio.use-case';
import { CriarVisualDashboardUseCase } from '@/core/use-cases/dashboard/criar-visual-dashboard.use-case';
import { ExcluirVisualDashboardUseCase } from '@/core/use-cases/dashboard/excluir-visual-dashboard.use-case';
import {
  GerarPacoteEntregaDashboardUseCase,
  GerarPacoteEntregaDashboardOutput,
} from '@/core/use-cases/dashboard/gerar-pacote-entrega-dashboard.use-case';
import { DashboardPlannerEngine } from '@/core/domain/dashboard-automation/dashboard-planner-engine';
import {
  DashboardSpecification,
  VisualSpecification,
} from '@/core/domain/dashboard-automation/dashboard-specification';
import { TipoTemplateDashboard } from '@/core/domain/dashboard-design/dashboard-template';
import { TipoVisualDashboard } from '@/core/domain/enums/tipo-visual-dashboard';
import { obterConceitoDataViz } from '@/core/domain/dashboard-design/dataviz-pedagogy';
import {
  CriarModeloPowerBiInput,
  AtualizarModeloPowerBiInput,
  CriarMedidaDaxInput,
  AtualizarMedidaDaxInput,
  CriarPaginaRelatorioInput,
  CriarVisualDashboardInput,
} from '@/lib/validations/dashboard-schema';
import { ModeloPowerBi } from '@/core/domain/entities/modelo-powerbi';
import { MedidaDax } from '@/core/domain/entities/medida-dax';
import { PaginaRelatorio } from '@/core/domain/entities/pagina-relatorio';
import { VisualDashboard } from '@/core/domain/entities/visual-dashboard';

export interface DashboardActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardActionDeps {
  demandRepo: SqliteDemandRepository;
  modeloPowerBiRepo: SqliteModeloPowerBiRepository;
  medidaDaxRepo: SqliteMedidaDaxRepository;
  paginaRelatorioRepo: SqlitePaginaRelatorioRepository;
  visualDashboardRepo: SqliteVisualDashboardRepository;
  modeloAnaliticoRepo: SqliteModeloAnaliticoRepository;
  datasetAutorizadoRepo: SqliteDatasetAutorizadoRepository;
  processarEventoUseCase: ProcessarEventoAnaliticoUseCase;
}

const defaultDemandRepo = new SqliteDemandRepository();
const defaultModeloPowerBiRepo = new SqliteModeloPowerBiRepository();
const defaultMedidaDaxRepo = new SqliteMedidaDaxRepository();
const defaultPaginaRepo = new SqlitePaginaRelatorioRepository();
const defaultVisualRepo = new SqliteVisualDashboardRepository();
const defaultModeloAnaliticoRepo = new SqliteModeloAnaliticoRepository();
const defaultDatasetAutorizadoRepo = new SqliteDatasetAutorizadoRepository();

const defaultEventLogRepo = new SqliteEventoAnaliticoLogRepository();
const defaultEvidenciaRepo = new SqliteEvidenciaAnaliticaRepository();
const defaultRegistrarEvidenciaUseCase = new RegistrarEvidenciaUseCase(defaultEvidenciaRepo, defaultDemandRepo);
const defaultEventEngine = criarEvidenceEventEnginePadrao();
const defaultProcessarEventoUseCase = new ProcessarEventoAnaliticoUseCase(
  defaultEventEngine,
  defaultEventLogRepo,
  defaultRegistrarEvidenciaUseCase
);

function resolveDashboardDeps(customDeps?: Partial<DashboardActionDeps>): DashboardActionDeps {
  return {
    demandRepo: customDeps?.demandRepo ?? defaultDemandRepo,
    modeloPowerBiRepo: customDeps?.modeloPowerBiRepo ?? defaultModeloPowerBiRepo,
    medidaDaxRepo: customDeps?.medidaDaxRepo ?? defaultMedidaDaxRepo,
    paginaRelatorioRepo: customDeps?.paginaRelatorioRepo ?? defaultPaginaRepo,
    visualDashboardRepo: customDeps?.visualDashboardRepo ?? defaultVisualRepo,
    modeloAnaliticoRepo: customDeps?.modeloAnaliticoRepo ?? defaultModeloAnaliticoRepo,
    datasetAutorizadoRepo: customDeps?.datasetAutorizadoRepo ?? defaultDatasetAutorizadoRepo,
    processarEventoUseCase: customDeps?.processarEventoUseCase ?? defaultProcessarEventoUseCase,
  };
}

/**
 * Recupera o contexto completo da demanda na etapa de Dashboard, avalia D-01..D-08
 * e orquestra as orientações analíticas determinísticas do Copiloto.
 */
export async function obterContextoDashboardAction(
  demandaId: string,
  _deps?: Partial<DashboardActionDeps>
): Promise<DashboardActionResult<ExecutarCopilotoDashboardOutput>> {
  try {
    const deps = resolveDashboardDeps(_deps);

    const useCase = new ExecutarCopilotoDashboardUseCase(
      deps.demandRepo,
      deps.modeloPowerBiRepo,
      deps.medidaDaxRepo,
      deps.paginaRelatorioRepo,
      deps.visualDashboardRepo,
      deps.modeloAnaliticoRepo,
      deps.datasetAutorizadoRepo
    );

    const output = await useCase.execute({ demandaId });

    return {
      success: true,
      data: output,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro inesperado ao carregar contexto de dashboard da demanda.',
    };
  }
}

/**
 * Cria ou vincula um Modelo Power BI (.pbix, .pbip) ou formaliza Isenção (Excel-Only).
 */
export async function criarModeloPowerBiAction(
  input: CriarModeloPowerBiInput,
  _deps?: Partial<DashboardActionDeps>
): Promise<DashboardActionResult<ModeloPowerBi>> {
  try {
    const deps = resolveDashboardDeps(_deps);

    const useCase = new CriarModeloPowerBiUseCase(
      deps.demandRepo,
      deps.modeloPowerBiRepo,
      deps.modeloAnaliticoRepo
    );

    const { modelo } = await useCase.execute(input);

    // Emissão Determinística de Evento Analítico (Subgate 3.5B.4)
    try {
      const demand = await deps.demandRepo.findById(input.demandaId);
      const isIsento = modelo.tipo_formato === TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY;
      const timestampOcorrido = modelo.atualizado_em || modelo.criado_em;

      if (isIsento) {
        const idEvento = `evt_dash_isen_${modelo.id}_${timestampOcorrido}`;
        const evento: EventoAnalitico = {
          id_evento: idEvento,
          demanda_id: input.demandaId,
          projeto_id: demand?.projeto_id ?? null,
          etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
          categoria: 'DASHBOARD',
          tipo_evento: 'DASHBOARD_ISENCAO_FORMALIZADA',
          ocorrido_em: timestampOcorrido,
          executor: 'ANALISTA',
          artefato_origem_tipo: 'MODELO_POWERBI',
          artefato_origem_id: modelo.id,
          payload: {
            modeloId: modelo.id,
            justificativaIsencao: modelo.justificativa_isencao ?? '',
            formalizadoPor: 'ANALISTA',
            formalizadoEm: timestampOcorrido,
          },
          versao_contrato: '1.0',
        };
        await deps.processarEventoUseCase.execute(evento);
      } else {
        const idEvento = `evt_dash_mod_${modelo.id}`;
        const evento: EventoAnalitico = {
          id_evento: idEvento,
          demanda_id: input.demandaId,
          projeto_id: demand?.projeto_id ?? null,
          etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
          categoria: 'DASHBOARD',
          tipo_evento: 'DASHBOARD_MODELO_REGISTRADO',
          ocorrido_em: timestampOcorrido,
          executor: 'ANALISTA',
          artefato_origem_tipo: 'MODELO_POWERBI',
          artefato_origem_id: modelo.id,
          payload: {
            modeloId: modelo.id,
            nomeArquivo: modelo.nome_arquivo,
            tipoFormato: modelo.tipo_formato,
            caminhoLocal: modelo.caminho_local ?? null,
            tamanhoBytes: modelo.tamanho_bytes ?? 0,
            modeloAnaliticoId: modelo.modelo_analitico_id ?? null,
            registradoEm: timestampOcorrido,
          },
          versao_contrato: '1.0',
        };
        await deps.processarEventoUseCase.execute(evento);
      }
    } catch {
      // Isolamento de falha no motor de eventos
    }

    revalidatePath('/cockpit');
    revalidatePath('/demands');
    revalidatePath('/pipeline');
    revalidatePath(`/demands/${input.demandaId}`);

    return {
      success: true,
      data: modelo,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao registrar modelo Power BI.',
    };
  }
}

/**
 * Atualiza metadados, status ou justificativa de um Modelo Power BI existente.
 */
export async function atualizarModeloPowerBiAction(
  input: AtualizarModeloPowerBiInput,
  demandaId?: string,
  _deps?: Partial<DashboardActionDeps>
): Promise<DashboardActionResult<ModeloPowerBi>> {
  try {
    const deps = resolveDashboardDeps(_deps);
    const useCase = new AtualizarModeloPowerBiUseCase(deps.modeloPowerBiRepo);

    const { modelo } = await useCase.execute(input);

    // Emissão Determinística de Evento Analítico (Subgate 3.5B.4)
    try {
      const idDemandaEfetiva = demandaId || modelo.demanda_id;
      const demand = await deps.demandRepo.findById(idDemandaEfetiva);
      const timestampOcorrido = modelo.atualizado_em || modelo.criado_em;

      if (modelo.status === StatusModeloPowerBi.CONCLUIDO) {
        // CONCLUIDO != HOMOLOGADO: Conclusão técnica da construção dos artefatos
        const paginas = await deps.paginaRelatorioRepo.findByModeloPowerBiId(modelo.id);
        const medidas = await deps.medidaDaxRepo.findByModeloPowerBiId(modelo.id);
        let totalVisuais = 0;
        for (const pag of paginas) {
          const vis = await deps.visualDashboardRepo.findByPaginaId(pag.id);
          totalVisuais += (vis || []).length;
        }

        const idEvento = `evt_dash_conc_${modelo.id}_${timestampOcorrido}`;
        const evento: EventoAnalitico = {
          id_evento: idEvento,
          demanda_id: idDemandaEfetiva,
          projeto_id: demand?.projeto_id ?? null,
          etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
          categoria: 'DASHBOARD',
          tipo_evento: 'DASHBOARD_MODELO_CONCLUIDO',
          ocorrido_em: timestampOcorrido,
          executor: 'ANALISTA',
          artefato_origem_tipo: 'MODELO_POWERBI',
          artefato_origem_id: modelo.id,
          payload: {
            modeloId: modelo.id,
            nomeArquivo: modelo.nome_arquivo,
            tipoFormato: modelo.tipo_formato,
            totalMedidas: medidas.length,
            totalPaginas: paginas.length,
            totalVisuais: totalVisuais,
            concluidoPor: 'ANALISTA',
            concluidoEm: timestampOcorrido,
          },
          versao_contrato: '1.0',
        };
        await deps.processarEventoUseCase.execute(evento);
      } else if (modelo.status === StatusModeloPowerBi.HOMOLOGADO) {
        // HOMOLOGADO: Homologação formal soberana do dashboard
        const idEvento = `evt_dash_homol_${modelo.id}_${timestampOcorrido}`;
        const evento: EventoAnalitico = {
          id_evento: idEvento,
          demanda_id: idDemandaEfetiva,
          projeto_id: demand?.projeto_id ?? null,
          etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
          categoria: 'DASHBOARD',
          tipo_evento: 'DASHBOARD_MODELO_HOMOLOGADO',
          ocorrido_em: timestampOcorrido,
          executor: 'ANALISTA',
          artefato_origem_tipo: 'MODELO_POWERBI',
          artefato_origem_id: modelo.id,
          payload: {
            modeloId: modelo.id,
            nomeArquivo: modelo.nome_arquivo,
            tipoFormato: modelo.tipo_formato,
            homologadoPor: 'ANALISTA',
            justificativaHomologacao: modelo.justificativa_isencao ?? null,
            homologadoEm: timestampOcorrido,
          },
          versao_contrato: '1.0',
        };
        await deps.processarEventoUseCase.execute(evento);
      }
    } catch {
      // Isolamento de falha no motor de eventos
    }

    revalidatePath('/cockpit');
    revalidatePath('/demands');
    revalidatePath('/pipeline');
    if (demandaId) {
      revalidatePath(`/demands/${demandaId}`);
    }

    return {
      success: true,
      data: modelo,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao atualizar modelo Power BI.',
    };
  }
}

/**
 * Cria uma nova Medida DAX associada a um Modelo Power BI.
 */
export async function criarMedidaDaxAction(
  input: CriarMedidaDaxInput,
  demandaId: string,
  _deps?: Partial<DashboardActionDeps>
): Promise<DashboardActionResult<MedidaDax>> {
  try {
    const deps = resolveDashboardDeps(_deps);

    const useCase = new CriarMedidaDaxUseCase(
      deps.medidaDaxRepo,
      deps.modeloPowerBiRepo,
      deps.modeloAnaliticoRepo
    );

    const { medida } = await useCase.execute(input);

    // Emissão Determinística de Evento Analítico (Subgate 3.5B.4)
    try {
      const demand = await deps.demandRepo.findById(demandaId);
      const idEvento = `evt_dash_dax_${medida.id}`;
      const evento: EventoAnalitico = {
        id_evento: idEvento,
        demanda_id: demandaId,
        projeto_id: demand?.projeto_id ?? null,
        etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
        categoria: 'DAX',
        tipo_evento: 'DASHBOARD_MEDIDA_DAX_CADASTRADA',
        ocorrido_em: medida.criado_em,
        executor: 'ANALISTA',
        artefato_origem_tipo: 'MEDIDA_DAX',
        artefato_origem_id: medida.id,
        payload: {
          medidaId: medida.id,
          modeloPowerBiId: medida.modelo_powerbi_id,
          nome: medida.nome,
          tabelaHospedeira: medida.tabela_hospedeira,
          expressaoDax: medida.expressao_dax,
          categoriaDax: medida.categoria_dax,
          formatoString: medida.formato_string ?? null,
          metricaAnaliticaId: medida.metrica_analitica_id ?? null,
          descricao: medida.descricao ?? null,
          cadastradaEm: medida.criado_em,
        },
        versao_contrato: '1.0',
      };
      await deps.processarEventoUseCase.execute(evento);
    } catch {
      // Isolamento de falha no motor de eventos
    }

    revalidatePath('/cockpit');
    revalidatePath('/demands');
    revalidatePath('/pipeline');
    revalidatePath(`/demands/${demandaId}`);

    return {
      success: true,
      data: medida,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao cadastrar medida DAX.',
    };
  }
}

/**
 * Atualiza propriedades e fórmula de uma Medida DAX existente.
 */
export async function atualizarMedidaDaxAction(
  input: AtualizarMedidaDaxInput,
  demandaId: string,
  _deps?: Partial<DashboardActionDeps>
): Promise<DashboardActionResult<MedidaDax>> {
  try {
    const deps = resolveDashboardDeps(_deps);
    const useCase = new AtualizarMedidaDaxUseCase(deps.medidaDaxRepo);

    const { medida } = await useCase.execute(input);

    revalidatePath('/cockpit');
    revalidatePath('/demands');
    revalidatePath('/pipeline');
    revalidatePath(`/demands/${demandaId}`);

    return {
      success: true,
      data: medida,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao atualizar medida DAX.',
    };
  }
}

/**
 * Remove uma Medida DAX do Modelo Power BI.
 */
export async function excluirMedidaDaxAction(
  id: string,
  demandaId: string,
  _deps?: Partial<DashboardActionDeps>
): Promise<DashboardActionResult<{ id: string }>> {
  try {
    const deps = resolveDashboardDeps(_deps);
    const useCase = new ExcluirMedidaDaxUseCase(deps.medidaDaxRepo);

    await useCase.execute({ id });

    revalidatePath('/cockpit');
    revalidatePath('/demands');
    revalidatePath('/pipeline');
    revalidatePath(`/demands/${demandaId}`);

    return {
      success: true,
      data: { id },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao excluir medida DAX.',
    };
  }
}

/**
 * Executa o DashboardPlannerEngine para propor arquitetura de páginas e visuais.
 */
export async function gerarPropostaDashboardAction(
  demandaId: string,
  template?: TipoTemplateDashboard,
  _deps?: Partial<DashboardActionDeps>
): Promise<DashboardActionResult<DashboardSpecification>> {
  try {
    const deps = resolveDashboardDeps(_deps);

    const useCase = new GerarPropostaDashboardUseCase(
      deps.demandRepo,
      deps.modeloPowerBiRepo,
      deps.modeloAnaliticoRepo,
      deps.medidaDaxRepo
    );

    const proposta = await useCase.execute({
      demandaId,
      template,
      modoTrabalho: 'AUTOMATICO',
    });

    return {
      success: true,
      data: proposta,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao gerar proposta de dashboard.',
    };
  }
}

/**
 * Aprova e materializa formalmente a proposta no SQLite (Human-in-the-Loop).
 */
export async function aprovarPropostaDashboardAction(
  demandaId: string,
  proposta: DashboardSpecification,
  _deps?: Partial<DashboardActionDeps>
): Promise<DashboardActionResult<AprovarPropostaDashboardOutput>> {
  try {
    const deps = resolveDashboardDeps(_deps);

    const useCase = new AprovarPropostaDashboardUseCase(
      deps.paginaRelatorioRepo,
      deps.visualDashboardRepo,
      deps.modeloPowerBiRepo
    );

    const resultado = await useCase.execute({ proposta });

    // Emissão Determinística de Evento Analítico (Subgate 3.5B.4)
    // ID Determinístico: derivado exclusivamente das páginas persistidas criadas no SQLite pela aprovação!
    try {
      const demand = await deps.demandRepo.findById(demandaId);
      const primeiraPaginaId = resultado.paginas[0]?.id || proposta.modeloPowerBiId;
      const timestampAprovado = resultado.paginas[0]?.criado_em || new Date().toISOString();
      const idEvento = `evt_dash_arq_${primeiraPaginaId}`;

      const evento: EventoAnalitico = {
        id_evento: idEvento,
        demanda_id: demandaId,
        projeto_id: demand?.projeto_id ?? null,
        etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
        categoria: 'DASHBOARD',
        tipo_evento: 'DASHBOARD_ARQUITETURA_APROVADA',
        ocorrido_em: timestampAprovado,
        executor: 'ANALISTA',
        artefato_origem_tipo: 'ARQUITETURA_DASHBOARD',
        artefato_origem_id: primeiraPaginaId,
        payload: {
          modeloPowerBiId: proposta.modeloPowerBiId,
          primeiraPaginaId: primeiraPaginaId,
          totalPaginasCriadas: resultado.totalPaginasCriadas,
          totalVisuaisCriados: resultado.totalVisuaisCriados,
          aprovadoPor: 'ANALISTA',
          geradoComAuxilioCopiloto: true,
          aprovadoEm: timestampAprovado,
        },
        versao_contrato: '1.0',
      };
      await deps.processarEventoUseCase.execute(evento);
    } catch {
      // Isolamento de falha no motor de eventos
    }

    revalidatePath('/cockpit');
    revalidatePath('/demands');
    revalidatePath('/pipeline');
    revalidatePath(`/demands/${demandaId}`);

    return {
      success: true,
      data: resultado,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao aprovar proposta de dashboard.',
    };
  }
}

/**
 * Regenera deterministicamente uma alternativa de DataViz para um visual.
 */
export async function gerarAlternativaVisualAction(
  visualAtual: VisualSpecification,
  tipoAlternativo: TipoVisualDashboard
): Promise<DashboardActionResult<VisualSpecification>> {
  try {
    const alternativa = DashboardPlannerEngine.gerarAlternativaVisual(
      visualAtual,
      tipoAlternativo
    );

    return {
      success: true,
      data: alternativa,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao gerar alternativa de visual.',
    };
  }
}

/**
 * Alterna deterministicamente o tipo visual de um visual já persistido.
 */
export async function alternarTipoVisualPersistidoAction(
  id: string,
  novoTipo: TipoVisualDashboard,
  demandaId: string,
  _deps?: Partial<DashboardActionDeps>
): Promise<DashboardActionResult<VisualDashboard>> {
  try {
    const deps = resolveDashboardDeps(_deps);
    const visual = await deps.visualDashboardRepo.findById(id);
    if (!visual) {
      return { success: false, error: 'Visual não encontrado.' };
    }
    const conceito = obterConceitoDataViz(novoTipo);
    const atualizado = await deps.visualDashboardRepo.update({
      ...visual,
      tipo_visual: novoTipo,
      justificativa_dataviz: `Alternativa analítica selecionada: ${conceito.oQueE}`,
      atualizado_em: new Date().toISOString(),
    });

    revalidatePath('/cockpit');
    revalidatePath('/demands');
    revalidatePath('/pipeline');
    revalidatePath(`/demands/${demandaId}`);

    return { success: true, data: atualizado };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao alternar tipo visual.',
    };
  }
}

/**
 * Criação manual/avançada de Página de Relatório.
 */
export async function criarPaginaRelatorioAction(
  input: CriarPaginaRelatorioInput,
  demandaId: string,
  _deps?: Partial<DashboardActionDeps>
): Promise<DashboardActionResult<PaginaRelatorio>> {
  try {
    const deps = resolveDashboardDeps(_deps);
    const useCase = new CriarPaginaRelatorioUseCase(deps.paginaRelatorioRepo, deps.modeloPowerBiRepo);

    const { pagina } = await useCase.execute(input);

    // Emissão Determinística de Evento Analítico (Subgate 3.5B.4)
    try {
      const demand = await deps.demandRepo.findById(demandaId);
      const idEvento = `evt_dash_pag_${pagina.id}`;
      const evento: EventoAnalitico = {
        id_evento: idEvento,
        demanda_id: demandaId,
        projeto_id: demand?.projeto_id ?? null,
        etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
        categoria: 'DASHBOARD',
        tipo_evento: 'DASHBOARD_PAGINA_ESTRUTURADA',
        ocorrido_em: pagina.criado_em,
        executor: 'ANALISTA',
        artefato_origem_tipo: 'PAGINA_RELATORIO',
        artefato_origem_id: pagina.id,
        payload: {
          paginaId: pagina.id,
          modeloPowerBiId: pagina.modelo_powerbi_id,
          nome: pagina.nome,
          ordem: pagina.ordem,
          objetivoAnalitico: pagina.objetivo_analitico ?? null,
          publicoAlvo: pagina.publico_alvo,
          layoutGrid: pagina.layout_grid,
          estruturadaEm: pagina.criado_em,
        },
        versao_contrato: '1.0',
      };
      await deps.processarEventoUseCase.execute(evento);
    } catch {
      // Isolamento de falha no motor de eventos
    }

    revalidatePath('/cockpit');
    revalidatePath('/demands');
    revalidatePath('/pipeline');
    revalidatePath(`/demands/${demandaId}`);

    return {
      success: true,
      data: pagina,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao criar página de relatório.',
    };
  }
}

/**
 * Exclusão de Página de Relatório.
 */
export async function excluirPaginaRelatorioAction(
  id: string,
  demandaId: string,
  _deps?: Partial<DashboardActionDeps>
): Promise<DashboardActionResult<{ id: string }>> {
  try {
    const deps = resolveDashboardDeps(_deps);
    const useCase = new ExcluirPaginaRelatorioUseCase(deps.paginaRelatorioRepo);

    await useCase.execute({ id });

    revalidatePath('/cockpit');
    revalidatePath('/demands');
    revalidatePath('/pipeline');
    revalidatePath(`/demands/${demandaId}`);

    return {
      success: true,
      data: { id },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao excluir página de relatório.',
    };
  }
}

/**
 * Criação manual/avançada de Visual do Dashboard.
 */
export async function criarVisualDashboardAction(
  input: CriarVisualDashboardInput,
  demandaId: string,
  _deps?: Partial<DashboardActionDeps>
): Promise<DashboardActionResult<VisualDashboard>> {
  try {
    const deps = resolveDashboardDeps(_deps);
    const useCase = new CriarVisualDashboardUseCase(deps.visualDashboardRepo, deps.paginaRelatorioRepo);

    const { visual } = await useCase.execute(input);

    // Emissão Determinística de Evento Analítico (Subgate 3.5B.4)
    try {
      const demand = await deps.demandRepo.findById(demandaId);
      const idEvento = `evt_dash_vis_${visual.id}`;
      const evento: EventoAnalitico = {
        id_evento: idEvento,
        demanda_id: demandaId,
        projeto_id: demand?.projeto_id ?? null,
        etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
        categoria: 'DASHBOARD',
        tipo_evento: 'DASHBOARD_VISUAL_DEFINIDO',
        ocorrido_em: visual.criado_em,
        executor: 'ANALISTA',
        artefato_origem_tipo: 'VISUAL_DASHBOARD',
        artefato_origem_id: visual.id,
        payload: {
          visualId: visual.id,
          paginaId: visual.pagina_id,
          titulo: visual.titulo,
          tipoVisual: visual.tipo_visual,
          posicaoLayout: visual.posicao_layout,
          totalMedidasUtilizadas: (visual.medidas_utilizadas_ids || []).length,
          totalAtributosUtilizados: (visual.atributos_utilizados_ids || []).length,
          justificativaDataViz: visual.justificativa_dataviz ?? null,
          definidoEm: visual.criado_em,
        },
        versao_contrato: '1.0',
      };
      await deps.processarEventoUseCase.execute(evento);
    } catch {
      // Isolamento de falha no motor de eventos
    }

    revalidatePath('/cockpit');
    revalidatePath('/demands');
    revalidatePath('/pipeline');
    revalidatePath(`/demands/${demandaId}`);

    return {
      success: true,
      data: visual,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao criar visual do dashboard.',
    };
  }
}

/**
 * Exclusão de Visual do Dashboard.
 */
export async function excluirVisualDashboardAction(
  id: string,
  demandaId: string,
  _deps?: Partial<DashboardActionDeps>
): Promise<DashboardActionResult<{ id: string }>> {
  try {
    const deps = resolveDashboardDeps(_deps);
    const useCase = new ExcluirVisualDashboardUseCase(deps.visualDashboardRepo);

    await useCase.execute({ id });

    revalidatePath('/cockpit');
    revalidatePath('/demands');
    revalidatePath('/pipeline');
    revalidatePath(`/demands/${demandaId}`);

    return {
      success: true,
      data: { id },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao excluir visual do dashboard.',
    };
  }
}

/**
 * Gera o Pacote de Entrega do Dashboard, Documentação Automática e Exportações (Subgate 3.4E)
 */
export async function gerarPacoteEntregaDashboardAction(
  demandaId: string,
  templateEscolhido: string = 'Executive Premium',
  _deps?: Partial<DashboardActionDeps>
): Promise<DashboardActionResult<GerarPacoteEntregaDashboardOutput>> {
  try {
    const deps = resolveDashboardDeps(_deps);

    const useCase = new GerarPacoteEntregaDashboardUseCase(
      deps.demandRepo,
      deps.modeloPowerBiRepo,
      deps.medidaDaxRepo,
      deps.paginaRelatorioRepo,
      deps.visualDashboardRepo,
      deps.modeloAnaliticoRepo
    );

    const resultado = await useCase.execute({
      demandaId,
      templateEscolhido,
    });

    return {
      success: true,
      data: resultado,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao gerar pacote de entrega do dashboard.',
    };
  }
}
