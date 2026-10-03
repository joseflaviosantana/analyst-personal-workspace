'use client';

import React, { useState } from 'react';
import {
  ListChecks,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Clock,
  Ban,
  Tag,
  Loader2,
  X,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { RequisitoDemanda } from '@/core/domain/entities/requisito-demanda';
import {
  CategoriaRequisito,
  ROTULOS_CATEGORIA_REQUISITO,
} from '@/core/domain/enums/categoria-requisito';
import {
  StatusRequisito,
  ROTULOS_STATUS_REQUISITO,
} from '@/core/domain/enums/status-requisito';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  criarRequisitoAction,
  atualizarRequisitoAction,
  removerRequisitoAction,
} from '@/app/actions/requirements-actions';

interface RequirementsListProps {
  demandaId: string;
  requisitos: RequisitoDemanda[];
  isReadOnly: boolean;
  onRefresh: () => void;
}

export function RequirementsList({
  demandaId,
  requisitos,
  isReadOnly,
  onRefresh,
}: RequirementsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequisito, setEditingRequisito] = useState<RequisitoDemanda | null>(null);

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<CategoriaRequisito>(CategoriaRequisito.METRICA_KPI);
  const [prioridade, setPrioridade] = useState<'OBRIGATORIO' | 'DESEJAVEL'>('OBRIGATORIO');
  const [status, setStatus] = useState<StatusRequisito>(StatusRequisito.IDENTIFICADO);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCategoria, setFilterCategoria] = useState<string>('ALL');

  const handleOpenAdd = () => {
    setEditingRequisito(null);
    setTitulo('');
    setDescricao('');
    setCategoria(CategoriaRequisito.METRICA_KPI);
    setPrioridade('OBRIGATORIO');
    setStatus(StatusRequisito.IDENTIFICADO);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (req: RequisitoDemanda) => {
    setEditingRequisito(req);
    setTitulo(req.titulo);
    setDescricao(req.descricao || '');
    setCategoria(req.categoria);
    setPrioridade(req.prioridade);
    setStatus(req.status);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || titulo.trim().length < 3) {
      setError('Título do requisito deve conter ao menos 3 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingRequisito) {
        const res = await atualizarRequisitoAction({
          id: editingRequisito.id,
          demandaId,
          titulo,
          descricao,
          categoria,
          prioridade,
          status,
        });
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await criarRequisitoAction({
          demandaId,
          titulo,
          descricao,
          categoria,
          prioridade,
        });
        if (!res.success) throw new Error(res.error);
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar requisito.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este requisito?')) return;
    try {
      const res = await removerRequisitoAction(id, demandaId);
      if (!res.success) alert(res.error);
      else onRefresh();
    } catch (err: any) {
      alert(err?.message || 'Erro ao remover requisito.');
    }
  };

  const handleToggleStatus = async (req: RequisitoDemanda) => {
    if (isReadOnly) return;
    // Ciclo de status: IDENTIFICADO -> CLARIFICADO -> ATENDIDO -> DESCARTADO
    let nextStatus: StatusRequisito;
    if (req.status === StatusRequisito.IDENTIFICADO) nextStatus = StatusRequisito.CLARIFICADO;
    else if (req.status === StatusRequisito.CLARIFICADO) nextStatus = StatusRequisito.ATENDIDO;
    else if (req.status === StatusRequisito.ATENDIDO) nextStatus = StatusRequisito.DESCARTADO;
    else nextStatus = StatusRequisito.IDENTIFICADO;

    try {
      const res = await atualizarRequisitoAction({
        id: req.id,
        demandaId,
        status: nextStatus,
      });
      if (res.success) onRefresh();
    } catch (err: any) {
      console.error(err);
    }
  };

  const propostasIntakePendentes = requisitos.filter(
    (r) => r.origem === 'INTAKE' && r.status === StatusRequisito.IDENTIFICADO
  );

  const [isProcessingTriage, setIsProcessingTriage] = useState(false);

  const handleValidarRequisito = async (reqId: string) => {
    if (isReadOnly) return;
    setIsProcessingTriage(true);
    try {
      const res = await atualizarRequisitoAction({
        id: reqId,
        demandaId,
        status: StatusRequisito.CLARIFICADO,
      });
      if (res.success) {
        onRefresh();
      } else {
        alert(res.error || 'Erro ao validar requisito.');
      }
    } catch (err: any) {
      alert(err?.message || 'Erro ao validar requisito.');
    } finally {
      setIsProcessingTriage(false);
    }
  };

  const handleDescartarRequisito = async (reqId: string) => {
    if (isReadOnly) return;
    setIsProcessingTriage(true);
    try {
      const res = await atualizarRequisitoAction({
        id: reqId,
        demandaId,
        status: StatusRequisito.DESCARTADO,
      });
      if (res.success) {
        onRefresh();
      } else {
        alert(res.error || 'Erro ao descartar requisito.');
      }
    } catch (err: any) {
      alert(err?.message || 'Erro ao descartar requisito.');
    } finally {
      setIsProcessingTriage(false);
    }
  };

  const handleRestaurarRequisito = async (reqId: string) => {
    if (isReadOnly) return;
    setIsProcessingTriage(true);
    try {
      const res = await atualizarRequisitoAction({
        id: reqId,
        demandaId,
        status: StatusRequisito.CLARIFICADO,
      });
      if (res.success) {
        onRefresh();
      } else {
        alert(res.error || 'Erro ao restaurar requisito.');
      }
    } catch (err: any) {
      alert(err?.message || 'Erro ao restaurar requisito.');
    } finally {
      setIsProcessingTriage(false);
    }
  };

  const handleValidarTodasPropostas = async () => {
    if (isReadOnly || propostasIntakePendentes.length === 0) return;
    setIsProcessingTriage(true);
    try {
      for (const req of propostasIntakePendentes) {
        await atualizarRequisitoAction({
          id: req.id,
          demandaId,
          status: StatusRequisito.CLARIFICADO,
        });
      }
      onRefresh();
    } catch (err: any) {
      alert(err?.message || 'Erro ao validar propostas em lote.');
    } finally {
      setIsProcessingTriage(false);
    }
  };

  const filteredRequisitos = requisitos.filter((r) =>
    filterCategoria === 'ALL' ? true : r.categoria === filterCategoria
  );

  const getStatusBadge = (st: StatusRequisito) => {
    switch (st) {
      case StatusRequisito.IDENTIFICADO:
        return (
          <Badge variant="warning" className="text-[10px]">
            <Clock className="h-3 w-3 mr-1 inline" />
            {ROTULOS_STATUS_REQUISITO[st]}
          </Badge>
        );
      case StatusRequisito.CLARIFICADO:
        return (
          <Badge variant="info" className="text-[10px]">
            <CheckCircle className="h-3 w-3 mr-1 inline" />
            {ROTULOS_STATUS_REQUISITO[st]}
          </Badge>
        );
      case StatusRequisito.ATENDIDO:
        return (
          <Badge variant="success" className="text-[10px]">
            <CheckCircle className="h-3 w-3 mr-1 inline" />
            {ROTULOS_STATUS_REQUISITO[st]}
          </Badge>
        );
      case StatusRequisito.DESCARTADO:
        return (
          <Badge variant="disabled" className="text-[10px]">
            <Ban className="h-3 w-3 mr-1 inline" />
            {ROTULOS_STATUS_REQUISITO[st]}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4" data-testid="requirements-list-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-emerald-400" />
            <span>Requisitos Analíticos Mapeados</span>
            <span className="text-xs font-normal text-slate-400">
              ({requisitos.length})
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Métricas, dimensões, regras de negócio e restrições acordadas formalmente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filtro por categoria */}
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">Todas as categorias</option>
            {Object.entries(ROTULOS_CATEGORIA_REQUISITO).map(([catKey, label]) => (
              <option key={catKey} value={catKey}>
                {label}
              </option>
            ))}
          </select>

          {!isReadOnly && (
            <button
              type="button"
              onClick={handleOpenAdd}
              data-testid="btn-add-requirement"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Novo Requisito</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner de Triagem Assistida do Intake */}
      {!isReadOnly && propostasIntakePendentes.length > 0 && (
        <div
          data-testid="intake-triagem-banner"
          className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-200">
                Triagem Assistida do Intake:{' '}
                <span className="font-semibold text-white">
                  {propostasIntakePendentes.length} proposta(s)
                </span>{' '}
                aguardando deliberação humana.
              </p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Revise cada requisito sugerido para validar no escopo ou descartar preservando o histórico de rastreabilidade.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleValidarTodasPropostas}
            disabled={isProcessingTriage}
            data-testid="btn-validate-all-intake"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shrink-0 self-start sm:self-auto shadow-sm"
          >
            {isProcessingTriage ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5" />
            )}
            <span>Validar Todas as Propostas</span>
          </button>
        </div>
      )}

      {/* Lista de Requisitos */}
      {filteredRequisitos.length === 0 ? (
        <Card className="p-8 text-center bg-slate-900/40 border-dashed border-slate-800">
          <ListChecks className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-400">
            Nenhum requisito cadastrado nesta categoria.
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Mapeie métricas fundamentais, granularidades e regras para direcionar o pipeline.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="requirements-cards-grid">
          {filteredRequisitos.map((req) => (
            <Card
              key={req.id}
              className="p-4 bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              data-testid={`requirement-card-${req.id}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-200 block">
                      {req.titulo}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="neutral" className="text-[10px]">
                        <Tag className="h-2.5 w-2.5 mr-1 inline" />
                        {ROTULOS_CATEGORIA_REQUISITO[req.categoria]}
                      </Badge>
                      {req.origem === 'INTAKE' && (
                        <Badge variant="info" className="text-[10px]" testId={`badge-origem-intake-${req.id}`}>
                          Proposta do Intake
                        </Badge>
                      )}
                      <Badge
                        variant={req.prioridade === 'OBRIGATORIO' ? 'warning' : 'neutral'}
                        className="text-[10px]"
                      >
                        {req.prioridade}
                      </Badge>
                      {getStatusBadge(req.status)}
                    </div>
                  </div>

                  {!isReadOnly && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(req)}
                        title="Editar requisito"
                        className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(req.id)}
                        title="Remover requisito"
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {req.descricao && (
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {req.descricao}
                  </p>
                )}
              </div>

              {!isReadOnly && (
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Origem: {req.origem === 'INTAKE' ? 'Entrada Inteligente' : req.origem}</span>

                  <div className="flex items-center gap-2">
                    {req.origem === 'INTAKE' && req.status === StatusRequisito.IDENTIFICADO ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleValidarRequisito(req.id)}
                          disabled={isProcessingTriage}
                          data-testid={`btn-validate-intake-${req.id}`}
                          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Validar</span>
                        </button>
                        <span className="text-slate-700">|</span>
                        <button
                          type="button"
                          onClick={() => handleDescartarRequisito(req.id)}
                          disabled={isProcessingTriage}
                          data-testid={`btn-discard-intake-${req.id}`}
                          className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-400 font-medium transition-colors disabled:opacity-50"
                        >
                          <Ban className="h-3 w-3" />
                          <span>Descartar</span>
                        </button>
                      </div>
                    ) : req.status === StatusRequisito.DESCARTADO ? (
                      <button
                        type="button"
                        onClick={() => handleRestaurarRequisito(req.id)}
                        disabled={isProcessingTriage}
                        data-testid={`btn-restore-intake-${req.id}`}
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
                      >
                        <Undo2 className="h-3 w-3" />
                        <span>Restaurar</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(req)}
                        data-testid={`btn-toggle-status-${req.id}`}
                        className="hover:text-blue-400 text-slate-300 font-medium transition-colors"
                      >
                        <span>Avançar Status</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal Adicionar/Editar Requisito */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-emerald-400" />
                <span>{editingRequisito ? 'Editar Requisito' : 'Novo Requisito Analítico'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título do Requisito *
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  placeholder="Ex.: Receita Líquida Mensal com Dedução de Devoluções"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição / Regra Detalhada
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  placeholder="Especificação de fórmula, campos esperados ou condição de negócio..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as CategoriaRequisito)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    {Object.entries(ROTULOS_CATEGORIA_REQUISITO).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={prioridade}
                    onChange={(e) =>
                      setPrioridade(e.target.value as 'OBRIGATORIO' | 'DESEJAVEL')
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="OBRIGATORIO">Obrigatório</option>
                    <option value="DESEJAVEL">Desejável</option>
                  </select>
                </div>
              </div>

              {editingRequisito && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusRequisito)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    {Object.entries(ROTULOS_STATUS_REQUISITO).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Salvar Requisito</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
