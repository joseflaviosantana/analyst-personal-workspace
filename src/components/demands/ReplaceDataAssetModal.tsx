'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  FileSpreadsheet, 
  FileText,
  Info,
  Copy,
  Check
} from 'lucide-react';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { ResultadoInspecaoArquivo } from '@/core/domain/adapters/file-system-adapter.interface';
import { inspectLocalFileAction, replaceDataAssetAction } from '@/app/actions/data-asset-actions';
import { sugerirProximaVersao } from '@/lib/validations/data-asset-schema';

interface ReplaceDataAssetModalProps {
  asset: AtivoDados | null;
  onClose: () => void;
  onReplaced: (result: { ativoSubstituido: AtivoDados; novoAtivo: AtivoDados }) => void;
}

export function ReplaceDataAssetModal({ asset, onClose, onReplaced }: ReplaceDataAssetModalProps) {
  // Fase 1: Inspeção Física
  const [caminhoLocal, setCaminhoLocal] = useState('');
  const [abaAlvoXlsx, setAbaAlvoXlsx] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<ResultadoInspecaoArquivo | null>(null);
  const [inspectionError, setInspectionError] = useState<string | null>(null);

  // Fase 2: Metadados da Nova Versão
  const [versao, setVersao] = useState('');
  const [origem, setOrigem] = useState('');
  const [descricaoConteudo, setDescricaoConteudo] = useState('');
  const [granularidade, setGranularidade] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [dataRecebimento, setDataRecebimento] = useState(() => new Date().toISOString().split('T')[0]);
  const [justificativa, setJustificativa] = useState('');

  // Controle de submissão e erros
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Inicializa valores ao abrir o modal com base no ativo anterior
  useEffect(() => {
    if (asset) {
      setCaminhoLocal(asset.caminho_local || '');
      setAbaAlvoXlsx('');
      setInspectionResult(null);
      setInspectionError(null);
      setSubmitError(null);

      // Sugestão de versão: X.Y -> X.(Y+1); outros padrões -> preenchimento manual
      const versaoSugerida = sugerirProximaVersao(asset.versao);
      setVersao(versaoSugerida || '');

      setOrigem(asset.origem || '');
      setDescricaoConteudo(asset.descricao_conteudo || '');
      setGranularidade(asset.granularidade || '');
      setPeriodoInicio(asset.periodo_inicio || '');
      setPeriodoFim(asset.periodo_fim || '');
      setDataRecebimento(new Date().toISOString().split('T')[0]);
      setJustificativa('');
    }
  }, [asset]);

  if (!asset) return null;

  const isXlsxCandidate = caminhoLocal.toLowerCase().endsWith('.xlsx');
  const isHashIdentico = Boolean(
    inspectionResult?.fisico && inspectionResult.fisico.hashSha256 === asset.hash_sha256
  );
  const isVersaoIgual = Boolean(
    versao.trim() && versao.trim() === (asset.versao?.trim() || '')
  );
  const isJustificativaValida = justificativa.trim().length >= 10;

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caminhoLocal.trim()) {
      setInspectionError('Por favor, informe o caminho absoluto do arquivo local.');
      return;
    }

    setIsInspecting(true);
    setInspectionError(null);
    setSubmitError(null);

    try {
      const res = await inspectLocalFileAction(caminhoLocal, isXlsxCandidate ? abaAlvoXlsx : undefined);
      if (res.success && res.data && res.data.sucesso && res.data.fisico) {
        setInspectionResult(res.data);
      } else {
        setInspectionError(res.error || (res.data as any)?.erros?.join(' ') || 'Falha ao inspecionar o arquivo.');
        setInspectionResult(null);
      }
    } catch (err: any) {
      setInspectionError(err?.message || 'Erro inesperado na inspeção física.');
      setInspectionResult(null);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleConfirmReplacement = async () => {
    if (!inspectionResult || !inspectionResult.fisico) {
      setSubmitError('Realize a inspeção física do novo arquivo antes de confirmar.');
      return;
    }

    if (isHashIdentico) {
      setSubmitError(
        'O arquivo inspecionado possui hash SHA-256 idêntico ao ativo atual. Não é permitido substituir um ativo por um arquivo de conteúdo físico idêntico.'
      );
      return;
    }

    if (!versao.trim()) {
      setSubmitError('A nova versão do ativo é obrigatória.');
      return;
    }

    if (isVersaoIgual) {
      setSubmitError(`A nova versão deve ser diferente da versão anterior ('${asset.versao || '1.0'}').`);
      return;
    }

    if (!origem.trim() || origem.trim().length < 3) {
      setSubmitError('A origem/fonte é obrigatória e deve ter no mínimo 3 caracteres.');
      return;
    }

    if (!isJustificativaValida) {
      setSubmitError('A justificativa da substituição é obrigatória e deve conter no mínimo 10 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await replaceDataAssetAction({
        demanda_id: asset.demanda_id,
        ativo_antigo_id: asset.id,
        caminho_local: caminhoLocal,
        nome_arquivo: inspectionResult.fisico.nomeArquivo,
        formato: inspectionResult.fisico.formato as FormatoArquivo,
        tamanho_bytes: inspectionResult.fisico.tamanhoBytes,
        total_linhas: inspectionResult.conteudo?.totalLinhas ?? 0,
        total_colunas: inspectionResult.conteudo?.totalColunas ?? 0,
        hash_sha256: inspectionResult.fisico.hashSha256,
        schema_inferido: inspectionResult.conteudo?.colunas ? JSON.stringify(inspectionResult.conteudo.colunas) : null,
        origem: origem.trim(),
        descricao_conteudo: descricaoConteudo.trim() || null,
        granularidade: granularidade.trim() || null,
        periodo_inicio: periodoInicio || null,
        periodo_fim: periodoFim || null,
        data_recebimento: dataRecebimento,
        versao: versao.trim(),
        justificativa: justificativa.trim(),
      });

      if (res.success && res.data) {
        onReplaced(res.data);
        onClose();
      } else {
        setSubmitError(res.error || 'Erro ao processar a substituição do ativo.');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Falha de comunicação durante a substituição.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden"
        data-testid="modal-replace-data-asset"
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">Substituir Ativo de Dados</h2>
              <p className="text-xs text-slate-400">
                Cadastrar nova versão para o ativo <span className="font-mono text-slate-300 font-semibold">{asset.nome_arquivo}</span> (v{asset.versao || '1.0'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            data-testid="btn-close-replace-modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Card Resumo do Ativo Atual (a ser substituído) */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5 text-xs text-slate-300">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
                Ativo Atual em Vigor (Passará para SUBSTITUÍDO)
              </span>
              <span className="rounded bg-emerald-950 border border-emerald-800/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                v{asset.versao || '1.0'} • ATIVO
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono">
              <div>
                <span className="text-slate-500 block">Arquivo:</span>
                <span className="text-slate-200 truncate block" title={asset.nome_arquivo}>{asset.nome_arquivo}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Linhas × Colunas:</span>
                <span className="text-slate-200">{asset.total_linhas.toLocaleString()} × {asset.total_colunas}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tamanho:</span>
                <span className="text-slate-200">{formatBytes(asset.tamanho_bytes)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">SHA-256:</span>
                <span className="text-slate-400 truncate block" title={asset.hash_sha256}>
                  {asset.hash_sha256.slice(0, 10)}...{asset.hash_sha256.slice(-6)}
                </span>
              </div>
            </div>
          </div>

          {/* FASE 1: Inspeção Física do Novo Arquivo */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-900/60 text-blue-300 text-xs font-semibold">
                1
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Inspeção Física do Novo Arquivo</h3>
            </div>

            <form onSubmit={handleInspect} className="space-y-3">
              <div>
                <label htmlFor="replace-caminho-local" className="block text-xs font-medium text-slate-300 mb-1">
                  Caminho Absoluto Local do Novo Arquivo <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="replace-caminho-local"
                      type="text"
                      value={caminhoLocal}
                      onChange={(e) => setCaminhoLocal(e.target.value)}
                      placeholder="Ex: C:\Dados\Vendas_2026_v2.csv ou D:\Bases\clientes.xlsx"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      data-testid="input-replace-caminho-local"
                      disabled={isInspecting || isSubmitting}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isInspecting || isSubmitting || !caminhoLocal.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm shrink-0"
                    data-testid="btn-inspect-replace-file"
                  >
                    {isInspecting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Inspecionando...</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-3.5 w-3.5" />
                        <span>Inspecionar Arquivo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {isXlsxCandidate && (
                <div>
                  <label htmlFor="replace-aba-alvo-xlsx" className="block text-xs font-medium text-slate-300 mb-1">
                    Worksheet Alvo (Opcional para XLSX)
                  </label>
                  <input
                    id="replace-aba-alvo-xlsx"
                    type="text"
                    value={abaAlvoXlsx}
                    onChange={(e) => setAbaAlvoXlsx(e.target.value)}
                    placeholder="Deixe em branco para inspecionar a 1ª worksheet"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    data-testid="input-replace-aba-xlsx"
                    disabled={isInspecting || isSubmitting}
                  />
                </div>
              )}
            </form>

            {/* Erro de Inspeção */}
            {inspectionError && (
              <div 
                className="flex items-start gap-2 rounded-lg border border-rose-800/80 bg-rose-950/40 p-3 text-xs text-rose-300"
                data-testid="replace-inspection-error"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{inspectionError}</span>
              </div>
            )}

            {/* Resultado da Inspeção */}
            {inspectionResult?.fisico && (
              <div className="space-y-3">
                <div 
                  className="rounded-lg border border-blue-900/60 bg-blue-950/20 p-4 space-y-3"
                  data-testid="replace-inspection-result"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-blue-900/40">
                    <div className="flex items-center gap-2">
                      {inspectionResult.fisico.formato === 'XLSX' ? (
                        <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-400" />
                      )}
                      <span className="font-semibold text-slate-200 text-xs font-mono">{inspectionResult.fisico.nomeArquivo}</span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 font-semibold">
                        {inspectionResult.fisico.formato}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatBytes(inspectionResult.fisico.tamanhoBytes)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="rounded bg-slate-950/60 p-2 border border-slate-800/80">
                      <span className="text-slate-400 text-[10px] block">Total de Linhas</span>
                      <span className="font-semibold text-slate-100 font-mono">{inspectionResult.conteudo?.totalLinhas?.toLocaleString() ?? '—'}</span>
                    </div>
                    <div className="rounded bg-slate-950/60 p-2 border border-slate-800/80">
                      <span className="text-slate-400 text-[10px] block">Total de Colunas</span>
                      <span className="font-semibold text-slate-100 font-mono">{inspectionResult.conteudo?.totalColunas ?? '—'}</span>
                    </div>
                    <div className="rounded bg-slate-950/60 p-2 border border-slate-800/80 col-span-2">
                      <span className="text-slate-400 text-[10px] block">Integridade SHA-256</span>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="font-mono text-[11px] text-slate-300 truncate" title={inspectionResult.fisico.hashSha256}>
                          {inspectionResult.fisico.hashSha256.slice(0, 16)}...{inspectionResult.fisico.hashSha256.slice(-8)}
                        </span>
                        <button
                          type="button"
                          onClick={() => inspectionResult.fisico && handleCopyHash(inspectionResult.fisico.hashSha256)}
                          className="text-slate-400 hover:text-white p-0.5 shrink-0"
                          title="Copiar Hash SHA-256"
                        >
                          {copiedHash ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BLOQUEIO MANDATÓRIO: Hash SHA-256 idêntico ao ativo atual */}
                {isHashIdentico && (
                  <div 
                    className="flex items-start gap-2.5 rounded-lg border border-rose-800 bg-rose-950/60 p-3.5 text-xs text-rose-200"
                    data-testid="alert-identical-hash-blocked"
                  >
                    <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-100">Substituição Bloqueada: Conteúdo Físico Idêntico</p>
                      <p className="mt-0.5 text-rose-300">
                        O arquivo inspecionado possui hash SHA-256 idêntico ao ativo atual ({asset.hash_sha256.slice(0, 12)}...). 
                        Como o conteúdo físico não sofreu alterações, esta ação não caracteriza uma nova versão do ativo.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FASE 2: Metadados da Nova Versão e Justificativa Obrigatória */}
          {inspectionResult?.fisico && !isHashIdentico && (
            <div className="space-y-4 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-900/60 text-emerald-300 text-xs font-semibold">
                  2
                </div>
                <h3 className="text-sm font-semibold text-slate-200">Metadados da Nova Versão e Justificativa</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nova Versão */}
                <div>
                  <label htmlFor="replace-versao" className="block text-xs font-medium text-slate-300 mb-1">
                    Nova Versão <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="replace-versao"
                    type="text"
                    value={versao}
                    onChange={(e) => setVersao(e.target.value)}
                    placeholder="Ex: 1.1 ou 2.0"
                    className={`w-full rounded-lg border ${
                      isVersaoIgual ? 'border-rose-600 focus:ring-rose-500' : 'border-slate-700 focus:ring-blue-500'
                    } bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 font-mono`}
                    data-testid="input-replace-versao"
                    disabled={isSubmitting}
                  />
                  {isVersaoIgual && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      A nova versão deve ser diferente da versão anterior ('{asset.versao || '1.0'}').
                    </p>
                  )}
                </div>

                {/* Origem */}
                <div>
                  <label htmlFor="replace-origem" className="block text-xs font-medium text-slate-300 mb-1">
                    Origem / Fonte Declarada <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="replace-origem"
                    type="text"
                    value={origem}
                    onChange={(e) => setOrigem(e.target.value)}
                    placeholder="Ex: ERP SAP / Depto Financeiro"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    data-testid="input-replace-origem"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Granularidade */}
                <div>
                  <label htmlFor="replace-granularidade" className="block text-xs font-medium text-slate-300 mb-1">
                    Granularidade Observada
                  </label>
                  <input
                    id="replace-granularidade"
                    type="text"
                    value={granularidade}
                    onChange={(e) => setGranularidade(e.target.value)}
                    placeholder="Ex: 1 linha por item faturado"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    data-testid="input-replace-granularidade"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Data de Recebimento */}
                <div>
                  <label htmlFor="replace-data-recebimento" className="block text-xs font-medium text-slate-300 mb-1">
                    Data de Recebimento <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="replace-data-recebimento"
                    type="date"
                    value={dataRecebimento}
                    onChange={(e) => setDataRecebimento(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    data-testid="input-replace-data-recebimento"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Justificativa Obrigatória da Substituição */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="replace-justificativa" className="block text-xs font-medium text-slate-300">
                    Justificativa Formal da Substituição <span className="text-rose-400">*</span>
                  </label>
                  <span className={`text-[10px] ${isJustificativaValida ? 'text-slate-400' : 'text-amber-400 font-semibold'}`}>
                    {justificativa.trim().length}/10 caracteres mínimos
                  </span>
                </div>
                <textarea
                  id="replace-justificativa"
                  rows={2}
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  placeholder="Explique o motivo da substituição da base (ex: Cliente reenviou a base corrigindo nulos na coluna data e adicionando o fechamento do mês)..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  data-testid="input-replace-justificativa"
                  disabled={isSubmitting}
                />
              </div>

              {/* Erro de Submissão */}
              {submitError && (
                <div 
                  className="flex items-start gap-2 rounded-lg border border-rose-800/80 bg-rose-950/40 p-3 text-xs text-rose-300"
                  data-testid="replace-submit-error"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-4 bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            data-testid="btn-cancel-replace"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmReplacement}
            disabled={
              isSubmitting ||
              !inspectionResult ||
              isHashIdentico ||
              !versao.trim() ||
              isVersaoIgual ||
              !isJustificativaValida ||
              origem.trim().length < 3
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow-sm transition-colors disabled:opacity-50"
            data-testid="btn-confirm-replace"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Processando Substituição...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Confirmar Substituição</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
