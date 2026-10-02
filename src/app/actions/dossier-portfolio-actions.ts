'use server';

/**
 * src/app/actions/dossier-portfolio-actions.ts
 *
 * Server Actions para a Aba 11 (Dossiê Vivo, Portfólio & Aprendizados — Subgate 2B).
 * Fornece a interface com a camada de aplicação/casos de uso para:
 * 1. Compilação do Dossiê Técnico Vivo (documentação concorrente auditável e interna).
 * 2. Geração, atualização e consulta do Estudo de Caso de Portfólio (STAR).
 * 3. Homologação formal APROV-10 (Trava Soberana Humana).
 * 4. Exportação do estudo de caso homologado.
 * 5. Curadoria e listagem de Ativos de Aprendizado (Memória Operacional).
 */

import { revalidatePath } from 'next/cache';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IEstudoCasoPortfolioRepository } from '@/core/domain/repositories/estudo-caso-portfolio-repository.interface';
import { IAtivoAprendizadoRepository } from '@/core/domain/repositories/ativo-aprendizado-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { IEventoAnaliticoLogRepository } from '@/core/domain/repositories/evento-analitico-log-repository.interface';
import { IRequisitoDemandaRepository } from '@/core/domain/repositories/requisito-demanda-repository.interface';
import { IPerguntaClarificacaoRepository } from '@/core/domain/repositories/pergunta-clarificacao-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IModeloPowerBiRepository } from '@/core/domain/repositories/modelo-powerbi-repository.interface';
import { IMedidaDaxRepository } from '@/core/domain/repositories/medida-dax-repository.interface';
import { IEvidenciaAnaliticaRepository } from '@/core/domain/repositories/evidencia-analitica-repository.interface';
import { IValidacaoConciliacaoRepository } from '@/core/domain/repositories/validacao-conciliacao-repository.interface';
import { IEntregavelDemandaRepository } from '@/core/domain/repositories/entregavel-demanda-repository.interface';

import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteEstudoCasoPortfolioRepository } from '@/infrastructure/db/repositories/sqlite-estudo-caso-portfolio-repository';
import { SqliteAtivoAprendizadoRepository } from '@/infrastructure/db/repositories/sqlite-ativo-aprendizado-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { SqliteEventoAnaliticoLogRepository } from '@/infrastructure/db/repositories/sqlite-evento-analitico-log-repository';
import { SqliteRequisitoDemandaRepository } from '@/infrastructure/db/repositories/sqlite-requisito-repository';
import { SqlitePerguntaClarificacaoRepository } from '@/infrastructure/db/repositories/sqlite-pergunta-clarificacao-repository';
import { SqliteAtivoDadosRepository } from '@/infrastructure/db/repositories/ativo-dados-repository';
import { SqliteProblemasQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-problemas-qualidade-repository';
import { SqliteReceitaPreparacaoRepository } from '@/infrastructure/db/repositories/sqlite-receita-preparacao-repository';
import { SqliteModeloAnaliticoRepository } from '@/infrastructure/db/repositories/sqlite-modelo-analitico-repository';
import { SqliteModeloPowerBiRepository } from '@/infrastructure/db/repositories/sqlite-modelo-powerbi-repository';
import { SqliteMedidaDaxRepository } from '@/infrastructure/db/repositories/sqlite-medida-dax-repository';
import { SqliteEvidenciaAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-evidencia-analitica-repository';
import { SqliteValidacaoConciliacaoRepository } from '@/infrastructure/db/repositories/sqlite-validacao-conciliacao-repository';
import { SqliteEntregavelDemandaRepository } from '@/infrastructure/db/repositories/sqlite-entregavel-demanda-repository';

import {
  CompilarDossieVivoUseCase,
  CompilarDossieVivoOutput,
} from '@/core/use-cases/dossier/compilar-dossie-vivo.use-case';
import { ObterEstudoCasoDemandaUseCase } from '@/core/use-cases/portfolio/obter-estudo-caso-demanda.use-case';
import { GerarRascunhoEstudoCasoUseCase } from '@/core/use-cases/portfolio/gerar-rascunho-estudo-caso.use-case';
import { AtualizarEstudoCasoUseCase } from '@/core/use-cases/portfolio/atualizar-estudo-caso.use-case';
import { HomologarEstudoCasoPortfolioUseCase } from '@/core/use-cases/portfolio/homologar-estudo-caso-portfolio.use-case';
import {
  ExportarEstudoCasoPortfolioUseCase,
  ExportarEstudoCasoPortfolioOutput,
} from '@/core/use-cases/portfolio/exportar-estudo-caso-portfolio.use-case';
import { CurarAtivoAprendizadoUseCase } from '@/core/use-cases/portfolio/curar-ativo-aprendizado.use-case';
import { ListarAtivosAprendizadoDemandaUseCase } from '@/core/use-cases/portfolio/listar-ativos-aprendizado-demanda.use-case';

import {
  atualizarEstudoCasoSchema,
  homologarEstudoCasoSchema,
  curarAtivoAprendizadoSchema,
  AtualizarEstudoCasoSchemaInput,
  HomologarEstudoCasoSchemaInput,
  CurarAtivoAprendizadoSchemaInput,
} from '@/lib/validations/portfolio-schema';
import { EstudoCasoPortfolio } from '@/core/domain/entities/estudo-caso-portfolio';
import { AtivoAprendizado } from '@/core/domain/entities/ativo-aprendizado';

export type DossierPortfolioActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface DossierPortfolioDeps {
  demandRepo: IDemandRepository;
  caseRepo: IEstudoCasoPortfolioRepository;
  ativoRepo: IAtivoAprendizadoRepository;
  auditRepo: IAuditRepository;
  eventLogRepo: IEventoAnaliticoLogRepository;
  requisitoRepo: IRequisitoDemandaRepository;
  perguntaRepo: IPerguntaClarificacaoRepository;
  ativoDadosRepo: IAtivoDadosRepository;
  problemaQualidadeRepo: IProblemasQualidadeRepository;
  receitaRepo: IReceitaPreparacaoRepository;
  modeloAnaliticoRepo: IModeloAnaliticoRepository;
  modeloPowerBiRepo: IModeloPowerBiRepository;
  medidaDaxRepo: IMedidaDaxRepository;
  evidenciaRepo: IEvidenciaAnaliticaRepository;
  validacaoRepo: IValidacaoConciliacaoRepository;
  entregavelRepo: IEntregavelDemandaRepository;
}

function resolveDossierPortfolioDeps(
  customDeps?: Partial<DossierPortfolioDeps>
): DossierPortfolioDeps {
  return {
    demandRepo: customDeps?.demandRepo ?? new SqliteDemandRepository(),
    caseRepo: customDeps?.caseRepo ?? new SqliteEstudoCasoPortfolioRepository(),
    ativoRepo: customDeps?.ativoRepo ?? new SqliteAtivoAprendizadoRepository(),
    auditRepo: customDeps?.auditRepo ?? new SqliteAuditRepository(),
    eventLogRepo: customDeps?.eventLogRepo ?? new SqliteEventoAnaliticoLogRepository(),
    requisitoRepo: customDeps?.requisitoRepo ?? new SqliteRequisitoDemandaRepository(),
    perguntaRepo: customDeps?.perguntaRepo ?? new SqlitePerguntaClarificacaoRepository(),
    ativoDadosRepo: customDeps?.ativoDadosRepo ?? new SqliteAtivoDadosRepository(),
    problemaQualidadeRepo: customDeps?.problemaQualidadeRepo ?? new SqliteProblemasQualidadeRepository(),
    receitaRepo: customDeps?.receitaRepo ?? new SqliteReceitaPreparacaoRepository(),
    modeloAnaliticoRepo: customDeps?.modeloAnaliticoRepo ?? new SqliteModeloAnaliticoRepository(),
    modeloPowerBiRepo: customDeps?.modeloPowerBiRepo ?? new SqliteModeloPowerBiRepository(),
    medidaDaxRepo: customDeps?.medidaDaxRepo ?? new SqliteMedidaDaxRepository(),
    evidenciaRepo: customDeps?.evidenciaRepo ?? new SqliteEvidenciaAnaliticaRepository(),
    validacaoRepo: customDeps?.validacaoRepo ?? new SqliteValidacaoConciliacaoRepository(),
    entregavelRepo: customDeps?.entregavelRepo ?? new SqliteEntregavelDemandaRepository(),
  };
}

function revalidateAllPaths(demandaId: string) {
  try {
    revalidatePath('/cockpit');
    revalidatePath('/demands');
    revalidatePath('/pipeline');
    revalidatePath(`/demands/${demandaId}`);
  } catch {
    // Modo teste sem servidor Next.js ativo
  }
}

/**
 * 1. Compilar / Consultar Dossiê Técnico Concorrente Vivo
 */
export async function compilarDossieVivoAction(
  demandaId: string,
  customDeps?: Partial<DossierPortfolioDeps>
): Promise<DossierPortfolioActionResult<CompilarDossieVivoOutput>> {
  try {
    const deps = resolveDossierPortfolioDeps(customDeps);
    const useCase = new CompilarDossieVivoUseCase(
      deps.demandRepo,
      deps.requisitoRepo,
      deps.perguntaRepo,
      deps.ativoDadosRepo,
      deps.problemaQualidadeRepo,
      deps.receitaRepo,
      deps.modeloAnaliticoRepo,
      deps.modeloPowerBiRepo,
      deps.medidaDaxRepo,
      deps.evidenciaRepo,
      deps.validacaoRepo,
      deps.entregavelRepo,
      deps.auditRepo
    );

    const output = await useCase.execute({ demandaId });
    return { success: true, data: output };
  } catch (error: any) {
    return { success: false, error: error.message || 'Falha ao compilar o Dossiê Técnico Vivo.' };
  }
}

/**
 * 2. Obter Estudo de Caso de Portfólio atual da Demanda (se existir)
 */
export async function obterEstudoCasoAction(
  demandaId: string,
  customDeps?: Partial<DossierPortfolioDeps>
): Promise<DossierPortfolioActionResult<EstudoCasoPortfolio | null>> {
  try {
    const deps = resolveDossierPortfolioDeps(customDeps);
    const useCase = new ObterEstudoCasoDemandaUseCase(deps.caseRepo);
    const caseEntity = await useCase.execute({ demandaId });
    return { success: true, data: caseEntity };
  } catch (error: any) {
    return { success: false, error: error.message || 'Falha ao buscar estudo de caso.' };
  }
}

/**
 * 3. Gerar ou Regenerar Rascunho Determinístico STAR
 */
export async function gerarRascunhoEstudoCasoAction(
  demandaId: string,
  customDeps?: Partial<DossierPortfolioDeps>
): Promise<DossierPortfolioActionResult<EstudoCasoPortfolio>> {
  try {
    const deps = resolveDossierPortfolioDeps(customDeps);
    const useCase = new GerarRascunhoEstudoCasoUseCase(
      deps.demandRepo,
      deps.requisitoRepo,
      deps.ativoDadosRepo,
      deps.problemaQualidadeRepo,
      deps.receitaRepo,
      deps.modeloAnaliticoRepo,
      deps.modeloPowerBiRepo,
      deps.medidaDaxRepo,
      deps.evidenciaRepo,
      deps.validacaoRepo,
      deps.entregavelRepo,
      deps.caseRepo
    );

    const result = await useCase.execute({ demandaId });
    revalidateAllPaths(demandaId);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || 'Falha ao gerar rascunho de estudo de caso.' };
  }
}

/**
 * 4. Atualizar Estudo de Caso (Campos STAR, Técnicas ou Checklist)
 * Salvaguarda: Invalida server-side se estiver em HOMOLOGADO_APROV_10
 */
export async function atualizarEstudoCasoAction(
  rawInput: AtualizarEstudoCasoSchemaInput,
  customDeps?: Partial<DossierPortfolioDeps>
): Promise<DossierPortfolioActionResult<EstudoCasoPortfolio>> {
  try {
    const parsed = atualizarEstudoCasoSchema.parse(rawInput);
    const deps = resolveDossierPortfolioDeps(customDeps);
    const useCase = new AtualizarEstudoCasoUseCase(
      deps.caseRepo,
      deps.demandRepo,
      deps.auditRepo
    );

    const updated = await useCase.execute(parsed);
    revalidateAllPaths(updated.demanda_id);
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Falha ao atualizar estudo de caso.' };
  }
}

/**
 * 5. Homologar Formalmente Estudo de Caso de Portfólio (APROV-10)
 * Trava Soberana Humana: Exige checklist 100% atestado e declaração humana assinada.
 */
export async function homologarEstudoCasoAction(
  rawInput: HomologarEstudoCasoSchemaInput,
  customDeps?: Partial<DossierPortfolioDeps>
): Promise<DossierPortfolioActionResult<EstudoCasoPortfolio>> {
  try {
    const parsed = homologarEstudoCasoSchema.parse(rawInput);
    const deps = resolveDossierPortfolioDeps(customDeps);
    const useCase = new HomologarEstudoCasoPortfolioUseCase(
      deps.caseRepo,
      deps.demandRepo,
      deps.eventLogRepo,
      deps.auditRepo
    );

    const homologado = await useCase.execute(parsed);
    revalidateAllPaths(homologado.demanda_id);
    return { success: true, data: homologado };
  } catch (error: any) {
    return { success: false, error: error.message || 'Falha ao homologar estudo de caso via APROV-10.' };
  }
}

/**
 * 6. Exportar Estudo de Caso Homologado para Formato Público Sanitizado
 * Salvaguarda: Bloqueia deterministicamente se status !== HOMOLOGADO_APROV_10
 */
export async function exportarEstudoCasoAction(
  caseId: string,
  customDeps?: Partial<DossierPortfolioDeps>
): Promise<DossierPortfolioActionResult<ExportarEstudoCasoPortfolioOutput>> {
  try {
    const deps = resolveDossierPortfolioDeps(customDeps);
    const useCase = new ExportarEstudoCasoPortfolioUseCase(deps.caseRepo);
    const output = await useCase.execute({ caseId });
    return { success: true, data: output };
  } catch (error: any) {
    return { success: false, error: error.message || 'Falha ao exportar estudo de caso.' };
  }
}

/**
 * 7. Curar e Promover Ativo de Aprendizado para a Memória Operacional
 */
export async function curarAtivoAprendizadoAction(
  rawInput: CurarAtivoAprendizadoSchemaInput,
  customDeps?: Partial<DossierPortfolioDeps>
): Promise<DossierPortfolioActionResult<AtivoAprendizado>> {
  try {
    const parsed = curarAtivoAprendizadoSchema.parse(rawInput);
    const deps = resolveDossierPortfolioDeps(customDeps);
    const useCase = new CurarAtivoAprendizadoUseCase(
      deps.ativoRepo,
      deps.demandRepo,
      deps.eventLogRepo,
      deps.auditRepo
    );

    const ativo = await useCase.execute(parsed);
    if (parsed.demandaId) {
      revalidateAllPaths(parsed.demandaId);
    }
    return { success: true, data: ativo };
  } catch (error: any) {
    return { success: false, error: error.message || 'Falha ao curar ativo de aprendizado.' };
  }
}

/**
 * 8. Listar Ativos de Aprendizado vinculados à Demanda
 */
export async function listarAtivosAprendizadoAction(
  demandaId: string,
  customDeps?: Partial<DossierPortfolioDeps>
): Promise<DossierPortfolioActionResult<AtivoAprendizado[]>> {
  try {
    const deps = resolveDossierPortfolioDeps(customDeps);
    const useCase = new ListarAtivosAprendizadoDemandaUseCase(deps.ativoRepo);
    const ativos = await useCase.execute({ demandaId });
    return { success: true, data: ativos };
  } catch (error: any) {
    return { success: false, error: error.message || 'Falha ao listar ativos de aprendizado.' };
  }
}
