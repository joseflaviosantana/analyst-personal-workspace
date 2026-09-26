'use client';

import React, { useState } from 'react';
import { 
  Database, 
  Plus, 
  X, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  FileSpreadsheet, 
  FileText,
  Info,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  History
} from 'lucide-react';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { 
  EstadoDemanda, 
  isEstadoTerminal, 
  normalizarEstadoDemanda 
} from '@/core/domain/enums/estado-demanda';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { ResultadoInspecaoArquivo } from '@/core/domain/adapters/file-system-adapter.interface';
import { Card } from '@/components/ui/Card';
import { inspectLocalFileAction, registerDataAssetAction } from '@/app/actions/data-asset-actions';
import { DataAssetCard } from './DataAssetCard';
import { DataAssetSchemaModal } from './DataAssetSchemaModal';
import { ReplaceDataAssetModal } from './ReplaceDataAssetModal';

interface TabDataAssetsProps {
  demand: DemandaComProjeto;
  initialAssets?: AtivoDados[];
}

export function TabDataAssets({ demand, initialAssets = [] }: TabDataAssetsProps) {
  const [assets, setAssets] = useState<AtivoDados[]>(initialAssets);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedAssetForSchema, setSelectedAssetForSchema] = useState<AtivoDados | null>(null);
  const [selectedAssetForReplace, setSelectedAssetForReplace] = useState<AtivoDados | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const ativosVigentes = assets.filter((a) => a.status === 'ATIVO');
  const ativosSubstituidos = assets.filter((a) => a.status === 'SUBSTITUIDO');

  const handleAssetReplaced = (result: { ativoSubstituido: AtivoDados; novoAtivo: AtivoDados }) => {
    setAssets((prev) => {
      const updated = prev.map((a) => (a.id === result.ativoSubstituido.id ? result.ativoSubstituido : a));
      return [result.novoAtivo, ...updated.filter((a) => a.id !== result.novoAtivo.id)];
    });
    setFeedback({
      type: 'success',
      message: `Ativo '${result.novoAtivo.nome_arquivo}' (v${result.novoAtivo.versao}) cadastrado com sucesso em substituição a '${result.ativoSubstituido.nome_arquivo}' (v${result.ativoSubstituido.versao}).`,
    });
  };

  // Estados da Fase 1: Inspeção
  const [caminhoLocal, setCaminhoLocal] = useState('');
  const [abaAlvoXlsx, setAbaAlvoXlsx] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<ResultadoInspecaoArquivo | null>(null);
  const [inspectionError, setInspectionError] = useState<string | null>(null);

  // Estados da Fase 2: Metadados Humanos
  const [origem, setOrigem] = useState('');
  const [descricaoConteudo, setDescricaoConteudo] = useState('');
  const [granularidade, setGranularidade] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [dataRecebimento, setDataRecebimento] = useState(() => new Date().toISOString().split('T')[0]);
  const [versao, setVersao] = useState('1.0');
  const [isRegistering, setIsRegistering] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [copiedHash, setCopiedHash] = useState(false);

  // Governança de Workflow da Demanda
  const estadoAtual = normalizarEstadoDemanda(demand.estado);
  const isSuspensa = estadoAtual === EstadoDemanda.SUSPENSA;
  const isConcluida = estadoAtual === EstadoDemanda.CONCLUIDA;
  const isCancelada = estadoAtual === EstadoDemanda.CANCELADA;
  const isTerminal = isEstadoTerminal(estadoAtual);
  const isReadOnly = isSuspensa || isTerminal;

  const isXlsxCandidate = caminhoLocal.toLowerCase().endsWith('.xlsx');

  const handleCopyPreviewHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleResetForm = () => {
    setCaminhoLocal('');
    setAbaAlvoXlsx('');
    setInspectionResult(null);
    setInspectionError(null);
    setOrigem('');
    setDescricaoConteudo('');
    setGranularidade('');
    setPeriodoInicio('');
    setPeriodoFim('');
    setDataRecebimento(new Date().toISOString().split('T')[0]);
    setVersao('1.0');
    setValidationErrors({});
    setIsFormOpen(false);
  };

  // Fase 1: Executar Inspeção Física
  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caminhoLocal.trim()) {
      setInspectionError('Por favor, informe o caminho absoluto do arquivo local.');
      return;
    }

    setIsInspecting(true);
    setInspectionError(null);
    setInspectionResult(null);
    setValidationErrors({});

    try {
      const res = await inspectLocalFileAction(caminhoLocal, abaAlvoXlsx || undefined);
      if (!res.success || !res.data) {
        setInspectionError(res.error || 'Falha ao inspecionar o arquivo.');
      } else if (!res.data.sucesso) {
        setInspectionError(res.data.erros?.join(' ') || 'O arquivo não pôde ser inspecionado com sucesso.');
      } else {
        setInspectionResult(res.data);
      }
    } catch (err: any) {
      setInspectionError(err?.message || 'Erro inesperado durante a inspeção.');
    } finally {
      setIsInspecting(false);
    }
  };

  // Fase 2: Confirmar Cadastro
  const handleConfirmRegister = async () => {
    if (!inspectionResult || !inspectionResult.fisico) return;

    const errors: Record<string, string> = {};
    if (!origem.trim()) {
      errors.origem = 'A origem do arquivo é obrigatória.';
    } else if (origem.trim().length < 3) {
      errors.origem = 'A origem deve conter no mínimo 3 caracteres.';
    }

    if (!dataRecebimento) {
      errors.dataRecebimento = 'A data de recebimento é obrigatória.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsRegistering(true);
    setFeedback(null);

    const fisico = inspectionResult.fisico;
    const conteudo = inspectionResult.conteudo;

    try {
      const res = await registerDataAssetAction({
        demanda_id: demand.id,
        caminho_local: fisico.caminhoNormalizado,
        nome_arquivo: fisico.nomeArquivo,
        formato: fisico.formato as FormatoArquivo,
        tamanho_bytes: fisico.tamanhoBytes,
        total_linhas: conteudo?.totalLinhas ?? 0,
        total_colunas: conteudo?.totalColunas ?? 0,
        hash_sha256: fisico.hashSha256,
        schema_inferido: conteudo?.schemaInferido ? JSON.stringify(conteudo.schemaInferido) : null,
        origem: origem.trim(),
        descricao_conteudo: descricaoConteudo.trim() || null,
        granularidade: granularidade.trim() || null,
        periodo_inicio: periodoInicio || null,
        periodo_fim: periodoFim || null,
        data_recebimento: dataRecebimento,
        versao: versao.trim() || '1.0',
      });

      if (!res.success || !res.data) {
        setFeedback({
          type: 'error',
          message: res.error || 'Falha ao cadastrar o ativo de dados.',
        });
      } else {
        setAssets((prev) => [res.data, ...prev]);
        setFeedback({
          type: 'success',
          message: `Ativo "${res.data.nome_arquivo}" catalogado com sucesso no inventário da demanda.`,
        });
        handleResetForm();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Erro inesperado na confirmação do cadastro.',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6" data-testid="tab-data-assets-container">
      {/* Banner de Governança Read-Only quando aplicável */}
      {isReadOnly && (
        <div 
          className="flex items-center gap-2.5 rounded-lg border border-amber-800/80 bg-amber-950/40 p-3.5 text-xs text-amber-300"
          data-testid="banner-readonly-governance"
        >
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            {isSuspensa && 'Demanda Suspensa: O cadastro e a alteração de ativos estão desabilitados enquanto a demanda estiver pausada.'}
            {isConcluida && 'Demanda Concluída: O inventário de ativos está congelado para auditoria e histórico de entregáveis.'}
            {isCancelada && 'Demanda Cancelada: O inventário de ativos está arquivado em modo estritamente somente-leitura.'}
          </span>
        </div>
      )}

      {/* Banner de Feedback Global */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-lg p-3 text-xs border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/70 border-rose-800 text-rose-300'
          }`}
          data-testid="data-asset-feedback-alert"
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="hover:opacity-75"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Cabeçalho de Ações da Aba (quando o formulário não está aberto) */}
      {!isFormOpen && assets.length > 0 && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-400" />
              <span>Inventário de Ativos de Dados ({assets.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Bases tabulares e arquivos brutos catalogados sob imutabilidade e referência local.
            </p>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(true);
                setFeedback(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm transition-colors"
              data-testid="btn-open-register-asset"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Catalogar Ativo Local</span>
            </button>
          )}
        </div>
      )}

      {/* Formulário Expansível de Catalogação em Duas Fases */}
      {isFormOpen && !isReadOnly && (
        <Card className="p-6 border-blue-900/60 bg-slate-900 shadow-xl" testId="form-register-data-asset">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Catalogar Novo Ativo de Dados Local</h3>
            </div>
            <button
              type="button"
              onClick={handleResetForm}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Cancelar catalogação"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* FASE 1: Inspeção Física do Arquivo */}
          <form onSubmit={handleInspect} className="space-y-4">
            <div>
              <label htmlFor="input-caminho-local" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Caminho Absoluto do Arquivo no Disco Local <span className="text-rose-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="input-caminho-local"
                  type="text"
                  value={caminhoLocal}
                  onChange={(e) => setCaminhoLocal(e.target.value)}
                  placeholder="Ex.: C:\Projetos\Dados\vendas.xlsx ou /Users/.../metas.csv"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  data-testid="input-caminho-local"
                  disabled={isInspecting || isRegistering}
                />
                <button
                  type="submit"
                  disabled={isInspecting || isRegistering || !caminhoLocal.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
                  data-testid="btn-inspect-file"
                >
                  {isInspecting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                      <span>Inspecionando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-3.5 w-3.5 text-blue-400" />
                      <span>Inspecionar Arquivo</span>
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Dica: No Windows Explorer, selecione o arquivo e use Shift + Botão Direito &rarr; &ldquo;Copiar como caminho&rdquo;.
              </p>
            </div>

            {/* Campo Opcional de Worksheet para XLSX (Single-Sheet) */}
            {isXlsxCandidate && (
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200">Configuração de Planilha Excel (XLSX)</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <label htmlFor="input-aba-alvo-xlsx" className="text-xs text-slate-400 shrink-0">
                    Nome da Worksheet (opcional):
                  </label>
                  <input
                    id="input-aba-alvo-xlsx"
                    type="text"
                    value={abaAlvoXlsx}
                    onChange={(e) => setAbaAlvoXlsx(e.target.value)}
                    placeholder="Deixe em branco para inspecionar a primeira aba"
                    className="flex-1 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    data-testid="input-aba-alvo-xlsx"
                    disabled={isInspecting || isRegistering}
                  />
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>
                    Inspeção Otimizada (Single-Sheet): Para proteção estrita de memória, a inspeção analisa uma worksheet por vez.
                  </span>
                </p>
              </div>
            )}

            {/* Mensagem de Erro de Inspeção */}
            {inspectionError && (
              <div 
                className="flex items-center gap-2 rounded-lg border border-rose-800/80 bg-rose-950/50 p-3 text-xs text-rose-300"
                data-testid="inspection-error-alert"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{inspectionError}</span>
              </div>
            )}
          </form>

          {/* FASE 2: Exibição da Prévia e Formulário de Metadados Humanos */}
          {inspectionResult && inspectionResult.sucesso && inspectionResult.fisico && (
            <div className="mt-6 pt-6 border-t border-slate-800 space-y-6" data-testid="inspection-preview-section">
              {/* Card de Resumo da Inspeção Física/Estrutural */}
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-3" data-testid="inspection-preview-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Inspeção Física Concluída com Sucesso (Sem Persistência)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {inspectionResult.fisico.formato} &bull; {formatBytes(inspectionResult.fisico.tamanhoBytes)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Arquivo:</span>
                    <span className="font-semibold text-slate-200 truncate block" title={inspectionResult.fisico.nomeArquivo}>
                      {inspectionResult.fisico.nomeArquivo}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Volumetria Inspecionada:</span>
                    <span className="font-semibold text-emerald-400" data-testid="preview-volumetry">
                      {(inspectionResult.conteudo?.totalLinhas ?? 0).toLocaleString('pt-BR')} lin &times; {inspectionResult.conteudo?.totalColunas ?? 0} col
                    </span>
                  </div>
                  {inspectionResult.conteudo?.worksheetAtiva && (
                    <div>
                      <span className="text-slate-500 text-[11px] block">Aba Inspecionada:</span>
                      <span className="text-slate-200 font-medium">{inspectionResult.conteudo.worksheetAtiva}</span>
                    </div>
                  )}
                  {inspectionResult.conteudo?.delimitadorDetectado && (
                    <div>
                      <span className="text-slate-500 text-[11px] block">Delimitador:</span>
                      <code className="text-blue-300 font-mono">{JSON.stringify(inspectionResult.conteudo.delimitadorDetectado)}</code>
                    </div>
                  )}
                </div>

                {/* Hash SHA-256 */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    <span className="text-slate-500">Hash SHA-256:</span>
                    <span title={inspectionResult.fisico.hashSha256}>
                      {inspectionResult.fisico.hashSha256.slice(0, 16)}...{inspectionResult.fisico.hashSha256.slice(-12)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPreviewHash(inspectionResult.fisico!.hashSha256)}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    {copiedHash ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copiar Hash</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Avisos Estruturais (se houver) */}
                {inspectionResult.avisos && inspectionResult.avisos.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-amber-300 space-y-1">
                    {inspectionResult.avisos.map((aviso, idx) => (
                      <p key={idx} className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400" />
                        <span>{aviso}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Formulário de Metadados Humanos */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Complementação dos Metadados do Ativo
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Origem (Obrigatória, mín 3 caracteres) */}
                  <div>
                    <label htmlFor="input-origem" className="block text-xs font-medium text-slate-300 mb-1">
                      Origem / Fonte Declarada <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="input-origem"
                      type="text"
                      value={origem}
                      onChange={(e) => {
                        setOrigem(e.target.value);
                        if (validationErrors.origem) {
                          setValidationErrors((prev) => {
                            const next = { ...prev };
                            delete next.origem;
                            return next;
                          });
                        }
                      }}
                      placeholder="Ex.: Exportação SAP - Depto Financeiro"
                      className={`w-full rounded-lg border ${
                        validationErrors.origem ? 'border-rose-600' : 'border-slate-700'
                      } bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      data-testid="input-origem"
                      disabled={isRegistering}
                    />
                    {validationErrors.origem && (
                      <span className="text-[11px] text-rose-400 mt-1 block" data-testid="error-origem">
                        {validationErrors.origem}
                      </span>
                    )}
                  </div>

                  {/* Granularidade */}
                  <div>
                    <label htmlFor="input-granularidade" className="block text-xs font-medium text-slate-300 mb-1">
                      Granularidade Observada (Opcional)
                    </label>
                    <input
                      id="input-granularidade"
                      type="text"
                      value={granularidade}
                      onChange={(e) => setGranularidade(e.target.value)}
                      placeholder="Ex.: Transacional (1 linha por venda), Diária, etc."
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      data-testid="input-granularidade"
                      disabled={isRegistering}
                    />
                  </div>

                  {/* Período de Cobertura */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Período Coberto pelos Dados (Opcional)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={periodoInicio}
                        onChange={(e) => setPeriodoInicio(e.target.value)}
                        placeholder="Início"
                        className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        data-testid="input-periodo-inicio"
                        disabled={isRegistering}
                      />
                      <input
                        type="date"
                        value={periodoFim}
                        onChange={(e) => setPeriodoFim(e.target.value)}
                        placeholder="Fim"
                        className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        data-testid="input-periodo-fim"
                        disabled={isRegistering}
                      />
                    </div>
                  </div>

                  {/* Data de Recebimento & Versão */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="input-data-recebimento" className="block text-xs font-medium text-slate-300 mb-1">
                        Data de Recebimento <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id="input-data-recebimento"
                        type="date"
                        value={dataRecebimento}
                        onChange={(e) => setDataRecebimento(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        data-testid="input-data-recebimento"
                        disabled={isRegistering}
                      />
                    </div>
                    <div>
                      <label htmlFor="input-versao" className="block text-xs font-medium text-slate-300 mb-1">
                        Versão
                      </label>
                      <input
                        id="input-versao"
                        type="text"
                        value={versao}
                        onChange={(e) => setVersao(e.target.value)}
                        placeholder="1.0"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        data-testid="input-versao"
                        disabled={isRegistering}
                      />
                    </div>
                  </div>
                </div>

                {/* Descrição do Conteúdo */}
                <div>
                  <label htmlFor="input-descricao-conteudo" className="block text-xs font-medium text-slate-300 mb-1">
                    Descrição do Conteúdo da Base (Opcional)
                  </label>
                  <textarea
                    id="input-descricao-conteudo"
                    rows={2}
                    value={descricaoConteudo}
                    onChange={(e) => setDescricaoConteudo(e.target.value)}
                    placeholder="Descreva suscintamente o teor dos dados, filtros aplicados na extração ou observações relevantes..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    data-testid="input-descricao-conteudo"
                    disabled={isRegistering}
                  />
                </div>
              </div>

              {/* Botões de Ação Final */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleResetForm}
                  disabled={isRegistering}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  data-testid="btn-cancel-register"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRegister}
                  disabled={isRegistering}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow-sm transition-colors disabled:opacity-50"
                  data-testid="btn-confirm-register"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Cadastrando Ativo...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Confirmar Catalogação</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ESTADO VAZIO: Quando a demanda não possui ativos e o formulário está fechado */}
      {!isFormOpen && assets.length === 0 && (
        <div
          data-testid="empty-data-assets"
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-blue-400 mb-4">
            <Database className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">Nenhum ativo de dados catalogado</h3>
          <p className="mt-1 text-sm text-slate-400 max-w-sm">
            Cataloge arquivos tabulares locais (.xlsx, .csv, .tsv, .txt) para iniciar o ciclo de inspeção estrutural e governança analítica.
          </p>
          {!isReadOnly && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm transition-colors"
                data-testid="btn-open-register-asset"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Catalogar Ativo Local</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* LISTA / INVENTÁRIO DOS ATIVOS CADASTRADOS (Alternativa 3A aprovada) */}
      {!isFormOpen && assets.length > 0 && (
        <div className="space-y-6" data-testid="data-assets-list">
          {/* Seção 1: Ativos Vigentes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Ativos Vigentes ({ativosVigentes.length})
                </h4>
                <span className="text-[11px] text-slate-500">
                  Fontes em vigor para modelagem e análise
                </span>
              </div>
            </div>

            {ativosVigentes.length > 0 ? (
              <div className="space-y-4" data-testid="active-data-assets-list">
                {ativosVigentes.map((asset) => (
                  <DataAssetCard
                    key={asset.id}
                    asset={asset}
                    onViewSchema={(a) => setSelectedAssetForSchema(a)}
                    onReplace={(a) => setSelectedAssetForReplace(a)}
                    isReadOnly={isReadOnly}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-center text-xs text-slate-400">
                Nenhum ativo vigente no momento. Todos os ativos catalogados foram substituídos.
              </div>
            )}
          </div>

          {/* Seção 2: Histórico de Ativos Substituídos (Alternativa 3A aprovada) */}
          {ativosSubstituidos.length > 0 && (
            <div className="border-t border-slate-800/80 pt-4" data-testid="section-replaced-assets">
              <button
                type="button"
                onClick={() => setIsHistoryOpen((prev) => !prev)}
                className="flex items-center justify-between w-full p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:bg-slate-900 transition-colors text-left"
                data-testid="btn-toggle-replaced-history"
              >
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-300">
                    Histórico de Ativos Substituídos ({ativosSubstituidos.length})
                  </span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
                    Auditável
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>{isHistoryOpen ? 'Ocultar' : 'Exibir'}</span>
                  {isHistoryOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </button>

              {isHistoryOpen && (
                <div className="mt-3 space-y-4 pl-2 border-l-2 border-slate-800/80" data-testid="replaced-data-assets-list">
                  {ativosSubstituidos.map((asset) => (
                    <DataAssetCard
                      key={asset.id}
                      asset={asset}
                      onViewSchema={(a) => setSelectedAssetForSchema(a)}
                      isReadOnly={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalhes e Visualização de Schema */}
      <DataAssetSchemaModal
        asset={selectedAssetForSchema}
        onClose={() => setSelectedAssetForSchema(null)}
      />

      {/* Modal de Substituição de Ativo (Unidade 3.3B) */}
      <ReplaceDataAssetModal
        asset={selectedAssetForReplace}
        onClose={() => setSelectedAssetForReplace(null)}
        onReplaced={handleAssetReplaced}
      />
    </div>
  );
}
