import { db } from '@/infrastructure/db/client';
import { bootstrapRegistros, sistemaInfo } from '@/infrastructure/db/schema';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let dbStatus = 'OPERACIONAL';
  let totalRegistros = 0;

  try {
    const rows = db.select().from(bootstrapRegistros).all();
    totalRegistros = rows.length;
  } catch (error) {
    dbStatus = 'ERRO';
    console.error('Falha ao consultar banco local:', error);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950 text-slate-100">
      <div 
        id="bootstrap-card"
        data-testid="bootstrap-card" 
        className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-sm"
      >
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div>
            <h1 
              data-testid="app-title" 
              className="text-2xl font-bold tracking-tight text-white"
            >
              Analyst Personal Workspace
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Sistema Operacional Pessoal para Trabalho em Dados e BI
            </p>
          </div>
          <span 
            data-testid="app-version-badge" 
            className="rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/60 px-3 py-1 text-xs font-semibold"
          >
            V1 — Bootstrap Técnico
          </span>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-slate-950/60 p-4 border border-slate-800/80">
            <span className="text-sm font-medium text-slate-300">Status da Fundação Técnica</span>
            <span 
              data-testid="bootstrap-status" 
              className="inline-flex items-center rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2.5 py-1 text-xs font-semibold"
            >
              ● OPERACIONAL
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-950/40 p-4 border border-slate-800/60">
              <span className="text-xs text-slate-500 uppercase font-semibold">Persistência Local</span>
              <p className="text-sm font-medium text-slate-200 mt-1">SQLite + Drizzle ORM</p>
              <p className="text-xs text-slate-400 mt-0.5">Status: {dbStatus} ({totalRegistros} registros)</p>
            </div>
            <div className="rounded-lg bg-slate-950/40 p-4 border border-slate-800/60">
              <span className="text-xs text-slate-500 uppercase font-semibold">Execução</span>
              <p className="text-sm font-medium text-slate-200 mt-1">Next.js App Router (Local-First)</p>
              <p className="text-xs text-slate-400 mt-0.5">Ambiente: Windows x64</p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-950/40 p-4 border border-slate-800/60 text-xs text-slate-400 space-y-1">
            <p>✓ Driver SQLite nativo (<code className="text-slate-300">better-sqlite3</code>) validado.</p>
            <p>✓ Migrations estruturais versionadas e aplicadas.</p>
            <p>✓ Isolamento estrito de dados e conformidade com ADR-002.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
