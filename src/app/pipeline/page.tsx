import React from 'react';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { PipelineView } from './pipeline-view';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  const demandRepo = new SqliteDemandRepository();
  const projectRepo = new SqliteProjectRepository();

  const [demands, projects] = await Promise.all([
    demandRepo.findAll(),
    projectRepo.findAll(),
  ]);

  return <PipelineView initialDemands={demands} projects={projects} />;
}
