'use client';

import React, { useState } from 'react';
import { X, Copy, Check, FileSpreadsheet, FileText, Database, Calendar, HardDrive, Hash, Layers } from 'lucide-react';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { ROTULOS_FORMATO_ARQUIVO } from '@/core/domain/enums/formato-arquivo';

interface DataAssetSchemaModalProps {
  asset: AtivoDados | null;
  onClose: () => void;
}

export function DataAssetSchemaModal({ asset, onClose }: DataAssetSchemaModalProps) {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!asset) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(asset.hash_sha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  let schemaEntries: Array<{ nome: string; tipo: string }> = [];
  if (asset.schema_inferido) {
    try {
      const parsed = JSON.parse(asset.schema_inferido);
      if (typeof parsed === 'object' && parsed !== null) {
        schemaEntries = Object.entries(parsed).map(([nome, tipo]) => ({
          nome,
          tipo: String(tipo),
        }));
      }
    } catch {
      // ignore JSON parse error
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isExcel = asset.formato === 'XLSX' || asset.formato === 'XLS';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      data-testid="data-asset-schema-modal"
    >
      <div className="w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800">
              {isExcel ? (
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
              ) : (
                <FileText className="h-5 w-5 text-blue-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Ficha do Ativo</span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                  {ROTULOS_FORMATO_ARQUIVO[asset.formato] || asset.formato}
                </span>
                <span className="rounded bg-blue-950/80 border border-blue-800/80 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300">
                  v{asset.versao || '1.0'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5 truncate max-w-lg" title={asset.nome_arquivo}>
                {asset.nome_arquivo}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            data-testid="btn-close-schema-modal"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body rolável */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Metadados Técnicos / Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1">
              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                <HardDrive className="h-3 w-3" /> Tamanho
              </span>
              <p className="font-semibold text-slate-200">{formatBytes(asset.tamanho_bytes)}</p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1">
              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                <Layers className="h-3 w-3" /> Linhas
              </span>
              <p className="font-semibold text-slate-200">{asset.total_linhas.toLocaleString('pt-BR')}</p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1">
              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                <Database className="h-3 w-3" /> Colunas
              </span>
              <p className="font-semibold text-slate-200">{asset.total_colunas}</p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1">
              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Recebimento
              </span>
              <p className="font-semibold text-slate-200">{asset.data_recebimento}</p>
            </div>
          </div>

          {/* Caminho e Hash de Integridade */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Caminho de Referência Local no Disco
              </span>
              <code className="text-slate-300 font-mono text-[11px] break-all select-all block bg-slate-900 border border-slate-800/80 p-2 rounded">
                {asset.caminho_local}
              </code>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5 text-blue-400" /> Hash SHA-256 de Integridade
                </span>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                  data-testid="btn-copy-hash"
                >
                  {copiedHash ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copiar Hash</span>
                    </>
                  )}
                </button>
              </div>
              <code className="text-slate-400 font-mono text-[11px] break-all select-all block bg-slate-900 border border-slate-800/80 p-2 rounded">
                {asset.hash_sha256}
              </code>
            </div>
          </div>

          {/* Metadados de Negócio */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Metadados de Negócio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 text-[11px] block">Origem Declarada:</span>
                <span className="text-slate-200 font-medium">{asset.origem || 'Não informada'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Granularidade:</span>
                <span className="text-slate-200 font-medium">{asset.granularidade || 'Não informada'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Período Coberto:</span>
                <span className="text-slate-200 font-medium">
                  {asset.periodo_inicio || asset.periodo_fim 
                    ? `${asset.periodo_inicio || 'Início indeterminado'} até ${asset.periodo_fim || 'Fim indeterminado'}`
                    : 'Não especificado'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Status no Inventário:</span>
                <span className="text-emerald-400 font-medium">{asset.status}</span>
              </div>
            </div>

            {asset.descricao_conteudo && (
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-500 text-[11px] block mb-1">Descrição do Conteúdo:</span>
                <p className="text-slate-300 leading-relaxed text-xs">{asset.descricao_conteudo}</p>
              </div>
            )}
          </div>

          {/* Tabela de Schema Inferido */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-blue-400" />
                <span>Colunas e Tipos Inferidos ({schemaEntries.length})</span>
              </h3>
            </div>

            {schemaEntries.length === 0 ? (
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-center text-slate-500">
                Nenhum esquema tabular estruturado inferido para este ativo.
              </div>
            ) : (
              <div className="rounded-lg border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs" data-testid="table-asset-schema">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3 font-semibold w-12 text-center">#</th>
                      <th className="py-2 px-3 font-semibold">Nome da Coluna</th>
                      <th className="py-2 px-3 font-semibold w-32">Tipo Inferido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {schemaEntries.map((col, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-medium text-slate-200">{col.nome}</td>
                        <td className="py-2 px-3">
                          <span className="rounded bg-slate-800 border border-slate-700/80 px-2 py-0.5 text-[10px] font-mono text-blue-300">
                            {col.tipo}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-4 bg-slate-900/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
