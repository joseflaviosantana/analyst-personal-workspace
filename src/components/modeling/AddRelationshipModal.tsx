'use client';

import React, { useState } from 'react';
import { X, GitFork, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { CardinalidadeRelacionamento } from '@/core/domain/enums/cardinalidade-relacionamento';
import { DirecaoFiltroRelacionamento } from '@/core/domain/enums/direcao-filtro-relacionamento';
import { adicionarRelacionamentoAnaliticoAction } from '@/app/actions/modeling-actions';

interface AddRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelo: ModeloAnaliticoCompleto;
  demandaId: string;
  onSuccess: (msg: string) => void;
}

export function AddRelationshipModal({
  isOpen,
  onClose,
  modelo,
  demandaId,
  onSuccess,
}: AddRelationshipModalProps) {
  const entidades = modelo.entidades;

  const [entidadeOrigemId, setEntidadeOrigemId] = useState(entidades[0]?.id || '');
  const [entidadeDestinoId, setEntidadeDestinoId] = useState(
    entidades.length > 1 ? entidades[1]?.id : entidades[0]?.id || ''
  );

  const getEntidadeAtributos = (entId: string) => {
    const ent = entidades.find((e) => e.id === entId);
    return ent ? ent.atributos : [];
  };

  const attrsOrigem = getEntidadeAtributos(entidadeOrigemId);
  const attrsDestino = getEntidadeAtributos(entidadeDestinoId);

  const [atributoOrigemId, setAtributoOrigemId] = useState(attrsOrigem[0]?.id || '');
  const [atributoDestinoId, setAtributoDestinoId] = useState(attrsDestino[0]?.id || '');

  const [tipoRelacionamento, setTipoRelacionamento] = useState<CardinalidadeRelacionamento>(
    CardinalidadeRelacionamento.MUITOS_PARA_UM
  );
  const [direcaoFiltro, setDirecaoFiltro] = useState<DirecaoFiltroRelacionamento>(
    DirecaoFiltroRelacionamento.UNIDIRECIONAL
  );
  const [justificativa, setJustificativa] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOrigemChange = (newEntId: string) => {
    setEntidadeOrigemId(newEntId);
    const newAttrs = getEntidadeAtributos(newEntId);
    setAtributoOrigemId(newAttrs[0]?.id || '');
  };

  const handleDestinoChange = (newEntId: string) => {
    setEntidadeDestinoId(newEntId);
    const newAttrs = getEntidadeAtributos(newEntId);
    setAtributoDestinoId(newAttrs[0]?.id || '');
  };

  const ehNM = tipoRelacionamento === CardinalidadeRelacionamento.MUITOS_PARA_MUITOS;
  const ehBidirecional = direcaoFiltro === DirecaoFiltroRelacionamento.BIDIRECIONAL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!entidadeOrigemId || !atributoOrigemId || !entidadeDestinoId || !atributoDestinoId) {
      setError('Selecione entidades e atributos de origem e destino válidos.');
      return;
    }

    if (entidadeOrigemId === entidadeDestinoId && atributoOrigemId === atributoDestinoId) {
      setError('Não é permitido criar um auto-relacionamento sobre o mesmo atributo.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await adicionarRelacionamentoAnaliticoAction(
        {
          modeloId: modelo.id,
          entidadeOrigemId,
          atributoOrigemId,
          entidadeDestinoId,
          atributoDestinoId,
          tipoRelacionamento,
          direcaoFiltro,
          justificativa: justificativa.trim() || undefined,
        },
        demandaId
      );

      if (!res.success) {
        setError(res.error || 'Falha ao adicionar relacionamento analítico.');
      } else {
        onSuccess('Relacionamento analítico adicionado com sucesso!');
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao adicionar relacionamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="add-relationship-modal"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <GitFork className="h-5 w-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">Adicionar Relacionamento Analítico</h3>
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
          {/* Origem */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Entidade de Origem (Muitos/Fato) *
              </label>
              <select
                value={entidadeOrigemId}
                onChange={(e) => handleOrigemChange(e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500"
                data-testid="select-rel-source-entity"
              >
                {entidades.map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {ent.nome} ({ent.tipo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Atributo / Chave de Origem *
              </label>
              <select
                value={atributoOrigemId}
                onChange={(e) => setAtributoOrigemId(e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500"
                data-testid="select-rel-source-attr"
              >
                {attrsOrigem.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome_amigavel} ({a.papel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Destino */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Entidade de Destino (Um/Dimensão) *
              </label>
              <select
                value={entidadeDestinoId}
                onChange={(e) => handleDestinoChange(e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500"
                data-testid="select-rel-target-entity"
              >
                {entidades.map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {ent.nome} ({ent.tipo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Atributo / Chave de Destino *
              </label>
              <select
                value={atributoDestinoId}
                onChange={(e) => setAtributoDestinoId(e.target.value)}
                className="w-full rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500"
                data-testid="select-rel-target-attr"
              >
                {attrsDestino.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome_amigavel} ({a.papel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Configuração da Conexão */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Cardinalidade *
              </label>
              <select
                value={tipoRelacionamento}
                onChange={(e) => setTipoRelacionamento(e.target.value as CardinalidadeRelacionamento)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                data-testid="select-rel-cardinality"
              >
                <option value={CardinalidadeRelacionamento.MUITOS_PARA_UM}>Muitos para Um (N:1) — Padrão</option>
                <option value={CardinalidadeRelacionamento.UM_PARA_MUITOS}>Um para Muitos (1:N)</option>
                <option value={CardinalidadeRelacionamento.UM_PARA_UM}>Um para Um (1:1)</option>
                <option value={CardinalidadeRelacionamento.MUITOS_PARA_MUITOS}>Muitos para Muitos (N:M) — Alerta M-06</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Direção do Filtro *
              </label>
              <select
                value={direcaoFiltro}
                onChange={(e) => setDirecaoFiltro(e.target.value as DirecaoFiltroRelacionamento)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                data-testid="select-rel-filter-direction"
              >
                <option value={DirecaoFiltroRelacionamento.UNIDIRECIONAL}>Unidirecional (Recomendado)</option>
                <option value={DirecaoFiltroRelacionamento.BIDIRECIONAL}>Bidirecional (Alerta M-07)</option>
              </select>
            </div>
          </div>

          {(ehNM || ehBidirecional) && (
            <div className="rounded-lg bg-amber-950/40 border border-amber-800/60 p-3 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Justificativa Obrigatória para Alerta Crítico</span>
              </div>
              <p className="text-[11px] text-amber-300">
                Relacionamentos N:M e propagação de filtro bidirecional introduzem riscos analíticos. Registre a justificativa técnica.
              </p>
              <textarea
                rows={2}
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Explique o motivo técnico deste relacionamento..."
                className="w-full rounded bg-slate-950 border border-amber-800/80 px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500 text-xs"
                data-testid="input-rel-justification"
              />
            </div>
          )}

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
              data-testid="btn-submit-add-relationship"
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Salvando...' : 'Adicionar Relacionamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
