'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info, ArrowRight, ShieldCheck } from 'lucide-react';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { EntregavelDemanda } from '@/core/domain/entities/entregavel-demanda';
import { StatusEntregavel } from '@/core/domain/enums/status-entregavel';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';
import { ResultadoAvaliacaoValidacao } from '@/core/domain/rules/validation-rules-evaluator';

interface DeliverablesNextActionBannerProps {
  estadoDemanda: EstadoDemanda;
  entregaveis: EntregavelDemanda[];
  avaliacao?: ResultadoAvaliacaoValidacao | null;
  onOpenDocModal?: () => void;
  onOpenEncerramentoModal?: () => void;
  readOnly?: boolean;
}

export function DeliverablesNextActionBanner({
  estadoDemanda,
  entregaveis,
  avaliacao,
  onOpenDocModal,
  onOpenEncerramentoModal,
  readOnly = false,
}: DeliverablesNextActionBannerProps) {
  // Caso 1: Demanda já concluída (imutabilidade operacional)
  if (estadoDemanda === EstadoDemanda.CONCLUIDA) {
    return (
      <div
        className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-4 text-emerald-200"
        data-testid="banner-proxima-acao-concluida"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-emerald-300">
              Demanda Concluída e Encerrada
            </h4>
            <p className="mt-1 text-xs text-emerald-200/80">
              Todos os entregáveis obrigatórios foram aceitos formalmente e o ciclo de homologação foi concluído soberanamente. Os registros estão protegidos contra edições.
            </p>
          </div>
          {onOpenDocModal && (
            <button
              onClick={onOpenDocModal}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-800/40 hover:bg-emerald-700/50 text-emerald-200 border border-emerald-700/50 transition-colors"
            >
              Ver Memorial de Entrega
            </button>
          )}
        </div>
      </div>
    );
  }

  // Caso 2: Read-only ou suspensa / cancelada
  if (readOnly) {
    return (
      <div
        className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-slate-300"
        data-testid="banner-proxima-acao-readonly"
      >
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-slate-400 shrink-0" />
          <p className="text-xs">
            Esta demanda encontra-se no estado <strong>{estadoDemanda}</strong>. O painel de entregáveis está em modo somente leitura.
          </p>
        </div>
      </div>
    );
  }

  const total = entregaveis.length;
  const obrigatorios = entregaveis.filter((e) => e.obrigatorio);
  const obrigatoriosDisponiveis = obrigatorios.filter(
    (e) => e.status === StatusEntregavel.DISPONIVEL || e.status === StatusEntregavel.HOMOLOGADO
  );
  const obrigatoriosAceitos = obrigatorios.filter(
    (e) => e.aceite_status === StatusAceiteEntrega.ACEITO
  );
  const comAjustesOuRejeicao = entregaveis.filter(
    (e) =>
      e.aceite_status === StatusAceiteEntrega.AJUSTES_SOLICITADOS ||
      e.aceite_status === StatusAceiteEntrega.REJEITADO
  );

  const v04Ok = avaliacao?.pronto_para_conclusao ?? false;

  // Caso 3: Nenhum entregável cadastrado
  if (total === 0) {
    return (
      <div
        className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-4 text-amber-200"
        data-testid="banner-proxima-acao-sem-entregaveis"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-amber-300">
              Nenhum entregável cadastrado
            </h4>
            <p className="mt-1 text-xs text-amber-200/80">
              Cadastre os artefatos de entrega (painel Power BI, relatório executivo, documentação técnica) para estruturar o pacote formal do projeto.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Caso 4: Existem rejeições ou ajustes solicitados
  if (comAjustesOuRejeicao.length > 0) {
    return (
      <div
        className="rounded-lg border border-rose-900/40 bg-rose-950/20 p-4 text-rose-200"
        data-testid="banner-proxima-acao-ajustes-pendentes"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-rose-300">
              Pendências identificadas no aceite
            </h4>
            <p className="mt-1 text-xs text-rose-200/80">
              Existem {comAjustesOuRejeicao.length} entregável(is) com ressalvas, solicitação de ajustes ou rejeição. Revise os artefatos, submeta novas versões e colha nova homologação formal para habilitar a conclusão.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Caso 5: Entregáveis pendentes de disponibilização
  if (obrigatoriosDisponiveis.length < obrigatorios.length) {
    const pendentes = obrigatorios.length - obrigatoriosDisponiveis.length;
    return (
      <div
        className="rounded-lg border border-blue-900/40 bg-blue-950/20 p-4 text-blue-200"
        data-testid="banner-proxima-acao-pendente-disponibilizacao"
      >
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-300">
              Disponibilização de entregáveis pendente
            </h4>
            <p className="mt-1 text-xs text-blue-200/80">
              Ainda há {pendentes} entregável(is) obrigatório(s) em elaboração ou rascunho. Conclua os artefatos e marque-os como DISPONÍVEL para cumprir a regra V-03.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Caso 6: Todos disponíveis mas pendentes de aceite do cliente
  if (obrigatoriosAceitos.length < obrigatorios.length) {
    const pendentesAceite = obrigatorios.length - obrigatoriosAceitos.length;
    return (
      <div
        className="rounded-lg border border-indigo-900/40 bg-indigo-950/20 p-4 text-indigo-200"
        data-testid="banner-proxima-acao-pendente-aceite"
      >
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-indigo-300">
              Aguardando Aceite Formal do Stakeholder
            </h4>
            <p className="mt-1 text-xs text-indigo-200/80">
              Todos os artefatos obrigatórios estão disponibilizados. Compartilhe o memorial executivo com o contratante e registre a deliberação de aceite formal ({pendentesAceite} pendente{pendentesAceite === 1 ? '' : 's'}).
            </p>
          </div>
          {onOpenDocModal && (
            <button
              onClick={onOpenDocModal}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-800/40 hover:bg-indigo-700/50 text-indigo-200 border border-indigo-700/50 transition-colors shrink-0"
            >
              Gerar Relatório para Cliente
            </button>
          )}
        </div>
      </div>
    );
  }

  // Caso 7: Todos aceitos formalmente e V-04 atendida -> Pronto para encerramento
  if (v04Ok) {
    return (
      <div
        className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-4 text-emerald-200"
        data-testid="banner-proxima-acao-pronto-encerramento"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-emerald-300">
              Pronto para Conclusão e Encerramento Formal
            </h4>
            <p className="mt-1 text-xs text-emerald-200/80">
              Todos os entregáveis obrigatórios possuem aceite formal registrado e as regras de integridade (V-03 e V-04) estão 100% satisfeitas. A demanda pode ser concluída mediante decisão soberana humana.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenDocModal && (
              <button
                onClick={onOpenDocModal}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                Ver Memorial
              </button>
            )}
            {onOpenEncerramentoModal && (
              <button
                onClick={onOpenEncerramentoModal}
                data-testid="btn-abrir-encerramento-banner"
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
              >
                Concluir Demanda
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Caso Padrão
  return (
    <div
      className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-slate-300"
      data-testid="banner-proxima-acao-padrao"
    >
      <div className="flex items-center gap-3">
        <Info className="h-5 w-5 text-slate-400 shrink-0" />
        <p className="text-xs">
          Gerencie os entregáveis, disponibilize os artefatos validados e formalize o aceite com o contratante.
        </p>
      </div>
    </div>
  );
}
