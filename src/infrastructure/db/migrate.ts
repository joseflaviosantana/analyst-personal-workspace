import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './client';
import path from 'path';

export function runMigrations(migrationsFolder = path.join(process.cwd(), 'drizzle')) {
  console.log(`[MIGRATIONS] Executando migrations a partir de: ${migrationsFolder}`);
  migrate(db, { migrationsFolder });
  console.log('[MIGRATIONS] Migrations concluídas com sucesso.');
}

// Execução direta via CLI se chamado como script principal
if (process.argv[1] && process.argv[1].includes('migrate')) {
  try {
    runMigrations();
    sqlite.close();
    process.exit(0);
  } catch (error) {
    console.error('[MIGRATIONS] Erro fatal durante execução de migrations:', error);
    process.exit(1);
  }
}
