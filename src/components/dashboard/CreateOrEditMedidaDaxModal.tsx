'use client';

/**
 * src/components/dashboard/CreateOrEditMedidaDaxModal.tsx
 *
 * Modal de Criação e Edição de Medidas DAX (Subgate 3.4C)
 *
 * Recursos:
 * - Vínculo com Métricas Homologadas da Aba 6 com autopreenchimento de nomes e regras;
 * - Editor DAX monoespaçado integrado com análise determinística em tempo real;
 * - Configuração de tabela hospedeira e formato de exibição;
 * - Suporte à criação de novas medidas e edição de medidas existentes;
 * - 100% auditável e integrado com Server Actions.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  Link2,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { MedidaDax } from '@/core/domain/entities/medida-dax';
import { MetricaAnalitica } from '@/core/domain/entities/metrica-analitica';
import {
  CategoriaMedidaDax,
  ROTULOS_CATEGORIA_MEDIDA_DAX,
} from '@/core/domain/enums/categoria-medida-dax';
import {
  criarMedidaDaxAction,
  atualizarMedidaDaxAction,
} from '@/app/actions/dashboard-actions';
import { DaxEditor } from './DaxEditor';

interface CreateOrEditMedidaDaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  modeloPowerBiId: string;
  demandaId: string;
  metricasHomologadas: MetricaAnalitica[];
  medidaEmEdicao?: MedidaDax | null;
  metricaPreSelecionadaId?: string | null;
  onSuccess: () => void;
}

export function CreateOrEditMedidaDaxModal({
  isOpen,
  onClose,
  modeloPowerBiId,
  demandaId,
  metricasHomologadas = [],
  medidaEmEdicao,
  metricaPreSelecionadaId,
  onSuccess,
}: CreateOrEditMedidaDaxModalProps) {
  const isEditing = Boolean(medidaEmEdicao);

  const [nome, setNome] = useState('');
  const [metricaAnaliticaId, setMetricaAnaliticaId] = useState('');
  const [tabelaHospedeira, setTabelaHospedeira] = useState('_Medidas');
  const [categoriaDax, setCategoriaDax] = useState<CategoriaMedidaDax>(
    CategoriaMedidaDax.AGREGACAO_SIMPLES
  );
  const [formatoString, setFormatoString] = useState('R$ #,##0.00');
  const [descricao, setDescricao] = useState('');
  const [expressaoDax, setExpressaoDax] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Autopreenchimento inteligente ao selecionar métrica homologada
  const handleSelectMetrica = (id: string) => {
    setMetricaAnaliticaId(id);
    if (!id) return;

    const metrica = metricasHomologadas.find((m) => m.id === id);
    if (metrica) {
      if (!nome || nome === 'Nova Medida') {
        setNome(metrica.nome);
      }
      if (!descricao && metrica.descricao) {
        setDescricao(metrica.descricao);
      }
      if (!expressaoDax) {
        // Sugestão inicial baseada no tipo de agregação
        const tipoAgreg = (metrica.tipo_agregacao || 'SOMA').toUpperCase();
        if (tipoAgreg === 'SOMA') {
          setExpressaoDax(`SUM(fVendas[${metrica.nome.replace(/\s+/g, '')}])`);
          setCategoriaDax(CategoriaMedidaDax.AGREGACAO_SIMPLES);
        } else if (tipoAgreg === 'MEDIA') {
          setExpressaoDax(`AVERAGE(fVendas[${metrica.nome.replace(/\s+/g, '')}])`);
          setCategoriaDax(CategoriaMedidaDax.AGREGACAO_SIMPLES);
        } else if (tipoAgreg === 'CONTAGEM' || tipoAgreg === 'CONTAGEM_DISTINTA') {
          setExpressaoDax(`DISTINCTCOUNT(fVendas[${metrica.nome.replace(/\s+/g, '')}])`);
          setCategoriaDax(CategoriaMedidaDax.AGREGACAO_SIMPLES);
        }
      }
    }
  };

  useEffect(() => {
    if (medidaEmEdicao) {
      setNome(medidaEmEdicao.nome);
      setMetricaAnaliticaId(medidaEmEdicao.metrica_analitica_id ?? '');
      setTabelaHospedeira(medidaEmEdicao.tabela_hospedeira);
      setCategoriaDax(medidaEmEdicao.categoria_dax);
      setFormatoString(medidaEmEdicao.formato_string ?? '');
      setDescricao(medidaEmEdicao.descricao ?? '');
      setExpressaoDax(medidaEmEdicao.expressao_dax);
    } else {
      setNome('');
      setTabelaHospedeira('_Medidas');
      setCategoriaDax(CategoriaMedidaDax.AGREGACAO_SIMPLES);
      setFormatoString('R$ #,##0.00');
      setDescricao('');
      setExpressaoDax('');

      if (metricaPreSelecionadaId) {
        handleSelectMetrica(metricaPreSelecionadaId);
      } else {
        setMetricaAnaliticaId('');
      }
    }
    setError(null);
  }, [medidaEmEdicao, isOpen, metricaPreSelecionadaId]);

  if (!isOpen) return null;

  const selectedMetricaNome = metricasHomologadas.find((m) => m.id === metricaAnaliticaId)?.nome;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('O nome da medida é obrigatório.');
      return;
    }
    if (!expressaoDax.trim()) {
      setError('A expressão DAX da medida é obrigatória.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && medidaEmEdicao) {
        const res = await atualizarMedidaDaxAction(
          {
            id: medidaEmEdicao.id,
            nome: nome.trim(),
            metricaAnaliticaId: metricaAnaliticaId ? metricaAnaliticaId : null,
            tabelaHospedeira: tabelaHospedeira.trim() || '_Medidas',
            categoriaDax,
            formatoString: formatoString.trim() || null,
            descricao: descricao.trim() || null,
            expressaoDax: expressaoDax.trim(),
          },
          demandaId
        );

        if (!res.success) {
          setError(res.error || 'Falha ao atualizar medida DAX.');
        } else {
          onSuccess();
          onClose();
        }
      } else {
        const res = await criarMedidaDaxAction(
          {
            modeloPowerBiId,
            nome: nome.trim(),
            metricaAnaliticaId: metricaAnaliticaId ? metricaAnaliticaId : null,
            tabelaHospedeira: tabelaHospedeira.trim() || '_Medidas',
            categoriaDax,
            formatoString: formatoString.trim() || null,
            descricao: descricao.trim() || null,
            expressaoDax: expressaoDax.trim(),
          },
          demandaId
        );

        if (!res.success) {
          setError(res.error || 'Falha ao cadastrar medida DAX.');
        } else {
          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao salvar medida DAX.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      data-testid="create-edit-medida-dax-modal"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho do Modal */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? 'Editar Medida DAX' : 'Nova Medida DAX'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEditing
                  ? 'Atualize a fórmula, formato e metadados da medida selecionada'
                  : 'Cadastre a fórmula de cálculo vinculada às métricas de negócio'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div
            data-testid="modal-error-alert"
            className="rounded-lg bg-rose-950/60 border border-rose-800/80 p-3 flex items-start gap-2.5 text-xs text-rose-300"
          >
            <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. Vínculo com Métrica Analítica Homologada */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Métrica Analítica Homologada Vinculada (Linhagem Semântica)
            </label>
            <div className="relative">
              <select
                value={metricaAnaliticaId}
                onChange={(e) => handleSelectMetrica(e.target.value)}
                data-testid="select-metrica-homologada"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Nenhuma (Medida Técnica / Auxiliar)</option>
                {metricasHomologadas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} ({m.tipo_agregacao || 'Métrica'} — {m.unidade_medida || 'Unidade'})
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Vincular a uma métrica da modelagem satisfaz as regras D-02 e D-03 de governança analítica.
            </span>
          </div>

          {/* 2. Nome da Medida e Tabela Hospedeira */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Nome da Medida <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Total Vendas Líquidas"
                data-testid="input-nome-medida"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Tabela Hospedeira <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={tabelaHospedeira}
                onChange={(e) => setTabelaHospedeira(e.target.value)}
                placeholder="_Medidas"
                data-testid="input-tabela-hospedeira"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 3. Categoria DAX e Formato String */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Categoria do Padrão DAX
              </label>
              <select
                value={categoriaDax}
                onChange={(e) => setCategoriaDax(e.target.value as CategoriaMedidaDax)}
                data-testid="select-categoria-dax"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {Object.entries(ROTULOS_CATEGORIA_MEDIDA_DAX).map(([cat, rotulo]) => (
                  <option key={cat} value={cat}>
                    {rotulo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Formato de Exibição (formatString)
              </label>
              <input
                type="text"
                value={formatoString}
                onChange={(e) => setFormatoString(e.target.value)}
                placeholder="R$ #,##0.00 ou #,##0 ou 0.0%"
                data-testid="input-formato-string"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 4. Descrição Funcional */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Descrição Funcional / Regra de Negócio
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Explique o objetivo do cálculo para o usuário e para o catálogo de dados"
              data-testid="input-descricao-funcional"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* 5. Editor Profissional de Expressão DAX */}
          <div className="pt-1">
            <DaxEditor
              value={expressaoDax}
              onChange={setExpressaoDax}
              nomeMedida={nome}
              tabelaHospedeira={tabelaHospedeira}
              categoriaDax={categoriaDax}
              metricaHomologadaNome={selectedMetricaNome}
              rows={5}
            />
          </div>

          {/* Rodapé com Ações */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="btn-submit-medida-dax"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando Medida...</span>
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4" />
                  <span>{isEditing ? 'Salvar Alterações' : 'Criar Medida DAX'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
