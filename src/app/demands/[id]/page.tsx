import React from 'react';
import { notFound } from 'next/navigation';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { GetDemandUseCase } from '@/core/use-cases/demands/get-demand';
import { DemandWorkspaceView } from './workspace-view';

export const dynamic = 'force-dynamic';

interface DemandWorkspacePageProps {
  params: Promise<{ id: string }>;
}

export default async function DemandWorkspacePage({ params }: DemandWorkspacePageProps) {
  const { id } = await params;
  const demandRepo = new SqliteDemandRepository();
  const getDemand = new GetDemandUseCase(demandRepo);
  const demand = await getDemand.execute(id);

  if (!demand) {
    notFound();
  }

  return <DemandWorkspaceView demand={demand} />;
}
