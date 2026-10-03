import React from 'react';
import { notFound } from 'next/navigation';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { SqliteAtivoDadosRepository } from '@/infrastructure/db/repositories/ativo-dados-repository';
import { GetDemandUseCase } from '@/core/use-cases/demands/get-demand';
import { GetDemandTimelineUseCase } from '@/core/use-cases/workflow/get-demand-timeline';
import { ListDataAssetsUseCase } from '@/core/use-cases/data-assets/list-data-assets';
import { DemandWorkspaceView } from './workspace-view';

export const dynamic = 'force-dynamic';

interface DemandWorkspacePageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string; origem?: string }>;
}

export default async function DemandWorkspacePage({ params, searchParams }: DemandWorkspacePageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const demandRepo = new SqliteDemandRepository();
  const auditRepo = new SqliteAuditRepository();
  const ativoDadosRepo = new SqliteAtivoDadosRepository();

  const getDemand = new GetDemandUseCase(demandRepo);
  const getTimeline = new GetDemandTimelineUseCase(auditRepo);
  const listAssets = new ListDataAssetsUseCase(ativoDadosRepo);

  const [demand, timeline, assets] = await Promise.all([
    getDemand.execute(id),
    getTimeline.execute(id),
    listAssets.execute(id),
  ]);

  if (!demand) {
    notFound();
  }

  return (
    <DemandWorkspaceView 
      demand={demand} 
      timeline={timeline} 
      initialAssets={assets}
      defaultTab={resolvedSearchParams.tab || 'overview'}
      isOrigemIntake={resolvedSearchParams.origem === 'intake'}
    />
  );
}
