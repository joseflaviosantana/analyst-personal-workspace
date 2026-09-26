import React from 'react';
import { notFound } from 'next/navigation';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { EditDemandForm } from './edit-form';

export const dynamic = 'force-dynamic';

interface EditDemandPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDemandPage({ params }: EditDemandPageProps) {
  const { id } = await params;
  const demandRepo = new SqliteDemandRepository();
  const demand = await demandRepo.findById(id);

  if (!demand) {
    notFound();
  }

  return <EditDemandForm demand={demand} />;
}
