'use client';

/**
 * src/components/dashboard/CreateOrEditVisualModal.tsx
 *
 * Modal Operacional de Gestão Manual de Visual do Dashboard
 * (Subgate 3.4D — Analyst Personal Workspace V1)
 *
 * Permite ao usuário cadastrar manualmente um visual no relatório,
 * associando-o a uma página, medidas DAX, posição de layout e justificativa DataViz.
 */

import React, { useState } from 'react';
import { X, BarChart3, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PaginaRelatorio } from '@/core/domain/entities/pagina-relatorio';
import { MedidaDax } from '@/core/domain/entities/medida-dax';
import { TipoVisualDashboard, ROTULOS_TIPO_VISUAL_DASHBOARD } from '@/core/domain/enums/tipo-visual-dashboard';
import { PosicaoLayoutVisual, ROTULOS_POSICAO_LAYOUT_VISUAL } from '@/core/domain/enums/posicao-layout-visual';
import { criarVisualDashboardAction } from '@/app/actions/dashboard-actions';
import { obterConceitoDataViz } from '@/core/domain/dashboard-design/dataviz-pedagogy';

interface CreateOrEditVisualModalProps {
  isOpen: boolean;
  onClose: () => void;
  demandaId: string;
  paginas: PaginaRelatorio[];
  medidas: MedidaDax[];
  paginaPreSelecionadaId?: string | null;
  onSuccess: () => void;
}

export function CreateOrEditVisualModal({
  isOpen,
  onClose,
  demandaId,
  paginas,
  medidas,
  paginaPreSelecionadaId,
  onSuccess,
}: CreateOrEditVisualModalProps) {
  const [paginaId, setPaginaId] = useState(
    paginaPreSelecionadaId || paginas[0]?.id || ''
  );
  const [titulo, setTitulo] = useState('');
  const [tipoVisual, setTipoVisual] = useState<TipoVisualDashboard>(
    TipoVisualDashboard.GRAFICO_BARRAS
  );
  const [posicaoLayout, setPosicaoLayout] = useState<PosicaoLayoutVisual>(
    PosicaoLayoutVisual.CENTRAL_TENDENCIAS
  );
  const [medidasIds, setMedidasIds] = useState<string[]>([]);
  const [justificativa, setJustificativa] = useState('');
  const [ordem, setOrdem] = useState<number>(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const conceito = obterConceitoDataViz(tipoVisual);

  const toggleMedida = (medidaId: string) => {
    setMedidasIds((prev) =>
      prev.includes(medidaId) ? prev.filter((id) => id !== medidaId) : [...prev, medidaId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!paginaId) {
      setError('Selecione uma página para o visual.');
      return;
    }

    if (!titulo.trim()) {
      setError('O título do visual é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await criarVisualDashboardAction(
        {
          paginaId,
          titulo: titulo.trim(),
          tipoVisual,
          posicaoLayout,
          medidasUtilizadasIds: medidasIds,
          atributosUtilizadosIds: [],
          justificativaDataviz: justificativa.trim() || conceito.oQueE,
          ordem: Number(ordem) || 1,
        },
        demandaId
      );

      if (!res.success) {
        setError(res.error || 'Falha ao salvar o visual do dashboard.');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao salvar o visual.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="create-edit-visual-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <Card className="w-full max-w-xl bg-slate-900 border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Novo Visual no Dashboard</h2>
              <p className="text-xs text-slate-400">
                Configure o elemento gráfico com fundamentação analítica DataViz
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

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div
              data-testid="modal-error-banner"
              className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Página de Destino *</label>
              <select
                data-testid="select-pagina-visual"
                value={paginaId}
                onChange={(e) => setPaginaId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                required
              >
                {paginas.map((pag) => (
                  <option key={pag.id} value={pag.id}>
                    {pag.ordem}. {pag.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Posição no Grid</label>
              <select
                data-testid="select-posicao-layout"
                value={posicaoLayout}
                onChange={(e) => setPosicaoLayout(e.target.value as PosicaoLayoutVisual)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {Object.values(PosicaoLayoutVisual).map((pos) => (
                  <option key={pos} value={pos}>
                    {ROTULOS_POSICAO_LAYOUT_VISUAL[pos]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Título do Visual *</label>
              <input
                type="text"
                data-testid="input-titulo-visual"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Evolução da Receita Líquida por Mês"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tipo de Visual</label>
              <select
                data-testid="select-tipo-visual"
                value={tipoVisual}
                onChange={(e) => setTipoVisual(e.target.value as TipoVisualDashboard)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {Object.values(TipoVisualDashboard).map((val) => (
                  <option key={val} value={val}>
                    {ROTULOS_TIPO_VISUAL_DASHBOARD[val]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dica DataViz em tempo real */}
          <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/40 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-purple-300">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Aprenda Enquanto Trabalha: {conceito.nomeLegivel}</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">{conceito.oQueE}</p>
            <p className="text-purple-300/80 text-[11px] italic">💡 {conceito.dicaProfissional}</p>
          </div>

          {/* Medidas DAX Utilizadas */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Medidas DAX Vinculadas
            </label>
            {medidas.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Nenhuma medida DAX cadastrada. O visual pode ser registrado para planejamento.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto p-2 rounded-lg bg-slate-950 border border-slate-800">
                {medidas.map((medida) => {
                  const isChecked = medidasIds.includes(medida.id);
                  return (
                    <label
                      key={medida.id}
                      className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs transition-colors ${
                        isChecked ? 'bg-purple-950/60 text-purple-200' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleMedida(medida.id)}
                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="truncate">{medida.nome}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Justificativa de Data Visualization (DataViz)
            </label>
            <textarea
              rows={2}
              data-testid="input-justificativa-dataviz"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Explique por que este visual é a melhor escolha analítica para responder à pergunta de negócio."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
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
              data-testid="btn-submit-visual"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Adicionar Visual</span>
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
