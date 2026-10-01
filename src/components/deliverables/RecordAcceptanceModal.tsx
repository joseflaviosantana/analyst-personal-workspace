'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertCircle, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';
import { EntregavelDemanda } from '@/core/domain/entities/entregavel-demanda';

interface RecordAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    entregavelId: string;
    aceite_status: StatusAceiteEntrega;
    aceite_por: string;
    aceite_em?: string;
    aceite_justificativa?: string;
  }) => Promise<void>;
  entregavel: EntregavelDemanda | null;
  isSubmitting?: boolean;
}

export function RecordAcceptanceModal({
  isOpen,
  onClose,
  onSubmit,
  entregavel,
  isSubmitting = false,
}: RecordAcceptanceModalProps) {
  const [status, setStatus] = useState<StatusAceiteEntrega>(StatusAceiteEntrega.ACEITO);
  const [responsavel, setResponsavel] = useState('');
  const [dataAceite, setDataAceite] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (entregavel) {
      setStatus(
        entregavel.aceite_status !== StatusAceiteEntrega.PENDENTE
          ? entregavel.aceite_status
          : StatusAceiteEntrega.ACEITO
      );
      setResponsavel(entregavel.aceite_por || '');
      setDataAceite(
        entregavel.aceite_em
          ? new Date(entregavel.aceite_em).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
      setJustificativa(entregavel.aceite_justificativa || '');
    }
    setErrorMsg(null);
  }, [entregavel, isOpen]);

  if (!isOpen || !entregavel) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responsavel.trim() || responsavel.trim().length < 2) {
      setErrorMsg('Informe o nome ou identificação do responsável (mínimo 2 caracteres).');
      return;
    }
    if (
      (status === StatusAceiteEntrega.REJEITADO || status === StatusAceiteEntrega.AJUSTES_SOLICITADOS) &&
      (!justificativa.trim() || justificativa.trim().length < 10)
    ) {
      setErrorMsg('A justificativa com ao menos 10 caracteres é obrigatória para rejeições ou solicitações de ajustes.');
      return;
    }

    try {
      setErrorMsg(null);
      await onSubmit({
        entregavelId: entregavel.id,
        aceite_status: status,
        aceite_por: responsavel.trim(),
        aceite_em: dataAceite ? new Date(dataAceite).toISOString() : new Date().toISOString(),
        aceite_justificativa: justificativa.trim() ? justificativa.trim() : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao registrar aceite.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      data-testid="modal-record-acceptance"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">
              Registro de Aceite / Homologação Formal
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Artefato Info */}
        <div className="mt-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Entregável em Apreciação
          </span>
          <h4 className="text-xs font-semibold text-white mt-0.5">
            {entregavel.titulo} (v{entregavel.versao})
          </h4>
          {entregavel.obrigatorio && (
            <span className="inline-block mt-1 text-[10px] text-amber-400 font-medium">
              * Entregável obrigatório para conclusão da demanda
            </span>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg border border-rose-900/60 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Deliberação do Stakeholder / Contratante *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus(StatusAceiteEntrega.ACEITO)}
                className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                  status === StatusAceiteEntrega.ACEITO
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Aceito</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus(StatusAceiteEntrega.AJUSTES_SOLICITADOS)}
                className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                  status === StatusAceiteEntrega.AJUSTES_SOLICITADOS
                    ? 'border-amber-500 bg-amber-950/40 text-amber-300 shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Ajustes</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus(StatusAceiteEntrega.REJEITADO)}
                className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                  status === StatusAceiteEntrega.REJEITADO
                    ? 'border-rose-500 bg-rose-950/40 text-rose-300 shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <XCircle className="h-4 w-4 text-rose-400" />
                <span>Rejeitado</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Responsável / Stakeholder *
              </label>
              <input
                type="text"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Ex: Carlos Mendes (Diretor de Vendas)"
                className="w-full px-3 py-2 text-xs rounded-md bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Data da Deliberação *
              </label>
              <input
                type="date"
                value={dataAceite}
                onChange={(e) => setDataAceite(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Justificativa ou Parecer da Homologação {status !== StatusAceiteEntrega.ACEITO && '*'}
            </label>
            <textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder={
                status === StatusAceiteEntrega.ACEITO
                  ? 'Ex: Relatório revisado e métricas aprovadas conforme alinhamento com a diretoria.'
                  : 'Descreva os apontamentos, ressalvas ou requisitos de alteração solicitados (mínimo 10 caracteres)...'
              }
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-md bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              required={status !== StatusAceiteEntrega.ACEITO}
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
              data-testid="btn-confirmar-aceite"
              className="px-4 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {isSubmitting ? 'Registrando...' : 'Confirmar Deliberação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
