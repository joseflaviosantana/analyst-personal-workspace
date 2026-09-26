import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import * as schema from '@/infrastructure/db/schema';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { TransitionDemandStateUseCase } from '@/core/use-cases/workflow/transition-demand-state';
import { SuspendDemandUseCase } from '@/core/use-cases/workflow/suspend-demand';
import { ResumeDemandUseCase } from '@/core/use-cases/workflow/resume-demand';
import { CancelDemandUseCase } from '@/core/use-cases/workflow/cancel-demand';
import { GetDemandTimelineUseCase } from '@/core/use-cases/workflow/get-demand-timeline';

describe('Integration Tests: Persistência do Workflow e Governança de Estados (Bloco 2)', () => {
  const testDbDir = path.join(process.cwd(), '.workspace', 'data');
  const testDbPath = path.join(testDbDir, 'test_workflow_bloco2.db');

  beforeAll(() => {
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterAll(() => {
    const filesToClean = [
      testDbPath,
      `${testDbPath}-wal`,
      `${testDbPath}-shm`,
    ];
    for (const f of filesToClean) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch {
          // ignore lock on cleanup
        }
      }
    }
  });

  it('deve persistir transições de estado, trilha de auditoria e preservar integridade após nova conexão', async () => {
    // 1. PRIMEIRA CONEXÃO: Criação e Migrations
    const sqlite1 = new Database(testDbPath);
    sqlite1.pragma('foreign_keys = ON');
    sqlite1.pragma('journal_mode = WAL');
    sqlite1.pragma('synchronous = NORMAL');
    sqlite1.pragma('busy_timeout = 5000');

    const db1 = drizzle(sqlite1, { schema });
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(db1, { migrationsFolder });

    const projectRepo1 = new SqliteProjectRepository(db1);
    const demandRepo1 = new SqliteDemandRepository(db1);
    const auditRepo1 = new SqliteAuditRepository(db1);

    const transitionUseCase1 = new TransitionDemandStateUseCase(demandRepo1, auditRepo1);
    const suspendUseCase1 = new SuspendDemandUseCase(demandRepo1, auditRepo1);
    const resumeUseCase1 = new ResumeDemandUseCase(demandRepo1, auditRepo1);
    const cancelUseCase1 = new CancelDemandUseCase(demandRepo1, auditRepo1);
    const getTimelineUseCase1 = new GetDemandTimelineUseCase(auditRepo1);

    // Setup: Criação de Projeto e Demanda Inicial
    const now = new Date().toISOString();
    await projectRepo1.create({
      id: 'proj_wf_01',
      nome: 'Projeto Workflow Analytics',
      descricao: 'Teste de workflow com auditoria',
      status: 'ATIVO',
      data_inicio: '2026-03-01',
      data_conclusao_prevista: '2026-05-30',
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    await demandRepo1.create({
      id: 'dem_wf_01',
      projeto_id: 'proj_wf_01',
      titulo: 'Dashboard Executivo de Margem',
      solicitacao_bruta: 'Construir painel executivo com métricas de margem por canal',
      contexto: 'Reunião de diretoria do final do trimestre',
      objetivo_inicial: 'Entregar visão consolidada',
      prazo_esperado: '2026-04-15',
      restricoes_declaradas: 'Dados anonimizados',
      estado: EstadoDemanda.NOVA,
      estado_anterior: null,
      criado_em: now,
      atualizado_em: now,
      data_conclusao: null,
    });

    // Registra evento de criação na auditoria
    await auditRepo1.record({
      id: 'audit_criacao_01',
      demanda_id: 'dem_wf_01',
      entidade: 'DEMANDA',
      entidade_id: 'dem_wf_01',
      tipo_evento: 'CRIACAO',
      autor_tipo: 'HUMANO',
      dados_anteriores: null,
      dados_novos: JSON.stringify({ estado: EstadoDemanda.NOVA }),
      justificativa: null,
      timestamp: new Date(Date.now() - 5000).toISOString(),
    });

    // Transição 1: NOVA -> EM_CLARIFICACAO
    const demAtualizada1 = await transitionUseCase1.execute({
      demandaId: 'dem_wf_01',
      novoEstado: EstadoDemanda.EM_CLARIFICACAO,
      autorTipo: 'HUMANO',
    });
    expect(demAtualizada1.estado).toBe(EstadoDemanda.EM_CLARIFICACAO);

    // Transição 2: EM_CLARIFICACAO -> DADOS_RECEBIDOS
    const demAtualizada2 = await transitionUseCase1.execute({
      demandaId: 'dem_wf_01',
      novoEstado: EstadoDemanda.DADOS_RECEBIDOS,
      autorTipo: 'HUMANO',
    });
    expect(demAtualizada2.estado).toBe(EstadoDemanda.DADOS_RECEBIDOS);

    // Transição Inválida Rejeitada: Tentar pular direto para CONCLUIDA
    await expect(
      transitionUseCase1.execute({
        demandaId: 'dem_wf_01',
        novoEstado: EstadoDemanda.CONCLUIDA,
      })
    ).rejects.toThrow(/Não é permitido pular etapas/);

    // Suspensão: DADOS_RECEBIDOS -> SUSPENSA com justificativa
    const demSusp = await suspendUseCase1.execute({
      demandaId: 'dem_wf_01',
      justificativa: 'Aguardando concessão de credenciais ao Data Lake de Vendas',
    });
    expect(demSusp.estado).toBe(EstadoDemanda.SUSPENSA);
    expect(demSusp.estado_anterior).toBe(EstadoDemanda.DADOS_RECEBIDOS);

    // Tentativa de transição normal enquanto suspensa (deve falhar)
    await expect(
      transitionUseCase1.execute({
        demandaId: 'dem_wf_01',
        novoEstado: EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
      })
    ).rejects.toThrow();

    // Retomada: SUSPENSA -> DADOS_RECEBIDOS com justificativa
    const demRet = await resumeUseCase1.execute({
      demandaId: 'dem_wf_01',
      justificativa: 'Acesso liberado pela equipe de segurança da informação',
    });
    expect(demRet.estado).toBe(EstadoDemanda.DADOS_RECEBIDOS);
    expect(demRet.estado_anterior).toBeNull();

    // Cancelamento com justificativa
    const demCanc = await cancelUseCase1.execute({
      demandaId: 'dem_wf_01',
      justificativa: 'Demanda descontinuada pela área de negócios após reestruturação de escopo',
    });
    expect(demCanc.estado).toBe(EstadoDemanda.CANCELADA);

    // Tentativa de transicionar após cancelamento (estado terminal)
    await expect(
      transitionUseCase1.execute({
        demandaId: 'dem_wf_01',
        novoEstado: EstadoDemanda.DADOS_RECEBIDOS,
      })
    ).rejects.toThrow(/histórico congelado/);

    // Validação da Timeline (ordenada desc por timestamp)
    const timeline1 = await getTimelineUseCase1.execute('dem_wf_01');
    expect(timeline1.length).toBeGreaterThanOrEqual(5);
    expect(timeline1[timeline1.length - 1].tipo_evento).toBe('CRIACAO');

    // Fecha conexão 1
    sqlite1.close();

    // 2. SEGUNDA CONEXÃO: Validação de Preservação e Persistência Física
    const sqlite2 = new Database(testDbPath);
    sqlite2.pragma('foreign_keys = ON');

    const db2 = drizzle(sqlite2, { schema });
    const demandRepo2 = new SqliteDemandRepository(db2);
    const auditRepo2 = new SqliteAuditRepository(db2);
    const getTimelineUseCase2 = new GetDemandTimelineUseCase(auditRepo2);

    const demPersistida = await demandRepo2.findById('dem_wf_01');
    expect(demPersistida).toBeDefined();
    expect(demPersistida?.estado).toBe(EstadoDemanda.CANCELADA);
    expect(demPersistida?.estado_anterior).toBeNull();

    const timelinePersistida = await getTimelineUseCase2.execute('dem_wf_01');
    expect(timelinePersistida.length).toBe(timeline1.length);
    expect(timelinePersistida[timelinePersistida.length - 1].tipo_evento).toBe('CRIACAO');

    const eventoTransicao1 = timelinePersistida.find((t) => {
      if (!t.dados_novos) return false;
      const parsed = JSON.parse(t.dados_novos);
      return parsed.estado === EstadoDemanda.EM_CLARIFICACAO;
    });
    expect(eventoTransicao1).toBeDefined();

    const eventoTransicao2 = timelinePersistida.find((t) => {
      if (!t.dados_novos) return false;
      const parsed = JSON.parse(t.dados_novos);
      return parsed.estado === EstadoDemanda.DADOS_RECEBIDOS;
    });
    expect(eventoTransicao2).toBeDefined();

    const eventoSuspensao = timelinePersistida.find((t) => {
      if (!t.dados_novos) return false;
      const parsed = JSON.parse(t.dados_novos);
      return parsed.estado === EstadoDemanda.SUSPENSA;
    });
    expect(eventoSuspensao).toBeDefined();
    expect(eventoSuspensao?.justificativa).toBe('Aguardando concessão de credenciais ao Data Lake de Vendas');

    const eventoRetomada = timelinePersistida.find((t) => {
      if (!t.dados_anteriores) return false;
      const parsed = JSON.parse(t.dados_anteriores);
      return parsed.estado === EstadoDemanda.SUSPENSA;
    });
    expect(eventoRetomada).toBeDefined();
    expect(eventoRetomada?.justificativa).toBe('Acesso liberado pela equipe de segurança da informação');

    const eventoCancelamento = timelinePersistida.find((t) => {
      if (!t.dados_novos) return false;
      const parsed = JSON.parse(t.dados_novos);
      return parsed.estado === EstadoDemanda.CANCELADA;
    });
    expect(eventoCancelamento).toBeDefined();
    expect(eventoCancelamento?.justificativa).toBe('Demanda descontinuada pela área de negócios após reestruturação de escopo');

    sqlite2.close();
  });
});
