'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, Scale } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface ValidationSummaryCardsProps {
  totalValidacoes: number;
  totalObrigatorias: number;
  totalAprovadas: number;
  totalDivergentes: number;
  totalPendentesReteste: number;
}

export function ValidationSummaryCards({
  totalValidacoes,
  totalObrigatorias,
  totalAprovadas,
  totalDivergentes,
  totalPendentesReteste,
}: ValidationSummaryCardsProps) {
  const taxaConformidade = totalValidacoes > 0
    ? Math.round((totalAprovadas / totalValidacoes) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="validation-summary-cards">
      {/* Total de Checks */}
      <Card className="p-4 border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total de Checks</span>
          <Scale className="h-4 w-4 text-blue-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white" data-testid="metric-total-validacoes">
            {totalValidacoes}
          </span>
          <span className="text-xs text-slate-500">
            ({totalObrigatorias} obrigatório{totalObrigatorias === 1 ? '' : 's'})
          </span>
        </div>
      </Card>

      {/* Aprovados */}
      <Card className="p-4 border-emerald-900/40 bg-emerald-950/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-emerald-300">Aprovados</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-400" data-testid="metric-total-aprovadas">
            {totalAprovadas}
          </span>
          <span className="text-xs text-emerald-500/80">em conformidade</span>
        </div>
      </Card>

      {/* Divergentes / Rejeitados */}
      <Card className="p-4 border-amber-900/40 bg-amber-950/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-amber-300">Divergentes / Desvios</span>
          <AlertTriangle className="h-4 w-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-400" data-testid="metric-total-divergentes">
            {totalDivergentes}
          </span>
          <span className="text-xs text-amber-500/80">requer atenção</span>
        </div>
      </Card>

      {/* Conformidade Geral */}
      <Card className="p-4 border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Taxa de Conformidade</span>
          <Clock className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-cyan-400" data-testid="metric-taxa-conformidade">
            {taxaConformidade}%
          </span>
          {totalPendentesReteste > 0 && (
            <span className="text-[11px] text-slate-400">
              ({totalPendentesReteste} pendente{totalPendentesReteste === 1 ? '' : 's'})
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
