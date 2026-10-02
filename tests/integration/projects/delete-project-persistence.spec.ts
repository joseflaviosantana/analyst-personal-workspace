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
import {
  DeleteProjectUseCase,
  ProjetoPossuiDemandasVinculadasError,
  ProjetoNotFoundError,
} from '@/core/use-cases/projects/delete-project';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';

describe('Integration Tests: Persistência Real SQLite e Integridade da Exclusão (Subgate 1)', () => {
  const testDbDir = path.join(process.cwd(), '.workspace', 'data');
  const testDbPath = path.join(testDbDir, 'test_delete_project_persistence.db');

  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let auditRepo: SqliteAuditRepository;
  let deleteUseCase: DeleteProjectUseCase;

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
    deleteUseCase = new DeleteProjectUseCase(projectRepo, auditRepo);
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

  it('deve excluir projeto sem demandas, remover linha de projetos e preservar auditoria intacta', async () => {
    const now = new Date().toISOString();
    const projId = 'proj_integ_sem_demanda';

    // 1. Criar projeto no banco SQLite real
    await projectRepo.create({
      id: projId,
      nome: 'Projeto Sem Demandas Real',
      descricao: 'Criado para teste de exclusão e sobrevivência da auditoria',
      status: 'ATIVO',
      data_inicio: '2026-03-01',
      data_conclusao_prevista: '2026-05-01',
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    // 2. Verificar que existe e countDemands é 0
    const count = await projectRepo.countDemands(projId);
    expect(count).toBe(0);

    // 3. Executar o caso de uso de exclusão
    const result = await deleteUseCase.execute({
      projectId: projId,
      motivo: 'Teste de exclusão governada',
      autorTipo: 'HUMANO',
    });

    expect(result.success).toBe(true);
    expect(result.projectId).toBe(projId);

    // 4. Verificar que o projeto NÃO existe mais na tabela projetos
    const projAposExclusao = await projectRepo.findById(projId);
    expect(projAposExclusao).toBeNull();

    // 5. COMPROVAÇÃO DETERMINÍSTICA: O registro de auditoria permanece íntegro e consultável
    const auditorias = await auditRepo.findByEntidade('PROJETO', projId);
    expect(auditorias).toHaveLength(1);

    const auditRecord = auditorias[0];
    expect(auditRecord.entidade).toBe('PROJETO');
    expect(auditRecord.entidade_id).toBe(projId);
    expect(auditRecord.tipo_evento).toBe('EXCLUSAO');
    expect(auditRecord.autor_tipo).toBe('HUMANO');
    expect(auditRecord.demanda_id).toBeNull();
    expect(auditRecord.justificativa).toBe('Teste de exclusão governada');

    // Verifica integridade do payload de dados anteriores gravado
    expect(auditRecord.dados_anteriores).not.toBeNull();
    const dadosAnt = JSON.parse(auditRecord.dados_anteriores!);
    expect(dadosAnt.id).toBe(projId);
    expect(dadosAnt.nome).toBe('Projeto Sem Demandas Real');
    expect(dadosAnt.status).toBe('ATIVO');
  });

  it('deve bloquear a exclusão se houver demanda vinculada e NÃO acionar cascade destrutivo', async () => {
    const now = new Date().toISOString();
    const projId = 'proj_integ_com_demanda';
    const demId = 'dem_integ_vinculada_1';

    // 1. Criar projeto no banco SQLite real
    await projectRepo.create({
      id: projId,
      nome: 'Projeto Com Demanda Protegido',
      descricao: 'Não pode ser excluído',
      status: 'ATIVO',
      data_inicio: '2026-03-01',
      data_conclusao_prevista: '2026-05-01',
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    // 2. Criar demanda vinculada ao projeto
    await demandRepo.create({
      id: demId,
      projeto_id: projId,
      titulo: 'Demanda Vinculada Crítica',
      solicitacao_bruta: 'Solicitação do cliente para teste de proteção referencial',
      contexto: 'Contexto de proteção contra cascade',
      objetivo_inicial: 'Prevenir exclusão indevida',
      prazo_esperado: '2026-04-15',
      restricoes_declaradas: null,
      estado: EstadoDemanda.NOVA,
      criado_em: now,
      atualizado_em: now,
      data_conclusao: null,
    });

    // 3. Confirmar que countDemands retorna 1
    const count = await projectRepo.countDemands(projId);
    expect(count).toBe(1);

    // 4. Tentar executar a exclusão via DeleteProjectUseCase -> Deve ser bloqueado
    await expect(
      deleteUseCase.execute({ projectId: projId })
    ).rejects.toThrow(ProjetoPossuiDemandasVinculadasError);

    // 5. COMPROVAÇÃO DE PROTEÇÃO: Projeto continua existindo no banco
    const projAindaExiste = await projectRepo.findById(projId);
    expect(projAindaExiste).not.toBeNull();
    expect(projAindaExiste?.nome).toBe('Projeto Com Demanda Protegido');

    // 6. COMPROVAÇÃO DE PROTEÇÃO CONTRA CASCADE: Demanda continua existindo intacta
    const demandaAindaExiste = await demandRepo.findById(demId);
    expect(demandaAindaExiste).not.toBeNull();
    expect(demandaAindaExiste?.titulo).toBe('Demanda Vinculada Crítica');

    // 7. COMPROVAÇÃO DE AUDITORIA: Nenhum evento de exclusão foi gerado
    const auditorias = await auditRepo.findByEntidade('PROJETO', projId);
    expect(auditorias).toHaveLength(0);
  });

  it('deve lançar ProjetoNotFoundError ao tentar excluir projeto inexistente', async () => {
    await expect(
      deleteUseCase.execute({ projectId: 'proj_fantasma_999' })
    ).rejects.toThrow(ProjetoNotFoundError);
  });
});
