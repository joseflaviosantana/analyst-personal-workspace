import React from 'react';
import { notFound } from 'next/navigation';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { GetDemandUseCase } from '@/core/use-cases/demands/get-demand';
import { GetDemandTimelineUseCase } from '@/core/use-cases/workflow/get-demand-timeline';
import { DemandWorkspaceView } from './workspace-view';

export const dynamic = 'force-dynamic';

interface DemandWorkspacePageProps {
  params: Promise<{ id: string }>;
}

export default async function DemandWorkspacePage({ params }: DemandWorkspacePageProps) {
  const { id } = await params;
  const demandRepo = new SqliteDemandRepository();
  const auditRepo = new SqliteAuditRepository();

  const getDemand = new GetDemandUseCase(demandRepo);
  const getTimeline = new GetDemandTimelineUseCase(auditRepo);

  const [demand, timeline] = await Promise.all([
    getDemand.execute(id),
    getTimeline.execute(id),
  ]);

  if (!demand) {
    notFound();
  }

  return <DemandWorkspaceView demand={demand} timeline={timeline} />;
}
