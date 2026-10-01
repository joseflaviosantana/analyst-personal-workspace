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
import { CamadaValidacao } from '@/core/domain/enums/camada-validacao';
import { ResultadoValidacao } from '@/core/domain/enums/resultado-validacao';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';

import { TipoEntregavel } from '@/core/domain/enums/tipo-entregavel';
import { StatusEntregavel } from '@/core/domain/enums/status-entregavel';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import {
  registrarValidacaoAction,
  retestarValidacaoAction,
  atualizarValidacaoAction,
  removerValidacaoAction,
  listarValidacoesAction,
  obterProntidaoValidacaoAction,
  ValidationActionDeps,
} from '@/app/actions/validation-actions';

describe('Integration: Validation Actions & Governance Lifecycle (Subgate 3.7B)', () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let validacaoRepo: SqliteValidacaoConciliacaoRepository;
  let entregavelRepo: SqliteEntregavelDemandaRepository;
  let auditRepo: SqliteAuditRepository;
  let eventoLogRepo: SqliteEventoAnaliticoLogRepository;
  let evidenciaRepo: SqliteEvidenciaAnaliticaRepository;
  let deps: ValidationActionDeps;

  const testProjectId = 'prj_val_integ_1';
  const testDemandId = 'dem_val_integ_1';

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
      validacaoRepo,
      entregavelRepo,
      demandRepo,
      auditRepo,
      processarEventoUseCase,
    };

    const now = new Date().toISOString();
    await projectRepo.create({
      id: testProjectId,
      nome: 'Projeto Teste Validação',
      descricao: 'Validação e Conciliação Multicamadas',
      status: 'ATIVO',
      data_inicio: now,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    await demandRepo.create({
      id: testDemandId,
      projeto_id: testProjectId,
      titulo: 'Demanda BI Faturamento e Margem',
      solicitacao_bruta: 'Conciliação e validação numérica entre DW e Power BI',
      contexto: 'Conciliação entre DW e Power BI',
      objetivo_inicial: 'Validar métricas antes da entrega',
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.EM_VALIDACAO,
      criado_em: now,
      atualizado_em: now,
      data_conclusao: null,
    });

    await entregavelRepo.create({
      id: 'ent_val_test_1',
      demanda_id: testDemandId,
      titulo: 'Dashboard Executivo Power BI',
      tipo: TipoEntregavel.DASHBOARD_POWERBI,
      versao: '1.0',
      caminho_arquivo_ou_link: 'https://app.powerbi.com/groups/test/reports/report-1',
      descricao_sumario: 'Dashboard operacional e executivo',
      obrigatorio: true,
      status: StatusEntregavel.DISPONIVEL,
      aceite_status: StatusAceiteEntrega.PENDENTE,
      aceite_justificativa: null,
      aceite_por: null,
      aceite_em: null,
      criado_em: now,
      atualizado_em: now,
    });
  });

  it('deve registrar validação aprovada quando o desvio está dentro da tolerância', async () => {
    const res = await registrarValidacaoAction(
      {
        demanda_id: testDemandId,
        camada: CamadaValidacao.CONCILIACAO_CRUZADA_KPI,
        titulo: 'Faturamento Total Anual',
        metodo_verificacao: 'Query SQL SUM vs DAX SUM',
        base_referencia: 'gold_vendas (SELECT SUM(total))',
        valor_esperado: 1250000.5,
        valor_obtido: 1250000.5,
        tolerancia_permitida: 0,
        resultado: ResultadoValidacao.APROVADO,
        obrigatoria: true,
        executado_por: 'Analista Responsável',
      },
      testDemandId,
      deps
    );

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.data.id).toBeDefined();
    expect(res.data.resultado).toBe(ResultadoValidacao.APROVADO);
    expect(res.data.divergencia_absoluta).toBe(0);
    expect(res.data.divergencia_percentual).toBe(0);

    // Valida persistência de evidência analítica e evento emitido
    const eventos = await eventoLogRepo.findByDemandaId(testDemandId);
    expect(eventos.length).toBe(1);
    expect(eventos[0].tipo_evento).toBe('VALIDACAO_CONCILIACAO_REGISTRADA');

    const evidencias = await evidenciaRepo.findByDemandaId(testDemandId);
    expect(evidencias.length).toBe(1);
    expect(evidencias[0].tipo).toBe('VALIDACAO');
    // Rigor epistêmico: ressalva explícita de escopo pontual
    expect(evidencias[0].resultado_mensuravel).toContain('Ressalva Epistêmica');
    expect(evidencias[0].resultado_mensuravel).toContain('não certifica conformidade global');
  });

  it('deve registrar validação divergente e bloquear prontidão (regras V-01/V-02)', async () => {
    // Check divergente obrigatório
    const res = await registrarValidacaoAction(
      {
        demanda_id: testDemandId,
        camada: CamadaValidacao.TRANSFORMACOES_POWER_QUERY,
        titulo: 'Quantidade Total de Itens Vendidos',
        metodo_verificacao: 'Soma de colunas por mês no ERP e DW',
        base_referencia: 'ERP Legado',
        valor_esperado: 45000,
        valor_obtido: 44200,
        tolerancia_permitida: 10,
        resultado: ResultadoValidacao.DIVERGENTE,
        obrigatoria: true,
        executado_por: 'Analista Responsável',
      },
      testDemandId,
      deps
    );

    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.data.resultado).toBe(ResultadoValidacao.DIVERGENTE);
    expect(res.data.divergencia_absoluta).toBe(800);

    // Prontidão: V-01 passa (total checks >= 1), mas V-02 bloqueia (há divergência obrigatória)
    const prontidao = await obterProntidaoValidacaoAction(testDemandId, deps);
    expect(prontidao.success).toBe(true);
    if (!prontidao.success) return;

    expect(prontidao.data.pronto_para_entrega).toBe(false);
    expect(prontidao.data.bloqueios_entrega.length).toBeGreaterThan(0);
    expect(prontidao.data.total_validacoes).toBe(1);
    expect(prontidao.data.total_divergentes).toBe(1);

    const v02Diag = prontidao.data.diagnosticos.find((d) => d.codigo === 'V-02');
    expect(v02Diag).toBeDefined();
    expect(v02Diag?.tipo).toBe('BLOQUEIO');
  });

  it('deve realizar ciclo completo: criação divergente -> correção/reteste -> aprovação -> desbloqueio de V-02', async () => {
    // 1. Criação com divergência
    const criacao = await registrarValidacaoAction(
      {
        demanda_id: testDemandId,
        camada: CamadaValidacao.CALCULOS_E_DAX,
        titulo: 'Margem Líquida %',
        metodo_verificacao: 'Cálculo DAX vs Relatório Contábil',
        base_referencia: 'DRE Contábil',
        valor_esperado: 0.235,
        valor_obtido: 0.21,
        tolerancia_permitida: 0.001,
        resultado: ResultadoValidacao.DIVERGENTE,
        obrigatoria: true,
        executado_por: 'Analista Responsável',
      },
      testDemandId,
      deps
    );

    expect(criacao.success).toBe(true);
    if (!criacao.success) return;

    const valId = criacao.data.id;

    // Prontidão inicial: bloqueado por V-02
    let prontidao = await obterProntidaoValidacaoAction(testDemandId, deps);
    expect(prontidao.success && prontidao.data.pronto_para_entrega).toBe(false);

    // 2. Correção de fórmula / DAX no modelo e Reteste
    const reteste = await retestarValidacaoAction(
      {
        id: valId,
        valor_obtido: 0.235,
        executado_por: 'Analista Responsável',
        notas_evidencia: 'Fórmula corrigida para descontar impostos retidos na fonte.',
      },
      testDemandId,
      deps
    );

    expect(reteste.success).toBe(true);
    if (!reteste.success) return;

    expect(reteste.data.resultado).toBe(ResultadoValidacao.APROVADO);
    expect(reteste.data.valor_obtido).toBe(0.235);
    expect(reteste.data.divergencia_absoluta).toBe(0);

    // 3. Prontidão após reteste: desbloqueado
    prontidao = await obterProntidaoValidacaoAction(testDemandId, deps);
    expect(prontidao.success).toBe(true);
    if (!prontidao.success) return;

    expect(prontidao.data.pronto_para_entrega).toBe(true);
    expect(prontidao.data.bloqueios_entrega.length).toBe(0);
    expect(prontidao.data.total_aprovadas).toBe(1);
    expect(prontidao.data.total_divergentes).toBe(0);

    // Valida emissão de evento de reteste
    const eventos = await eventoLogRepo.findByDemandaId(testDemandId);
    expect(eventos.map((e) => e.tipo_evento)).toContain('VALIDACAO_CONCILIACAO_RETESTADA');
  });

  it('deve garantir idempotência de retry e persistência de múltiplos retestes legítimos', async () => {
    const criacao = await registrarValidacaoAction(
      {
        demanda_id: testDemandId,
        camada: CamadaValidacao.DADOS_BRUTOS_VS_CARREGADOS,
        titulo: 'Contagem de Clientes',
        metodo_verificacao: 'COUNT DISTINCT no banco e arquivo',
        base_referencia: 'PostgreSQL Prod',
        valor_esperado: 10000,
        valor_obtido: 9800,
        tolerancia_permitida: 0,
        resultado: ResultadoValidacao.DIVERGENTE,
        obrigatoria: true,
        executado_por: 'Analista Responsável',
      },
      testDemandId,
      deps
    );
    expect(criacao.success).toBe(true);
    if (!criacao.success) return;

    const valId = criacao.data.id;

    // Reteste 1: Ainda com desvio residual
    const ret1 = await retestarValidacaoAction(
      {
        id: valId,
        valor_obtido: 9950,
        executado_por: 'Analista Responsável',
        notas_evidencia: 'Primeira carga recuperou 150 registros faltantes',
      },
      testDemandId,
      deps
    );
    expect(ret1.success).toBe(true);

    // Reteste 2: 100% conciliado
    const ret2 = await retestarValidacaoAction(
      {
        id: valId,
        valor_obtido: 10000,
        executado_por: 'Analista Responsável',
        notas_evidencia: 'Carga completa de encerramento de mês executada',
      },
      testDemandId,
      deps
    );
    expect(ret2.success).toBe(true);

    const eventos = await eventoLogRepo.findByDemandaId(testDemandId);
    const eventosReteste = eventos.filter((e) => e.tipo_evento === 'VALIDACAO_CONCILIACAO_RETESTADA');
    // Dois retestes legítimos em momentos distintos possuem timestamps de atualização diferentes
    expect(eventosReteste.length).toBe(2);

    // Tentar reprocessar o MESMO evento do reteste 2 deve ser deduplicado (retry idempotente)
    const engine = criarEvidenceEventEnginePadrao();
    const registrarEvidenciaUseCase = new RegistrarEvidenciaUseCase(evidenciaRepo, demandRepo);
    const retryProcess = new ProcessarEventoAnaliticoUseCase(engine, eventoLogRepo, registrarEvidenciaUseCase);

    const retryResult = await retryProcess.execute({
      id_evento: eventosReteste[1].id_evento,
      demanda_id: testDemandId,
      etapa_origem: EtapaOrigemEvidencia.VALIDACAO,
      categoria: 'VALIDACAO',
      tipo_evento: 'VALIDACAO_CONCILIACAO_RETESTADA',
      ocorrido_em: eventosReteste[1].processado_em,
      executor: 'Analista Responsável',
      payload: (eventosReteste[1].payload_snapshot as any) || {},
      versao_contrato: '1.0',
    });

    expect(retryResult.status_processamento).toBe('DUPLICADO');
    expect(retryResult.ja_processado).toBe(true);
  });

  it('deve listar, atualizar e remover validação com sucesso', async () => {
    const criacao = await registrarValidacaoAction(
      {
        demanda_id: testDemandId,
        camada: CamadaValidacao.VISUAL_E_USABILIDADE,
        titulo: 'Check Opcional de Formatação',
        metodo_verificacao: 'Inspeção visual da camada gold',
        base_referencia: 'Template Oficial',
        valor_esperado: 1,
        valor_obtido: 1,
        tolerancia_permitida: 0,
        resultado: ResultadoValidacao.APROVADO,
        obrigatoria: false,
        executado_por: 'Analista Responsável',
      },
      testDemandId,
      deps
    );
    expect(criacao.success).toBe(true);
    if (!criacao.success) return;

    const valId = criacao.data.id;

    // Listar
    const lista = await listarValidacoesAction(testDemandId, deps);
    expect(lista.success).toBe(true);
    if (!lista.success) return;
    expect(lista.data.length).toBe(1);

    // Atualizar
    const atualizacao = await atualizarValidacaoAction(
      {
        id: valId,
        tolerancia_permitida: 0.05,
        notas_evidencia: 'Ajustada tolerância para acomodar pequenas variações.',
      },
      testDemandId,
      deps
    );
    expect(atualizacao.success).toBe(true);
    if (!atualizacao.success) return;
    expect(atualizacao.data.tolerancia_permitida).toBe(0.05);

    // Remover
    const remocao = await removerValidacaoAction(valId, testDemandId, deps);
    expect(remocao.success).toBe(true);

    const listaVazia = await listarValidacoesAction(testDemandId, deps);
    expect(listaVazia.success && listaVazia.data.length).toBe(0);
  });

  it('deve manter persistência íntegra mesmo se o Evidence Event Engine falhar (contenção de falha)', async () => {
    // Deps com motor de evento que lança erro
    const faultyDeps: ValidationActionDeps = {
      ...deps,
      processarEventoUseCase: {
        execute: vi.fn().mockRejectedValue(new Error('Falha simulada no motor de evidências')),
      } as any,
    };

    const res = await registrarValidacaoAction(
      {
        demanda_id: testDemandId,
        camada: CamadaValidacao.ATENDIMENTO_REQUISITOS,
        titulo: 'Teste Resiliência',
        metodo_verificacao: 'Verificação com simulação de erro no motor',
        base_referencia: 'Origem',
        valor_esperado: 10,
        valor_obtido: 10,
        tolerancia_permitida: 0,
        resultado: ResultadoValidacao.APROVADO,
        obrigatoria: true,
        executado_por: 'Analista',
      },
      testDemandId,
      faultyDeps
    );

    // Ação principal foi persistida e teve sucesso apesar do erro no subsistema de eventos
    expect(res.success).toBe(true);
    if (!res.success) return;

    const valSalva = await validacaoRepo.findById(res.data.id);
    expect(valSalva).not.toBeNull();
    expect(valSalva?.titulo).toBe('Teste Resiliência');
  });
});
