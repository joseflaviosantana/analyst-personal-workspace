'use client';

import React from 'react';
import {
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EntregavelDemanda } from '@/core/domain/entities/entregavel-demanda';
import { StatusEntregavel, ROTULOS_STATUS_ENTREGAVEL } from '@/core/domain/enums/status-entregavel';
import { StatusAceiteEntrega, ROTULOS_STATUS_ACEITE_ENTREGA } from '@/core/domain/enums/status-aceite-entrega';
import { ROTULOS_TIPO_ENTREGAVEL } from '@/core/domain/enums/tipo-entregavel';

interface DeliverableCardListProps {
  entregaveis: EntregavelDemanda[];
  readOnly?: boolean;
  onEdit: (entregavel: EntregavelDemanda) => void;
  onDelete: (entregavelId: string) => void;
  onDisponibilizar: (entregavelId: string) => void;
  onRegistrarAceite: (entregavel: EntregavelDemanda) => void;
}

export function DeliverableCardList({
  entregaveis,
  readOnly = false,
  onEdit,
  onDelete,
  onDisponibilizar,
  onRegistrarAceite,
}: DeliverableCardListProps) {
  if (entregaveis.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed border-slate-800 p-8 text-center"
        data-testid="deliverable-list-empty"
      >
        <Package className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-slate-300">
          Nenhum entregável cadastrado
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Adicione artefatos de entrega como relatórios executivos, arquivos .pbix, documentações técnicas ou planilhas consolidadas para compor o pacote da demanda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="deliverable-card-list">
      {entregaveis.map((item) => {
        const isDisponivel = item.status === StatusEntregavel.DISPONIVEL;
        const isHomologado = item.status === StatusEntregavel.HOMOLOGADO;
        const isAceito = item.aceite_status === StatusAceiteEntrega.ACEITO;
        const isRejeitado = item.aceite_status === StatusAceiteEntrega.REJEITADO;
        const isAjustes = item.aceite_status === StatusAceiteEntrega.AJUSTES_SOLICITADOS;

        const statusColor = isHomologado
          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
          : isDisponivel
          ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50'
          : 'bg-slate-800 text-slate-300 border-slate-700';

        const aceiteBadge = isAceito ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Aceito
          </span>
        ) : isRejeitado ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/80 text-rose-300 border border-rose-800/60">
            <XCircle className="h-3 w-3 text-rose-400" />
            Rejeitado
          </span>
        ) : isAjustes ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/80 text-amber-300 border border-amber-800/60">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            Ajustes Solicitados
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700">
            <Clock className="h-3 w-3 text-slate-400" />
            Pendente
          </span>
        );

        return (
          <Card
            key={item.id}
            data-testid={`deliverable-card-${item.id}`}
            className="p-4 border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              {/* Informações Principais */}
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {ROTULOS_TIPO_ENTREGAVEL[item.tipo] || item.tipo}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${statusColor}`}>
                    {ROTULOS_STATUS_ENTREGAVEL[item.status] || item.status}
                  </span>
                  <span className="text-xs font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                    v{item.versao}
                  </span>
                  {item.obrigatorio ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                      Obrigatório
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-500">
                      Opcional
                    </span>
                  )}
                  {aceiteBadge}
                </div>

                <h4 className="text-sm font-semibold text-white">
                  {item.titulo}
                </h4>

                {item.descricao_sumario && (
                  <p className="text-xs text-slate-400">
                    {item.descricao_sumario}
                  </p>
                )}

                {item.caminho_arquivo_ou_link && (
                  <div className="flex items-center gap-1.5 pt-1 text-xs">
                    <span className="text-slate-500">Caminho / Artefato:</span>
                    <a
                      href={item.caminho_arquivo_ou_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 truncate max-w-md"
                    >
                      {item.caminho_arquivo_ou_link}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                )}

                {/* Bloco de Auditoria de Aceite */}
                {item.aceite_status !== StatusAceiteEntrega.PENDENTE && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>
                        <strong className="text-slate-300">Deliberação:</strong> {ROTULOS_STATUS_ACEITE_ENTREGA[item.aceite_status]}
                      </span>
                      {item.aceite_por && (
                        <span>
                          <strong className="text-slate-300">Por:</strong> {item.aceite_por}
                        </span>
                      )}
                      {item.aceite_em && (
                        <span>
                          <strong className="text-slate-300">Em:</strong>{' '}
                          {new Date(item.aceite_em).toLocaleDateString('pt-BR', {
                            timeZone: 'UTC',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    {item.aceite_justificativa && (
                      <p className="italic text-slate-400">
                        &ldquo;{item.aceite_justificativa}&rdquo;
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              {!readOnly && (
                <div className="flex sm:flex-col items-center gap-1.5 shrink-0 self-end sm:self-start">
                  {!isDisponivel && !isAceito && (
                    <button
                      onClick={() => onDisponibilizar(item.id)}
                      data-testid={`btn-disponibilizar-${item.id}`}
                      title="Marcar entregável como DISPONÍVEL para homologação"
                      className="px-2.5 py-1 text-xs font-medium rounded bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-200 border border-indigo-700/50 flex items-center gap-1 transition-colors"
                    >
                      <Send className="h-3 w-3" />
                      Disponibilizar
                    </button>
                  )}

                  <button
                    onClick={() => onRegistrarAceite(item)}
                    data-testid={`btn-aceite-${item.id}`}
                    title="Registrar deliberação de aceite formal do stakeholder"
                    className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 flex items-center gap-1 transition-colors"
                  >
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    Aceite Formal
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(item)}
                      data-testid={`btn-editar-${item.id}`}
                      title="Editar metadados do entregável"
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {!isAceito && (
                      <button
                        onClick={() => onDelete(item.id)}
                        data-testid={`btn-excluir-${item.id}`}
                        title="Remover entregável"
                        className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
