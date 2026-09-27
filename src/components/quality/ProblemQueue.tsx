'use client';

import React, { useState, useMemo } from 'react';
import {
  Filter,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ListOrdered,
  FileQuestion
} from 'lucide-react';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { ProblemCard } from './ProblemCard';
import { EmptyState } from '@/components/ui/EmptyState';

interface ProblemQueueProps {
  problems: ProblemaQualidade[];
  onDeliberate: (problem: ProblemaQualidade) => void;
  onUpdateStatus: (problem: ProblemaQualidade) => void;
  onOpenManualModal: () => void;
  isReadOnly?: boolean;
}

type SeveridadeFiltro = 'TODOS' | 'PENDENTE' | 'CRITICA_ALTA' | 'MEDIA_BAIXA' | 'RESOLVIDOS';
type OrigemFiltro = 'TODAS' | 'AUTOMATICA' | 'REGRA' | 'MANUAL';

export function ProblemQueue({
  problems,
  onDeliberate,
  onUpdateStatus,
  onOpenManualModal,
  isReadOnly = false,
}: ProblemQueueProps) {
  const [severidadeFiltro, setSeveridadeFiltro] = useState<SeveridadeFiltro>('TODOS');
  const [origemFiltro, setOrigemFiltro] = useState<OrigemFiltro>('TODAS');
  const [termoBusca, setTermoBusca] = useState('');

  // Contagens para badges de filtro rápido
  const contagens = useMemo(() => {
    return {
      todos: problems.length,
      pendentes: problems.filter((p) => p.severidade === SeveridadeProblema.PENDENTE).length,
      criticosAltos: problems.filter(
        (p) =>
          (p.severidade === SeveridadeProblema.CRITICA || p.severidade === SeveridadeProblema.ALTA) &&
          p.status !== StatusProblemaQualidade.TRATADO &&
          p.status !== StatusProblemaQualidade.ACEITO_COMO_RESTRICAO
      ).length,
      mediosBaixos: problems.filter(
        (p) =>
          (p.severidade === SeveridadeProblema.MEDIA || p.severidade === SeveridadeProblema.BAIXA) &&
          p.status !== StatusProblemaQualidade.TRATADO &&
          p.status !== StatusProblemaQualidade.ACEITO_COMO_RESTRICAO
      ).length,
      resolvidos: problems.filter(
        (p) =>
          p.status === StatusProblemaQualidade.TRATADO ||
          p.status === StatusProblemaQualidade.ACEITO_COMO_RESTRICAO
      ).length,
    };
  }, [problems]);

  // Filtragem e ordenação por prioridade normativa de decisão
  const problemasFiltrados = useMemo(() => {
    return problems
      .filter((p) => {
        // Filtro por Severidade / Situação
        if (severidadeFiltro === 'PENDENTE' && p.severidade !== SeveridadeProblema.PENDENTE) {
          return false;
        }
        if (severidadeFiltro === 'CRITICA_ALTA') {
          const isCriticaOuAlta = p.severidade === SeveridadeProblema.CRITICA || p.severidade === SeveridadeProblema.ALTA;
          const isAberto = p.status !== StatusProblemaQualidade.TRATADO && p.status !== StatusProblemaQualidade.ACEITO_COMO_RESTRICAO;
          if (!isCriticaOuAlta || !isAberto) return false;
        }
        if (severidadeFiltro === 'MEDIA_BAIXA') {
          const isMediaOuBaixa = p.severidade === SeveridadeProblema.MEDIA || p.severidade === SeveridadeProblema.BAIXA;
          const isAberto = p.status !== StatusProblemaQualidade.TRATADO && p.status !== StatusProblemaQualidade.ACEITO_COMO_RESTRICAO;
          if (!isMediaOuBaixa || !isAberto) return false;
        }
        if (severidadeFiltro === 'RESOLVIDOS') {
          const isResolvido = p.status === StatusProblemaQualidade.TRATADO || p.status === StatusProblemaQualidade.ACEITO_COMO_RESTRICAO;
          if (!isResolvido) return false;
        }

        // Filtro por Origem
        if (origemFiltro === 'AUTOMATICA' && (p.origem_deteccao !== 'AUTOMATICA' || p.regra_id)) {
          return false;
        }
        if (origemFiltro === 'REGRA' && !p.regra_id) {
          return false;
        }
        if (origemFiltro === 'MANUAL' && p.origem_deteccao !== 'MANUAL') {
          return false;
        }

        // Busca textual
        if (termoBusca.trim()) {
          const termo = termoBusca.toLowerCase();
          const matchTitulo = p.titulo.toLowerCase().includes(termo);
          const matchDescricao = p.descricao.toLowerCase().includes(termo);
          const matchColuna = p.coluna_afetada?.toLowerCase().includes(termo) ?? false;
          const matchTabela = p.tabela_afetada.toLowerCase().includes(termo);
          if (!matchTitulo && !matchDescricao && !matchColuna && !matchTabela) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Ordem 1: PENDENTE tem prioridade absoluta no topo
        if (a.severidade === SeveridadeProblema.PENDENTE && b.severidade !== SeveridadeProblema.PENDENTE) return -1;
        if (b.severidade === SeveridadeProblema.PENDENTE && a.severidade !== SeveridadeProblema.PENDENTE) return 1;

        // Ordem 2: Itens resolvidos vão para o final
        const aResolvido = a.status === StatusProblemaQualidade.TRATADO || a.status === StatusProblemaQualidade.ACEITO_COMO_RESTRICAO;
        const bResolvido = b.status === StatusProblemaQualidade.TRATADO || b.status === StatusProblemaQualidade.ACEITO_COMO_RESTRICAO;
        if (aResolvido && !bResolvido) return 1;
        if (!aResolvido && bResolvido) return -1;

        // Ordem 3: Severidade hierárquica (CRITICA > ALTA > MEDIA > BAIXA)
        const pesoSeveridade: Record<SeveridadeProblema, number> = {
          [SeveridadeProblema.PENDENTE]: 5,
          [SeveridadeProblema.CRITICA]: 4,
          [SeveridadeProblema.ALTA]: 3,
          [SeveridadeProblema.MEDIA]: 2,
          [SeveridadeProblema.BAIXA]: 1,
        };

        const pesoA = pesoSeveridade[a.severidade] || 0;
        const pesoB = pesoSeveridade[b.severidade] || 0;
        if (pesoA !== pesoB) return pesoB - pesoA;

        // Ordem 4: Total de linhas afetadas decrescente
        return (b.total_linhas_afetadas || 0) - (a.total_linhas_afetadas || 0);
      });
  }, [problems, severidadeFiltro, origemFiltro, termoBusca]);

  return (
    <div className="space-y-4" data-testid="problem-queue-container">
      {/* Barra de Ferramentas, Filtros e Ações */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              Fila de Anomalias e Problemas de Qualidade ({problems.length})
            </h2>
          </div>

          {/* Botão de Registro Manual de Anomalia */}
          <button
            type="button"
            onClick={onOpenManualModal}
            disabled={isReadOnly}
            data-testid="btn-open-manual-problem-modal"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition-colors self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5 text-blue-400" />
            <span>Registrar Anomalia Manual</span>
          </button>
        </div>

        {/* Linha de Filtros Rápidos de Situação */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setSeveridadeFiltro('TODOS')}
            data-testid="filter-status-todos"
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              severidadeFiltro === 'TODOS'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Todos ({contagens.todos})
          </button>

          <button
            type="button"
            onClick={() => setSeveridadeFiltro('PENDENTE')}
            data-testid="filter-status-pendentes"
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              severidadeFiltro === 'PENDENTE'
                ? 'bg-amber-600 text-slate-950 font-bold'
                : contagens.pendentes > 0
                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60 hover:bg-amber-900/60'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            Pendentes de Decisão ({contagens.pendentes})
          </button>

          <button
            type="button"
            onClick={() => setSeveridadeFiltro('CRITICA_ALTA')}
            data-testid="filter-status-criticos"
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              severidadeFiltro === 'CRITICA_ALTA'
                ? 'bg-rose-700 text-white'
                : contagens.criticosAltos > 0
                ? 'bg-rose-950/60 text-rose-300 border border-rose-900/60 hover:bg-rose-900/60'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            Críticos e Altos ({contagens.criticosAltos})
          </button>

          <button
            type="button"
            onClick={() => setSeveridadeFiltro('MEDIA_BAIXA')}
            data-testid="filter-status-medios"
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              severidadeFiltro === 'MEDIA_BAIXA'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            Médios e Baixos ({contagens.mediosBaixos})
          </button>

          <button
            type="button"
            onClick={() => setSeveridadeFiltro('RESOLVIDOS')}
            data-testid="filter-status-resolvidos"
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              severidadeFiltro === 'RESOLVIDOS'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            Tratados / Resolvidos ({contagens.resolvidos})
          </button>
        </div>

        {/* Linha de Busca Textual e Filtro de Origem */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-800/60">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por título, coluna ou descrição..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              data-testid="input-search-problems"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[11px] text-slate-400 whitespace-nowrap">Origem:</span>
            <select
              aria-label="Filtrar por Origem da Anomalia"
              value={origemFiltro}
              onChange={(e) => setOrigemFiltro(e.target.value as OrigemFiltro)}
              data-testid="select-filter-origem"
              className="rounded-lg bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="TODAS">Todas as Origens</option>
              <option value="AUTOMATICA">Scanner Automático (V1–V7)</option>
              <option value="REGRA">Regras de Negócio (R1–R5)</option>
              <option value="MANUAL">Declarado Manualmente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Cards da Fila */}
      {problemasFiltrados.length > 0 ? (
        <div className="space-y-3" data-testid="problem-card-list">
          {problemasFiltrados.map((problem) => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              onDeliberate={onDeliberate}
              onUpdateStatus={onUpdateStatus}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={problems.length === 0 ? "Nenhum problema de qualidade detectado" : "Nenhum problema encontrado para os filtros ativos"}
          description={
            problems.length === 0
              ? "O ativo foi inspecionado e não possui nenhuma inconsistência estrutural ou regra violada."
              : "Tente redefinir os filtros de severidade ou o termo de busca para visualizar outros itens."
          }
          testId="empty-state-problem-queue"
        />
      )}
    </div>
  );
}
