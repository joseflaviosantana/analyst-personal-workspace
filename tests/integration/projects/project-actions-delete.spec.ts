import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Database from 'better-sqlite3';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import * as schema from '@/infrastructure/db/schema';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import {
  deleteProjectAction,
  updateProjectAction,
} from '@/app/actions/project-actions';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';

describe('Integration Tests: Server Action de Exclusão Segura de Projetos (Subgate 2)', () => {
  const testDbDir = path.join(process.cwd(), '.workspace', 'data');
  const testDbPath = path.join(testDbDir, 'test_project_actions_delete.db');

  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let auditRepo: SqliteAuditRepository;

  beforeAll(() => {
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }
    const filesToClean = [testDbPath, `${testDbPath}-wal`, `${testDbPath}-shm`];
    for (const f of filesToClean) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch {
          // ignore
        }
      }
    }

    sqlite = new Database(testDbPath);
    sqlite.pragma('foreign_keys = ON');
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('synchronous = NORMAL');
    sqlite.pragma('busy_timeout = 5000');

    db = drizzle(sqlite, { schema });
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(db, { migrationsFolder });

    projectRepo = new SqliteProjectRepository(db);
    demandRepo = new SqliteDemandRepository(db);
    auditRepo = new SqliteAuditRepository(db);
  });

  afterAll(() => {
    if (sqlite) {
      sqlite.close();
    }
    const filesToClean = [testDbPath, `${testDbPath}-wal`, `${testDbPath}-shm`];
    for (const f of filesToClean) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch {
          // ignore
        }
      }
    }
  });

  it('1. Server Action exclui projeto sem demandas com sucesso', async () => {
    const projId = 'proj_act_sem_demanda';
    const now = new Date().toISOString();

    await projectRepo.create({
      id: projId,
      nome: 'Projeto Sem Demandas Action',
      descricao: 'Teste de exclusão via Server Action',
      status: 'ATIVO',
      data_inicio: '2026-03-01',
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    const res = await deleteProjectAction(projId, 'Exclusão autorizada pelo usuário', {
      projectRepo,
      auditRepo,
    });

    expect(res.success).toBe(true);
    expect(res.data?.projectId).toBe(projId);

    // Confirma que não existe mais no repositório
    const check = await projectRepo.findById(projId);
    expect(check).toBeNull();
  });

  it('2. Server Action injeta auditoria e a exclusão permanece auditável no banco', async () => {
    const projId = 'proj_act_audit_check';
    const now = new Date().toISOString();

    await projectRepo.create({
      id: projId,
      nome: 'Projeto para Checar Auditoria',
      descricao: 'Auditoria deve sobreviver',
      status: 'ATIVO',
      data_inicio: null,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    const res = await deleteProjectAction(projId, 'Auditoria deve registrar este motivo', {
      projectRepo,
      auditRepo,
    });

    expect(res.success).toBe(true);

    // O projeto foi removido
    expect(await projectRepo.findById(projId)).toBeNull();

    // Comprovação: registro de auditoria existe e é consultável
    const auditorias = await auditRepo.findByEntidade('PROJETO', projId);
    expect(auditorias).toHaveLength(1);
    expect(auditorias[0].tipo_evento).toBe('EXCLUSAO');
    expect(auditorias[0].justificativa).toBe('Auditoria deve registrar este motivo');
    expect(auditorias[0].demanda_id).toBeNull();
  });

  it('3. Server Action rejeita projeto com demanda e retorna erro seguro', async () => {
    const projId = 'proj_act_com_demanda';
    const demId = 'dem_act_vinculada_1';
    const now = new Date().toISOString();

    await projectRepo.create({
      id: projId,
      nome: 'Projeto Protegido Action',
      descricao: 'Possui demanda vinculada',
      status: 'ATIVO',
      data_inicio: null,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    await demandRepo.create({
      id: demId,
      projeto_id: projId,
      titulo: 'Demanda Vinculada 1',
      solicitacao_bruta: 'Solicitação ativa',
      contexto: null,
      objetivo_inicial: null,
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.NOVA,
      criado_em: now,
      atualizado_em: now,
      data_conclusao: null,
    });

    const res = await deleteProjectAction(projId, undefined, {
      projectRepo,
      auditRepo,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Não é possível excluir o projeto porque existem 1 demanda(s) vinculada(s)');

    // Confirma que o projeto continua existindo
    const proj = await projectRepo.findById(projId);
    expect(proj).not.toBeNull();
  });

  it('4. Server Action rejeita projeto inexistente com mensagem amigável', async () => {
    const res = await deleteProjectAction('proj_nao_existe_999', undefined, {
      projectRepo,
      auditRepo,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("não foi encontrado");
  });

  it('5. Fluxo de exclusão não executa cascade de demandas em nenhuma circunstância', async () => {
    const projId = 'proj_act_cascade_test';
    const demId = 'dem_act_cascade_1';
    const now = new Date().toISOString();

    await projectRepo.create({
      id: projId,
      nome: 'Projeto Cascade Test',
      descricao: 'Verificar se demandas são preservadas',
      status: 'ATIVO',
      data_inicio: null,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    await demandRepo.create({
      id: demId,
      projeto_id: projId,
      titulo: 'Demanda que não pode sumir',
      solicitacao_bruta: 'Demanda viva',
      contexto: null,
      objetivo_inicial: null,
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.NOVA,
      criado_em: now,
      atualizado_em: now,
      data_conclusao: null,
    });

    // Tentativa de exclusão via action
    const res = await deleteProjectAction(projId, undefined, {
      projectRepo,
      auditRepo,
    });
    expect(res.success).toBe(false);

    // A demanda DEVE permanecer viva e acessível
    const demandaAindaViva = await demandRepo.findById(demId);
    expect(demandaAindaViva).not.toBeNull();
    expect(demandaAindaViva?.id).toBe(demId);
  });

  it('6. Edição normal do projeto continua funcionando normalmente', async () => {
    const projId = 'proj_act_edit_test';
    const now = new Date().toISOString();

    await projectRepo.create({
      id: projId,
      nome: 'Nome Original',
      descricao: 'Descricao Original',
      status: 'ATIVO',
      data_inicio: null,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    const res = await updateProjectAction(
      projId,
      {
        nome: 'Nome Atualizado com Sucesso',
        descricao: 'Nova descrição',
        status: 'PAUSADO',
      },
      { projectRepo }
    );

    expect(res.success).toBe(true);
    expect(res.data?.nome).toBe('Nome Atualizado com Sucesso');
    expect(res.data?.status).toBe('PAUSADO');

    const updated = await projectRepo.findById(projId);
    expect(updated?.nome).toBe('Nome Atualizado com Sucesso');
  });
});
