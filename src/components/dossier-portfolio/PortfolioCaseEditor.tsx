'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import {
  EstudoCasoPortfolio,
  ChecklistSanitizacao,
  MetricaFatoCase,
} from '@/core/domain/entities/estudo-caso-portfolio';
import { TecnicaSanitizacao, ROTULOS_TECNICA_SANITIZACAO } from '@/core/domain/enums/tecnica-sanitizacao';
import { SanitizationChecklistPanel } from './SanitizationChecklistPanel';
import {
  FileEdit,
  Sparkles,
  Layers,
  Calculator,
  CheckCircle,
  Tag,
  Wrench,
  BarChart3,
  Plus,
  Trash2,
} from 'lucide-react';

interface PortfolioCaseEditorProps {
  caseData: EstudoCasoPortfolio;
  disabled?: boolean;
  onChange: (updated: Partial<EstudoCasoPortfolio>) => void;
}

export function PortfolioCaseEditor({ caseData, disabled = false, onChange }: PortfolioCaseEditorProps) {
  const handleTextChange = (field: keyof EstudoCasoPortfolio, value: string) => {
    onChange({ [field]: value });
  };

  const handleToggleTecnica = (tecnica: TecnicaSanitizacao) => {
    if (disabled) return;
    const current = caseData.tecnicas_sanitizacao || [];
    const exists = current.includes(tecnica);
    const updated = exists ? current.filter((t) => t !== tecnica) : [...current, tecnica];
    onChange({ tecnicas_sanitizacao: updated });
  };

  const handleChecklistChange = (checklist_sanitizacao: ChecklistSanitizacao) => {
    onChange({ checklist_sanitizacao });
  };

  const handleAddMetrica = () => {
    if (disabled) return;
    const current = caseData.metricas_fatos || [];
    const nova: MetricaFatoCase = {
      rotulo: 'Novo Indicador Sanitizado',
      expressaoSanitizada: '+0.0%',
      impactoOuConclusao: 'Impacto mensurável obtido na análise.',
    };
    onChange({ metricas_fatos: [...current, nova] });
  };

  const handleUpdateMetrica = (index: number, patch: Partial<MetricaFatoCase>) => {
    if (disabled) return;
    const current = [...(caseData.metricas_fatos || [])];
    current[index] = { ...current[index], ...patch };
    onChange({ metricas_fatos: current });
  };

  const handleRemoveMetrica = (index: number) => {
    if (disabled) return;
    const current = [...(caseData.metricas_fatos || [])];
    current.splice(index, 1);
    onChange({ metricas_fatos: current });
  };

  return (
    <div className="space-y-6" data-testid="portfolio-case-editor">
      {/* Título Sanitizado */}
      <Card className="p-5 bg-slate-900 border-slate-800">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
          Título Profissional do Estudo de Caso (Sanitizado)
        </label>
        <input
          type="text"
          value={caseData.titulo}
          disabled={disabled}
          onChange={(e) => handleTextChange('titulo', e.target.value)}
          placeholder="Ex: Estudo de Caso Analítico: Otimização de Performance e Margem"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          data-testid="input-case-title"
        />
        <p className="mt-1.5 text-[11px] text-slate-400">
          Recomendação: Omitir nomes proprietários de clientes, substituindo por arquétipos de negócio.
        </p>
      </Card>

      {/* 4 Blocos da Narrativa STAR */}
      <div className="space-y-5">
        {/* Situação & Problema de Negócio (STAR - S) */}
        <Card className="p-5 bg-slate-900 border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-900/60 border border-blue-700 text-blue-300 text-xs font-bold">
              S
            </div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Situação & Problema de Negócio (Contexto Analítico)
            </label>
          </div>
          <textarea
            rows={4}
            value={caseData.problema_negocio}
            disabled={disabled}
            onChange={(e) => handleTextChange('problema_negocio', e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 font-mono leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 resize-y"
            data-testid="textarea-problema-negocio"
          />
        </Card>

        {/* Tarefa & Preparação de Dados (STAR - T) */}
        <Card className="p-5 bg-slate-900 border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-900/60 border border-teal-700 text-teal-300 text-xs font-bold">
              T
            </div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Tarefa & Engenharia de Dados (Perfilamento, Qualidade & Power Query M)
            </label>
          </div>
          <textarea
            rows={4}
            value={caseData.processo_preparacao}
            disabled={disabled}
            onChange={(e) => handleTextChange('processo_preparacao', e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 font-mono leading-relaxed focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 resize-y"
            data-testid="textarea-processo-preparacao"
          />
        </Card>

        {/* Ação, Modelagem & Decisões (STAR - A) */}
        <Card className="p-5 bg-slate-900 border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-900/60 border border-purple-700 text-purple-300 text-xs font-bold">
              A
            </div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Ação, Modelagem Dimensional & Medidas DAX
            </label>
          </div>
          <textarea
            rows={4}
            value={caseData.modelagem_decisoes}
            disabled={disabled}
            onChange={(e) => handleTextChange('modelagem_decisoes', e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 font-mono leading-relaxed focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50 resize-y"
            data-testid="textarea-modelagem-decisoes"
          />
        </Card>

        {/* Resultados Fatuais & Validação (STAR - R) */}
        <Card className="p-5 bg-slate-900 border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-900/60 border border-emerald-700 text-emerald-300 text-xs font-bold">
              R
            </div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Resultados Fatuais & Reconciliação Numérica (Impacto Comprovado)
            </label>
          </div>
          <textarea
            rows={5}
            value={caseData.validacao_resultados}
            disabled={disabled}
            onChange={(e) => handleTextChange('validacao_resultados', e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 font-mono leading-relaxed focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 resize-y"
            data-testid="textarea-validacao-resultados"
          />
        </Card>
      </div>

      {/* Técnicas de Sanitização Proporcionais Utilizadas */}
      <Card className="p-5 bg-slate-900 border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Técnicas de Sanitização Proporcionais Utilizadas
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {Object.values(TecnicaSanitizacao).map((tec) => {
            const isSelected = caseData.tecnicas_sanitizacao?.includes(tec);
            return (
              <label
                key={tec}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                  isSelected
                    ? 'border-cyan-800 bg-cyan-950/40 text-cyan-200'
                    : 'border-slate-800 bg-slate-950/30 text-slate-400 hover:border-slate-700'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={disabled}
                  onChange={() => handleToggleTecnica(tec)}
                  className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                  data-testid={`checkbox-tecnica-${tec}`}
                />
                <span className="font-medium">{ROTULOS_TECNICA_SANITIZACAO[tec]}</span>
              </label>
            );
          })}
        </div>
      </Card>

      {/* Métricas e Fatos Extraídos */}
      <Card className="p-5 bg-slate-900 border-slate-800">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Métricas & Fatos Fatuais Sanitizados ({caseData.metricas_fatos?.length || 0})
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddMetrica}
            disabled={disabled}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
            data-testid="btn-add-metrica-fato"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Adicionar Fato</span>
          </button>
        </div>

        <div className="space-y-3">
          {(caseData.metricas_fatos || []).map((mf, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
            >
              <div className="sm:col-span-4">
                <label className="text-[10px] text-slate-400 font-medium block mb-1">Rótulo</label>
                <input
                  type="text"
                  value={mf.rotulo}
                  disabled={disabled}
                  onChange={(e) => handleUpdateMetrica(idx, { rotulo: e.target.value })}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
                  data-testid={`input-metrica-rotulo-${idx}`}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="text-[10px] text-slate-400 font-medium block mb-1">
                  Expressão Sanitizada
                </label>
                <input
                  type="text"
                  value={mf.expressaoSanitizada}
                  disabled={disabled}
                  onChange={(e) => handleUpdateMetrica(idx, { expressaoSanitizada: e.target.value })}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-cyan-300 font-mono disabled:opacity-50"
                  data-testid={`input-metrica-expressao-${idx}`}
                />
              </div>
              <div className="sm:col-span-4">
                <label className="text-[10px] text-slate-400 font-medium block mb-1">
                  Impacto / Conclusão
                </label>
                <input
                  type="text"
                  value={mf.impactoOuConclusao}
                  disabled={disabled}
                  onChange={(e) => handleUpdateMetrica(idx, { impactoOuConclusao: e.target.value })}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 disabled:opacity-50"
                  data-testid={`input-metrica-impacto-${idx}`}
                />
              </div>
              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemoveMetrica(idx)}
                  disabled={disabled}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors disabled:opacity-40"
                  title="Remover fato"
                  data-testid={`btn-remove-metrica-${idx}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {(!caseData.metricas_fatos || caseData.metricas_fatos.length === 0) && (
            <p className="text-xs text-slate-400 italic py-2 text-center">
              Nenhuma métrica factual cadastrada. Clique em &quot;Adicionar Fato&quot; para registrar destaques quantitativos.
            </p>
          )}
        </div>
      </Card>

      {/* Painel do Checklist de Sanitização */}
      <SanitizationChecklistPanel
        checklist={caseData.checklist_sanitizacao}
        disabled={disabled}
        onChange={handleChecklistChange}
      />
    </div>
  );
}
