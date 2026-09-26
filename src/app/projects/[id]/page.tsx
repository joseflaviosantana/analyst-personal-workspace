import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit3, 
  PlusCircle, 
  Calendar, 
  Clock, 
  FileText, 
  ArrowRight,
  FolderKanban
} from 'lucide-react';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { GetProjectUseCase } from '@/core/use-cases/projects/get-project';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DemandStateBadge } from '@/components/ui/DemandStateBadge';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

interface ProjectDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { id } = await params;
  const projectRepo = new SqliteProjectRepository();
  const demandRepo = new SqliteDemandRepository();
  const getProject = new GetProjectUseCase(projectRepo, demandRepo);

  const data = await getProject.execute(id);

  if (!data) {
    notFound();
  }

  const { project, demands } = data;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Navegação Superior / Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            aria-label="Voltar para Projetos"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Projetos &gt;</span>
              <span className="text-xs text-slate-300 font-medium">{project.nome}</span>
            </div>
            <h1 data-testid="project-details-title" className="text-2xl font-bold tracking-tight text-white mt-0.5">
              {project.nome}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${project.id}/edit`}
            data-testid="btn-edit-project"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Editar Projeto</span>
          </Link>
          <Link
            href={`/demands/new?projectId=${project.id}`}
            data-testid="btn-new-demand-for-project"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Nova Demanda</span>
          </Link>
        </div>
      </div>

      {/* Cartão de Metadados e Informações do Projeto */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-950/80 border border-blue-800/60 text-blue-400">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status Operacional</p>
              <div className="mt-1">
                <Badge variant={project.status === 'ATIVO' ? 'success' : 'neutral'} testId="project-status-badge">
                  {project.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
            {project.data_inicio && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span>Início: {project.data_inicio}</span>
              </div>
            )}
            {project.data_conclusao_prevista && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span>Previsão: {project.data_conclusao_prevista}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-500" />
              <span>Atualizado: {new Date(project.atualizado_em).toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Contexto Estratégico &amp; Descrição
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line" data-testid="project-description">
            {project.descricao || 'Nenhuma descrição detalhada informada.'}
          </p>
        </div>
      </Card>

      {/* Lista de Demandas Vinculadas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Demandas Vinculadas ({demands.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Unidades operacionais de trabalho que compõem este projeto
            </p>
          </div>

          <Link
            href={`/demands/new?projectId=${project.id}`}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
          >
            <span>+ Adicionar Demanda</span>
          </Link>
        </div>

        {demands.length === 0 ? (
          <EmptyState
            testId="project-empty-demands"
            title="Este projeto ainda não possui demandas."
            description="Crie a primeira demanda vinculada a este projeto para iniciar o ciclo de vida analítico."
            actionText="+ Criar Primeira Demanda"
            actionHref={`/demands/new?projectId=${project.id}`}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3" data-testid="project-demands-list">
            {demands.map((demand) => (
              <Card 
                key={demand.id} 
                className="flex items-center justify-between p-4 hover:border-slate-700 transition-colors"
                testId={`demand-item-${demand.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      <Link href={`/demands/${demand.id}`} className="hover:text-blue-400 transition-colors">
                        {demand.titulo}
                      </Link>
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span>Atualizado em: {new Date(demand.atualizado_em).toLocaleString('pt-BR')}</span>
                      {demand.prazo_esperado && <span>• Prazo: {demand.prazo_esperado}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <DemandStateBadge estado={demand.estado} testId={`badge-demand-state-${demand.id}`} />
                  <Link
                    href={`/demands/${demand.id}`}
                    data-testid={`btn-open-workspace-${demand.id}`}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <span>Abrir Workspace</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
