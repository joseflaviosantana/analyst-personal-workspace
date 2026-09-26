import React from 'react';
import Link from 'next/link';
import { PlusCircle, FolderKanban, ArrowRight, FileText } from 'lucide-react';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { ListProjectsUseCase } from '@/core/use-cases/projects/list-projects';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projectRepo = new SqliteProjectRepository();
  const listProjects = new ListProjectsUseCase(projectRepo);
  const projects = await listProjects.execute();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 data-testid="projects-page-title" className="text-2xl font-bold tracking-tight text-white">
            Projetos
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Iniciativas de negócio e agrupadores estratégicos de demandas
          </p>
        </div>

        <Link
          href="/projects/new"
          data-testid="btn-new-project"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Novo Projeto</span>
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          testId="projects-empty-state"
          title="Nenhum projeto cadastrado."
          description="Registre seu primeiro projeto para organizar demandas agrupadas e acompanhar entregas."
          actionText="+ Criar Primeiro Projeto"
          actionHref="/projects/new"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="projects-grid">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col justify-between hover:border-slate-700 transition-colors" testId={`project-card-${project.id}`}>
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-400">
                      <FolderKanban className="h-4 w-4" />
                    </div>
                    <h2 className="text-base font-semibold text-white leading-tight">
                      <Link href={`/projects/${project.id}`} className="hover:text-blue-400 transition-colors">
                        {project.nome}
                      </Link>
                    </h2>
                  </div>
                  <Badge 
                    variant={project.status === 'ATIVO' ? 'success' : 'neutral'}
                    testId={`badge-status-${project.id}`}
                  >
                    {project.status}
                  </Badge>
                </div>

                <p className="mt-3 text-xs text-slate-400 line-clamp-2">
                  {project.descricao || 'Sem descrição informada.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1 text-slate-300">
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  <span>{project.totalDemandas} demanda(s)</span>
                </div>

                <Link
                  href={`/projects/${project.id}`}
                  data-testid={`btn-view-project-${project.id}`}
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  <span>Abrir</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
