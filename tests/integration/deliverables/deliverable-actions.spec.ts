import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import * as schema from '@/infrastructure/db/schema';

import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteValidacaoConciliacaoRepository } from '@/infrastructure/db/repositories/sqlite-validacao-conciliacao-repository';
import { SqliteEntregavelDemandaRepository } from '@/infrastructure/db/repositories/sqlite-entregavel-demanda-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { SqliteEventoAnaliticoLogRepository } from '@/infrastructure/db/repositories/sqlite-evento-analitico-log-repository';
import { SqliteEvidenciaAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-evidencia-analitica-repository';

import {
  RegistrarEvidenciaUseCase,
  ProcessarEventoAnaliticoUseCase,
} from '@/core/use-cases/evidence';
import { criarEvidenceEventEnginePadrao } from '@/core/domain/evidence-events';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { TipoEntregavel } from '@/core/domain/enums/tipo-entregavel';
import { StatusEntregavel } from '@/core/domain/enums/status-entregavel';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';
import { CamadaValidacao } from '@/core/domain/enums/camada-validacao';
import { ResultadoValidacao } from '@/core/domain/enums/resultado-validacao';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import {
  registrarEntregavelAction,
  disponibilizarEntregavelAction,
  registrarAceiteEntregaAction,
  obterProntidaoEntregaAction,
  gerarDocumentacaoContratanteAction,
  formalizarEncerramentoDemandaAction,
  DeliverableActionDeps,
} from '@/app/actions/deliverable-actions';

describe('Integration: Deliverable Actions & Governance Lifecycle (Subgate 3.7C)', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let validacaoRepo: SqliteValidacaoConciliacaoRepository;
  let entregavelRepo: SqliteEntregavelDemandaRepository;
  let auditRepo: SqliteAuditRepository;
  let eventoLogRepo: SqliteEventoAnaliticoLogRepository;
  let evidenciaRepo: SqliteEvidenciaAnaliticaRepository;
  let deps: DeliverableActionDeps;

  const testProjectId = 'prj_deliv_integ_1';
  const testDemandId = 'dem_deliv_integ_1';

  beforeEach(async () => {
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');

    db = drizzle(sqlite, { schema });
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(db, { migrationsFolder });

    projectRepo = new SqliteProjectRepository(db);
    demandRepo = new SqliteDemandRepository(db);
    validacaoRepo = new SqliteValidacaoConciliacaoRepository(db);
    entregavelRepo = new SqliteEntregavelDemandaRepository(db);
    auditRepo = new SqliteAuditRepository(db);
    eventoLogRepo = new SqliteEventoAnaliticoLogRepository(db);
    evidenciaRepo = new SqliteEvidenciaAnaliticaRepository(db);

    const engine = criarEvidenceEventEnginePadrao();
    const registrarEvidenciaUseCase = new RegistrarEvidenciaUseCase(evidenciaRepo, demandRepo);
    const processarEventoUseCase = new ProcessarEventoAnaliticoUseCase(
      engine,
      eventoLogRepo,
      registrarEvidenciaUseCase
    );

    deps = {
      demandRepo,
      entregavelRepo,
      validacaoRepo,
      auditRepo,
      processarEventoUseCase,
    };

    // Criar projeto base
    await projectRepo.create({
      id: testProjectId,
      nome: 'Projeto BI Comercial',
      descricao: 'Modernização de relatórios comerciais',
      status: 'ATIVO',
      data_inicio: '2026-03-01T00:00:00.000Z',
      data_conclusao_prevista: '2026-03-31T00:00:00.000Z',
      data_conclusao_real: null,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    });

    // Criar demanda base no estado PRONTA_PARA_ENTREGA
    await demandRepo.create({
      id: testDemandId,
      projeto_id: testProjectId,
      titulo: 'Dashboard Executivo de Faturamento',
      solicitacao_bruta: 'Desenvolvimento de painel executivo com conciliação contábil',
      contexto: 'Operações de Vendas',
      objetivo_inicial: 'Entregar painel comercial homologado',
      prazo_esperado: null,
      restricoes_declaradas: null,
      data_conclusao: null,
      estado: EstadoDemanda.PRONTA_PARA_ENTREGA,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    });

    // Cadastrar uma validação obrigatória aprovada para atender V-01/V-02
    await validacaoRepo.create({
      id: 'val_base_01',
      demanda_id: testDemandId,
      titulo: 'Conciliação Contábil Faturamento',
      camada: CamadaValidacao.CONCILIACAO_CRUZADA_KPI,
      metodo_verificacao: 'Batimento com ERP',
      tolerancia_permitida: 0,
      resultado: ResultadoValidacao.APROVADO,
      valor_esperado: 100000.0,
      valor_obtido: 100000.0,
      divergencia_absoluta: 0,
      divergencia_percentual: 0,
      obrigatoria: true,
      executado_por: 'HUMANO',
      executado_em: new Date().toISOString(),
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    });
  });

  it('1. deve cadastrar entregável e despachar evento ENTREGA_ARTEFATO_REGISTRADO', async () => {
    const res = await registrarEntregavelAction(
      {
        demanda_id: testDemandId,
        titulo: 'Dashboard Power BI Executivo',
        tipo: TipoEntregavel.DASHBOARD_POWERBI,
        versao: '1.0',
        caminho_arquivo_ou_link: 'app.powerbi.com/report-123',
        descricao_sumario: 'Painel com visão consolidada de faturamento mensal',
        obrigatorio: true,
        status: StatusEntregavel.RASCUNHO,
      },
      deps
    );

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.data.id).toMatch(/^ent_/);
    expect(res.data.status).toBe(StatusEntregavel.RASCUNHO);
    expect(res.data.aceite_status).toBe(StatusAceiteEntrega.PENDENTE);

    // Verificar disparo determinístico do evento no log
    const logs = await eventoLogRepo.findByDemandaId(testDemandId);
    const logRegistro = logs.find((l) => l.tipo_evento === 'ENTREGA_ARTEFATO_REGISTRADO');
    expect(logRegistro).toBeDefined();
    expect(logRegistro?.id_evento).toBe(`evt_ent_reg_${res.data.id}`);
  });

  it('2. deve disponibilizar entregável e despachar evento ENTREGA_PACOTE_DISPONIBILIZADO', async () => {
    const regRes = await registrarEntregavelAction(
      {
        demanda_id: testDemandId,
        titulo: 'Dicionário de Métricas DAX',
        tipo: TipoEntregavel.DOCUMENTO_TECNICO,
        versao: '1.0',
        caminho_arquivo_ou_link: 'docs/dicionario.md',
        obrigatorio: true,
        status: StatusEntregavel.RASCUNHO,
      },
      deps
    );
    expect(regRes.success).toBe(true);
    if (!regRes.success) return;

    const dispRes = await disponibilizarEntregavelAction(regRes.data.id, deps);
    expect(dispRes.success).toBe(true);
    if (!dispRes.success) return;

    expect(dispRes.data.status).toBe(StatusEntregavel.DISPONIVEL);

    // Verificar evento de disponibilização
    const logs = await eventoLogRepo.findByDemandaId(testDemandId);
    const logDisp = logs.find((l) => l.tipo_evento === 'ENTREGA_PACOTE_DISPONIBILIZADO');
    expect(logDisp).toBeDefined();
    expect(logDisp?.id_evento).toBe(`evt_ent_disp_${testDemandId}_${regRes.data.id}_v1.0`);
  });

  it('3. deve registrar aceite formal (ACEITO) e despachar evento ENTREGA_ACEITE_FORMALIZADO', async () => {
    const regRes = await registrarEntregavelAction(
      {
        demanda_id: testDemandId,
        titulo: 'Relatório Executivo Mensal',
        tipo: TipoEntregavel.RELATORIO_PDF,
        versao: '1.0',
        caminho_arquivo_ou_link: 'relatorios/faturamento.pdf',
        obrigatorio: true,
        status: StatusEntregavel.DISPONIVEL,
      },
      deps
    );
    expect(regRes.success).toBe(true);
    if (!regRes.success) return;

    const aceiteRes = await registrarAceiteEntregaAction(
      {
        id: regRes.data.id,
        aceite_status: StatusAceiteEntrega.ACEITO,
        aceite_por: 'Juliana Costa (Gerente Financeira)',
        aceite_justificativa: 'Relatório aprovado integralmente com os números do SAP.',
      },
      deps
    );

    expect(aceiteRes.success).toBe(true);
    if (!aceiteRes.success) return;

    expect(aceiteRes.data.aceite_status).toBe(StatusAceiteEntrega.ACEITO);
    expect(aceiteRes.data.status).toBe(StatusEntregavel.HOMOLOGADO);
    expect(aceiteRes.data.aceite_por).toBe('Juliana Costa (Gerente Financeira)');

    // Verificar evento de aceite formal
    const logs = await eventoLogRepo.findByDemandaId(testDemandId);
    const logAceite = logs.find((l) => l.tipo_evento === 'ENTREGA_ACEITE_FORMALIZADO');
    expect(logAceite).toBeDefined();
    expect(logAceite?.id_evento).toContain(`evt_ent_aceito_${regRes.data.id}_`);
  });

  it('4. deve registrar solicitações de ajustes (AJUSTES_SOLICITADOS) e despachar evento ENTREGA_AJUSTE_SOLICITADO', async () => {
    const regRes = await registrarEntregavelAction(
      {
        demanda_id: testDemandId,
        titulo: 'Planilha de Conciliação',
        tipo: TipoEntregavel.PLANILHA_CONSOLIDADA,
        versao: '1.0',
        caminho_arquivo_ou_link: 'conciliacao.xlsx',
        obrigatorio: false,
        status: StatusEntregavel.DISPONIVEL,
      },
      deps
    );
    expect(regRes.success).toBe(true);
    if (!regRes.success) return;

    const ajusteRes = await registrarAceiteEntregaAction(
      {
        id: regRes.data.id,
        aceite_status: StatusAceiteEntrega.AJUSTES_SOLICITADOS,
        aceite_por: 'Carlos Auditor',
        aceite_justificativa: 'Necessário incluir coluna de código contábil analítico.',
      },
      deps
    );

    expect(ajusteRes.success).toBe(true);
    if (!ajusteRes.success) return;

    expect(ajusteRes.data.aceite_status).toBe(StatusAceiteEntrega.AJUSTES_SOLICITADOS);

    const logs = await eventoLogRepo.findByDemandaId(testDemandId);
    const logAjuste = logs.find((l) => l.tipo_evento === 'ENTREGA_AJUSTE_SOLICITADO');
    expect(logAjuste).toBeDefined();
    expect(logAjuste?.id_evento).toContain(`evt_ent_ajustes_${regRes.data.id}_`);
  });

  it('5. deve registrar rejeição formal (REJEITADO) e despachar evento ENTREGA_REJEITADA', async () => {
    const regRes = await registrarEntregavelAction(
      {
        demanda_id: testDemandId,
        titulo: 'Apresentação Executiva',
        tipo: TipoEntregavel.APRESENTACAO_EXECUTIVA,
        versao: '1.0',
        caminho_arquivo_ou_link: 'slides.pptx',
        obrigatorio: false,
        status: StatusEntregavel.DISPONIVEL,
      },
      deps
    );
    expect(regRes.success).toBe(true);
    if (!regRes.success) return;

    const rejeicaoRes = await registrarAceiteEntregaAction(
      {
        id: regRes.data.id,
        aceite_status: StatusAceiteEntrega.REJEITADO,
        aceite_por: 'Diretoria de Operações',
        aceite_justificativa: 'Artefato não atende aos requisitos do template corporativo.',
      },
      deps
    );

    expect(rejeicaoRes.success).toBe(true);
    if (!rejeicaoRes.success) return;

    expect(rejeicaoRes.data.aceite_status).toBe(StatusAceiteEntrega.REJEITADO);

    const logs = await eventoLogRepo.findByDemandaId(testDemandId);
    const logRejeicao = logs.find((l) => l.tipo_evento === 'ENTREGA_REJEITADA');
    expect(logRejeicao).toBeDefined();
    expect(logRejeicao?.id_evento).toContain(`evt_ent_rejeitado_${regRes.data.id}_`);
  });

  it('6. Governança V-03 / V-04: bloqueia conclusão quando há entregável obrigatório pendente de aceite', async () => {
    // Cadastrar entregável obrigatório apenas como DISPONIVEL (aceite pendente)
    await registrarEntregavelAction(
      {
        demanda_id: testDemandId,
        titulo: 'Painel Crítico Obrigatório',
        tipo: TipoEntregavel.DASHBOARD_POWERBI,
        versao: '1.0',
        caminho_arquivo_ou_link: 'app.powerbi.com/critico',
        obrigatorio: true,
        status: StatusEntregavel.DISPONIVEL,
      },
      deps
    );

    // Tentar concluir demanda -> DEVE SER BLOQUEADO por V-04
    const resConclusao = await formalizarEncerramentoDemandaAction(testDemandId, undefined, deps);
    expect(resConclusao.success).toBe(false);
    if (resConclusao.success) return;
    expect(resConclusao.error).toContain('aceite PENDENTE');

    // A demanda deve continuar em PRONTA_PARA_ENTREGA
    const demandaAtual = await demandRepo.findById(testDemandId);
    expect(demandaAtual?.estado).toBe(EstadoDemanda.PRONTA_PARA_ENTREGA);
  });

  it('7. Conclusão Soberana: transiciona para CONCLUIDA e gera ENTREGA_ENCERRAMENTO_FORMALIZADO quando V-04 é atendida', async () => {
    // Cadastrar entregável obrigatório e homologá-lo
    const regRes = await registrarEntregavelAction(
      {
        demanda_id: testDemandId,
        titulo: 'Painel Crítico Homologado',
        tipo: TipoEntregavel.DASHBOARD_POWERBI,
        versao: '1.0',
        caminho_arquivo_ou_link: 'app.powerbi.com/homologado',
        obrigatorio: true,
        status: StatusEntregavel.DISPONIVEL,
      },
      deps
    );
    expect(regRes.success).toBe(true);
    if (!regRes.success) return;

    await registrarAceiteEntregaAction(
      {
        id: regRes.data.id,
        aceite_status: StatusAceiteEntrega.ACEITO,
        aceite_por: 'Diretoria de Tecnologia',
        aceite_justificativa: 'Painel validado e homologado sem pendências.',
      },
      deps
    );

    // Avaliação de prontidão deve estar 100% apta
    const prontidaoRes = await obterProntidaoEntregaAction(testDemandId, deps);
    expect(prontidaoRes.success).toBe(true);
    if (!prontidaoRes.success) return;
    expect(prontidaoRes.data.pronto_para_conclusao).toBe(true);

    // Agora a conclusão soberana deve ter sucesso!
    const resConclusao = await formalizarEncerramentoDemandaAction(
      testDemandId,
      'Conclusão formal autorizada após aceite integral de todos os artefatos.',
      deps
    );

    expect(resConclusao.success).toBe(true);
    if (!resConclusao.success) return;
    expect(resConclusao.data.estado).toBe(EstadoDemanda.CONCLUIDA);

    // Verificar demanda no banco
    const demandaConcluida = await demandRepo.findById(testDemandId);
    expect(demandaConcluida?.estado).toBe(EstadoDemanda.CONCLUIDA);
    expect(demandaConcluida?.data_conclusao).toBeDefined();

    // Trilha de auditoria gravada
    const trilha = await auditRepo.findByDemandaId(testDemandId);
    const transicaoAuditoria = trilha.find(
      (t) => t.tipo_evento === 'TRANSICAO_ESTADO' && t.entidade_id === testDemandId
    );
    expect(transicaoAuditoria).toBeDefined();

    // Evento ENTREGA_ENCERRAMENTO_FORMALIZADO no log
    const logs = await eventoLogRepo.findByDemandaId(testDemandId);
    const logConclusao = logs.find((l) => l.tipo_evento === 'ENTREGA_ENCERRAMENTO_FORMALIZADO');
    expect(logConclusao).toBeDefined();
    expect(logConclusao?.id_evento).toContain(`evt_ent_concluida_${testDemandId}_`);
  });

  it('8. deve gerar documentação do contratante via Server Action', async () => {
    await registrarEntregavelAction(
      {
        demanda_id: testDemandId,
        titulo: 'Artefato para Memorial',
        tipo: TipoEntregavel.DOCUMENTO_TECNICO,
        versao: '1.0',
        caminho_arquivo_ou_link: 'docs/memorial.md',
        obrigatorio: true,
        status: StatusEntregavel.HOMOLOGADO,
      },
      deps
    );

    const docRes = await gerarDocumentacaoContratanteAction(testDemandId, deps);
    expect(docRes.success).toBe(true);
    if (!docRes.success) return;
    expect(docRes.data).toContain('# Relatório de Entrega Técnica e Operacional');
    expect(docRes.data).toContain('Dashboard Executivo de Faturamento');
    expect(docRes.data.toLowerCase()).not.toContain('analyst personal workspace');
  });
});
