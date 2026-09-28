'use client';

import React, { useState } from 'react';
import {
  X,
  Play,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Hash,
  Database,
  Loader2
} from 'lucide-react';
import { inspectLocalFileAction } from '@/app/actions/data-asset-actions';
import { registrarAtivoDerivadoAction } from '@/app/actions/preparation-actions';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { PapelEntradaLinhagem, ROTULOS_PAPEL_ENTRADA_LINHAGEM } from '@/core/domain/enums/papel-entrada-linhagem';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { ResultadoInspecaoArquivo } from '@/core/domain/adapters/file-system-adapter.interface';

interface RegisterDerivedAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  etapa: EtapaTransformacao | null;
  receitaId: string;
  demandaId: string;
  ativosDisponiveis: AtivoDados[];
  onSuccess: (data: { ativo: AtivoDados }) => void;
}

export function RegisterDerivedAssetModal({
  isOpen,
  onClose,
  etapa,
  receitaId,
  demandaId,
  ativosDisponiveis,
  onSuccess,
}: RegisterDerivedAssetModalProps) {
  const [caminhoLocal, setCaminhoLocal] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<ResultadoInspecaoArquivo | null>(null);

  // Seleção de Fontes de Entrada e Papéis
  const [origemSelecionadaId, setOrigemSelecionadaId] = useState<string>(
    ativosDisponiveis.length > 0 ? ativosDisponiveis[0].id : ''
  );
  const [papelEntrada, setPapelEntrada] = useState<PapelEntradaLinhagem>(PapelEntradaLinhagem.FONTE_PRINCIPAL);

  const [descricaoConteudo, setDescricaoConteudo] = useState('');
  const [justificativa, setJustificativa] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !etapa) return null;

  const handleInspect = async () => {
    if (!caminhoLocal || caminhoLocal.trim() === '') {
      setError('Informe o caminho do arquivo físico local.');
      return;
    }

    setIsInspecting(true);
    setError(null);

    try {
      const res = await inspectLocalFileAction(caminhoLocal.trim());
      if (!res.success) {
        setError(res.error || 'Falha ao inspecionar o arquivo físico no disco.');
        setInspectionResult(null);
      } else {
        setInspectionResult(res.data ?? null);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado na inspeção física.');
      setInspectionResult(null);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectionResult || !inspectionResult.fisico) {
      setError('É obrigatório inspecionar e comprovar a existência física do arquivo antes de registrá-lo.');
      return;
    }

    if (!origemSelecionadaId) {
      setError('Selecione ao menos um ativo de dados de origem para compor a linhagem.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await registrarAtivoDerivadoAction({
        demanda_id: demandaId,
        receita_id: receitaId,
        etapa_id: etapa.id,
        fontes_entrada: [
          {
            ativo_origem_id: origemSelecionadaId,
            papel: papelEntrada,
          },
        ],
        nome_arquivo: inspectionResult.fisico.nomeArquivo,
        caminho_local: caminhoLocal.trim(),
        formato: inspectionResult.fisico.formato as FormatoArquivo,
        tamanho_bytes: inspectionResult.fisico.tamanhoBytes,
        total_linhas: inspectionResult.conteudo?.totalLinhas ?? 0,
        total_colunas: inspectionResult.conteudo?.totalColunas ?? 0,
        hash_sha256: inspectionResult.fisico.hashSha256,
        descricao_conteudo: descricaoConteudo.trim() || `Ativo derivado gerado pela etapa #${etapa.ordem} (${etapa.tipo_operacao})`,
        schema_inferido: JSON.stringify(inspectionResult.conteudo?.colunas || []),
        justificativa: justificativa.trim() || null,
      });

      if (!res.success) {
        setError(res.error || 'Erro ao registrar ativo derivado.');
      } else {
        onSuccess({ ativo: res.data.ativo });
        onClose();
        setCaminhoLocal('');
        setInspectionResult(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao registrar ativo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto"
      data-testid="register-derived-asset-modal"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Registrar Ativo Derivado — Saída da Etapa #{etapa.ordem}
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-md">{etapa.descricao}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-register-derived-modal"
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div
            className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300"
            data-testid="error-register-derived"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Passo 1: Caminho e Inspeção Física */}
          <div>
            <label htmlFor="derived-caminho-local" className="block text-xs font-semibold text-slate-300 mb-1">
              Caminho Físico Local do Arquivo Tratado / Gerado <span className="text-rose-400">*</span>
            </label>
            <div className="flex gap-2">
              <input
                id="derived-caminho-local"
                type="text"
                value={caminhoLocal}
                onChange={(e) => setCaminhoLocal(e.target.value)}
                placeholder="Ex: C:\Dados\Tratados\vendas_higienizadas.parquet ou .csv"
                data-testid="input-derived-filepath"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={handleInspect}
                disabled={isInspecting || !caminhoLocal.trim()}
                data-testid="btn-inspect-derived-file"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50 shrink-0"
              >
                {isInspecting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Inspecionando...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5" />
                    <span>Inspecionar</span>
                  </>
                )}
              </button>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              O arquivo gerado externamente pelo Power Query M, SQL, Python ou ferramenta de preferência será inspecionado sem duplicação de dados.
            </span>
          </div>

          {/* Resultado da Inspeção */}
          {inspectionResult && inspectionResult.fisico && (
            <div
              className="rounded-lg border border-emerald-900/80 bg-emerald-950/20 p-3 space-y-2 text-xs"
              data-testid="derived-inspection-preview"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Arquivo Físico Comprovado no Disco</span>
                </div>
                <span className="font-mono text-xs text-slate-200">
                  {inspectionResult.fisico.nomeArquivo}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-500 block">Formato:</span>
                  <strong className="text-emerald-300">{inspectionResult.fisico.formato}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Linhas:</span>
                  <strong>{inspectionResult.conteudo?.totalLinhas ?? 0}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Colunas:</span>
                  <strong>{inspectionResult.conteudo?.totalColunas ?? 0}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Tamanho:</span>
                  <strong>{(inspectionResult.fisico.tamanhoBytes / 1024).toFixed(1)} KB</strong>
                </div>
              </div>
              <div className="pt-1 font-mono text-[11px] truncate text-slate-400">
                <span className="text-slate-500">Hash SHA-256: </span>
                <span className="text-slate-300 select-all">{inspectionResult.fisico.hashSha256}</span>
              </div>
            </div>
          )}

          {/* Passo 2: Fonte de Entrada e Papel de Linhagem */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label htmlFor="derived-origem-asset" className="block text-xs font-semibold text-slate-300 mb-1">
                Ativo de Origem (Upstream) <span className="text-rose-400">*</span>
              </label>
              <select
                id="derived-origem-asset"
                value={origemSelecionadaId}
                onChange={(e) => setOrigemSelecionadaId(e.target.value)}
                data-testid="select-derived-source-asset"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                {ativosDisponiveis.map((ativo) => (
                  <option key={ativo.id} value={ativo.id}>
                    {ativo.nome_arquivo} ({ativo.categoria_ativo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="derived-papel-linhagem" className="block text-xs font-semibold text-slate-300 mb-1">
                Papel na Linhagem <span className="text-rose-400">*</span>
              </label>
              <select
                id="derived-papel-linhagem"
                value={papelEntrada}
                onChange={(e) => setPapelEntrada(e.target.value as PapelEntradaLinhagem)}
                data-testid="select-derived-lineage-role"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                {Object.entries(ROTULOS_PAPEL_ENTRADA_LINHAGEM).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="derived-content-desc" className="block text-xs font-semibold text-slate-300 mb-1">
              Descrição do Conteúdo / Sumário das Alterações
            </label>
            <input
              id="derived-content-desc"
              type="text"
              value={descricaoConteudo}
              onChange={(e) => setDescricaoConteudo(e.target.value)}
              placeholder="Ex: Base com duplicidades removidas e tipos numéricos convertidos"
              data-testid="input-derived-content-desc"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="derived-justification" className="block text-xs font-semibold text-slate-300 mb-1">
              Justificativa / Observações (Opcional)
            </label>
            <input
              id="derived-justification"
              type="text"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Observações complementares sobre a geração do ativo..."
              data-testid="input-derived-justification"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !inspectionResult || !inspectionResult.fisico}
              data-testid="btn-submit-register-derived"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-sm hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <span>Confirmar Registro Atômico</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
