'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { ChecklistSanitizacao } from '@/core/domain/entities/estudo-caso-portfolio';
import { ShieldCheck, ShieldAlert, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';

interface SanitizationChecklistPanelProps {
  checklist: ChecklistSanitizacao;
  disabled?: boolean;
  onChange: (updated: ChecklistSanitizacao) => void;
}

export function SanitizationChecklistPanel({
  checklist,
  disabled = false,
  onChange,
}: SanitizationChecklistPanelProps) {
  const items = [
    {
      key: 'nomesClientesOcultados' as const,
      label: 'Nomes de Clientes, Parceiros e Fornecedores Ocultados',
      description:
        'Substituição por termos genéricos ("Empresa Varejista", "Operadora de Saúde Líder", "Instituição de Ensino Superior").',
      category: 'DESIDENTIFICACAO',
    },
    {
      key: 'dadosPessoaisOcultados' as const,
      label: 'Dados Pessoais (LGPD/GDPR) e Credenciais 100% Removidos',
      description:
        'Nenhum CPF, e-mail, telefone, chave de acesso, hash interno de identificador de pessoa física ou senha na narrativa.',
      category: 'LGPD_SEGREDOS',
    },
    {
      key: 'dadosFinanceirosSigilososTratados' as const,
      label: 'Dados Financeiros Sigilosos Proporcionalmente Tratados',
      description:
        'Aplicação de sanitização proporcional: agregação, índices relativos (base 100), variações percentuais ou dados sintéticos.',
      category: 'FINANCEIRO',
    },
    {
      key: 'metricasFatuaisPreservadas' as const,
      label: 'Fidelidade Factual de Métricas e Metodologias Preservada',
      description:
        'As conclusões analíticas, desafios técnicos, fórmulas e decisões metodológicas refletem fielmente o trabalho executado.',
      category: 'INTEGRIDADE',
    },
  ];

  const totalAtendidos =
    (checklist.nomesClientesOcultados ? 1 : 0) +
    (checklist.dadosPessoaisOcultados ? 1 : 0) +
    (checklist.dadosFinanceirosSigilososTratados ? 1 : 0) +
    (checklist.metricasFatuaisPreservadas ? 1 : 0) +
    (checklist.declaracaoHumanaAssinada ? 1 : 0);

  const isCompleto = totalAtendidos === 5;

  const handleToggle = (key: keyof ChecklistSanitizacao) => {
    if (disabled) return;
    onChange({
      ...checklist,
      [key]: !checklist[key],
    });
  };

  return (
    <Card className="p-5 bg-slate-900 border-slate-800" data-testid="sanitization-checklist-panel">
      {/* Header com Progresso */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {isCompleto ? (
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-amber-400" />
          )}
          <div>
            <h4 className="text-sm font-semibold text-white">
              Checklist Soberano de Sanitização e Desidentificação
            </h4>
            <p className="text-xs text-slate-400">
              Requisito inegociável para a homologação formal APROV-10 e exportação pública.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              isCompleto
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/60 border-amber-800 text-amber-300'
            }`}
            data-testid="checklist-progress-badge"
          >
            {totalAtendidos}/5 itens atestados
          </span>
        </div>
      </div>

      {/* 4 Itens de Desidentificação */}
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const checked = checklist[item.key];
          return (
            <label
              key={item.key}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                checked
                  ? 'border-emerald-900/50 bg-emerald-950/15'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => handleToggle(item.key)}
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                data-testid={`checkbox-${item.key}`}
              />
              <div className="flex-1">
                <span
                  className={`text-xs font-medium block ${
                    checked ? 'text-emerald-200' : 'text-slate-300'
                  }`}
                >
                  {item.label}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </label>
          );
        })}

        {/* 5º Item — Declaração Humana Soberana Formal */}
        <div
          className={`p-4 rounded-lg border transition-all ${
            checklist.declaracaoHumanaAssinada
              ? 'border-indigo-800/80 bg-indigo-950/20'
              : 'border-amber-900/40 bg-amber-950/10'
          }`}
        >
          <label
            className={`flex items-start gap-3 cursor-pointer select-none ${
              disabled ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={checklist.declaracaoHumanaAssinada}
              disabled={disabled}
              onChange={() => handleToggle('declaracaoHumanaAssinada')}
              className="mt-1 h-4 w-4 rounded border-indigo-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
              data-testid="checkbox-declaracaoHumanaAssinada"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                <UserCheck className="h-4 w-4 text-indigo-400" />
                <span>Declaração de Revisão Humana Soberana (Obrigatória)</span>
              </div>
              <p className="text-xs text-slate-300 italic mt-1 leading-relaxed">
                &ldquo;Declaro, sob minha responsabilidade profissional como analista humano, que
                revisei integralmente este estudo de caso, conferi a higienização de cada métrica e
                atesto que o conteúdo está plenamente sanitizado, factual e aderente às diretrizes de
                segurança da informação.&rdquo;
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Alerta de Bloqueio se Incompleto */}
      {!isCompleto && (
        <div className="mt-4 p-3 rounded-lg border border-amber-900/60 bg-amber-950/30 text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            A homologação formal APROV-10 permanece bloqueada até que todos os 5 itens do checklist
            estejam atestados.
          </span>
        </div>
      )}
    </Card>
  );
}
