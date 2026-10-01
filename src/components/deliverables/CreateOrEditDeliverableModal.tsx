'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { TipoEntregavel, ROTULOS_TIPO_ENTREGAVEL } from '@/core/domain/enums/tipo-entregavel';
import { StatusEntregavel, ROTULOS_STATUS_ENTREGAVEL } from '@/core/domain/enums/status-entregavel';
import { EntregavelDemanda } from '@/core/domain/entities/entregavel-demanda';

interface CreateOrEditDeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    titulo: string;
    tipo: TipoEntregavel;
    versao: string;
    status: StatusEntregavel;
    obrigatorio: boolean;
    caminho_arquivo_ou_link: string;
    descricao_sumario?: string;
  }) => Promise<void>;
  initialData?: EntregavelDemanda | null;
  isSubmitting?: boolean;
}

export function CreateOrEditDeliverableModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}: CreateOrEditDeliverableModalProps) {
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<TipoEntregavel>(TipoEntregavel.DASHBOARD_POWERBI);
  const [versao, setVersao] = useState('1.0');
  const [status, setStatus] = useState<StatusEntregavel>(StatusEntregavel.DISPONIVEL);
  const [obrigatorio, setObrigatorio] = useState(true);
  const [caminhoArquivoOuLink, setCaminhoArquivoOuLink] = useState('');
  const [descricaoSumario, setDescricaoSumario] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitulo(initialData.titulo);
      setTipo(initialData.tipo);
      setVersao(initialData.versao);
      setStatus(initialData.status);
      setObrigatorio(initialData.obrigatorio);
      setCaminhoArquivoOuLink(initialData.caminho_arquivo_ou_link || '');
      setDescricaoSumario(initialData.descricao_sumario || '');
    } else {
      setTitulo('');
      setTipo(TipoEntregavel.DASHBOARD_POWERBI);
      setVersao('1.0');
      setStatus(StatusEntregavel.DISPONIVEL);
      setObrigatorio(true);
      setCaminhoArquivoOuLink('');
      setDescricaoSumario('');
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || titulo.trim().length < 3) {
      setErrorMsg('O título deve conter ao menos 3 caracteres.');
      return;
    }
    if (!versao.trim()) {
      setErrorMsg('A versão do entregável é obrigatória.');
      return;
    }
    if (!caminhoArquivoOuLink.trim()) {
      setErrorMsg('O caminho do arquivo ou link do artefato é obrigatório.');
      return;
    }

    try {
      setErrorMsg(null);
      await onSubmit({
        titulo: titulo.trim(),
        tipo,
        versao: versao.trim(),
        status,
        obrigatorio,
        caminho_arquivo_ou_link: caminhoArquivoOuLink.trim(),
        descricao_sumario: descricaoSumario.trim() ? descricaoSumario.trim() : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao salvar entregável.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      data-testid="modal-create-edit-deliverable"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-base font-semibold text-white">
            {initialData ? 'Editar Entregável' : 'Novo Entregável'}
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg border border-rose-900/60 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Título do Entregável *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Painel Executivo de Vendas Mensais"
              className="w-full px-3 py-2 text-xs rounded-md bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tipo de Artefato *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoEntregavel)}
                className="w-full px-3 py-2 text-xs rounded-md bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              >
                {Object.entries(ROTULOS_TIPO_ENTREGAVEL).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Versão *
              </label>
              <input
                type="text"
                value={versao}
                onChange={(e) => setVersao(e.target.value)}
                placeholder="1.0"
                className="w-full px-3 py-2 text-xs rounded-md bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Status Operacional *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusEntregavel)}
                className="w-full px-3 py-2 text-xs rounded-md bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              >
                {Object.entries(ROTULOS_STATUS_ENTREGAVEL).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={obrigatorio}
                  onChange={(e) => setObrigatorio(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 bg-slate-950"
                />
                <span>Obrigatório para conclusão (V-03 / V-04)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Caminho de Arquivo ou URL do Artefato *
            </label>
            <input
              type="text"
              value={caminhoArquivoOuLink}
              onChange={(e) => setCaminhoArquivoOuLink(e.target.value)}
              placeholder="Ex: docs/relatorio.pdf ou https://app.powerbi.com/..."
              className="w-full px-3 py-2 text-xs rounded-md bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descrição / Sumário Técnico (opcional)
            </label>
            <textarea
              value={descricaoSumario}
              onChange={(e) => setDescricaoSumario(e.target.value)}
              placeholder="Resumo técnico ou escopo deste artefato..."
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-md bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="btn-salvar-entregavel"
              className="px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {isSubmitting ? 'Salvando...' : 'Salvar Entregável'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
