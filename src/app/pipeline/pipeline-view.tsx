'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Layers, 
  ArrowRight, 
  PauseCircle, 
  PlayCircle, 
  XCircle, 
  FolderKanban, 
  Filter, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { Projeto } from '@/core/domain/entities/projeto';
import { 
  EstadoDemanda, 
  ESTADOS_ORDENADOS_SEQUENCIAIS, 
  ROTULOS_ESTADO_DEMANDA,
  normalizarEstadoDemanda 
} from '@/core/domain/enums/estado-demanda';
import { DemandStateBadge } from '@/components/ui/DemandStateBadge';
import { SuspendDemandModal } from '@/components/workflow/SuspendDemandModal';
import { ResumeDemandModal } from '@/components/workflow/ResumeDemandModal';
import { CancelDemandModal } from '@/components/workflow/CancelDemandModal';
import { advanceDemandAction } from '@/app/actions/workflow-actions';

interface PipelineViewProps {
  initialDemands: DemandaComProjeto[];
  projects: Projeto[];
}

export function PipelineView({ initialDemands, projects }: PipelineViewProps) {
  const router = useRouter();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'suspensas' | 'canceladas'>('none');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  // Estados dos modais de governança
  const [suspendModalDemand, setSuspendModalDemand] = useState<DemandaComProjeto | null>(null);
  const [resumeModalDemand, setResumeModalDemand] = useState<DemandaComProjeto | null>(null);
  const [cancelModalDemand, setCancelModalDemand] = useState<DemandaComProjeto | null>(null);

  // Filtragem por projeto
  const filteredDemands = selectedProjectId === 'all'
    ? initialDemands
    : initialDemands.filter((d) => d.projeto_id === selectedProjectId);

  // Separação entre esteira normal e estados excepcionais
  const demandasNormais = filteredDemands.filter((d) => {
    const estado = normalizarEstadoDemanda(d.estado);
    return estado !== EstadoDemanda.SUSPENSA && estado !== EstadoDemanda.CANCELADA;
  });

  const demandasSuspensas = filteredDemands.filter(
    (d) => normalizarEstadoDemanda(d.estado) === EstadoDemanda.SUSPENSA
  );

  const demandasCanceladas = filteredDemands.filter(
    (d) => normalizarEstadoDemanda(d.estado) === EstadoDemanda.CANCELADA
  );

  const handleAdvance = async (demand: DemandaComProjeto) => {
    setAdvancingId(demand.id);
    setFeedback(null);
    try {
      const res = await advanceDemandAction(demand.id);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Erro ao avançar estado.' });
      } else {
        setFeedback({ 
          type: 'success', 
          message: `Demanda "${demand.titulo}" avançada com sucesso.` 
        });
        router.refresh();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro inesperado.' });
    } finally {
      setAdvancingId(null);
    }
  };

  const handleActionSuccess = (msg: string) => {
    setFeedback({ type: 'success', message: msg });
    router.refresh();
  };

  return (
    <div className="space-y-6" data-testid="pipeline-view">
      {/* Top Header do Pipeline */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-blue-400" />
            <h1 data-testid="pipeline-title" className="text-2xl font-bold tracking-tight text-white">
              Pipeline Kanban (Esteira de Fluxo)
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Governança visual das 8 etapas sequenciais normais e prateleira de estados excepcionais
          </p>
        </div>

        {/* Filtros e Contadores de Estados Excepcionais */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por Projeto */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              data-testid="filter-pipeline-project"
              className="bg-transparent text-slate-200 focus:outline-none text-xs"
            >
              <option value="all" className="bg-slate-900 text-slate-200">
                Todos os Projetos ({initialDemands.length})
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Botões de Gavetas Excepcionais (CF-22 / UX Spec 6.1) */}
          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === 'suspensas' ? 'none' : 'suspensas')}
            data-testid="btn-shelf-suspensas"
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
              activeDrawer === 'suspensas'
                ? 'border-amber-500 bg-amber-950/60 text-amber-300'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-amber-700/60 hover:text-amber-400'
            )}
          >
            <PauseCircle className="h-3.5 w-3.5 text-amber-400" />
            <span>Suspensas</span>
            <span className="rounded-full bg-amber-950/80 px-1.5 py-0.2 text-[10px] font-bold text-amber-300" data-testid="count-suspensas">
              {demandasSuspensas.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === 'canceladas' ? 'none' : 'canceladas')}
            data-testid="btn-shelf-canceladas"
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
              activeDrawer === 'canceladas'
                ? 'border-rose-500 bg-rose-950/60 text-rose-300'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-rose-700/60 hover:text-rose-400'
            )}
          >
            <XCircle className="h-3.5 w-3.5 text-rose-400" />
            <span>Canceladas</span>
            <span className="rounded-full bg-rose-950/80 px-1.5 py-0.2 text-[10px] font-bold text-rose-300" data-testid="count-canceladas">
              {demandasCanceladas.length}
            </span>
          </button>
        </div>
      </div>

      {/* Alerta de Feedback de Sucesso/Erro */}
      {feedback && (
        <div 
          data-testid="pipeline-feedback-alert"
          className={clsx(
            'flex items-center justify-between rounded-lg p-3 text-xs border transition-all',
            feedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/70 border-rose-800 text-rose-300'
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button 
            type="button"
            onClick={() => setFeedback(null)}
            className="hover:opacity-75"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Gaveta de Demandas Suspensas (Drawer Superior) */}
      {activeDrawer === 'suspensas' && (
        <div 
          data-testid="shelf-suspensas-panel"
          className="rounded-xl border border-amber-800/60 bg-amber-950/20 p-5 shadow-lg space-y-4"
        >
          <div className="flex items-center justify-between border-b border-amber-900/50 pb-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <PauseCircle className="h-4 w-4" />
              <span>Estante de Demandas Suspensas ({demandasSuspensas.length})</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveDrawer('none')}
              className="text-amber-400/70 hover:text-amber-300 text-xs flex items-center gap-1"
            >
              <span>Fechar</span>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {demandasSuspensas.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Nenhuma demanda suspensa no momento.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {demandasSuspensas.map((d) => (
                <div 
                  key={d.id}
                  data-testid={`card-suspensa-${d.id}`}
                  className="rounded-lg border border-amber-900/60 bg-slate-900 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/demands/${d.id}`}
                      className="text-sm font-semibold text-white hover:text-amber-400 transition-colors line-clamp-1"
                    >
                      {d.titulo}
                    </Link>
                    <DemandStateBadge estado={d.estado} />
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <FolderKanban className="h-3 w-3 text-slate-500" />
                    <span>{d.projetoNome}</span>
                  </div>

                  {d.estado_anterior && (
                    <div className="text-[11px] text-amber-300/90 rounded bg-amber-950/60 border border-amber-900/50 p-2">
                      <span>Pausada na etapa: </span>
                      <strong>{ROTULOS_ESTADO_DEMANDA[normalizarEstadoDemanda(d.estado_anterior)]}</strong>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setResumeModalDemand(d)}
                      data-testid={`btn-resume-demand-${d.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                    >
                      <PlayCircle className="h-3.5 w-3.5" />
                      <span>Retomar Demanda</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCancelModalDemand(d)}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gaveta de Demandas Canceladas */}
      {activeDrawer === 'canceladas' && (
        <div 
          data-testid="shelf-canceladas-panel"
          className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-5 shadow-lg space-y-4"
        >
          <div className="flex items-center justify-between border-b border-rose-900/50 pb-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <XCircle className="h-4 w-4" />
              <span>Demandas Canceladas — Histórico Congelado ({demandasCanceladas.length})</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveDrawer('none')}
              className="text-rose-400/70 hover:text-rose-300 text-xs flex items-center gap-1"
            >
              <span>Fechar</span>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {demandasCanceladas.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Nenhuma demanda cancelada.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {demandasCanceladas.map((d) => (
                <div 
                  key={d.id}
                  data-testid={`card-cancelada-${d.id}`}
                  className="rounded-lg border border-rose-950 bg-slate-900 p-4 space-y-3 opacity-80"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/demands/${d.id}`}
                      className="text-sm font-semibold text-white hover:text-rose-400 transition-colors line-clamp-1"
                    >
                      {d.titulo}
                    </Link>
                    <DemandStateBadge estado={d.estado} />
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <FolderKanban className="h-3 w-3 text-slate-500" />
                    <span>{d.projetoNome}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-500">
                    <span>Encerrada em: {d.data_conclusao ? new Date(d.data_conclusao).toLocaleDateString('pt-BR') : '-'}</span>
                    <Link href={`/demands/${d.id}`} className="hover:text-slate-300">
                      Ver Histórico
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grade / Esteira das 8 Colunas Sequenciais Normais do Pipeline */}
      <div 
        data-testid="kanban-grid"
        className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-w-full"
      >
        {ESTADOS_ORDENADOS_SEQUENCIAIS.map((estado, idx) => {
          const demandasDaColuna = demandasNormais.filter(
            (d) => normalizarEstadoDemanda(d.estado) === estado
          );
          const isUltimaColuna = idx === ESTADOS_ORDENADOS_SEQUENCIAIS.length - 1;

          return (
            <div
              key={estado}
              data-testid={`kanban-column-${estado}`}
              className="flex flex-col w-[280px] min-w-[280px] max-w-[280px] shrink-0 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 shadow-md"
            >
              {/* Cabeçalho da Coluna */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-200 truncate" title={ROTULOS_ESTADO_DEMANDA[estado]}>
                    {ROTULOS_ESTADO_DEMANDA[estado]}
                  </span>
                </div>
                <span 
                  data-testid={`count-col-${estado}`}
                  className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold text-slate-400 shrink-0"
                >
                  {demandasDaColuna.length}
                </span>
              </div>

              {/* Cartões da Coluna */}
              <div className="flex-1 space-y-3 min-h-[300px]">
                {demandasDaColuna.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-800 text-center p-3">
                    <span className="text-[11px] text-slate-500">Sem demandas nesta fase</span>
                  </div>
                ) : (
                  demandasDaColuna.map((demanda) => {
                    const isAdvancing = advancingId === demanda.id;

                    return (
                      <div
                        key={demanda.id}
                        data-testid={`demand-card-${demanda.id}`}
                        className="group rounded-lg border border-slate-800 bg-slate-950 p-3.5 shadow-sm hover:border-slate-700 hover:shadow-md transition-all space-y-3 overflow-hidden"
                      >
                        <div className="space-y-1 min-w-0">
                          <Link
                            href={`/demands/${demanda.id}`}
                            data-testid={`card-title-${demanda.id}`}
                            className="block text-xs font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug break-words"
                          >
                            {demanda.titulo}
                          </Link>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 min-w-0">
                            <FolderKanban className="h-3 w-3 text-slate-500 shrink-0" />
                            <span className="truncate">{demanda.projetoNome}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(demanda.atualizado_em).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        {/* Ações Rápidas no Cartão */}
                        <div className="flex items-center justify-between pt-1 gap-1.5 min-w-0">
                          {!isUltimaColuna && (
                            <button
                              type="button"
                              onClick={() => handleAdvance(demanda)}
                              disabled={isAdvancing}
                              data-testid={`btn-advance-card-${demanda.id}`}
                              className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 rounded bg-blue-600/80 px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors truncate"
                              title={`Avançar para ${ROTULOS_ESTADO_DEMANDA[ESTADOS_ORDENADOS_SEQUENCIAIS[idx + 1]]}`}
                            >
                              <span className="truncate">{isAdvancing ? '...' : 'Avançar'}</span>
                              <ArrowRight className="h-3 w-3 shrink-0" />
                            </button>
                          )}

                          {isUltimaColuna && (
                            <div className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 rounded bg-emerald-950/60 border border-emerald-800/60 px-2 py-1 text-[11px] font-medium text-emerald-400 truncate">
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">Concluída</span>
                            </div>
                          )}

                          {/* Menu / Botões de Suspensão e Cancelamento */}
                          {!isUltimaColuna && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setSuspendModalDemand(demanda)}
                                data-testid={`btn-suspend-card-${demanda.id}`}
                                className="rounded p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                                title="Suspender Demanda"
                              >
                                <PauseCircle className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setCancelModalDemand(demanda)}
                                data-testid={`btn-cancel-card-${demanda.id}`}
                                className="rounded p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                                title="Cancelar Demanda"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modais de Governança de Transições */}
      {suspendModalDemand && (
        <SuspendDemandModal
          isOpen={true}
          onClose={() => setSuspendModalDemand(null)}
          demandaId={suspendModalDemand.id}
          demandaTitulo={suspendModalDemand.titulo}
          onSuccess={() => handleActionSuccess(`Demanda "${suspendModalDemand.titulo}" suspensa com sucesso.`)}
        />
      )}

      {resumeModalDemand && (
        <ResumeDemandModal
          isOpen={true}
          onClose={() => setResumeModalDemand(null)}
          demandaId={resumeModalDemand.id}
          demandaTitulo={resumeModalDemand.titulo}
          estadoAnterior={resumeModalDemand.estado_anterior}
          onSuccess={() => handleActionSuccess(`Demanda "${resumeModalDemand.titulo}" retomada com sucesso.`)}
        />
      )}

      {cancelModalDemand && (
        <CancelDemandModal
          isOpen={true}
          onClose={() => setCancelModalDemand(null)}
          demandaId={cancelModalDemand.id}
          demandaTitulo={cancelModalDemand.titulo}
          onSuccess={() => handleActionSuccess(`Demanda "${cancelModalDemand.titulo}" cancelada com sucesso.`)}
        />
      )}
    </div>
  );
}
