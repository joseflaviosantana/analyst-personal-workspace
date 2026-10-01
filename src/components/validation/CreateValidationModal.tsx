'use client';

import React, { useState } from 'react';
import { X, Scale, Loader2, HelpCircle } from 'lucide-react';
import {
  CamadaValidacao,
  ROTULOS_CAMADA_VALIDACAO,
} from '@/core/domain/enums/camada-validacao';
import { registrarValidacaoAction } from '@/app/actions/validation-actions';

interface CreateValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  demandaId: string;
  metricasDisponiveis?: { id: string; nome: string }[];
  onSuccess: (msg: string) => void;
}

export function CreateValidationModal({
  isOpen,
  onClose,
  demandaId,
  metricasDisponiveis = [],
  onSuccess,
}: CreateValidationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [titulo, setTitulo] = useState('');
  const [camada, setCamada] = useState<CamadaValidacao>(CamadaValidacao.CONCILIACAO_CRUZADA_KPI);
  const [metricaId, setMetricaId] = useState('');
  const [baseReferencia, setBaseReferencia] = useState('');
  const [valorEsperado, setValorEsperado] = useState<string>('');
  const [valorObtido, setValorObtido] = useState<string>('');
  const [toleranciaPermitida, setToleranciaPermitida] = useState<string>('0');
  const [unidadeMedida, setUnidadeMedida] = useState('');
  const [obrigatoria, setObrigatoria] = useState(true);
  const [metodoVerificacao, setMetodoVerificacao] = useState(
    'Confronto de totalizadores entre a base de referência e o modelo analítico.'
  );
  const [executadoPor, setExecutadoPor] = useState('Analista Responsável');
  const [notasEvidencia, setNotasEvidencia] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || titulo.trim().length < 3) {
      setError('Título do check deve conter ao menos 3 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const valEsperadoNum = valorEsperado.trim() !== '' ? parseFloat(valorEsperado) : null;
    const valObtidoNum = valorObtido.trim() !== '' ? parseFloat(valorObtido) : null;
    const tolNum = toleranciaPermitida.trim() !== '' ? Math.max(0, parseFloat(toleranciaPermitida)) : 0;

    const res = await registrarValidacaoAction(
      {
        demanda_id: demandaId,
        titulo: titulo.trim(),
        camada,
        metrica_id: metricaId.trim() !== '' ? metricaId : null,
        base_referencia: baseReferencia.trim() !== '' ? baseReferencia.trim() : null,
        valor_esperado: valEsperadoNum,
        valor_obtido: valObtidoNum,
        tolerancia_permitida: tolNum,
        unidade_medida: unidadeMedida.trim() !== '' ? unidadeMedida.trim() : null,
        obrigatoria,
        metodo_verificacao: metodoVerificacao.trim(),
        executado_por: executadoPor.trim() || 'Analista Responsável',
        notas_evidencia: notasEvidencia.trim() !== '' ? notasEvidencia.trim() : null,
      },
      demandaId
    );

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error);
    } else {
      onSuccess(`Check de validação "${res.data.titulo}" cadastrado com sucesso.`);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      data-testid="create-validation-modal"
    >
      <div className="relative w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">
              Novo Check de Validação / Conciliação
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div
            data-testid="validation-modal-error"
            className="mt-4 rounded-lg bg-rose-950/70 border border-rose-800 p-3 text-xs text-rose-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Título do Check */}
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Título do Check <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Confronto Faturamento Mensal (ERP vs Medida DAX)"
              data-testid="input-validation-title"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Camada de Validação */}
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Camada de Validação
              </label>
              <select
                value={camada}
                onChange={(e) => setCamada(e.target.value as CamadaValidacao)}
                data-testid="select-validation-layer"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                {Object.entries(ROTULOS_CAMADA_VALIDACAO).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Métrica Analítica Vinculada */}
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Métrica Associada (Opcional)
              </label>
              <select
                value={metricaId}
                onChange={(e) => setMetricaId(e.target.value)}
                data-testid="select-validation-metric"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Nenhuma / Não se aplica</option>
                {metricasDisponiveis.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Base de Referência */}
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Base de Referência Externa / Fonte de Confronto
            </label>
            <input
              type="text"
              value={baseReferencia}
              onChange={(e) => setBaseReferencia(e.target.value)}
              placeholder="Ex.: Relatório Fechamento Contábil Q3.xlsx ou SELECT SUM(valor) no ERP"
              data-testid="input-validation-reference"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Confronto Numérico: Esperado x Obtido x Tolerância */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Parâmetros de Comparação Numérica</span>
              <span className="text-[11px] text-slate-500">Tolerância zero por padrão conservador</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  Valor Esperado (Referência)
                </label>
                <input
                  type="number"
                  step="any"
                  value={valorEsperado}
                  onChange={(e) => setValorEsperado(e.target.value)}
                  placeholder="0.00"
                  data-testid="input-expected-value"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  Valor Obtido (Apurado)
                </label>
                <input
                  type="number"
                  step="any"
                  value={valorObtido}
                  onChange={(e) => setValorObtido(e.target.value)}
                  placeholder="0.00"
                  data-testid="input-obtained-value"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 flex items-center gap-1">
                  <span>Tolerância Permitida</span>
                  <span title="Default conservador: 0 (exatidão estrita). Ajuste caso a métrica admita arredondamento.">
                    <HelpCircle className="h-3 w-3 text-slate-400" />
                  </span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={toleranciaPermitida}
                  onChange={(e) => setToleranciaPermitida(e.target.value)}
                  placeholder="0.00"
                  data-testid="input-tolerance"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-1/2">
                <label className="block text-[11px] font-medium text-slate-300">
                  Unidade de Medida (Opcional)
                </label>
                <input
                  type="text"
                  value={unidadeMedida}
                  onChange={(e) => setUnidadeMedida(e.target.value)}
                  placeholder="R$, %, unidades"
                  data-testid="input-unit-measure"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="w-1/2 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={obrigatoria}
                    onChange={(e) => setObrigatoria(e.target.checked)}
                    data-testid="checkbox-validation-mandatory"
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                  />
                  <span className="text-xs text-slate-300 font-medium">
                    Obrigatório para Entrega
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Método de Verificação */}
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Método de Verificação Aplicado
            </label>
            <input
              type="text"
              value={metodoVerificacao}
              onChange={(e) => setMetodoVerificacao(e.target.value)}
              data-testid="input-verification-method"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Executor e Notas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Executor do Teste
              </label>
              <input
                type="text"
                value={executadoPor}
                onChange={(e) => setExecutadoPor(e.target.value)}
                placeholder="Analista Responsável"
                data-testid="input-executed-by"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">
                Notas de Evidência (Opcional)
              </label>
              <input
                type="text"
                value={notasEvidencia}
                onChange={(e) => setNotasEvidencia(e.target.value)}
                placeholder="Ex.: Verificado no painel oficial do contratante."
                data-testid="input-evidence-notes"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="btn-submit-create-validation"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Registrando...' : 'Registrar Check'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
