import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { eq } from 'drizzle-orm';
import path from 'path';
import * as schema from '@/infrastructure/db/schema';

describe('Integration: Persistência Local SQLite + Drizzle ORM', () => {
  let sqlite: Database.Database;
  let testDb: ReturnType<typeof drizzle<typeof schema>>;

  beforeEach(() => {
    // Banco SQLite isolado em memória para testes de integração ultra-rápidos
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('synchronous = NORMAL');
    sqlite.pragma('busy_timeout = 5000');

    testDb = drizzle(sqlite, { schema });

    // Aplica as migrations versionadas reais da pasta drizzle/
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(testDb, { migrationsFolder });
  });

  afterEach(() => {
    sqlite.close();
  });

  it('deve aplicar migrations e conter as tabelas de bootstrap', () => {
    const tabelas = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];

    const nomesTabelas = tabelas.map((t) => t.name);
    expect(nomesTabelas).toContain('sistema_info');
    expect(nomesTabelas).toContain('bootstrap_registros');
  });

  it('deve persistir e recuperar registro sintético com timestamps válidos', () => {
    const timestampAtual = new Date().toISOString();
    const registroSintetico = {
      id: 'reg-sintetico-001',
      titulo: 'Demanda de Teste Sintética de Bootstrap',
      status: 'OPERACIONAL',
      criado_em: timestampAtual,
      atualizado_em: timestampAtual,
    };

    // Escrita
    testDb.insert(schema.bootstrapRegistros).values(registroSintetico).run();

    // Leitura
    const resultado = testDb
      .select()
      .from(schema.bootstrapRegistros)
      .where(eq(schema.bootstrapRegistros.id, 'reg-sintetico-001'))
      .get();

    expect(resultado).toBeDefined();
    expect(resultado?.id).toBe('reg-sintetico-001');
    expect(resultado?.titulo).toBe('Demanda de Teste Sintética de Bootstrap');
    expect(resultado?.status).toBe('OPERACIONAL');
    expect(resultado?.criado_em).toBe(timestampAtual);
    expect(resultado?.atualizado_em).toBe(timestampAtual);
  });

  it('deve aplicar restrição de chave única na tabela sistema_info', () => {
    const timestampAtual = new Date().toISOString();

    testDb.insert(schema.sistemaInfo).values({
      id: 'sys-001',
      chave: 'VERSAO_SISTEMA',
      valor: '0.1.0',
      criado_em: timestampAtual,
      atualizado_em: timestampAtual,
    }).run();

    // Tentar inserir mesma chave única deve disparar erro de integridade SQLite
    expect(() => {
      testDb.insert(schema.sistemaInfo).values({
        id: 'sys-002',
        chave: 'VERSAO_SISTEMA',
        valor: '0.2.0',
        criado_em: timestampAtual,
        atualizado_em: timestampAtual,
      }).run();
    }).toThrow();
  });
});
