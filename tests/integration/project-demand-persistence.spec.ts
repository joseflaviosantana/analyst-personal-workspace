import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import * as schema from '@/infrastructure/db/schema';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';

describe('Integration Tests: Persistência Real SQLite e Integridade Referencial (Bloco 1)', () => {
  const testDbDir = path.join(process.cwd(), '.workspace', 'data');
  const testDbPath = path.join(testDbDir, 'test_persistence_bloco1.db');

  beforeAll(() => {
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterAll(() => {
    // Limpeza de arquivos de teste após execução
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

  it('deve executar migrations, persistir Projeto e Demandas, validar integridade e preservar dados após nova conexão', async () => {
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

    // Criação de Projeto Sintético
    const now = new Date().toISOString();
    const projSintetico = {
      id: 'proj_sintetico_01',
      nome: 'Projeto Sintético de Teste Integrado',
      descricao: 'Validação de persistência e chaves estrangeiras',
      status: 'ATIVO' as const,
      data_inicio: '2026-01-01',
      data_conclusao_prevista: '2026-06-30',
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    };
    await projectRepo1.create(projSintetico);

    // Leitura do Projeto criado
    const projLido = await projectRepo1.findById('proj_sintetico_01');
    expect(projLido).toBeDefined();
    expect(projLido?.nome).toBe('Projeto Sintético de Teste Integrado');

    // Criação de 2 Demandas Sintéticas vinculadas ao Projeto
    const dem1 = {
      id: 'dem_sintetica_01',
      projeto_id: 'proj_sintetico_01',
      titulo: 'Demanda Sintética 1',
      solicitacao_bruta: 'Solicitação bruta para teste de integridade 1',
      contexto: 'Contexto sintético 1',
      objetivo_inicial: 'Objetivo sintético 1',
      prazo_esperado: '2026-03-31',
      restricoes_declaradas: 'Nenhuma restrição',
      estado: EstadoDemanda.BACKLOG,
      criado_em: now,
      atualizado_em: now,
      data_conclusao: null,
    };

    const dem2 = {
      id: 'dem_sintetica_02',
      projeto_id: 'proj_sintetico_01',
      titulo: 'Demanda Sintética 2',
      solicitacao_bruta: 'Solicitação bruta para teste de integridade 2',
      contexto: 'Contexto sintético 2',
      objetivo_inicial: 'Objetivo sintético 2',
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.BACKLOG,
      criado_em: now,
      atualizado_em: now,
      data_conclusao: null,
    };

    await demandRepo1.create(dem1);
    await demandRepo1.create(dem2);

    // Validação de Relacionamento Projeto -> Demandas
    const demandasDoProjeto = await demandRepo1.findByProjectId('proj_sintetico_01');
    expect(demandasDoProjeto).toHaveLength(2);

    // Validação de contadores agregados
    const projetosComContadores = await projectRepo1.findAll();
    const projetoAgregado = projetosComContadores.find((p) => p.id === 'proj_sintetico_01');
    expect(projetoAgregado?.totalDemandas).toBe(2);
    expect(projetoAgregado?.demandasAtivas).toBe(2);

    // Validação de Integridade Referencial no SQLite Físico (foreign_keys = ON)
    expect(() => {
      sqlite1
        .prepare(
          `INSERT INTO demandas (id, projeto_id, titulo, solicitacao_bruta, estado, criado_em, atualizado_em) 
           VALUES ('dem_orfa_invalida', 'projeto_fantasma_inexistente', 'Demanda Órfã', 'Texto', 'BACKLOG', ?, ?)`
        )
        .run(now, now);
    }).toThrow(/FOREIGN KEY/i);

    // Fechamento formal da Conexão 1
    sqlite1.close();

    // 2. SEGUNDA CONEXÃO: Validação de Preservação e Persistência após Nova Conexão
    const sqlite2 = new Database(testDbPath);
    sqlite2.pragma('foreign_keys = ON');

    const db2 = drizzle(sqlite2, { schema });
    const projectRepo2 = new SqliteProjectRepository(db2);
    const demandRepo2 = new SqliteDemandRepository(db2);

    // Confirma que os dados continuam intactos no arquivo físico
    const projReaberto = await projectRepo2.findById('proj_sintetico_01');
    expect(projReaberto).toBeDefined();
    expect(projReaberto?.nome).toBe('Projeto Sintético de Teste Integrado');

    const demReaberta = await demandRepo2.findById('dem_sintetica_01');
    expect(demReaberta).toBeDefined();
    expect(demReaberta?.titulo).toBe('Demanda Sintética 1');
    expect(demReaberta?.projetoNome).toBe('Projeto Sintético de Teste Integrado');

    // Atualização na nova conexão
    await projectRepo2.update('proj_sintetico_01', { status: 'CONCLUIDO' });
    const projAtualizado = await projectRepo2.findById('proj_sintetico_01');
    expect(projAtualizado?.status).toBe('CONCLUIDO');

    await demandRepo2.update('dem_sintetica_01', { titulo: 'Demanda Sintética Título Editado' });
    const demAtualizada = await demandRepo2.findById('dem_sintetica_01');
    expect(demAtualizada?.titulo).toBe('Demanda Sintética Título Editado');

    sqlite2.close();
  });
});
