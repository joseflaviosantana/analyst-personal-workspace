'use client';

import React, { useState } from 'react';
import { Database, Calendar, Clock, LayoutDashboard, TrendingUp, CheckCircle2, ChevronDown, ChevronUp, Info, GraduationCap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ResultadoAnaliseIntake } from '@/core/domain/intake/intake-types';

interface IntakeFactsSectionProps {
  fatos: ResultadoAnaliseIntake['fatos'];
}

export function IntakeFactsSection({ fatos }: IntakeFactsSectionProps) {
  const [showEntenderMelhor, setShowEntenderMelhor] = useState(false);
  const hasAtivos = fatos.ativosDadosMencionados.length > 0;
  const hasEntregaveis = fatos.entregaveisExplicitamenteSolicitados.length > 0;
  const hasIndicadores = fatos.indicadoresExplicitamenteMencionados.length > 0;

  return (
    <Card className="p-5 border-emerald-900/50 bg-slate-900/90 shadow-md space-y-4" data-testid="section-fatos">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-300 tracking-wider">
            2. 🟢 JÁ SABEMOS
          </span>
          <Badge variant="success" data-testid="badge-fatos-observados">
            O QUE FOI DECLARADO NO PEDIDO (Fatos Confirmados)
          </Badge>
          <span className="text-xs text-slate-400">Extraído diretamente do texto</span>
        </div>

        <button
          type="button"
          onClick={() => setShowEntenderMelhor(!showEntenderMelhor)}
          className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          <Info className="h-3.5 w-3.5" />
          <span>Entender melhor</span>
          {showEntenderMelhor ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {showEntenderMelhor && (
        <div className="rounded-lg bg-emerald-950/40 border border-emerald-800/50 p-3 space-y-2 text-xs text-slate-300 animate-in fade-in duration-200">
          <p>
            <strong>Por que já sabemos:</strong> Estas informações foram declaradas de forma explícita pelo cliente no pedido original. O sistema não fez suposições sobre elas.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/90 pt-1 border-t border-emerald-900/40">
            <GraduationCap className="h-3.5 w-3.5 flex-shrink-0" />
            <span>📘 Nome profissional: requisitos declarados de negócio e dimensões analíticas</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Ativos de Dados Mencionados */}
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Database className="h-4 w-4 text-emerald-400" />
            <span>Arquivos e bases informadas</span>
          </div>
          {hasAtivos ? (
            <ul className="space-y-1.5" data-testid="list-ativos-mencionados">
              {fatos.ativosDadosMencionados.map((ativo, idx) => (
                <li key={idx} className="flex items-center justify-between text-xs bg-slate-900/80 rounded px-2.5 py-1.5 border border-slate-800">
                  <span className="font-mono text-emerald-300 font-medium truncate max-w-[180px]">
                    {ativo.termoVerbatim}
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded uppercase">
                    {ativo.tipoDetectado}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">Nenhum arquivo ou base diretamente citado no pedido.</p>
          )}
        </div>

        {/* Período / Janela Temporal */}
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <span>Período de vendas informado</span>
          </div>
          {fatos.periodoJanelaTemporalMencionada ? (
            <div className="text-xs bg-slate-900/80 rounded p-2.5 border border-slate-800 space-y-1" data-testid="fato-periodo">
              <p className="font-mono text-emerald-300 font-medium">
                {fatos.periodoJanelaTemporalMencionada.termoVerbatim}
              </p>
              <p className="text-[11px] text-slate-400">
                {fatos.periodoJanelaTemporalMencionada.interpretacao}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Nenhum período de tempo informado no pedido.</p>
          )}
        </div>

        {/* Prazo Mencionado */}
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span>Data ou prazo informado</span>
          </div>
          {fatos.prazoMencionado ? (
            <div className="text-xs bg-slate-900/80 rounded p-2.5 border border-slate-800" data-testid="fato-prazo">
              <span className="font-mono text-emerald-300 font-medium">
                {fatos.prazoMencionado}
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Nenhum prazo ou data citada no pedido.</p>
          )}
        </div>

        {/* Entregáveis Solicitados */}
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-2 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <LayoutDashboard className="h-4 w-4 text-emerald-400" />
            <span>O que foi pedido para entregar</span>
          </div>
          {hasEntregaveis ? (
            <ul className="space-y-1.5" data-testid="list-entregaveis-fatos">
              {fatos.entregaveisExplicitamenteSolicitados.map((entregavel, idx) => (
                <li key={idx} className="text-xs bg-slate-900/80 rounded p-2 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-200 font-medium">{entregavel.nome}</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                    {entregavel.tipo}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">Nenhum formato de entrega especificado diretamente.</p>
          )}
        </div>

        {/* Indicadores / Métricas Mencionadas */}
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5 space-y-2 md:col-span-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span>Indicadores ou números citados</span>
          </div>
          {hasIndicadores ? (
            <div className="flex flex-wrap gap-2" data-testid="list-indicadores-fatos">
              {fatos.indicadoresExplicitamenteMencionados.map((ind, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-2.5 py-1 text-xs text-slate-200 border border-slate-800">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span>{ind.nome}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Nenhum número ou indicador diretamente citado no pedido.</p>
          )}
        </div>
      </div>
    </Card>
  );
}
