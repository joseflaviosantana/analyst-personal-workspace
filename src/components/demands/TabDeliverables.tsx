'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
} from 'lucide-react';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { EntregavelDemanda } from '@/core/domain/entities/entregavel-demanda';
import { ResultadoAvaliacaoValidacao } from '@/core/domain/rules/validation-rules-evaluator';
import {
  EstadoDemanda,
  isEstadoTerminal,
  normalizarEstadoDemanda,
} from '@/core/domain/enums/estado-demanda';
import { TipoEntregavel } from '@/core/domain/enums/tipo-entregavel';
import { StatusEntregavel } from '@/core/domain/enums/status-entregavel';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';

import {
  listarEntregaveisAction,
  registrarEntregavelAction,
  atualizarEntregavelAction,
  removerEntregavelAction,
  disponibilizarEntregavelAction,
  registrarAceiteEntregaAction,
  obterProntidaoEntregaAction,
  gerarDocumentacaoContratanteAction,
  formalizarEncerramentoDemandaAction,
} from '@/app/actions/deliverable-actions';

import { DeliverablesSummaryCards } from '@/components/deliverables/DeliverablesSummaryCards';
import { DeliverablesNextActionBanner } from '@/components/deliverables/DeliverablesNextActionBanner';
import { DeliverableCardList } from '@/components/deliverables/DeliverableCardList';
import { CreateOrEditDeliverableModal } from '@/components/deliverables/CreateOrEditDeliverableModal';
import { RecordAcceptanceModal } from '@/components/deliverables/RecordAcceptanceModal';
import { ContractorDocumentationModal } from '@/components/deliverables/ContractorDocumentationModal';
import { ConfirmEncerramentoModal } from '@/components/deliverables/ConfirmEncerramentoModal';

interface TabDeliverablesProps {
  demand: DemandaComProjeto;
}

export function TabDeliverables({ demand }: TabDeliverablesProps) {
  const router = useRouter();

  const [entregaveis, setEntregaveis] = useState<EntregavelDemanda[]>([]);
  const [prontidao, setProntidao] = useState<ResultadoAvaliacaoValidacao | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modais
  const [createOrEditModalOpen, setCreateOrEditModalOpen] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<EntregavelDemanda | null>(null);

  const [acceptanceModalOpen, setAcceptanceModalOpen] = useState(false);
  const [selectedForAcceptance, setSelectedForAcceptance] = useState<EntregavelDemanda | null>(null);

  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docContent, setDocContent] = useState('');

  const [encerramentoModalOpen, setEncerramentoModalOpen] = useState(false);

  // Governança de Workflow Read-Only
  const estadoAtual = normalizarEstadoDemanda(demand.estado);
  const isSuspensa = estadoAtual === EstadoDemanda.SUSPENSA;
  const isTerminal = isEstadoTerminal(estadoAtual);
  const isReadOnly = isTerminal || isSuspensa;

  const carregarDados = useCallback(async () => {
    try {
      setIsLoading(true);
      const [resEntregaveis, resProntidao] = await Promise.all([
        listarEntregaveisAction(demand.id),
        obterProntidaoEntregaAction(demand.id),
      ]);

      if (resEntregaveis.success && resEntregaveis.data) {
        setEntregaveis(resEntregaveis.data);
      }
      if (resProntidao.success && resProntidao.data) {
        setProntidao(resProntidao.data);
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Erro ao carregar dados dos entregáveis e governança.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [demand.id]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Ações
  const handleSaveDeliverable = async (data: {
    titulo: string;
    tipo: TipoEntregavel;
    versao: string;
    status: StatusEntregavel;
    obrigatorio: boolean;
    caminho_arquivo_ou_link: string;
    descricao_sumario?: string;
  }) => {
    setIsSubmitting(true);
    try {
      if (selectedForEdit) {
        const res = await atualizarEntregavelAction({
          id: selectedForEdit.id,
          ...data,
        });
        if (!res.success) throw new Error(res.error);
        setFeedback({ type: 'success', message: 'Entregável atualizado com sucesso.' });
      } else {
        const res = await registrarEntregavelAction({
          ...data,
          demanda_id: demand.id,
        });
        if (!res.success) throw new Error(res.error);
        setFeedback({ type: 'success', message: 'Entregável cadastrado com sucesso.' });
      }
      await carregarDados();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDeliverable = async (entregavelId: string) => {
    if (!confirm('Deseja realmente remover este entregável?')) return;
    try {
      const res = await removerEntregavelAction(entregavelId);
      if (!res.success) throw new Error(res.error);
      setFeedback({ type: 'success', message: 'Entregável removido com sucesso.' });
      await carregarDados();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Falha ao remover entregável.',
      });
    }
  };

  const handleDisponibilizar = async (entregavelId: string) => {
    try {
      const res = await disponibilizarEntregavelAction(entregavelId);
      if (!res.success) throw new Error(res.error);
      setFeedback({ type: 'success', message: 'Entregável marcado como DISPONÍVEL.' });
      await carregarDados();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Falha ao disponibilizar entregável.',
      });
    }
  };

  const handleRecordAcceptance = async (data: {
    entregavelId: string;
    aceite_status: StatusAceiteEntrega;
    aceite_por: string;
    aceite_em?: string;
    aceite_justificativa?: string;
  }) => {
    setIsSubmitting(true);
    try {
      if (data.aceite_status === StatusAceiteEntrega.PENDENTE) {
        throw new Error('Selecione uma deliberação válida (Aceito, Ajustes ou Rejeitado).');
      }

      const res = await registrarAceiteEntregaAction({
        id: data.entregavelId,
        aceite_status: data.aceite_status,
        aceite_por: data.aceite_por,
        aceite_justificativa: data.aceite_justificativa,
      });
      if (!res.success) throw new Error(res.error);
      setFeedback({
        type: 'success',
        message: `Deliberação (${data.aceite_status}) registrada com sucesso.`,
      });
      await carregarDados();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDocModal = async () => {
    try {
      const res = await gerarDocumentacaoContratanteAction(demand.id);
      if (res.success && res.data) {
        setDocContent(res.data);
        setDocModalOpen(true);
      } else {
        const errorText = !res.success ? res.error : 'Falha ao gerar memorial executivo.';
        throw new Error(errorText);
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro ao gerar documentação executiva.',
      });
    }
  };

  const handleConfirmEncerramento = async (justificativa?: string) => {
    setIsSubmitting(true);
    try {
      const res = await formalizarEncerramentoDemandaAction(demand.id, justificativa);
      if (!res.success) throw new Error(res.error);
      setFeedback({
        type: 'success',
        message: 'Demanda CONCLUÍDA formalmente com governança integral.',
      });
      router.refresh();
      await carregarDados();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="tab-deliverables">
      {/* Feedback Toast / Alert */}
      {feedback && (
        <div
          data-testid="deliverables-feedback-alert"
          className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-200'
              : 'border-rose-800/60 bg-rose-950/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white p-0.5 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <DeliverablesSummaryCards
        entregaveis={entregaveis}
        avaliacao={prontidao}
      />

      {/* Banner de Próxima Ação Determinística */}
      <DeliverablesNextActionBanner
        estadoDemanda={estadoAtual}
        entregaveis={entregaveis}
        avaliacao={prontidao}
        onOpenDocModal={handleOpenDocModal}
        onOpenEncerramentoModal={() => setEncerramentoModalOpen(true)}
        readOnly={isReadOnly}
      />

      {/* Toolbar / Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-400" />
            Pacote de Entregáveis da Demanda
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie artefatos, disponibilização técnica e colha formalmente o aceite do contratante.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenDocModal}
            data-testid="btn-abrir-documentacao"
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-indigo-400" />
            Relatório do Contratante
          </button>

          {!isReadOnly && (
            <button
              onClick={() => {
                setSelectedForEdit(null);
                setCreateOrEditModalOpen(true);
              }}
              data-testid="btn-novo-entregavel"
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo Entregável
            </button>
          )}
        </div>
      </div>

      {/* Lista de Cards de Entregáveis */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          <span className="text-xs">Carregando entregáveis e governança...</span>
        </div>
      ) : (
        <DeliverableCardList
          entregaveis={entregaveis}
          readOnly={isReadOnly}
          onEdit={(entregavel) => {
            setSelectedForEdit(entregavel);
            setCreateOrEditModalOpen(true);
          }}
          onDelete={handleDeleteDeliverable}
          onDisponibilizar={handleDisponibilizar}
          onRegistrarAceite={(entregavel) => {
            setSelectedForAcceptance(entregavel);
            setAcceptanceModalOpen(true);
          }}
        />
      )}

      {/* Modais */}
      <CreateOrEditDeliverableModal
        isOpen={createOrEditModalOpen}
        onClose={() => {
          setCreateOrEditModalOpen(false);
          setSelectedForEdit(null);
        }}
        onSubmit={handleSaveDeliverable}
        initialData={selectedForEdit}
        isSubmitting={isSubmitting}
      />

      <RecordAcceptanceModal
        isOpen={acceptanceModalOpen}
        onClose={() => {
          setAcceptanceModalOpen(false);
          setSelectedForAcceptance(null);
        }}
        onSubmit={handleRecordAcceptance}
        entregavel={selectedForAcceptance}
        isSubmitting={isSubmitting}
      />

      <ContractorDocumentationModal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        markdownContent={docContent}
        demandaTitulo={demand.titulo}
      />

      <ConfirmEncerramentoModal
        isOpen={encerramentoModalOpen}
        onClose={() => setEncerramentoModalOpen(false)}
        onConfirm={handleConfirmEncerramento}
        demandaTitulo={demand.titulo}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
