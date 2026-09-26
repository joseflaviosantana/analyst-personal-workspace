import React from 'react';
import Link from 'next/link';
import { PlusCircle, FileText, ArrowRight } from 'lucide-react';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { ListDemandsUseCase } from '@/core/use-cases/demands/list-demands';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DemandStateBadge } from '@/components/ui/DemandStateBadge';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default async function DemandsPage() {
  const demandRepo = new SqliteDemandRepository();
  const listDemands = new ListDemandsUseCase(demandRepo);
  const demands = await listDemands.execute();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 data-testid="demands-page-title" className="text-2xl font-bold tracking-tight text-white">
            Demandas
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Unidades operacionais de trabalho e ciclo de vida analítico
          </p>
        </div>

        <Link
          href="/demands/new"
          data-testid="btn-new-demand-main"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Nova Demanda</span>
        </Link>
      </div>

      {demands.length === 0 ? (
        <EmptyState
          testId="demands-empty-state"
          title="Nenhuma demanda cadastrada."
          description="Cadastre sua primeira demanda vinculada a um projeto para iniciar o ciclo de entrega analítica."
          actionText="+ Criar Primeira Demanda"
          actionHref="/demands/new"
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300" data-testid="table-all-demands">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Título da Demanda</th>
                  <th className="px-6 py-3.5 font-semibold">Projeto</th>
                  <th className="px-6 py-3.5 font-semibold">Estado Atual</th>
                  <th className="px-6 py-3.5 font-semibold">Última Atualização</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {demands.map((demand) => (
                  <tr key={demand.id} className="hover:bg-slate-800/40 transition-colors" data-testid={`demand-row-${demand.id}`}>
                    <td className="px-6 py-4 font-medium text-white">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
                        <Link href={`/demands/${demand.id}`} className="hover:text-blue-400 transition-colors">
                          {demand.titulo}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <Link href={`/projects/${demand.projeto_id}`} className="hover:underline">
                        {demand.projetoNome}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <DemandStateBadge estado={demand.estado} testId={`badge-state-${demand.id}`} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(demand.atualizado_em).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/demands/${demand.id}`}
                        data-testid={`btn-open-demand-${demand.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <span>Workspace</span>
                        <ArrowRight className="h-3 w-3" />
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
  );
}
