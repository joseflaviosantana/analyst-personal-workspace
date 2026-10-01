'use client';

/**
 * src/components/dashboard/DashboardOverviewSection.tsx
 *
 * Bloco 1 — Visão Geral do Dashboard (Subgates 3.4A e 3.4B)
 *
 * Exibe a visão executiva do modelo de BI da demanda com suporte explícito aos estados:
 * - Sem Modelo Power BI (empty state orientativo com ações de abertura de modal);
 * - Modelo Power BI Existente (detalhes técnicos, formato PBIX/PBIP, edição de metadados);
 * - Isenção Excel-Only (formalização de entrega tabular D-08 com edição de justificativa);
 * - Contexto Parcial (modelo presente mas sem medidas/páginas configuradas);
 * - Vínculo semântico com Modelo Analítico homologado.
 */

import React from 'react';
import {
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  Clock,
  Layers,
  Database,
  ArrowRight,
  ShieldCheck,
  Info,
  Edit3,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ModeloPowerBi } from '@/core/domain/entities/modelo-powerbi';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import { ROTULOS_STATUS_MODELO_POWERBI } from '@/core/domain/enums/status-modelo-powerbi';

interface DashboardOverviewSectionProps {
  modeloPowerBi: ModeloPowerBi | null;
  modeloAnalitico: ModeloAnaliticoCompleto | null;
  totalMedidas: number;
  totalPaginas: number;
  totalVisuais: number;
  onOpenRegisterModal?: () => void;
  onOpenExemptionModal?: () => void;
  onOpenEditModal?: () => void;
}

export function DashboardOverviewSection({
  modeloPowerBi,
  modeloAnalitico,
  totalMedidas,
  totalPaginas,
  totalVisuais,
  onOpenRegisterModal,
  onOpenExemptionModal,
  onOpenEditModal,
}: DashboardOverviewSectionProps) {
  // Estado 1: Isenção Formal de Power BI (Excel-only — D-08)
  if (modeloPowerBi?.tipo_formato === TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY) {
    return (
      <div data-testid="dashboard-overview-isento" className="space-y-4">
        <Card className="p-6 border-emerald-900/60 bg-emerald-950/20">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 flex-1">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Entrega Tabular Isenta de Power BI
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 font-mono">
                    Regra D-08 Homologada
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mt-1">
                  Demanda configurada para consumo direto em Excel / Planilha
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  Esta demanda foi formalmente declarada como <strong className="text-white">ISENTO_EXCEL_ONLY</strong>.
                  Não é exigida a construção de relatórios ou medidas DAX no Power BI. Os dados e métricas homologados
                  serão consumidos em formato tabular.
                </p>

                {modeloPowerBi.justificativa_isencao && (
                  <div className="mt-3.5 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                    <span className="font-semibold text-slate-200">Justificativa formal registrada:</span>
                    <p className="italic mt-1 text-slate-400">"{modeloPowerBi.justificativa_isencao}"</p>
                  </div>
                )}
              </div>
            </div>

            {onOpenEditModal && (
              <button
                type="button"
                onClick={onOpenEditModal}
                data-testid="btn-edit-exemption"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-800 bg-emerald-950/60 text-emerald-300 text-xs font-semibold hover:bg-emerald-900/60 hover:text-white transition-colors flex-shrink-0 self-start"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Editar Justificativa</span>
              </button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Estado 2: Sem Modelo Power BI Cadastrado (Empty State Orientativo)
  if (!modeloPowerBi) {
    return (
      <div data-testid="dashboard-overview-empty" className="space-y-4">
        <Card className="p-8 text-center border-slate-800 bg-slate-900/70">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3 text-blue-400">
            <FileCode className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white">
            Nenhum Modelo Power BI Registrado
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Para iniciar o trabalho na etapa de Dashboard, vincule um arquivo de modelo (.pbix ou .pbip) ou formalize
            a isenção de Power BI caso a demanda seja estritamente tabular.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenRegisterModal}
              data-testid="btn-open-register-pbi"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 font-semibold text-white text-xs hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30"
            >
              <span>Registrar Arquivo Power BI (.pbix / .pbip)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onOpenExemptionModal}
              data-testid="btn-open-declare-exemption"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium hover:text-white hover:bg-slate-700 transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Declarar Isenção (Excel-Only)</span>
            </button>
          </div>

          {/* Contexto do Modelo Analítico Vigente */}
          {modeloAnalitico ? (
            <div className="mt-6 pt-5 border-t border-slate-800 text-left max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-semibold">Modelo Analítico Base Disponível:</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                O modelo semântico <strong className="text-white">"{modeloAnalitico.nome}"</strong> está homologado com{' '}
                <strong className="text-white">{modeloAnalitico.metricas?.length ?? 0} métrica(s)</strong> prontas para serem implementadas em DAX.
              </p>
            </div>
          ) : (
            <div className="mt-6 pt-5 border-t border-slate-800 text-left max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold">Aviso Metodológico:</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                A etapa anterior (Modelagem Analítica) ainda não possui um modelo homologado. Recomenda-se homologar o modelo analítico antes de finalizar os visuais do Dashboard.
              </p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Estado 3: Modelo Power BI Existente (com ou sem contexto parcial)
  const isParcial = totalMedidas === 0 || totalPaginas === 0;

  return (
    <div data-testid="dashboard-overview-content" className="space-y-4">
      {/* Alerta de Contexto Parcial quando aplicável */}
      {isParcial && (
        <div
          data-testid="dashboard-overview-partial"
          className="rounded-lg border border-amber-800/60 bg-amber-950/30 p-3.5 flex items-start gap-3 text-xs"
        >
          <Info className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">Contexto Parcialmente Configurado: </span>
            <span className="text-slate-300">
              O arquivo do modelo está registrado, mas ainda aguarda a definição de{' '}
              {totalMedidas === 0 && 'medidas DAX'}
              {totalMedidas === 0 && totalPaginas === 0 && ' e '}
              {totalPaginas === 0 && 'páginas com visuais'}. Utilize as abas progressivas ao lado para avançar na construção.
            </span>
          </div>
        </div>
      )}

      {/* Card Principal: Metadados do Arquivo e Status */}
      <Card className="p-5 border-slate-800 bg-slate-900/90">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  {modeloPowerBi.tipo_formato}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-300 font-semibold">
                  {ROTULOS_STATUS_MODELO_POWERBI[modeloPowerBi.status] || modeloPowerBi.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                {modeloPowerBi.nome_arquivo}
              </h3>
              {modeloPowerBi.caminho_local && (
                <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-xl">
                  {modeloPowerBi.caminho_local}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Tamanho:</span>
              <span className="text-xs font-mono text-slate-200">
                {(modeloPowerBi.tamanho_bytes / 1024).toFixed(1)} KB
              </span>
            </div>
            {modeloPowerBi.versao_powerbi && (
              <div className="text-right border-l border-slate-800 pl-3">
                <span className="text-[11px] text-slate-400 block">Versão:</span>
                <span className="text-xs font-mono text-slate-200">
                  {modeloPowerBi.versao_powerbi}
                </span>
              </div>
            )}
            {onOpenEditModal && (
              <div className="border-l border-slate-800 pl-3">
                <button
                  type="button"
                  onClick={onOpenEditModal}
                  data-testid="btn-edit-powerbi-model"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5 text-blue-400" />
                  <span>Editar Modelo</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Grade de Métricas Sintéticas da Etapa */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Medidas DAX</span>
              <Layers className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <span className="text-lg font-bold text-white">{totalMedidas}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Páginas</span>
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <span className="text-lg font-bold text-white">{totalPaginas}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Visuais</span>
              <Layers className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <span className="text-lg font-bold text-white">{totalVisuais}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Modelo Analítico</span>
              <Database className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-emerald-300 truncate block">
              {modeloAnalitico ? 'Homologado' : 'Não vinculado'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
