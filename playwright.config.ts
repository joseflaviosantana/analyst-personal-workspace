import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './src/infrastructure/db/schema';

const e2eDbPath = path.resolve(process.cwd(), '.workspace', 'data', 'workspace-e2e.db');

// Assegura existência e migrações do banco E2E isolado de forma determinística
const dbDir = path.dirname(e2eDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const e2eSqlite = new Database(e2eDbPath);
e2eSqlite.pragma('foreign_keys = ON');
e2eSqlite.pragma('journal_mode = WAL');
e2eSqlite.pragma('synchronous = NORMAL');
e2eSqlite.pragma('busy_timeout = 5000');
const e2eDb = drizzle(e2eSqlite, { schema });
migrate(e2eDb, { migrationsFolder: path.resolve(process.cwd(), 'drizzle') });
e2eSqlite.close();

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60 * 1000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3005',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- -p 3005',
    url: 'http://localhost:3005',
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      PORT: '3005',
      WORKSPACE_DB_PATH: e2eDbPath,
    },
  },
});
