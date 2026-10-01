'use client';

/**
 * src/components/dashboard/CreateOrEditPaginaModal.tsx
 *
 * Modal Operacional de Gestão Manual de Página de Relatório
 * (Subgate 3.4D — Analyst Personal Workspace V1)
 *
 * Permite ao usuário cadastrar uma nova página do relatório Power BI
 * ou editar propriedades de uma página existente no modelo.
 */

import React, { useState } from 'react';
import { X, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PaginaRelatorio } from '@/core/domain/entities/pagina-relatorio';
import { PublicoAlvoPagina, ROTULOS_PUBLICO_ALVO_PAGINA } from '@/core/domain/enums/publico-alvo-pagina';
import { LayoutGridPagina, ROTULOS_LAYOUT_GRID_PAGINA } from '@/core/domain/enums/layout-grid-pagina';
import { criarPaginaRelatorioAction } from '@/app/actions/dashboard-actions';

interface CreateOrEditPaginaModalProps {
  isOpen: boolean;
  onClose: () => void;
  modeloPowerBiId: string;
  demandaId: string;
  proximaOrdem?: number;
  paginaEmEdicao?: PaginaRelatorio | null;
  onSuccess: () => void;
}

export function CreateOrEditPaginaModal({
  isOpen,
  onClose,
  modeloPowerBiId,
  demandaId,
  proximaOrdem = 1,
  paginaEmEdicao,
  onSuccess,
}: CreateOrEditPaginaModalProps) {
  const isEditing = Boolean(paginaEmEdicao);

  const [nome, setNome] = useState(paginaEmEdicao?.nome ?? '');
  const [ordem, setOrdem] = useState<number>(paginaEmEdicao?.ordem ?? proximaOrdem);
  const [publicoAlvo, setPublicoAlvo] = useState<PublicoAlvoPagina>(
    paginaEmEdicao?.publico_alvo ?? PublicoAlvoPagina.EXECUTIVO
  );
  const [layoutGrid, setLayoutGrid] = useState<LayoutGridPagina>(
    paginaEmEdicao?.layout_grid ?? LayoutGridPagina.PADRAO_16_9
  );
  const [objetivoAnalitico, setObjetivoAnalitico] = useState(
    paginaEmEdicao?.objetivo_analitico ?? ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError('O nome da página é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await criarPaginaRelatorioAction(
        {
          modeloPowerBiId,
          nome: nome.trim(),
          ordem: Number(ordem) || 1,
          publicoAlvo,
          layoutGrid,
          objetivoAnalitico: objetivoAnalitico.trim() || undefined,
        },
        demandaId
      );

      if (!res.success) {
        setError(res.error || 'Falha ao salvar a página do relatório.');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao salvar a página.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="create-edit-pagina-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <Card className="w-full max-w-lg bg-slate-900 border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {isEditing ? 'Editar Página do Relatório' : 'Nova Página do Relatório'}
              </h2>
              <p className="text-xs text-slate-400">
                Defina o público-alvo, objetivo analítico e padrão de layout da página
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-modal"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div
              data-testid="modal-error-banner"
              className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nome da Página *</label>
              <input
                type="text"
                data-testid="input-nome-pagina"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Visão Executiva de Vendas"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Ordem na Aba</label>
              <input
                type="number"
                min={1}
                max={99}
                data-testid="input-ordem-pagina"
                value={ordem}
                onChange={(e) => setOrdem(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Público-Alvo</label>
              <select
                data-testid="select-publico-alvo"
                value={publicoAlvo}
                onChange={(e) => setPublicoAlvo(e.target.value as PublicoAlvoPagina)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {Object.values(PublicoAlvoPagina).map((val) => (
                  <option key={val} value={val}>
                    {ROTULOS_PUBLICO_ALVO_PAGINA[val]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Layout do Grid</label>
              <select
                data-testid="select-layout-grid"
                value={layoutGrid}
                onChange={(e) => setLayoutGrid(e.target.value as LayoutGridPagina)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {Object.values(LayoutGridPagina).map((val) => (
                  <option key={val} value={val}>
                    {ROTULOS_LAYOUT_GRID_PAGINA[val]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Objetivo Analítico / Narrativa
            </label>
            <textarea
              rows={3}
              data-testid="input-objetivo-analitico"
              value={objetivoAnalitico}
              onChange={(e) => setObjetivoAnalitico(e.target.value)}
              placeholder="Descreva a finalidade desta página, as decisões que ela subsidia e as perguntas norteadoras."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="btn-submit-pagina"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isEditing ? 'Salvar Alterações' : 'Criar Página'}</span>
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
