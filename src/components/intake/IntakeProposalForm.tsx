'use client';

import React from 'react';
import {
  FolderPlus,
  FolderKanban,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Projeto } from '@/core/domain/entities/projeto';

interface IntakeProposalFormProps {
  existingProjects: Array<Pick<Projeto, 'id' | 'nome'>>;
  projetoDecisao: 'NOVO' | 'EXISTENTE';
  onChangeProjetoDecisao: (d: 'NOVO' | 'EXISTENTE') => void;
  novoProjetoNome: string;
  onChangeNovoProjetoNome: (v: string) => void;
  novoProjetoDescricao: string;
  onChangeNovoProjetoDescricao: (v: string) => void;
  projetoIdExistente: string;
  onChangeProjetoIdExistente: (v: string) => void;
  demandaTitulo: string;
  onChangeDemandaTitulo: (v: string) => void;
  demandaObjetivo: string;
  onChangeDemandaObjetivo: (v: string) => void;
  demandaContexto: string;
  onChangeDemandaContexto: (v: string) => void;
  demandaPrazo: string;
  onChangeDemandaPrazo: (v: string) => void;
  demandaRestricoes: string;
  onChangeDemandaRestricoes: (v: string) => void;
  perguntasAceitasCount: number;
  onConfirmar: () => void;
  isConfirming: boolean;
  confirmError: string | null;
}

export function IntakeProposalForm({
  existingProjects,
  projetoDecisao,
  onChangeProjetoDecisao,
  novoProjetoNome,
  onChangeNovoProjetoNome,
  novoProjetoDescricao,
  onChangeNovoProjetoDescricao,
  projetoIdExistente,
  onChangeProjetoIdExistente,
  demandaTitulo,
  onChangeDemandaTitulo,
  demandaObjetivo,
  onChangeDemandaObjetivo,
  demandaContexto,
  onChangeDemandaContexto,
  demandaPrazo,
  onChangeDemandaPrazo,
  demandaRestricoes,
  onChangeDemandaRestricoes,
  perguntasAceitasCount,
  onConfirmar,
  isConfirming,
  confirmError,
}: IntakeProposalFormProps) {
  const hasExistingProjects = existingProjects.length > 0;
  const selectedExistingProject = existingProjects.find((p) => p.id === projetoIdExistente);

  return (
    <Card className="p-6 border-blue-800/60 bg-slate-900/95 shadow-xl space-y-6" data-testid="section-deliberacao-proposta">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-300 tracking-wider">
              7. CRIAR DEMANDA E PROJETO
            </span>
            <Badge variant="default" data-testid="badge-estrutura-proposta">
              Proposta do Copiloto — Revise antes de criar
            </Badge>
          </div>
          <h2 className="text-base font-bold text-white mt-1">
            Revise e confirme a estrutura
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          Todos os campos são editáveis antes de confirmar
        </span>
      </div>

      {/* Bloco 1: Decisão de Projeto (Novo vs Existente) */}
      <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-blue-400" />
            <span>1. Destino do Projeto</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Decisão de Projeto">
          <button
            type="button"
            data-testid="radio-projeto-novo"
            onClick={() => onChangeProjetoDecisao('NOVO')}
            className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
              projetoDecisao === 'NOVO'
                ? 'border-blue-500 bg-blue-950/40 text-white shadow-sm'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <FolderPlus className={`h-5 w-5 mt-0.5 ${projetoDecisao === 'NOVO' ? 'text-blue-400' : 'text-slate-500'}`} />
            <div>
              <p className="text-xs font-semibold text-slate-200">Criar Novo Projeto</p>
              <p className="text-[11px] text-slate-400">Inicia nova iniciativa agrupadora a partir da proposta.</p>
            </div>
          </button>

          <button
            type="button"
            data-testid="radio-projeto-existente"
            onClick={() => onChangeProjetoDecisao('EXISTENTE')}
            disabled={!hasExistingProjects}
            className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
              projetoDecisao === 'EXISTENTE'
                ? 'border-blue-500 bg-blue-950/40 text-white shadow-sm'
                : !hasExistingProjects
                ? 'border-slate-800 bg-slate-950/20 text-slate-600 cursor-not-allowed opacity-50'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <FolderKanban className={`h-5 w-5 mt-0.5 ${projetoDecisao === 'EXISTENTE' ? 'text-blue-400' : 'text-slate-500'}`} />
            <div>
              <p className="text-xs font-semibold text-slate-200">Vincular a Projeto Existente</p>
              <p className="text-[11px] text-slate-400">
                {hasExistingProjects
                  ? 'Agrupa a nova demanda em um projeto já existente.'
                  : 'Nenhum projeto cadastrado no workspace.'}
              </p>
            </div>
          </button>
        </div>

        {/* Campos se NOVO Projeto */}
        {projetoDecisao === 'NOVO' && (
          <div className="space-y-3 pt-2 animate-in fade-in" data-testid="form-novo-projeto">
            <div>
              <label htmlFor="input-novo-projeto-nome" className="block text-xs font-medium text-slate-300 mb-1">
                Nome do Novo Projeto *
              </label>
              <input
                id="input-novo-projeto-nome"
                data-testid="input-novo-projeto-nome"
                type="text"
                value={novoProjetoNome}
                onChange={(e) => onChangeNovoProjetoNome(e.target.value)}
                placeholder="Ex: Análise Comercial 2026"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="input-novo-projeto-descricao" className="block text-xs font-medium text-slate-300 mb-1">
                Descrição do Projeto (Opcional)
              </label>
              <textarea
                id="input-novo-projeto-descricao"
                data-testid="textarea-novo-projeto-descricao"
                rows={2}
                value={novoProjetoDescricao}
                onChange={(e) => onChangeNovoProjetoDescricao(e.target.value)}
                placeholder="Objetivo estratégico do projeto..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Campo se Projeto EXISTENTE */}
        {projetoDecisao === 'EXISTENTE' && (
          <div className="pt-2 animate-in fade-in" data-testid="form-projeto-existente">
            <label htmlFor="select-projeto-existente" className="block text-xs font-medium text-slate-300 mb-1">
              Selecione o Projeto *
            </label>
            <select
              id="select-projeto-existente"
              data-testid="select-projeto-existente"
              value={projetoIdExistente}
              onChange={(e) => onChangeProjetoIdExistente(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Selecione um projeto existente...</option>
              {existingProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.id})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bloco 2: Dados da Demanda */}
      <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-400" />
          <span>2. Dados da Demanda</span>
        </label>

        <div className="space-y-3">
          <div>
            <label htmlFor="input-demanda-titulo" className="block text-xs font-medium text-slate-300 mb-1">
              Título da Demanda *
            </label>
            <input
              id="input-demanda-titulo"
              data-testid="input-demanda-titulo"
              type="text"
              value={demandaTitulo}
              onChange={(e) => onChangeDemandaTitulo(e.target.value)}
              placeholder="Ex: Painel de Vendas Regional 2025"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="textarea-demanda-objetivo" className="block text-xs font-medium text-slate-300 mb-1">
                Objetivo Inicial
              </label>
              <textarea
                id="textarea-demanda-objetivo"
                data-testid="textarea-demanda-objetivo"
                rows={3}
                value={demandaObjetivo}
                onChange={(e) => onChangeDemandaObjetivo(e.target.value)}
                placeholder="Objetivo principal a alcançar..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="textarea-demanda-contexto" className="block text-xs font-medium text-slate-300 mb-1">
                Contexto de Negócio
              </label>
              <textarea
                id="textarea-demanda-contexto"
                data-testid="textarea-demanda-contexto"
                rows={3}
                value={demandaContexto}
                onChange={(e) => onChangeDemandaContexto(e.target.value)}
                placeholder="Contexto e motivação da solicitação..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-demanda-prazo" className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Prazo Esperado</span>
              </label>
              <input
                id="input-demanda-prazo"
                data-testid="input-demanda-prazo"
                type="text"
                value={demandaPrazo}
                onChange={(e) => onChangeDemandaPrazo(e.target.value)}
                placeholder="Ex: 2026-04-30 ou Próxima sexta-feira"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="textarea-demanda-restricoes" className="block text-xs font-medium text-slate-300 mb-1">
                Restrições Declaradas
              </label>
              <input
                id="textarea-demanda-restricoes"
                data-testid="textarea-demanda-restricoes"
                type="text"
                value={demandaRestricoes}
                onChange={(e) => onChangeDemandaRestricoes(e.target.value)}
                placeholder="Ex: Apenas dados de filiais ativas..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bloco 3: Resumo Pré-Confirmação */}
      <div className="rounded-xl border border-blue-900/60 bg-blue-950/20 p-4 space-y-2.5" data-testid="resumo-materializacao">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
          <ShieldCheck className="h-4 w-4" />
          <span>Resumo do que será criado</span>
        </div>
        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
          <li>
            <strong className="text-slate-200">Projeto:</strong>{' '}
            {projetoDecisao === 'NOVO'
              ? `Criar novo projeto "${novoProjetoNome || '(nome pendente)'}"`
              : `Vincular ao projeto "${selectedExistingProject?.nome || projetoIdExistente || '(não selecionado)'}"`}
          </li>
          <li>
            <strong className="text-slate-200">Demanda:</strong> "{demandaTitulo || '(título pendente)'}" (Estado inicial: NOVA)
          </li>
          <li>
            <strong className="text-slate-200">Perguntas de Esclarecimento:</strong> {perguntasAceitasCount} pergunta(s) selecionada(s) para acompanhamento na etapa de Requisitos (Aba 2).
          </li>
          <li>
            <strong className="text-slate-200">Rastreabilidade:</strong> Origem registrada como Entrada Inteligente revisada por você.
          </li>
        </ul>
      </div>

      {/* Erro de Confirmação */}
      {confirmError && (
        <div
          data-testid="confirm-error-message"
          className="flex items-center gap-2.5 rounded-lg border border-rose-900/80 bg-rose-950/40 p-3.5 text-xs text-rose-300 animate-in fade-in"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
          <span>{confirmError}</span>
        </div>
      )}

      {/* Botão de Confirmação Final */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-slate-800">
        <button
          type="button"
          data-testid="btn-confirm-intake"
          onClick={onConfirmar}
          disabled={isConfirming || !demandaTitulo.trim() || (projetoDecisao === 'NOVO' && !novoProjetoNome.trim()) || (projetoDecisao === 'EXISTENTE' && !projetoIdExistente)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all"
        >
          {isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Criando demanda e projeto...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirmar e Criar Demanda</span>
            </>
          )}
        </button>
      </div>
    </Card>
  );
}
