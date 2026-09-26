'use client';

import React from 'react';
import { Clock, User, ArrowRight, ShieldCheck, PauseCircle, PlayCircle, XCircle } from 'lucide-react';
import { TrilhaAuditoria } from '@/core/domain/entities/trilha-auditoria';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { DemandStateBadge } from '@/components/ui/DemandStateBadge';
import { Card } from '@/components/ui/Card';

interface TimelineViewProps {
  timeline: TrilhaAuditoria[];
}

export function TimelineView({ timeline }: TimelineViewProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <Card className="p-6 text-center text-slate-500 text-xs" testId="demand-workflow-timeline">
        <Clock className="h-6 w-6 mx-auto mb-2 text-slate-600" />
        <p>Nenhuma transição registrada até o momento na trilha de auditoria.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6" testId="demand-workflow-timeline">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <Clock className="h-4 w-4 text-blue-400" />
          <span>Trilha de Auditoria & Linha do Tempo do Workflow</span>
        </div>
        <span className="text-[11px] text-slate-400" data-testid="timeline-count">
          {timeline.length} {timeline.length === 1 ? 'evento registrado' : 'eventos registrados'}
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {timeline.map((evento, index) => {
          let estadoAnterior: EstadoDemanda | string | null = null;
          let estadoNovo: EstadoDemanda | string | null = null;

          try {
            if (evento.dados_anteriores) {
              const parsed = JSON.parse(evento.dados_anteriores);
              estadoAnterior = parsed.estado ?? null;
            }
            if (evento.dados_novos) {
              const parsed = JSON.parse(evento.dados_novos);
              estadoNovo = parsed.estado ?? null;
            }
          } catch {
            // ignore JSON parse errors
          }

          const isSuspensao = estadoNovo === EstadoDemanda.SUSPENSA;
          const isCancelamento = estadoNovo === EstadoDemanda.CANCELADA;
          const isRetomada = estadoAnterior === EstadoDemanda.SUSPENSA;
          const isCriacao = evento.tipo_evento === 'CRIACAO';

          return (
            <div 
              key={evento.id} 
              data-testid={`timeline-event-${index}`}
              className="relative space-y-1.5"
            >
              {/* Dot icon na linha do tempo */}
              <div 
                className="absolute -left-6 mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 border border-slate-700"
                aria-hidden="true"
              >
                {isCriacao && <ShieldCheck className="h-2.5 w-2.5 text-blue-400" />}
                {isSuspensao && <PauseCircle className="h-2.5 w-2.5 text-amber-400" />}
                {isRetomada && <PlayCircle className="h-2.5 w-2.5 text-emerald-400" />}
                {isCancelamento && <XCircle className="h-2.5 w-2.5 text-rose-400" />}
                {!isCriacao && !isSuspensao && !isRetomada && !isCancelamento && (
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                )}
              </div>

              {/* Cabeçalho do evento */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-200">
                  {isCriacao && 'Criação da Demanda'}
                  {isSuspensao && 'Suspensão da Demanda'}
                  {isRetomada && 'Retomada de Demanda'}
                  {isCancelamento && 'Cancelamento da Demanda'}
                  {!isCriacao && !isSuspensao && !isRetomada && !isCancelamento && 'Transição de Estado'}
                </span>

                <span className="text-slate-500">•</span>

                <span className="text-slate-400" data-testid={`timeline-time-${index}`}>
                  {new Date(evento.timestamp).toLocaleString('pt-BR')}
                </span>

                <span className="text-slate-500">•</span>

                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <User className="h-3 w-3 text-slate-500" />
                  <span>{evento.autor_tipo === 'HUMANO' ? 'Analista Humano' : 'Copilot IA'}</span>
                </span>
              </div>

              {/* Transição de Estados */}
              {estadoNovo && (
                <div className="flex items-center gap-2 pt-0.5">
                  {estadoAnterior && (
                    <>
                      <DemandStateBadge estado={estadoAnterior} showDot={false} className="text-[11px] py-0 px-2" />
                      <ArrowRight className="h-3 w-3 text-slate-600" />
                    </>
                  )}
                  <DemandStateBadge estado={estadoNovo} className="text-[11px] py-0 px-2" />
                </div>
              )}

              {/* Justificativa */}
              {evento.justificativa && (
                <div 
                  data-testid={`timeline-justification-${index}`}
                  className="mt-1 rounded-md bg-slate-950/80 border border-slate-800/80 p-2.5 text-xs text-slate-300 italic"
                >
                  &ldquo;{evento.justificativa}&rdquo;
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
