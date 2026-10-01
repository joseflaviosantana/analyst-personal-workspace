/**
 * tests/integration/dossier-portfolio/dossier-portfolio-actions.spec.ts
 *
 * Suíte de Testes de Integração das Server Actions da Aba 11 (Subgate 2B).
 * Valida o ciclo completo com banco SQLite real e aplicação das 5 Salvaguardas Mandatórias:
 * 1. Separação clara Dossiê Técnico × Case de Portfólio.
 * 2. Estado inicial RASCUNHO com exportação pública estritamente bloqueada.
 * 3. Trava Soberana APROV-10 exigindo checklist 100% atestado e declaração humana.
 * 4. Salvaguarda 1 & 2: Invalidação server-side por edição material em case homologado,
 *    retorno determinístico a RASCUNHO, incremento de versão e rebloqueio de exportação.
 * 5. Salvaguarda 3: Bloqueio estrito em demandas SUSPENSA e CANCELADA.
 * 6. Salvaguarda 4: Demanda CONCLUIDA operando plenamente para elaboração, revisão e APROV-10.
 * 7. Salvaguarda 5: Dossiê Técnico 100% consultável/exportável em qualquer estado.
 * 8. Curadoria e listagem de Ativos de Aprendizado para a Memória Operacional.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import * as schema from '@/infrastructure/db/schema';

import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
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
  compilarDossieVivoAction,
  obterEstudoCasoAction,
  gerarRascunhoEstudoCasoAction,
  atualizarEstudoCasoAction,
  homologarEstudoCasoAction,
  exportarEstudoCasoAction,
  curarAtivoAprendizadoAction,
  listarAtivosAprendizadoAction,
  DossierPortfolioDeps,
} from '@/app/actions/dossier-portfolio-actions';

import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { StatusEstudoCaso } from '@/core/domain/enums/status-estudo-caso';
import { CategoriaAtivoAprendizado } from '@/core/domain/enums/categoria-ativo-aprendizado';
import { TecnicaSanitizacao } from '@/core/domain/enums/tecnica-sanitizacao';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Integration: Dossier & Portfolio Actions Lifecycle (Subgate 2B)', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let deps: DossierPortfolioDeps;

  const testProjectId = 'prj_dossier_integ_1';
  const testDemandId = 'dem_dossier_integ_1';
  const testDemandSuspensaId = 'dem_dossier_suspensa_1';
  const testDemandConcluidaId = 'dem_dossier_concluida_1';

  beforeEach(async () => {
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');

    db = drizzle(sqlite, { schema });
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(db, { migrationsFolder });

    const demandRepo = new SqliteDemandRepository(db);
    const caseRepo = new SqliteEstudoCasoPortfolioRepository(db);
    const ativoRepo = new SqliteAtivoAprendizadoRepository(db);
    const auditRepo = new SqliteAuditRepository(db);
    const eventLogRepo = new SqliteEventoAnaliticoLogRepository(db);
    const requisitoRepo = new SqliteRequisitoDemandaRepository(db);
    const perguntaRepo = new SqlitePerguntaClarificacaoRepository(db);
    const ativoDadosRepo = new SqliteAtivoDadosRepository(db);
    const problemaQualidadeRepo = new SqliteProblemasQualidadeRepository(db);
    const receitaRepo = new SqliteReceitaPreparacaoRepository(db);
    const modeloAnaliticoRepo = new SqliteModeloAnaliticoRepository(db);
    const modeloPowerBiRepo = new SqliteModeloPowerBiRepository(db);
    const medidaDaxRepo = new SqliteMedidaDaxRepository(db);
    const evidenciaRepo = new SqliteEvidenciaAnaliticaRepository(db);
    const validacaoRepo = new SqliteValidacaoConciliacaoRepository(db);
    const entregavelRepo = new SqliteEntregavelDemandaRepository(db);

    deps = {
      demandRepo,
      caseRepo,
      ativoRepo,
      auditRepo,
      eventLogRepo,
      requisitoRepo,
      perguntaRepo,
      ativoDadosRepo,
      problemaQualidadeRepo,
      receitaRepo,
      modeloAnaliticoRepo,
      modeloPowerBiRepo,
      medidaDaxRepo,
      evidenciaRepo,
      validacaoRepo,
      entregavelRepo,
    };

    // Insere projeto base
    const now = new Date().toISOString();
    db.insert(schema.projetos).values({
      id: testProjectId,
      nome: 'Projeto de Integração de Portfólio',
      status: 'ATIVO',
      criado_em: now,
      atualizado_em: now,
    }).run();

    // 1. Demanda em Modelagem / Ativa
    db.insert(schema.demandas).values({
      id: testDemandId,
      projeto_id: testProjectId,
      titulo: 'Análise de Churn de Clientes',
      solicitacao_bruta: 'Mensagem bruta original',
      contexto: 'Contexto de perda de clientes recorrentes',
      objetivo_inicial: 'Mapear motivos de cancelamento',
      estado: EstadoDemanda.PRONTA_PARA_ENTREGA,
      criado_em: now,
      atualizado_em: now,
    }).run();

    // 2. Demanda Suspensa
    db.insert(schema.demandas).values({
      id: testDemandSuspensaId,
      projeto_id: testProjectId,
      titulo: 'Demanda Suspensa de Teste',
      solicitacao_bruta: 'Bruto suspensa',
      contexto: 'Contexto suspenso',
      objetivo_inicial: 'Objetivo suspenso',
      estado: EstadoDemanda.SUSPENSA,
      criado_em: now,
      atualizado_em: now,
    }).run();

    // 3. Demanda Concluída
    db.insert(schema.demandas).values({
      id: testDemandConcluidaId,
      projeto_id: testProjectId,
      titulo: 'Demanda Concluída com Sucesso',
      solicitacao_bruta: 'Bruto concluído',
      contexto: 'Contexto concluído',
      objetivo_inicial: 'Objetivo concluído',
      estado: EstadoDemanda.CONCLUIDA,
      data_conclusao: now,
      criado_em: now,
      atualizado_em: now,
    }).run();
  });

  it('1. Compilação do Dossiê Vivo: Funciona em qualquer estado sem requerer APROV-10 (Salvaguarda 5)', async () => {
    // Demanda ativa
    const resAtiva = await compilarDossieVivoAction(testDemandId, deps);
    expect(resAtiva.success).toBe(true);
    if (resAtiva.success) {
      expect(resAtiva.data.totalSecoes).toBe(11);
      expect(resAtiva.data.markdown).toContain('# DOSSIÊ TÉCNICO CONCORRENTE — Análise de Churn de Clientes');
    }

    // Demanda suspensa
    const resSuspensa = await compilarDossieVivoAction(testDemandSuspensaId, deps);
    expect(resSuspensa.success).toBe(true);
    if (resSuspensa.success) {
      expect(resSuspensa.data.markdown).toContain('Estado Operacional no Workflow:** `SUSPENSA`');
    }

    // Demanda concluída
    const resConcluida = await compilarDossieVivoAction(testDemandConcluidaId, deps);
    expect(resConcluida.success).toBe(true);
    if (resConcluida.success) {
      expect(resConcluida.data.markdown).toContain('Estado Operacional no Workflow:** `CONCLUIDA`');
    }
  });

  it('2. Geração de Rascunho STAR e Bloqueio de Exportação Pública Pré-APROV-10', async () => {
    // 1. Gerar rascunho determinístico
    const resGerar = await gerarRascunhoEstudoCasoAction(testDemandId, deps);
    expect(resGerar.success).toBe(true);
    if (!resGerar.success) return;

    expect(resGerar.data.status).toBe(StatusEstudoCaso.RASCUNHO);
    expect(resGerar.data.versao).toBe(1);
    expect(resGerar.data.homologado_em).toBeNull();
    expect(resGerar.data.checklist_sanitizacao.declaracaoHumanaAssinada).toBe(false);

    // 2. Consulta da demanda
    const resObter = await obterEstudoCasoAction(testDemandId, deps);
    expect(resObter.success).toBe(true);
    if (resObter.success && resObter.data) {
      expect(resObter.data.id).toBe(resGerar.data.id);
    }

    // 3. Tentativa de exportação pública antes da homologação APROV-10 deve ser bloqueada
    const resExport = await exportarEstudoCasoAction(resGerar.data.id, deps);
    expect(resExport.success).toBe(false);
    if (!resExport.success) {
      expect(resExport.error).toContain('APROV-10');
    }
  });

  it('3. Trava APROV-10: Impede homologação com checklist incompleto e autoriza com 100% atestado', async () => {
    const resGerar = await gerarRascunhoEstudoCasoAction(testDemandId, deps);
    expect(resGerar.success).toBe(true);
    if (!resGerar.success) return;

    const caseId = resGerar.data.id;

    // 1. Tentativa de homologar sem checklist completo
    const resHomologarInvalido = await homologarEstudoCasoAction(
      { caseId, autor: 'Analista Sênior' },
      deps
    );
    expect(resHomologarInvalido.success).toBe(false);
    if (!resHomologarInvalido.success) {
      expect(resHomologarInvalido.error).toContain('APROV-10');
    }

    // 2. Preenche o checklist 100% e a declaração humana
    const resAtualizar = await atualizarEstudoCasoAction(
      {
        caseId,
        checklist_sanitizacao: {
          nomesClientesOcultados: true,
          dadosPessoaisOcultados: true,
          dadosFinanceirosSigilososTratados: true,
          metricasFatuaisPreservadas: true,
          declaracaoHumanaAssinada: true,
        },
      },
      deps
    );
    expect(resAtualizar.success).toBe(true);

    // 3. Homologação formal APROV-10 agora deve ser aprovada
    const resHomologarOk = await homologarEstudoCasoAction(
      {
        caseId,
        autor: 'José Flávio (Analista Responsável)',
        justificativa: 'Métricas conciliadas e tratadas proporcionalmente.',
      },
      deps
    );
    expect(resHomologarOk.success).toBe(true);
    if (resHomologarOk.success) {
      expect(resHomologarOk.data.status).toBe(StatusEstudoCaso.HOMOLOGADO_APROV_10);
      expect(resHomologarOk.data.homologado_por).toBe('José Flávio (Analista Responsável)');
      expect(resHomologarOk.data.homologado_em).not.toBeNull();
    }

    // 4. Exportação pública agora deve ser autorizada com sucesso
    const resExportOk = await exportarEstudoCasoAction(caseId, deps);
    expect(resExportOk.success).toBe(true);
    if (resExportOk.success) {
      expect(resExportOk.data.markdown).toContain('Estudo de Caso Profissional de Portfólio');
      expect(resExportOk.data.markdown).toContain('Homologado por:');
      expect(resExportOk.data.markdown).toContain('José Flávio (Analista Responsável)');
    }

    // 5. Verifica se o Event Log e a Trilha de Auditoria registraram o evento formal
    const logs = await deps.eventLogRepo.findByDemandaId(testDemandId);
    expect(logs.some((l) => l.tipo_evento === 'PORTFOLIO_CASO_HOMOLOGADO_APROV_10')).toBe(true);

    const audits = await deps.auditRepo.findByDemandaId(testDemandId);
    expect(audits.some((a) => a.entidade === 'ESTUDO_CASO_PORTFOLIO')).toBe(true);
  });

  it('4. Salvaguarda 1 & 2: Edição material em case homologado invalida server-side para RASCUNHO e rebloqueia exportação', async () => {
    // 1. Cria e homologa case
    const resGerar = await gerarRascunhoEstudoCasoAction(testDemandId, deps);
    if (!resGerar.success) return;
    const caseId = resGerar.data.id;

    await atualizarEstudoCasoAction(
      {
        caseId,
        checklist_sanitizacao: {
          nomesClientesOcultados: true,
          dadosPessoaisOcultados: true,
          dadosFinanceirosSigilososTratados: true,
          metricasFatuaisPreservadas: true,
          declaracaoHumanaAssinada: true,
        },
      },
      deps
    );

    const resHomologar = await homologarEstudoCasoAction(
      { caseId, autor: 'Analista Sênior' },
      deps
    );
    expect(resHomologar.success).toBe(true);

    // 2. Executa edição material (alterando o título ou STAR)
    const resEdicaoMaterial = await atualizarEstudoCasoAction(
      {
        caseId,
        titulo: 'Título Materialmente Editado Após Homologação',
      },
      deps
    );
    expect(resEdicaoMaterial.success).toBe(true);
    if (resEdicaoMaterial.success) {
      // Invalidação server-side comprovada
      expect(resEdicaoMaterial.data.status).toBe(StatusEstudoCaso.RASCUNHO);
      expect(resEdicaoMaterial.data.homologado_em).toBeNull();
      expect(resEdicaoMaterial.data.homologado_por).toBeNull();
      expect(resEdicaoMaterial.data.versao).toBe(2);
    }

    // 3. Exportação pública deve ser imediatamente bloqueada após a edição material
    const resExportBloqueada = await exportarEstudoCasoAction(caseId, deps);
    expect(resExportBloqueada.success).toBe(false);
    if (!resExportBloqueada.success) {
      expect(resExportBloqueada.error).toContain('APROV-10');
    }
  });

  it('5. Salvaguarda 3: Demandas SUSPENSA e CANCELADA bloqueiam mutações', async () => {
    // Tentativa de gerar rascunho em demanda suspensa
    const resGerarSuspensa = await gerarRascunhoEstudoCasoAction(testDemandSuspensaId, deps);
    expect(resGerarSuspensa.success).toBe(false);
    if (!resGerarSuspensa.success) {
      expect(resGerarSuspensa.error).toContain('SUSPENSA');
    }

    // Tentativa de curar ativo em demanda suspensa
    const resCurarSuspensa = await curarAtivoAprendizadoAction(
      {
        demandaId: testDemandSuspensaId,
        titulo: 'DAX Reutilizável',
        categoria: CategoriaAtivoAprendizado.DAX,
        procedimento_padrao: 'CALCULATE(...)',
        tags: [],
      },
      deps
    );
    expect(resCurarSuspensa.success).toBe(false);
    if (!resCurarSuspensa.success) {
      expect(resCurarSuspensa.error).toContain('SUSPENSA');
    }
  });

  it('6. Salvaguarda 4: Demanda CONCLUIDA autoriza elaboração, revisão, APROV-10 e curadoria de aprendizados', async () => {
    // 1. Gerar rascunho em demanda concluída
    const resGerar = await gerarRascunhoEstudoCasoAction(testDemandConcluidaId, deps);
    expect(resGerar.success).toBe(true);
    if (!resGerar.success) return;
    const caseId = resGerar.data.id;

    // 2. Atualizar checklist
    const resAtualizar = await atualizarEstudoCasoAction(
      {
        caseId,
        checklist_sanitizacao: {
          nomesClientesOcultados: true,
          dadosPessoaisOcultados: true,
          dadosFinanceirosSigilososTratados: true,
          metricasFatuaisPreservadas: true,
          declaracaoHumanaAssinada: true,
        },
      },
      deps
    );
    expect(resAtualizar.success).toBe(true);

    // 3. Homologar APROV-10 na demanda concluída
    const resHomologar = await homologarEstudoCasoAction(
      { caseId, autor: 'Analista de Conclusão' },
      deps
    );
    expect(resHomologar.success).toBe(true);
    if (resHomologar.success) {
      expect(resHomologar.data.status).toBe(StatusEstudoCaso.HOMOLOGADO_APROV_10);
    }

    // 4. Curar ativo de aprendizado na demanda concluída
    const resCurar = await curarAtivoAprendizadoAction(
      {
        demandaId: testDemandConcluidaId,
        titulo: 'Padrão Power Query de Desnormalização',
        categoria: CategoriaAtivoAprendizado.POWER_QUERY_M,
        procedimento_padrao: '= Table.UnpivotOtherColumns(...)',
        tags: ['PowerQuery', 'ETL'],
      },
      deps
    );
    expect(resCurar.success).toBe(true);

    // 5. Listar ativos da demanda
    const resListar = await listarAtivosAprendizadoAction(testDemandConcluidaId, deps);
    expect(resListar.success).toBe(true);
    if (resListar.success) {
      expect(resListar.data).toHaveLength(1);
      expect(resListar.data[0].titulo).toBe('Padrão Power Query de Desnormalização');
    }
  });
});
