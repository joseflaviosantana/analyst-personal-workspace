'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit3, 
  Calendar, 
  Clock, 
  FolderKanban, 
  ShieldAlert, 
  Target,
  FileCode2,
  Info
} from 'lucide-react';
import { clsx } from 'clsx';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface DemandWorkspaceViewProps {
  demand: DemandaComProjeto;
}

export function DemandWorkspaceView({ demand }: DemandWorkspaceViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | string>('overview');

  const tabs = [
    { id: 'overview', label: '1. Visão Geral', ready: true },
    { id: 'requirements', label: '2. Requisitos', ready: false },
    { id: 'data', label: '3. Ativos de Dados', ready: false },
    { id: 'quality', label: '4. Qualidade', ready: false },
    { id: 'transformation', label: '5. Preparação M', ready: false },
    { id: 'planning', label: '6. Planejamento & KPIs', ready: false },
    { id: 'powerbi', label: '7. Power BI & DAX', ready: false },
    { id: 'findings', label: '8. Evidências', ready: false },
    { id: 'validation', label: '9. Validação', ready: false },
    { id: 'deliverables', label: '10. Entregáveis', ready: false },
    { id: 'dossier', label: '11. Dossiê & Portfólio', ready: false },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Sticky Context Header do Workspace */}
      <div 
        data-testid="demand-sticky-header"
        className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md sticky top-0 z-20"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${demand.projeto_id}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              aria-label="Voltar para Projeto"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Link href="/projects" className="hover:text-slate-300">Projetos</Link>
                <span>&gt;</span>
                <Link href={`/projects/${demand.projeto_id}`} className="hover:text-slate-300">
                  {demand.projetoNome}
                </Link>
                <span>&gt;</span>
                <span className="text-slate-200 font-medium truncate max-w-xs">{demand.titulo}</span>
              </div>
              <h1 data-testid="demand-workspace-title" className="text-xl font-bold tracking-tight text-white mt-0.5">
                {demand.titulo}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Estado:</span>
              <Badge variant="default" testId="demand-workspace-state">
                {demand.estado}
              </Badge>
            </div>

            <Link
              href={`/demands/${demand.id}/edit`}
              data-testid="btn-edit-demand"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Editar Demanda</span>
            </Link>
          </div>
        </div>

        {/* Faixa Compacta de Metadados */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <FolderKanban className="h-3.5 w-3.5 text-slate-500" />
            <span>Projeto: <strong className="text-slate-300">{demand.projetoNome}</strong></span>
          </div>
          {demand.prazo_esperado && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>Prazo Esperado: <strong className="text-slate-300">{demand.prazo_esperado}</strong></span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>Atualizado: {new Date(demand.atualizado_em).toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Navegação Contextual por 11 Abas da UX Normativa */}
      <div className="border-b border-slate-800 overflow-x-auto pb-px" data-testid="demand-workspace-tabs">
        <nav className="flex space-x-1" aria-label="Abas do Workspace da Demanda">
          {tabs.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              data-testid={`tab-nav-${t.id}`}
              className={clsx(
                'whitespace-nowrap px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5',
                activeTab === t.id
                  ? 'border-blue-500 bg-blue-950/30 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              )}
            >
              <span>{t.label}</span>
              {!t.ready && (
                <span className="text-[10px] text-slate-500 font-normal">
                  (Em breve)
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      {activeTab === 'overview' ? (
        <div className="space-y-6" data-testid="tab-content-overview">
          {/* Solicitação Bruta Original */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <FileCode2 className="h-4 w-4 text-blue-400" />
              <span>Solicitação Bruta Original do Cliente</span>
            </div>
            <div 
              data-testid="demand-raw-request"
              className="rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed"
            >
              {demand.solicitacao_bruta}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Preservação integral da mensagem de entrada recebida para fins de conformidade e auditoria.
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contexto de Negócio */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Info className="h-4 w-4 text-cyan-400" />
                <span>Contexto de Negócio</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line" data-testid="demand-context-text">
                {demand.contexto || 'Nenhum contexto específico informado no momento do cadastro.'}
              </p>
            </Card>

            {/* Objetivo Inicial Declarado */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Target className="h-4 w-4 text-emerald-400" />
                <span>Objetivo Inicial Declarado</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line" data-testid="demand-objective-text">
                {demand.objetivo_inicial || 'Nenhum objetivo formal registrado.'}
              </p>
            </Card>
          </div>

          {/* Restrições Declaradas */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>Restrições Declaradas</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed" data-testid="demand-restrictions-text">
              {demand.restricoes_declaradas || 'Nenhuma restrição declarada para esta demanda.'}
            </p>
          </Card>
        </div>
      ) : (
        /* Áreas Futuras da UX indicadas com honestidade técnica */
        <Card className="p-12 text-center" data-testid="tab-future-placeholder">
          <Info className="h-8 w-8 text-blue-400 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-white">
            Espaço Metodológico Preparado
          </h2>
          <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
            Esta área corresponde à etapa futura do workflow analítico (V1) e será implementada no Bloco correspondente do roadmap técnico.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <span>Retornar para Visão Geral</span>
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
