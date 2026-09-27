import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import * as schema from '@/infrastructure/db/schema';

import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAtivoDadosRepository } from '@/infrastructure/db/repositories/ativo-dados-repository';
import { SqliteDiagnosticosQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-diagnosticos-qualidade-repository';
import { SqliteProblemasQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-problemas-qualidade-repository';
import { SqliteRegrasQualidadeRepository } from '@/infrastructure/db/repositories/sqlite-regras-qualidade-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';

import {
  evaluateQualityGateAction,
  deliberateQualityProblemAction,
  updateQualityProblemStatusAction,
  registerManualProblemAction,
  createQualityRuleAction,
  updateQualityRuleAction,
  toggleQualityRuleStatusAction,
  listQualityRulesAction,
  listQualityProblemsAction,
  getAssetQualityDiagnosticAction,
  QualityActionDeps,
} from '@/app/actions/quality-actions';
import {
  advanceDemandAction,
  transitionDemandAction,
  WorkflowActionDeps,
} from '@/app/actions/workflow-actions';

import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { StatusVerificacaoQualidade } from '@/core/domain/enums/status-verificacao-qualidade';
import { TipoRegraQualidade } from '@/core/domain/enums/tipo-regra-qualidade';
import { StatusRegraQualidade } from '@/core/domain/enums/status-regra-qualidade';
import { TrilhaAuditoria } from '@/core/domain/entities/trilha-auditoria';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Integration Tests: Server Actions e Integração de Qualidade (Unidade 3.4C.2)', () => {
  let sqlite: Database.Database;
  let testDb: ReturnType<typeof drizzle<typeof schema>>;

  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let ativoDadosRepo: SqliteAtivoDadosRepository;
  let diagnosticosRepo: SqliteDiagnosticosQualidadeRepository;
  let problemasRepo: SqliteProblemasQualidadeRepository;
  let regrasRepo: SqliteRegrasQualidadeRepository;
  let auditRepo: SqliteAuditRepository;

  let qualityDeps: QualityActionDeps;
  let workflowDeps: WorkflowActionDeps;

  const testProjectId = 'proj_qa_actions';
  const testDemandId = 'dem_qa_actions';
  const testAssetId = 'ast_qa_actions';

  beforeEach(async () => {
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');

    testDb = drizzle(sqlite, { schema });
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(testDb, { migrationsFolder });

    projectRepo = new SqliteProjectRepository(testDb as any);
    demandRepo = new SqliteDemandRepository(testDb as any);
    ativoDadosRepo = new SqliteAtivoDadosRepository(testDb as any);
    diagnosticosRepo = new SqliteDiagnosticosQualidadeRepository(testDb as any);
    problemasRepo = new SqliteProblemasQualidadeRepository(testDb as any);
    regrasRepo = new SqliteRegrasQualidadeRepository(testDb as any);
    auditRepo = new SqliteAuditRepository(testDb as any);

    qualityDeps = {
      ativoDadosRepo,
      diagnosticosRepo,
      problemasRepo,
      regrasRepo,
      auditRepo,
    };

    workflowDeps = {
      demandRepo,
      auditRepo,
      ativoDadosRepo,
      diagnosticosRepo,
      problemasRepo,
    };

    // Seed de dados base: Projeto, Demanda na etapa 2 (EM_QUALIDADE_E_PREPARACAO) e Ativo ATIVO
    const now = new Date().toISOString();
    await projectRepo.create({
      id: testProjectId,
      nome: 'Projeto QA Actions',
      descricao: 'Projeto de teste de integração para Server Actions',
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
      titulo: 'Demanda QA Actions',
      solicitacao_bruta: 'Solicitação bruta para testes de quality actions',
      contexto: null,
      objetivo_inicial: null,
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
      estado_anterior: EstadoDemanda.DADOS_RECEBIDOS,
      data_conclusao: null,
      criado_em: now,
      atualizado_em: now,
    });

    await ativoDadosRepo.create({
      id: testAssetId,
      demanda_id: testDemandId,
      nome_arquivo: 'vendas.csv',
      caminho_local: 'C:/dados/vendas.csv',
      formato: FormatoArquivo.CSV,
      origem: 'ERP Corporativo',
      descricao_conteudo: 'Base de vendas 2026',
      granularidade: 'Transacional',
      periodo_inicio: '2026-01-01',
      periodo_fim: '2026-06-30',
      versao: '1.0',
      tamanho_bytes: 10240,
      total_linhas: 500,
      total_colunas: 6,
      hash_sha256: 'a'.repeat(64),
      schema_inferido: JSON.stringify([{ nome: 'id', tipo: 'INTEGER' }]),
      data_recebimento: now,
      status: StatusAtivoDados.ATIVO,
      substitui_ativo_id: null,
      criado_em: now,
      atualizado_em: now,
    });
  });

  afterEach(() => {
    sqlite.close();
  });

  describe('1. evaluateQualityGateAction', () => {
    it('deve retornar BLOQUEADO quando o ativo ainda não possui diagnóstico', async () => {
      const res = await evaluateQualityGateAction(
        { demandaId: testDemandId },
        qualityDeps
      );

      expect(res.success).toBe(true);
      if (!res.success) throw new Error(res.error);

      expect(res.data.decisao).toBe('BLOQUEADO');
      expect(res.data.liberado).toBe(false);
      expect(res.data.bloqueante).toBe(true);
      expect(res.data.motivo).toContain('ainda não possui diagnóstico');
    });

    it('deve retornar BLOQUEADO quando existem achados com severidade PENDENTE', async () => {
      const now = new Date().toISOString();
      const diagId = 'diag_pendente';
      await diagnosticosRepo.create({
        id: diagId,
        ativo_dados_id: testAssetId,
        demanda_id: testDemandId,
        iniciado_em: now,
        concluido_em: now,
        duracao_ms: 100,
        total_linhas_avaliadas: 500,
        total_colunas_avaliadas: 6,
        verificacoes_executadas: [],
        total_problemas_detectados: 1,
        status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
        erro_mensagem: null,
        resumo_metricas: null,
        criado_em: now,
        atualizado_em: now,
      });

      await problemasRepo.create({
        id: 'prob_pendente_1',
        diagnostico_id: diagId,
        ativo_dados_id: testAssetId,
        demanda_id: testDemandId,
        categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
        titulo: 'Valores nulos em ID',
        descricao: 'Coluna ID com 5 nulos',
        tabela_afetada: 'vendas.csv',
        coluna_afetada: 'id',
        total_linhas_afetadas: 5,
        percentual_linhas_afetadas: 1.0,
        amostra_evidencias: [],
        severidade: SeveridadeProblema.PENDENTE,
        impacto_calculo: null,
        acao_deliberada: null,
        justificativa_deliberacao: null,
        deliberado_por_humano: false,
        deliberado_em: null,
        status: StatusProblemaQualidade.ABERTO,
        origem_deteccao: 'AUTOMATICA',
        regra_id: null,
        regra_snapshot: null,
        criado_em: now,
        atualizado_em: now,
      });

      const res = await evaluateQualityGateAction(
        { demandaId: testDemandId },
        qualityDeps
      );

      expect(res.success).toBe(true);
      if (!res.success) throw new Error(res.error);

      expect(res.data.decisao).toBe('BLOQUEADO');
      expect(res.data.liberado).toBe(false);
      expect(res.data.detalhes.totalPendentes).toBe(1);
      expect(res.data.motivo).toContain('pendente(s) de deliberação humana');
    });
  });

  describe('2. deliberateQualityProblemAction', () => {
    it('deve rejeitar tentativa de deliberar com severidade PENDENTE', async () => {
      const res = await deliberateQualityProblemAction(
        {
          problemaId: 'prob_qualquer',
          demandaId: testDemandId,
          severidade: SeveridadeProblema.PENDENTE as any,
          acaoDeliberada: AcaoProblemaQualidade.CORRIGIR_NA_FONTE,
          justificativa: 'Justificativa com mais de 15 caracteres válida.',
        },
        qualityDeps
      );

      expect(res.success).toBe(false);
      if (res.success) throw new Error('Expected failure');
      expect(res.error).toContain('PENDENTE representa ausência de deliberação');
    });

    it('deve rejeitar tentativa de deliberar com justificativa menor que 15 caracteres', async () => {
      const res = await deliberateQualityProblemAction(
        {
          problemaId: 'prob_qualquer',
          demandaId: testDemandId,
          severidade: SeveridadeProblema.ALTA,
          acaoDeliberada: AcaoProblemaQualidade.CORRIGIR_NA_FONTE,
          justificativa: 'Muito curta',
        },
        qualityDeps
      );

      expect(res.success).toBe(false);
      if (res.success) throw new Error('Expected failure');
      expect(res.error).toContain('mínimo 15 caracteres');
    });

    it('deve deliberar com sucesso, aceitar como restrição e registrar evento de auditoria DECISAO_HUMANA', async () => {
      const now = new Date().toISOString();
      const probId = 'prob_para_deliberar';
      await problemasRepo.create({
        id: probId,
        diagnostico_id: null,
        ativo_dados_id: testAssetId,
        demanda_id: testDemandId,
        categoria: CategoriaProblemaQualidade.ANOMALIA_MANUAL_DECLARADA,
        titulo: 'Falta de chave estrangeira',
        descricao: 'Clientes sem cadastro',
        tabela_afetada: 'vendas.csv',
        coluna_afetada: 'cliente_id',
        total_linhas_afetadas: 2,
        percentual_linhas_afetadas: 0.4,
        amostra_evidencias: [],
        severidade: SeveridadeProblema.PENDENTE,
        impacto_calculo: null,
        acao_deliberada: null,
        justificativa_deliberacao: null,
        deliberado_por_humano: false,
        deliberado_em: null,
        status: StatusProblemaQualidade.ABERTO,
        origem_deteccao: 'MANUAL',
        regra_id: null,
        regra_snapshot: null,
        criado_em: now,
        atualizado_em: now,
      });

      const res = await deliberateQualityProblemAction(
        {
          problemaId: probId,
          demandaId: testDemandId,
          severidade: SeveridadeProblema.CRITICA,
          acaoDeliberada: AcaoProblemaQualidade.ACEITAR_COMO_RESTRICAO,
          justificativa: 'Restrição formalmente aceita pelo sponsor da área de negócio.',
          impactoCalculo: 'Exclui transações órfãs do KPI de margem líquida.',
        },
        qualityDeps
      );

      expect(res.success).toBe(true);
      if (!res.success) throw new Error(res.error);

      expect(res.data.severidade).toBe(SeveridadeProblema.CRITICA);
      expect(res.data.status).toBe(StatusProblemaQualidade.ACEITO_COMO_RESTRICAO);
      expect(res.data.acao_deliberada).toBe(AcaoProblemaQualidade.ACEITAR_COMO_RESTRICAO);
      expect(res.data.deliberado_por_humano).toBe(true);

      // Validação da auditoria gravada compulsoriamente
      const auditTrail = await auditRepo.findByDemandaId(testDemandId);
      const decEvent = auditTrail.find(
        (e: TrilhaAuditoria) => e.tipo_evento === 'DECISAO_HUMANA' && e.entidade_id === probId
      );
      expect(decEvent).toBeDefined();
      expect(decEvent?.autor_tipo).toBe('HUMANO');
      expect(decEvent?.justificativa).toBe('Restrição formalmente aceita pelo sponsor da área de negócio.');
    });
  });

  describe('3. updateQualityProblemStatusAction', () => {
    it('deve rejeitar transição para ACEITO_COMO_RESTRICAO se severidade for PENDENTE', async () => {
      const now = new Date().toISOString();
      const probId = 'prob_status_pendente';
      await problemasRepo.create({
        id: probId,
        diagnostico_id: null,
        ativo_dados_id: testAssetId,
        demanda_id: testDemandId,
        categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
        titulo: 'Teste Status',
        descricao: 'Teste',
        tabela_afetada: 'vendas.csv',
        coluna_afetada: 'id',
        total_linhas_afetadas: 1,
        percentual_linhas_afetadas: 0.2,
        amostra_evidencias: [],
        severidade: SeveridadeProblema.PENDENTE,
        impacto_calculo: null,
        acao_deliberada: null,
        justificativa_deliberacao: null,
        deliberado_por_humano: false,
        deliberado_em: null,
        status: StatusProblemaQualidade.ABERTO,
        origem_deteccao: 'MANUAL',
        regra_id: null,
        regra_snapshot: null,
        criado_em: now,
        atualizado_em: now,
      });

      const res = await updateQualityProblemStatusAction(
        {
          problemaId: probId,
          demandaId: testDemandId,
          novoStatus: StatusProblemaQualidade.ACEITO_COMO_RESTRICAO,
          justificativa: 'Justificativa válida com mais de 15 caracteres.',
        },
        qualityDeps
      );

      expect(res.success).toBe(false);
      if (res.success) throw new Error('Expected failure');
      expect(res.error).toContain('O problema deve ser deliberado primeiro');
    });

    it('deve atualizar status com sucesso e registrar auditoria quando dados forem válidos', async () => {
      const now = new Date().toISOString();
      const probId = 'prob_status_valido';
      await problemasRepo.create({
        id: probId,
        diagnostico_id: null,
        ativo_dados_id: testAssetId,
        demanda_id: testDemandId,
        categoria: CategoriaProblemaQualidade.NUMEROS_INVALIDOS,
        titulo: 'Valores negativos',
        descricao: 'Quantidade vendida negativa',
        tabela_afetada: 'vendas.csv',
        coluna_afetada: 'qtd',
        total_linhas_afetadas: 1,
        percentual_linhas_afetadas: 0.2,
        amostra_evidencias: [],
        severidade: SeveridadeProblema.MEDIA,
        impacto_calculo: null,
        acao_deliberada: AcaoProblemaQualidade.TRATAR_NO_PIPELINE,
        justificativa_deliberacao: 'Tratado via Power Query no pipeline.',
        deliberado_por_humano: true,
        deliberado_em: now,
        status: StatusProblemaQualidade.ABERTO,
        origem_deteccao: 'MANUAL',
        regra_id: null,
        regra_snapshot: null,
        criado_em: now,
        atualizado_em: now,
      });

      const res = await updateQualityProblemStatusAction(
        {
          problemaId: probId,
          demandaId: testDemandId,
          novoStatus: StatusProblemaQualidade.TRATADO,
          justificativa: 'Anomalia corrigida através de etapa de saneamento na camada M.',
        },
        qualityDeps
      );

      expect(res.success).toBe(true);
      if (!res.success) throw new Error(res.error);
      expect(res.data.status).toBe(StatusProblemaQualidade.TRATADO);

      const auditTrail = await auditRepo.findByDemandaId(testDemandId);
      const decEvent = auditTrail.find(
        (e: TrilhaAuditoria) => e.tipo_evento === 'DECISAO_HUMANA' && e.entidade_id === probId
      );
      expect(decEvent).toBeDefined();
    });
  });

  describe('4. registerManualProblemAction', () => {
    it('deve criar problema manual com severidade invariavelmente PENDENTE', async () => {
      const res = await registerManualProblemAction(
        {
          ativoDadosId: testAssetId,
          demandaId: testDemandId,
          categoria: CategoriaProblemaQualidade.ANOMALIA_MANUAL_DECLARADA,
          titulo: 'Duplicidade de cupom fiscal',
          descricao: 'Cupons emitidos no mesmo minuto com IDs iguais',
          tabelaAfetada: 'vendas.csv',
          colunaAfetada: 'cupom_id',
          totalLinhasAfetadas: 10,
        },
        qualityDeps
      );

      expect(res.success).toBe(true);
      if (!res.success) throw new Error(res.error);

      expect(res.data.severidade).toBe(SeveridadeProblema.PENDENTE);
      expect(res.data.origem_deteccao).toBe('MANUAL');
      expect(res.data.status).toBe(StatusProblemaQualidade.ABERTO);
      expect(res.data.deliberado_por_humano).toBe(false);
    });
  });

  describe('5. Regras de Qualidade R1-R5', () => {
    it('deve criar regra R1, listar, atualizar e alternar status sem exclusão física', async () => {
      // 1. Criação
      const resCreate = await createQualityRuleAction(
        {
          ativoDadosId: testAssetId,
          demandaId: testDemandId,
          tipo: TipoRegraQualidade.CHAVE_UNICA,
          nome: 'Chave Única de Vendas',
          descricao: 'ID da venda deve ser exclusivo',
          coluna: 'id',
          parametros: {
            tipo: TipoRegraQualidade.CHAVE_UNICA,
            colunas: ['id'],
            ignorarNulos: false,
          },
        },
        qualityDeps
      );

      expect(resCreate.success).toBe(true);
      if (!resCreate.success) throw new Error(resCreate.error);
      const regraCriada = resCreate.data;
      expect(regraCriada.status).toBe(StatusRegraQualidade.ATIVA);
      expect(regraCriada.versao).toBe(1);

      // 2. Listagem
      const resList = await listQualityRulesAction(
        { ativoDadosId: testAssetId },
        qualityDeps
      );
      expect(resList.success).toBe(true);
      if (!resList.success) throw new Error(resList.error);
      expect(resList.data.length).toBe(1);
      expect(resList.data[0].id).toBe(regraCriada.id);

      // 3. Atualização semântica (incrementa versão)
      const resUpdate = await updateQualityRuleAction(
        {
          id: regraCriada.id,
          demandaId: testDemandId,
          tipo: TipoRegraQualidade.CHAVE_UNICA,
          colunas: ['id', 'empresa_id'],
          parametros: {
            tipo: TipoRegraQualidade.CHAVE_UNICA,
            colunas: ['id', 'empresa_id'],
            ignorarNulos: true,
          },
        },
        qualityDeps
      );
      expect(resUpdate.success).toBe(true);
      if (!resUpdate.success) throw new Error(resUpdate.error);
      expect(resUpdate.data.versao).toBe(2);

      // 4. Alternância de status (ATIVA -> INATIVA)
      const resToggle = await toggleQualityRuleStatusAction(
        { id: regraCriada.id, demandaId: testDemandId },
        qualityDeps
      );
      expect(resToggle.success).toBe(true);
      if (!resToggle.success) throw new Error(resToggle.error);
      expect(resToggle.data.status).toBe(StatusRegraQualidade.INATIVA);
    });
  });

  describe('6. Integração Workflow-Actions com Quality Gate', () => {
    it('deve bloquear avanço de etapa 2 para etapa 3 se o Quality Gate estiver BLOQUEADO', async () => {
      // Estado atual da demanda: EM_QUALIDADE_E_PREPARACAO
      // Sem diagnóstico de qualidade -> Gate BLOQUEADO
      const res = await advanceDemandAction(testDemandId, undefined, workflowDeps);

      expect(res.success).toBe(false);
      if (res.success) throw new Error('Expected failure');
      expect(res.error).toContain('Quality Gate bloqueado');

      // Verifica que a demanda NÃO avançou no banco
      const dem = await demandRepo.findById(testDemandId);
      expect(dem?.estado).toBe(EstadoDemanda.EM_QUALIDADE_E_PREPARACAO);
    });

    it('deve exigir justificativa >= 15 caracteres quando o Gate for LIBERADO_COM_RESSALVA', async () => {
      const now = new Date().toISOString();
      const diagId = 'diag_parcial_guardrail';

      // Cria diagnóstico com status CONCLUIDO_PARCIALMENTE e verificação limitada por guardrail
      await diagnosticosRepo.create({
        id: diagId,
        ativo_dados_id: testAssetId,
        demanda_id: testDemandId,
        iniciado_em: now,
        concluido_em: now,
        duracao_ms: 200,
        total_linhas_avaliadas: 1000,
        total_colunas_avaliadas: 5,
        verificacoes_executadas: [
          {
            nome: 'Amostragem de 100k linhas',
            categoria: CategoriaProblemaQualidade.DUPLICIDADES_LINHA,
            status: StatusVerificacaoQualidade.LIMITADA_POR_GUARDRAIL,
            totalProblemas: 0,
            observacao: 'Arquivo excedeu o limite do guardrail',
          },
        ],
        total_problemas_detectados: 0,
        status_execucao: StatusExecucaoDiagnostico.CONCLUIDO_PARCIALMENTE,
        erro_mensagem: null,
        resumo_metricas: null,
        criado_em: now,
        atualizado_em: now,
      });

      // 1. Tentativa sem justificativa -> Rejeição
      const resSemJust = await advanceDemandAction(testDemandId, undefined, workflowDeps);
      expect(resSemJust.success).toBe(false);
      if (resSemJust.success) throw new Error('Expected failure');
      expect(resSemJust.error).toContain('exige justificativa formal com no mínimo 15 caracteres');

      // 2. Tentativa com justificativa curta -> Rejeição
      const resJustCurta = await advanceDemandAction(testDemandId, 'Curta', workflowDeps);
      expect(resJustCurta.success).toBe(false);
      if (resJustCurta.success) throw new Error('Expected failure');
      expect(resJustCurta.error).toContain('exige justificativa formal com no mínimo 15 caracteres');

      // 3. Tentativa com justificativa formal >= 15 caracteres -> Avanço autorizado
      const resValido = await advanceDemandAction(
        testDemandId,
        'Avanço autorizado com ressalva devido à validação parcial por limite de volume.',
        workflowDeps
      );
      expect(resValido.success).toBe(true);
      if (!resValido.success) throw new Error(resValido.error);
      expect(resValido.data.estado).toBe(EstadoDemanda.EM_MODELAGEM_E_ANALISE);

      // Demanda atualizada no banco
      const demAtual = await demandRepo.findById(testDemandId);
      expect(demAtual?.estado).toBe(EstadoDemanda.EM_MODELAGEM_E_ANALISE);
    });

    it('deve permitir avanço quando o Quality Gate for LIBERADO após resolução de anomalias', async () => {
      const now = new Date().toISOString();
      const diagId = 'diag_limpo';

      // Cria diagnóstico com sucesso e 0 problemas
      await diagnosticosRepo.create({
        id: diagId,
        ativo_dados_id: testAssetId,
        demanda_id: testDemandId,
        iniciado_em: now,
        concluido_em: now,
        duracao_ms: 150,
        total_linhas_avaliadas: 500,
        total_colunas_avaliadas: 6,
        verificacoes_executadas: [],
        total_problemas_detectados: 0,
        status_execucao: StatusExecucaoDiagnostico.CONCLUIDO,
        erro_mensagem: null,
        resumo_metricas: null,
        criado_em: now,
        atualizado_em: now,
      });

      const res = await advanceDemandAction(testDemandId, undefined, workflowDeps);
      expect(res.success).toBe(true);
      if (!res.success) throw new Error(res.error);
      expect(res.data.estado).toBe(EstadoDemanda.EM_MODELAGEM_E_ANALISE);

      const demAtual = await demandRepo.findById(testDemandId);
      expect(demAtual?.estado).toBe(EstadoDemanda.EM_MODELAGEM_E_ANALISE);
    });
  });
});
