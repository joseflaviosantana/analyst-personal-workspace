'use client';

import React from 'react';
import { FileText, Edit2, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface IntakeVerbatimCardProps {
  solicitacaoOriginal: string;
  onEditarOriginal?: () => void;
}

export function IntakeVerbatimCard({
  solicitacaoOriginal,
  onEditarOriginal,
}: IntakeVerbatimCardProps) {
  return (
    <Card className="p-5 border-slate-800 bg-slate-900/90 shadow-md space-y-3" data-testid="section-verbatim">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-300 tracking-wider">
            1. O CLIENTE PEDIU
          </span>
          <Badge variant="info" data-testid="badge-fato-bruto">
            PEDIDO ORIGINAL
          </Badge>
          <span className="text-xs text-slate-400 font-mono">
            ({solicitacaoOriginal.length} caracteres)
          </span>
        </div>

        {onEditarOriginal && (
          <button
            type="button"
            data-testid="btn-edit-raw-text"
            onClick={onEditarOriginal}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <Edit2 className="h-3 w-3" />
            <span>Editar Pedido</span>
          </button>
        )}
      </div>

      <div className="relative rounded-lg bg-slate-950/80 border border-slate-800 p-4 font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap break-words overflow-x-auto" data-testid="container-verbatim-text">
        {solicitacaoOriginal}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
        <ShieldAlert className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
        <span>
          Seu pedido original é preservado exatamente como você digitou, sem alterações ou resumos automáticos.
        </span>
      </div>
    </Card>
  );
}
