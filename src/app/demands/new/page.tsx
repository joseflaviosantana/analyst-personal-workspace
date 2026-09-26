import React from 'react';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { ListProjectsUseCase } from '@/core/use-cases/projects/list-projects';
import { NewDemandForm } from './new-form';

export const dynamic = 'force-dynamic';

interface NewDemandPageProps {
  searchParams: Promise<{ projectId?: string }>;
}

export default async function NewDemandPage({ searchParams }: NewDemandPageProps) {
  const { projectId } = await searchParams;
  const projectRepo = new SqliteProjectRepository();
  const listProjects = new ListProjectsUseCase(projectRepo);
  const projects = await listProjects.execute();

  return <NewDemandForm projects={projects} initialProjectId={projectId} />;
}
