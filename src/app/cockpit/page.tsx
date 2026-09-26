import React from 'react';
import Link from 'next/link';
import { 
  FolderKanban, 
  FileText, 
  Clock, 
  ArrowUpRight, 
  PlusCircle, 
  CheckCircle2 
} from 'lucide-react';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { GetCockpitSummaryUseCase } from '@/core/use-cases/cockpit/get-cockpit-summary';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default async function CockpitPage() {
  const projectRepo = new SqliteProjectRepository();
  const demandRepo = new SqliteDemandRepository();
  const getSummary = new GetCockpitSummaryUseCase(projectRepo, demandRepo);

  const summary = await getSummary.execute();

  const hasData = summary.totalProjetos > 0;

  return (
    <div className="space-y-8">
      {/* Cabeçalho do Cockpit */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 data-testid="cockpit-title" className="text-2xl font-bold tracking-tight text-white">
            Centro de Comando (Cockpit)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Visão situacional executiva e operacional do fluxo analítico
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/projects/new"
            data-testid="cockpit-new-project-btn"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Novo Projeto</span>
          </Link>
          <Link
            href="/demands/new"
            data-testid="cockpit-new-demand-btn"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Nova Demanda</span>
          </Link>
        </div>
      </div>

      {/* Estado Vazio Global se não houver projetos */}
      {!hasData ? (
        <EmptyState
          testId="cockpit-empty-state"
          title="Você ainda não possui projetos."
          description="Cadastre seu primeiro projeto de dados para estruturar iniciativas e vincular demandas operacionais."
          actionText="+ Criar Primeiro Projeto"
          actionHref="/projects/new"
        />
      ) : (
        <>
          {/* Métricas Rápidas Operacionais */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card testId="stat-total-projects" className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total de Projetos</span>
                <FolderKanban className="h-4 w-4 text-blue-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span data-testid="count-total-projects" className="text-3xl font-extrabold tracking-tight text-white">
                  {summary.totalProjetos}
                </span>
                <span className="text-xs text-slate-400">cadastrados</span>
              </div>
            </Card>

            <Card testId="stat-active-projects" className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Projetos Ativos</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span data-testid="count-active-projects" className="text-3xl font-extrabold tracking-tight text-emerald-400">
                  {summary.projetosAtivos}
                </span>
                <span className="text-xs text-slate-400">em andamento</span>
              </div>
            </Card>

            <Card testId="stat-total-demands" className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total de Demandas</span>
                <FileText className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span data-testid="count-total-demands" className="text-3xl font-extrabold tracking-tight text-white">
                  {summary.totalDemandas}
                </span>
                <span className="text-xs text-slate-400">no pipeline</span>
              </div>
            </Card>

            <Card testId="stat-active-demands" className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Demandas Ativas</span>
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span data-testid="count-active-demands" className="text-3xl font-extrabold tracking-tight text-amber-400">
                  {summary.demandasAtivas}
                </span>
                <span className="text-xs text-slate-400">não concluídas</span>
              </div>
            </Card>
          </div>

          {/* Demandas Recentes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-200">
                Demandas Atualizadas Recentemente
              </h2>
              <Link 
                href="/demands" 
                className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
              >
                Ver todas as demandas
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {summary.demandasRecentes.length === 0 ? (
              <EmptyState
                testId="cockpit-empty-demands"
                title="Este projeto ainda não possui demandas."
                description="Cadastre uma nova solicitação vinculada a um de seus projetos."
                actionText="+ Nova Demanda"
                actionHref="/demands/new"
              />
            ) : (
              <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300" data-testid="table-recent-demands">
                    <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-6 py-3.5 font-semibold">Título da Demanda</th>
                        <th className="px-6 py-3.5 font-semibold">Projeto de Origem</th>
                        <th className="px-6 py-3.5 font-semibold">Estado Atual</th>
                        <th className="px-6 py-3.5 font-semibold">Última Atualização</th>
                        <th className="px-6 py-3.5 font-semibold text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {summary.demandasRecentes.map((demanda) => (
                        <tr key={demanda.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">
                            <Link 
                              href={`/demands/${demanda.id}`}
                              className="hover:text-blue-400 transition-colors"
                            >
                              {demanda.titulo}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {demanda.projetoNome}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="default" testId={`badge-state-${demanda.id}`}>
                              {demanda.estado}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {new Date(demanda.atualizado_em).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/demands/${demanda.id}`}
                              className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                              Abrir Workspace
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
