'use client';

import React, { useState } from 'react';
import { X, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';
import { cadastrarMetricaAnaliticaAction } from '@/app/actions/modeling-actions';

interface CreateMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelo: ModeloAnaliticoCompleto;
  demandaId: string;
  onSuccess: (msg: string) => void;
}

export function CreateMetricModal({
  isOpen,
  onClose,
  modelo,
  demandaId,
  onSuccess,
}: CreateMetricModalProps) {
  const [nome, setNome] = useState('');
  const [formulaDeclarativa, setFormulaDeclarativa] = useState('SUM(');
  const [tipoAgregacao, setTipoAgregacao] = useState<TipoAgregacaoMetrica>(TipoAgregacaoMetrica.SOMA);
  const [tipoAditividade, setTipoAditividade] = useState<TipoAditividadeMetrica>(TipoAditividadeMetrica.TOTALMENTE_ADITIVA);
  const [unidadeMedida, setUnidadeMedida] = useState<UnidadeMedidaMetrica>(UnidadeMedidaMetrica.MOEDA);
  const [entidadeId, setEntidadeId] = useState<string>(modelo.entidades[0]?.id || '');
  const [descricao, setDescricao] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Assistência Inteligente ao Usuário: se escolher PERCENTUAL ou MEDIA, sugerir NAO_ADITIVA
  const handleAgregacaoChange = (newAgregacao: TipoAgregacaoMetrica) => {
    setTipoAgregacao(newAgregacao);
    if (newAgregacao === TipoAgregacaoMetrica.MEDIA) {
      setTipoAditividade(TipoAditividadeMetrica.NAO_ADITIVA);
    }
  };

  const handleUnidadeChange = (newUnidade: UnidadeMedidaMetrica) => {
    setUnidadeMedida(newUnidade);
    if (newUnidade === UnidadeMedidaMetrica.PERCENTUAL || newUnidade === UnidadeMedidaMetrica.INDICE) {
      setTipoAditividade(TipoAditividadeMetrica.NAO_ADITIVA);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim() || nome.length < 2) {
      setError('O nome da métrica deve ter ao menos 2 caracteres.');
      return;
    }

    if (!formulaDeclarativa.trim()) {
      setError('A fórmula declarativa é obrigatória.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await cadastrarMetricaAnaliticaAction(
        {
          modeloId: modelo.id,
          nome: nome.trim(),
          formulaDeclarativa: formulaDeclarativa.trim(),
          tipoAgregacao,
          tipoAditividade,
          unidadeMedida,
          entidadeId: entidadeId || null,
          descricao: descricao.trim() || undefined,
        },
        demandaId
      );

      if (!res.success) {
        setError(res.error || 'Falha ao cadastrar métrica analítica.');
      } else {
        onSuccess(`Métrica "${nome}" cadastrada com sucesso!`);
        setNome('');
        setDescricao('');
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao cadastrar métrica.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="create-metric-modal"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Cadastrar Métrica Analítica</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-950/70 border border-rose-800 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Nome da Métrica / KPI *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Faturamento Total, Ticket Médio"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              data-testid="input-metric-name"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Fórmula Declarativa Conceitual *
            </label>
            <input
              type="text"
              required
              value={formulaDeclarativa}
              onChange={(e) => setFormulaDeclarativa(e.target.value)}
              placeholder="Ex: SUM(vendas.valor_total)"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-cyan-300 focus:outline-none focus:border-emerald-500"
              data-testid="input-metric-formula"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Agregação *
              </label>
              <select
                value={tipoAgregacao}
                onChange={(e) => handleAgregacaoChange(e.target.value as TipoAgregacaoMetrica)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                data-testid="select-metric-aggregation"
              >
                <option value={TipoAgregacaoMetrica.SOMA}>SOMA</option>
                <option value={TipoAgregacaoMetrica.MEDIA}>MÉDIA</option>
                <option value={TipoAgregacaoMetrica.CONTAGEM}>CONTAGEM</option>
                <option value={TipoAgregacaoMetrica.CONTAGEM_DISTINTA}>CONTAGEM DISTINTA</option>
                <option value={TipoAgregacaoMetrica.MAXIMO}>MÁXIMO</option>
                <option value={TipoAgregacaoMetrica.MINIMO}>MÍNIMO</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Aditividade *
              </label>
              <select
                value={tipoAditividade}
                onChange={(e) => setTipoAditividade(e.target.value as TipoAditividadeMetrica)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                data-testid="select-metric-additivity"
              >
                <option value={TipoAditividadeMetrica.TOTALMENTE_ADITIVA}>TOTALMENTE ADITIVA</option>
                <option value={TipoAditividadeMetrica.SEMI_ADITIVA}>SEMI ADITIVA</option>
                <option value={TipoAditividadeMetrica.NAO_ADITIVA}>NÃO ADITIVA</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Unidade *
              </label>
              <select
                value={unidadeMedida}
                onChange={(e) => handleUnidadeChange(e.target.value as UnidadeMedidaMetrica)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                data-testid="select-metric-unit"
              >
                <option value={UnidadeMedidaMetrica.MOEDA}>MONETÁRIO / MOEDA (R$)</option>
                <option value={UnidadeMedidaMetrica.QUANTIDADE}>QUANTIDADE</option>
                <option value={UnidadeMedidaMetrica.PERCENTUAL}>PERCENTUAL (%)</option>
                <option value={UnidadeMedidaMetrica.INDICE}>ÍNDICE</option>
                <option value={UnidadeMedidaMetrica.TEMPO}>TEMPO</option>
                <option value={UnidadeMedidaMetrica.TEXTO}>TEXTO</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Entidade Vinculada (Opcional)
            </label>
            <select
              value={entidadeId}
              onChange={(e) => setEntidadeId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              data-testid="select-metric-entity"
            >
              <option value="">Global do Modelo</option>
              {modelo.entidades.map((ent) => (
                <option key={ent.id} value={ent.id}>
                  {ent.nome} ({ent.tipo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Descrição & Base de Reconciliação (Regra M-09)
            </label>
            <textarea
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Faturamento líquido consolidado. Base de reconciliação: ERP Financeiro - Relatório Oficial."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              data-testid="input-metric-description"
            />
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Mencionar a fonte ou base de conferência para atender à recomendação M-09.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="btn-submit-create-metric"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Cadastrando...' : 'Cadastrar Métrica'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
