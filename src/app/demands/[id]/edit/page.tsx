import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { isEstadoTerminal } from '@/core/domain/enums/estado-demanda';
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

  // Demandas em estados terminais (concluídas ou canceladas) possuem histórico congelado: não permite edição
  if (isEstadoTerminal(demand.estado)) {
    redirect(`/demands/${id}`);
  }

  return <EditDemandForm demand={demand} />;
}
