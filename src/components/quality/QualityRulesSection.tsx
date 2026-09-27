'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Plus,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Edit3,
  Key,
  Hash,
  ListFilter,
  CheckSquare,
  Calendar,
  Loader2
} from 'lucide-react';
import { RegraQualidade } from '@/core/domain/entities/regra-qualidade';
import { TipoRegraQualidade, ROTULOS_TIPO_REGRA_QUALIDADE } from '@/core/domain/enums/tipo-regra-qualidade';
import { StatusRegraQualidade } from '@/core/domain/enums/status-regra-qualidade';
import { Card } from '@/components/ui/Card';
import { toggleQualityRuleStatusAction } from '@/app/actions/quality-actions';

interface QualityRulesSectionProps {
  rules: RegraQualidade[];
  demandaId: string;
  onOpenCreateRule: () => void;
  onEditRule: (rule: RegraQualidade) => void;
  onRuleToggled: (updated: RegraQualidade) => void;
  isReadOnly?: boolean;
}

export function QualityRulesSection({
  rules,
  demandaId,
  onOpenCreateRule,
  onEditRule,
  onRuleToggled,
  isReadOnly = false,
}: QualityRulesSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const regrasAtivas = rules.filter((r) => r.status === StatusRegraQualidade.ATIVA);
  const regrasInativas = rules.filter((r) => r.status === StatusRegraQualidade.INATIVA);

  const handleToggle = async (rule: RegraQualidade) => {
    if (isReadOnly) return;
    setTogglingId(rule.id);
    const novoStatus = rule.status === StatusRegraQualidade.ATIVA
      ? StatusRegraQualidade.INATIVA
      : StatusRegraQualidade.ATIVA;

    try {
      const res = await toggleQualityRuleStatusAction({
        id: rule.id,
        demandaId,
        novoStatus,
      });

      if (res.success && res.data) {
        onRuleToggled(res.data);
      }
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  };

  const getTipoIcon = (tipo: TipoRegraQualidade) => {
    switch (tipo) {
      case TipoRegraQualidade.CHAVE_UNICA:
        return <Key className="h-4 w-4 text-amber-400" />;
      case TipoRegraQualidade.VALOR_MIN_MAX:
        return <Hash className="h-4 w-4 text-emerald-400" />;
      case TipoRegraQualidade.VALORES_PERMITIDOS:
        return <ListFilter className="h-4 w-4 text-blue-400" />;
      case TipoRegraQualidade.OBRIGATORIEDADE:
        return <CheckSquare className="h-4 w-4 text-cyan-400" />;
      case TipoRegraQualidade.REGRA_TEMPORAL:
        return <Calendar className="h-4 w-4 text-purple-400" />;
      default:
        return <Sliders className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/60 overflow-hidden" testId="quality-rules-section">
      {/* Header do Accordion */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/80">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          data-testid="btn-toggle-rules-accordion"
          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">
                Regras de Negócio Humanas (R1–R5)
              </span>
              <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-300">
                {regrasAtivas.length} ativas / {rules.length} configuradas
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Validações determinísticas configuradas pelo analista para este ativo de dados
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onOpenCreateRule}
            disabled={isReadOnly}
            data-testid="btn-add-quality-rule"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-blue-400" />
            <span>Adicionar Regra</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Expansível */}
      {isOpen && (
        <div className="border-t border-slate-800/80 p-5 space-y-4 bg-slate-950/20">
          {rules.length > 0 ? (
            <div className="space-y-3" data-testid="quality-rules-list">
              {rules.map((rule) => {
                const isAtiva = rule.status === StatusRegraQualidade.ATIVA;
                const isToggling = togglingId === rule.id;

                return (
                  <div
                    key={rule.id}
                    data-testid={`quality-rule-item-${rule.id}`}
                    className={`rounded-lg border p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isAtiva
                        ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        : 'border-slate-800/60 bg-slate-950/40 opacity-70 border-dashed'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                          {getTipoIcon(rule.tipo)}
                          <span>{rule.nome}</span>
                        </div>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                          {ROTULOS_TIPO_REGRA_QUALIDADE[rule.tipo]}
                        </span>
                        <span className="font-mono text-[10px] text-blue-400">
                          v{rule.versao}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
                            isAtiva
                              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {isAtiva ? 'ATIVA' : 'INATIVA'}
                        </span>
                      </div>

                      {rule.descricao && (
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {rule.descricao}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                        <span>
                          Coluna(s): <strong className="text-slate-300 font-mono">{rule.colunas.join(', ')}</strong>
                        </span>
                        <span>•</span>
                        <span>Atualizada em {new Date(rule.atualizado_em).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggle(rule)}
                        disabled={isToggling || isReadOnly}
                        data-testid={`btn-toggle-rule-status-${rule.id}`}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          isAtiva
                            ? 'border-amber-800/80 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60'
                            : 'border-emerald-800/80 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60'
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isAtiva ? (
                          <XCircle className="h-3.5 w-3.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        <span>{isAtiva ? 'Desativar' : 'Ativar'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditRule(rule)}
                        disabled={isReadOnly}
                        data-testid={`btn-edit-rule-${rule.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg text-xs text-slate-500">
              <p>Nenhuma regra de negócio configurada para este ativo de dados.</p>
              <p className="mt-1 text-slate-400">
                Você pode declarar regras personalizadas de chave única, limites, valores válidos, obrigatoriedade ou temporais.
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
