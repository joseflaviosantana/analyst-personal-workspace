'use client';

/**
 * src/components/projects/DeleteProjectModal.tsx
 *
 * Modal de Confirmação de Exclusão Segura de Projetos (Subgate 2)
 *
 * Princípios de Governança:
 * - Exige confirmação humana explícita antes de remover do workspace;
 * - Bloqueia ação na interface caso existam demandas vinculadas (>= 1);
 * - Alerta de irreversibilidade e exige autorização deliberada;
 * - Executa exclusão física no SQLite via deleteProjectAction com registro prévio de auditoria.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Trash2, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { Projeto } from '@/core/domain/entities/projeto';
import { deleteProjectAction } from '@/app/actions/project-actions';

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Projeto;
  totalDemandas: number;
  onSuccess?: () => void;
}

export function DeleteProjectModal({
  isOpen,
  onClose,
  project,
  totalDemandas,
  onSuccess,
}: DeleteProjectModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('Projeto criado por engano');

  if (!isOpen) return null;

  const isBlocked = totalDemandas > 0;

  const handleDelete = async () => {
    if (isBlocked) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await deleteProjectAction(project.id, motivo);
      if (!res.success) {
        setError(res.error || 'Falha ao excluir o projeto.');
      } else {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
        router.push('/projects?deleted=true');
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao excluir projeto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      data-testid="delete-project-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-project-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 id="delete-project-modal-title" className="text-base font-bold text-white">
                Excluir Projeto
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Confirmação de remoção permanente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            data-testid="btn-close-delete-project-modal"
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mensagem de Erro (se houver) */}
        {error && (
          <div
            data-testid="delete-project-error"
            className="rounded-lg bg-rose-950/60 border border-rose-800/80 p-3 text-xs text-rose-300 flex items-center gap-2"
            role="alert"
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Conteúdo Dinâmico Baseado no Vínculo de Demandas */}
        {isBlocked ? (
          <div className="space-y-4 text-xs text-slate-300">
            <div
              data-testid="delete-project-blocked-alert"
              className="p-3.5 rounded-lg border border-amber-800/60 bg-amber-950/30 text-amber-300 flex items-start gap-2.5"
            >
              <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-400" />
              <div className="space-y-1 leading-relaxed">
                <p className="font-semibold text-amber-200">Operação Bloqueada pela Governança</p>
                <p>
                  Este projeto possui{' '}
                  <strong data-testid="delete-project-demands-count" className="text-white">
                    {totalDemandas} demanda(s) vinculada(s)
                  </strong>
                  .
                </p>
                <p className="text-[11px] text-amber-300/80">
                  Para garantir a segurança dos dados e evitar deleções em cascata acidentais,
                  não é permitido excluir projetos que possuam demandas. Trate as demandas vinculadas
                  antes de solicitar a remoção deste projeto.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-slate-400 block mb-1">Projeto:</span>
              <span data-testid="delete-project-name" className="font-semibold text-white">
                {project.nome}
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                data-testid="btn-cancel-delete-project"
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Entendido / Fechar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs text-slate-300">
            <div
              data-testid="delete-project-warning-alert"
              className="p-3 rounded-lg border border-rose-800/40 bg-rose-950/20 text-rose-200 flex items-start gap-2.5"
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">
                <p className="font-medium text-rose-300">Aviso de Irreversibilidade</p>
                <p className="text-[11px] text-rose-300/80">
                  Esta ação é permanente e irreversível. O projeto será completamente removido
                  do workspace e a operação será registrada na trilha de auditoria.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1.5">
              <div>
                <span className="text-slate-400 block text-[11px]">Projeto a ser excluído:</span>
                <span data-testid="delete-project-name" className="font-semibold text-white text-sm">
                  {project.nome}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Demandas vinculadas:</span>
                <span data-testid="delete-project-demands-count" className="font-semibold text-emerald-400">
                  {totalDemandas} demanda(s)
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="motivo-exclusao" className="block text-[11px] font-medium text-slate-400 mb-1">
                Motivo / Justificativa da Exclusão (Trilha de Auditoria)
              </label>
              <input
                id="motivo-exclusao"
                type="text"
                data-testid="input-delete-project-reason"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex.: Projeto criado por engano"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-colors"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                data-testid="btn-cancel-delete-project"
                className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                data-testid="btn-confirm-delete-project"
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Excluir Projeto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
