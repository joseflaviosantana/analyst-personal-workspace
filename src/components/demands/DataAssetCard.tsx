'use client';

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Copy, 
  Check, 
  Eye, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Calendar,
  Layers
} from 'lucide-react';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { ROTULOS_FORMATO_ARQUIVO } from '@/core/domain/enums/formato-arquivo';
import { Card } from '@/components/ui/Card';
import { checkAssetAccessibilityAction } from '@/app/actions/data-asset-actions';
import { ResultadoAcessibilidade } from '@/core/domain/adapters/file-system-adapter.interface';

interface DataAssetCardProps {
  asset: AtivoDados;
  onViewSchema: (asset: AtivoDados) => void;
}

export function DataAssetCard({ asset, onViewSchema }: DataAssetCardProps) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [accessResult, setAccessResult] = useState<ResultadoAcessibilidade | null>(null);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(asset.hash_sha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCheckAccess = async () => {
    setIsCheckingAccess(true);
    try {
      const res = await checkAssetAccessibilityAction(asset.id);
      if (res.success && res.data) {
        setAccessResult(res.data);
      } else {
        setAccessResult({
          existe: false,
          legivel: false,
          eArquivoRegular: false,
          erro: res.error || 'Erro na verificação de acessibilidade.',
        });
      }
    } catch (err: any) {
      setAccessResult({
        existe: false,
        legivel: false,
        eArquivoRegular: false,
        erro: err?.message || 'Falha de comunicação.',
      });
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const isExcel = asset.formato === 'XLSX' || asset.formato === 'XLS';

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const shortHash = asset.hash_sha256 ? `${asset.hash_sha256.slice(0, 10)}...${asset.hash_sha256.slice(-8)}` : '';

  return (
    <Card className="p-5 border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-colors" testId={`data-asset-card-${asset.id}`}>
      <div className="flex flex-col gap-4">
        {/* Top bar: Ícone, Nome, Badges e Ações principais */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950">
              {isExcel ? (
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
              ) : (
                <FileText className="h-5 w-5 text-blue-400" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-slate-200 text-sm" data-testid={`asset-name-${asset.id}`}>
                  {asset.nome_arquivo}
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                  {ROTULOS_FORMATO_ARQUIVO[asset.formato] || asset.formato}
                </span>
                <span className="rounded bg-blue-950/80 border border-blue-800/80 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300">
                  v{asset.versao || '1.0'}
                </span>
                <span className="rounded bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                  {asset.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-lg" title={asset.caminho_local}>
                {asset.caminho_local}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={handleCheckAccess}
              disabled={isCheckingAccess}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
              data-testid={`btn-check-accessibility-${asset.id}`}
              title="Checar acessibilidade física do arquivo no disco"
            >
              <RefreshCw className={`h-3 w-3 ${isCheckingAccess ? 'animate-spin text-blue-400' : ''}`} />
              <span>{isCheckingAccess ? 'Verificando...' : 'Checar Acesso'}</span>
            </button>

            <button
              type="button"
              onClick={() => onViewSchema(asset)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-900/80 bg-blue-950/40 px-2.5 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-900/60 hover:text-white transition-colors"
              data-testid={`btn-view-schema-${asset.id}`}
            >
              <Eye className="h-3 w-3" />
              <span>Ver Schema</span>
            </button>
          </div>
        </div>

        {/* Status de Acessibilidade (se consultado) */}
        {accessResult && (
          <div 
            className={`flex items-center justify-between p-2 rounded text-xs border ${
              accessResult.existe && accessResult.legivel 
                ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300'
                : 'bg-rose-950/50 border-rose-800/80 text-rose-300'
            }`}
            data-testid={`accessibility-status-${asset.id}`}
          >
            <div className="flex items-center gap-1.5">
              {accessResult.existe && accessResult.legivel ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Arquivo acessível e legível no disco local.</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span>{accessResult.erro || 'Arquivo não encontrado ou inacessível no caminho local informado.'}</span>
                </>
              )}
            </div>
            <button 
              type="button" 
              onClick={() => setAccessResult(null)}
              className="text-[10px] text-slate-400 hover:text-slate-200"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Detalhes de Volumetria e Metadados em Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 text-[11px] block flex items-center gap-1">
              <Layers className="h-3 w-3" /> Volumetria
            </span>
            <span className="font-semibold text-slate-200" data-testid={`asset-volumetry-${asset.id}`}>
              {asset.total_linhas.toLocaleString('pt-BR')} lin × {asset.total_colunas} col
            </span>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">Tamanho</span>
            <span className="font-semibold text-slate-200">{formatBytes(asset.tamanho_bytes)}</span>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Recebimento
            </span>
            <span className="text-slate-200 font-medium">{asset.data_recebimento}</span>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">Origem Declarada</span>
            <span className="text-slate-200 font-medium truncate block" title={asset.origem || ''}>
              {asset.origem || 'Não informada'}
            </span>
          </div>
        </div>

        {/* Granularidade, Período e Hash SHA-256 */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            {asset.granularidade && (
              <span>
                Granularidade: <strong className="text-slate-300 font-normal">{asset.granularidade}</strong>
              </span>
            )}
            {(asset.periodo_inicio || asset.periodo_fim) && (
              <span>
                Período: <strong className="text-slate-300 font-normal">{asset.periodo_inicio || '...'} a {asset.periodo_fim || '...'}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <span className="text-slate-500">Hash:</span>
            <span title={asset.hash_sha256}>{shortHash}</span>
            <button
              type="button"
              onClick={handleCopyHash}
              className="p-1 hover:text-white transition-colors"
              title="Copiar hash SHA-256 completo"
              data-testid={`btn-copy-hash-${asset.id}`}
            >
              {copiedHash ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
