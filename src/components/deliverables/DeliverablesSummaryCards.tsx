'use client';

import React from 'react';
import { Package, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatusEntregavel } from '@/core/domain/enums/status-entregavel';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';
import { EntregavelDemanda } from '@/core/domain/entities/entregavel-demanda';
import { ResultadoAvaliacaoValidacao } from '@/core/domain/rules/validation-rules-evaluator';

interface DeliverablesSummaryCardsProps {
  entregaveis: EntregavelDemanda[];
  avaliacao?: ResultadoAvaliacaoValidacao | null;
}

export function DeliverablesSummaryCards({
  entregaveis,
  avaliacao,
}: DeliverablesSummaryCardsProps) {
  const total = entregaveis.length;
  const obrigatorios = entregaveis.filter((e) => e.obrigatorio).length;
  const disponiveis = entregaveis.filter(
    (e) => e.status === StatusEntregavel.DISPONIVEL || e.status === StatusEntregavel.HOMOLOGADO
  ).length;
  const aceitos = entregaveis.filter(
    (e) => e.aceite_status === StatusAceiteEntrega.ACEITO
  ).length;
  const rejeitadosOuAjustes = entregaveis.filter(
    (e) =>
      e.aceite_status === StatusAceiteEntrega.REJEITADO ||
      e.aceite_status === StatusAceiteEntrega.AJUSTES_SOLICITADOS
  ).length;

  const v03Ok = avaliacao?.pronto_para_entrega ?? false;
  const v04Ok = avaliacao?.pronto_para_conclusao ?? false;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="deliverables-summary-cards">
      {/* 1. Total de Entregáveis */}
      <Card className="p-4 border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total de Entregáveis</span>
          <Package className="h-4 w-4 text-blue-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white" data-testid="metric-total-entregaveis">
            {total}
          </span>
          <span className="text-xs text-slate-500">
            ({obrigatorios} obrigatório{obrigatorios === 1 ? '' : 's'})
          </span>
        </div>
      </Card>

      {/* 2. Disponíveis para Entrega */}
      <Card className="p-4 border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Disponibilizados</span>
          <Clock className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-indigo-400" data-testid="metric-disponibilizados">
            {disponiveis}
          </span>
          <span className="text-xs text-slate-500">prontos para envio</span>
        </div>
      </Card>

      {/* 3. Aceites Formalizados */}
      <Card className="p-4 border-emerald-900/40 bg-emerald-950/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-emerald-300">Aceites Concluídos</span>
          <CheckCircle className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-400" data-testid="metric-aceitos">
            {aceitos}
          </span>
          {rejeitadosOuAjustes > 0 && (
            <span className="text-xs text-amber-400">
              ({rejeitadosOuAjustes} pendência{rejeitadosOuAjustes === 1 ? '' : 's'})
            </span>
          )}
        </div>
      </Card>

      {/* 4. Prontidão de Workflow (V-03 / V-04) */}
      <Card className="p-4 border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Governança (V-03 / V-04)</span>
          <ShieldCheck className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="mt-2 flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">V-03 (Pronta Entrega):</span>
            <span
              className={`font-semibold ${v03Ok ? 'text-emerald-400' : 'text-amber-400'}`}
              data-testid="status-regra-v03"
            >
              {v03Ok ? 'Apto' : 'Pendente'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">V-04 (Conclusão):</span>
            <span
              className={`font-semibold ${v04Ok ? 'text-emerald-400' : 'text-amber-400'}`}
              data-testid="status-regra-v04"
            >
              {v04Ok ? 'Apto' : 'Bloqueado'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
