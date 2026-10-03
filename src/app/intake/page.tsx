import React from 'react';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { ListProjectsUseCase } from '@/core/use-cases/projects/list-projects';
import { IntakeFlow } from '@/components/intake';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Entrada Inteligente (Intake) | Analyst Personal Workspace',
  description:
    'Inicie a análise a partir de solicitações brutas com assistência proativa do Copiloto antes de criar projetos e demandas.',
};

export default async function IntakePage() {
  const projectRepo = new SqliteProjectRepository();
  const listProjects = new ListProjectsUseCase(projectRepo);
  const projects = await listProjects.execute();

  return (
    <div className="py-2">
      <IntakeFlow existingProjects={projects} />
    </div>
  );
}
