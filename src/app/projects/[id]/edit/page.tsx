import React from 'react';
import { notFound } from 'next/navigation';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { EditProjectForm } from './edit-form';

export const dynamic = 'force-dynamic';

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;
  const projectRepo = new SqliteProjectRepository();
  const project = await projectRepo.findById(id);

  if (!project) {
    notFound();
  }

  const totalDemandas = await projectRepo.countDemands(id);

  return <EditProjectForm project={project} totalDemandas={totalDemandas} />;
}
