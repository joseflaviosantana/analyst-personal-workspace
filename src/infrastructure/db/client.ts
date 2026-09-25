import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import fs from 'fs';
import path from 'path';

const dbPath = process.env.WORKSPACE_DB_PATH || path.join(process.cwd(), '.workspace', 'data', 'workspace.db');

// Assegura existência do diretório físico do banco SQLite
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Inicializa instância singleton com pragmas normativas do ADR-002
const globalForDb = globalThis as unknown as {
  sqliteClient: Database.Database | undefined;
};

export const sqlite = globalForDb.sqliteClient ?? new Database(dbPath);

// Configuração obrigatória de integridade e resiliência (ADR-002 Seção 4.2)
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('synchronous = NORMAL');
sqlite.pragma('busy_timeout = 5000');

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sqliteClient = sqlite;
}

export const db = drizzle(sqlite, { schema });
