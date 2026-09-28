'use client';

import React from 'react';
import {
  FileText,
  AlertTriangle,
  Play,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Plus,
  FileCheck2,
  Sparkles,
  Info,
  Database
} from 'lucide-react';
import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { ProntidaoModelagemOutput } from '@/core/use-cases/preparation';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';

interface PreparationNextActionBannerProps {
  hasAssets: boolean;
  receita: ReceitaPreparacao | null;
  etapas: EtapaTransformacao[];
  datasetAutorizado: DatasetAutorizadoAnalise | null;
  problemas: ProblemaQualidade[];
  prontidao: ProntidaoModelagemOutput | null;
  onOpenCreateRecipe: () => void;
  onOpenAddStep: () => void;
  onOpenAuthorizeDataset: () => void;
  onScrollToSteps: () => void;
  onScrollToVerifications: () => void;
  onAdvanceDemand?: () => void;
  isReadOnly?: boolean;
}

export function PreparationNextActionBanner({
  hasAssets,
  receita,
  etapas,
  datasetAutorizado,
  problemas,
  prontidao,
  onOpenCreateRecipe,
  onOpenAddStep,
  onOpenAuthorizeDataset,
  onScrollToSteps,
  onScrollToVerifications,
  onAdvanceDemand,
  isReadOnly = false,
}: PreparationNextActionBannerProps) {
  // Cenário 0: Sem Ativos Catalogados
  if (!hasAssets) {
    return (
      <div
        className="rounded-xl border border-amber-800/80 bg-amber-950/30 p-5 text-amber-200 space-y-2 shadow-sm"
        data-testid="prep-banner-no-assets"
      >
        <div className="flex items-center gap-2.5">
          <Info className="h-5 w-5 text-amber-400 shrink-0" />
          <h2 className="text-sm font-semibold text-white">Nenhum Ativo de Dados Catalogado</h2>
        </div>
        <p className="text-xs text-amber-300/90 leading-relaxed">
          <strong>1. Estado Atual:</strong> A demanda ainda não possui ativos catalogados na Aba 3.<br />
          <strong>2. Bloqueio:</strong> Impossível criar receitas ou registrar transformações sem uma fonte de dados.<br />
          <strong>3. Ação Recomendada:</strong> Acesse a <em>Aba 3 (Ativos de Dados)</em> e registre o primeiro arquivo ou fonte primária.<br />
          <strong>4. Racional:</strong> A esteira de preparação precisa de fontes primárias identificadas para compor o grafo de linhagem.<br />
          <strong>5. Validação:</strong> Ao catalogar, o arquivo terá hash SHA-256 e schema inferido.<br />
          <strong>6. Próximo Passo:</strong> Retornar à Aba 5 para estruturar o plano de preparação.
        </p>
      </div>
    );
  }

  // Cenário 1: Sem Receita Criada
  if (!receita) {
    const problemasTratar = problemas.filter((p) => p.acao_deliberada === 'TRATAR_NO_PIPELINE').length;
    return (
      <div
        className="rounded-xl border border-blue-800/80 bg-blue-950/40 p-5 text-blue-200 space-y-3 shadow-sm"
        data-testid="prep-banner-no-recipe"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-blue-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                Próxima Ação: Criar Receita de Preparação
              </h2>
              <span className="text-[11px] text-blue-300/80">Copiloto Proativo Explicável</span>
            </div>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={onOpenCreateRecipe}
              data-testid="btn-banner-create-recipe"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Receita de Preparação</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-blue-900/60 text-xs text-blue-300/90 leading-relaxed">
          <div>
            <p><strong>1. Estado Atual:</strong> Nenhuma receita ativa vinculada a esta demanda.</p>
            <p><strong>2. Bloqueios Detectados:</strong> {problemasTratar > 0 ? `${problemasTratar} problema(s) na Aba 4 aguardando resolução via pipeline.` : 'Necessário formalizar o plano de preparação antes de avançar.'}</p>
            <p><strong>3. Ação Recomendada:</strong> Criar a primeira receita para orquestrar as transformações.</p>
          </div>
          <div>
            <p><strong>4. Racional:</strong> Garante rastreabilidade, auditabilidade e versionamento do tratamento dos dados.</p>
            <p><strong>5. Como Validar:</strong> A receita será registrada em status <em>Rascunho</em> na trilha de auditoria.</p>
            <p><strong>6. Próximo Passo Sugerido:</strong> Adicionar etapas de transformação (limpeza, deduplicação, normalização).</p>
          </div>
        </div>
      </div>
    );
  }

  // Cenário 2: Receita em Rascunho sem etapas
  if (etapas.length === 0) {
    return (
      <div
        className="rounded-xl border border-indigo-800/80 bg-indigo-950/40 p-5 text-indigo-200 space-y-3 shadow-sm"
        data-testid="prep-banner-empty-recipe"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Plus className="h-5 w-5 text-indigo-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                Próxima Ação: Adicionar Etapas de Transformação
              </h2>
              <span className="text-[11px] text-indigo-300/80">Receita &quot;{receita.titulo}&quot; em Rascunho</span>
            </div>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={onOpenAddStep}
              data-testid="btn-banner-add-first-step"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Primeira Etapa</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-indigo-900/60 text-xs text-indigo-300/90 leading-relaxed">
          <div>
            <p><strong>1. Estado Atual:</strong> Receita criada em rascunho, sem etapas operacionais cadastradas.</p>
            <p><strong>2. Bloqueios Detectados:</strong> A receita não pode ser executada ou concluída vazia.</p>
            <p><strong>3. Ação Recomendada:</strong> Cadastre as operações planejadas (ex: Power Query M, SQL, Python ou manual).</p>
          </div>
          <div>
            <p><strong>4. Racional:</strong> Cada etapa descreve a intervenção técnica aplicada sobre os dados.</p>
            <p><strong>5. Como Validar:</strong> A etapa será gravada com ordem e vinculará anomalias da Aba 4.</p>
            <p><strong>6. Próximo Passo Sugerido:</strong> Associar problemas de qualidade correspondentes à etapa.</p>
          </div>
        </div>
      </div>
    );
  }

  // Cenário 3: Há etapas apenas planejadas (aguardando execução física e registro do derivado)
  const etapasPlanejadas = etapas.filter((e) => e.status === StatusEtapaTransformacao.PLANEJADA);
  if (etapasPlanejadas.length > 0) {
    return (
      <div
        className="rounded-xl border border-amber-800/80 bg-amber-950/40 p-5 text-amber-200 space-y-3 shadow-sm"
        data-testid="prep-banner-planned-steps"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Play className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                Próxima Ação: Registrar Ativo Derivado da Etapa #{etapasPlanejadas[0].ordem}
              </h2>
              <span className="text-[11px] text-amber-300/80">{etapasPlanejadas.length} etapa(s) planejada(s) aguardando execução</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onScrollToSteps}
            data-testid="btn-banner-scroll-to-steps"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-amber-500 transition-colors shrink-0"
          >
            <span>Ver Etapa e Registrar Saída</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-amber-900/60 text-xs text-amber-300/90 leading-relaxed">
          <div>
            <p><strong>1. Estado Atual:</strong> A etapa #{etapasPlanejadas[0].ordem} ({etapasPlanejadas[0].tipo_operacao}) está planejada.</p>
            <p><strong>2. Bloqueios Detectados:</strong> A receita não pode ser concluída sem execução física das etapas.</p>
            <p><strong>3. Ação Recomendada:</strong> Aplique a transformação em sua ferramenta e registre o arquivo gerado.</p>
          </div>
          <div>
            <p><strong>4. Racional:</strong> O registro do ativo derivado conecta a linhagem de procedência dos dados.</p>
            <p><strong>5. Como Validar:</strong> O sistema inspecionará o arquivo local, calculando hash SHA-256 e schema.</p>
            <p><strong>6. Próximo Passo Sugerido:</strong> Diagnosticar o ativo derivado na Aba 4 e validar a resolução do problema.</p>
          </div>
        </div>
      </div>
    );
  }

  // Cenário 4: Há etapas executadas aguardando validação comprobatória ou problemas de pipeline abertos
  const etapasExecutadas = etapas.filter((e) => e.status === StatusEtapaTransformacao.EXECUTADA);
  const problemasTratarAbertos = problemas.filter(
    (p) => p.acao_deliberada === 'TRATAR_NO_PIPELINE' && p.status !== 'TRATADO' && p.status !== 'ACEITO_COMO_RESTRICAO'
  );

  if (problemasTratarAbertos.length > 0 || etapasExecutadas.length > 0) {
    return (
      <div
        className="rounded-xl border border-cyan-800/80 bg-cyan-950/40 p-5 text-cyan-200 space-y-3 shadow-sm"
        data-testid="prep-banner-validations-pending"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="h-5 w-5 text-cyan-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                Próxima Ação: Validar Tratamento dos Problemas no Pipeline
              </h2>
              <span className="text-[11px] text-cyan-300/80">
                {problemasTratarAbertos.length} anomalia(s) de pipeline aguardando validação empírica
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onScrollToVerifications}
            data-testid="btn-banner-scroll-to-verifications"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 transition-colors shrink-0"
          >
            <span>Verificar Tratamento Empírico</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-cyan-900/60 text-xs text-cyan-300/90 leading-relaxed">
          <div>
            <p><strong>1. Estado Atual:</strong> Ativo derivado registrado; comprovação empírica pendente.</p>
            <p><strong>2. Bloqueios Detectados:</strong> Proibida conclusão declarativa sem revalidação por diagnóstico.</p>
            <p><strong>3. Ação Recomendada:</strong> Acione o teste empírico de tratamento do problema de qualidade.</p>
          </div>
          <div>
            <p><strong>4. Racional:</strong> Certifica deterministicamente que as transformações realmente corrigiram as falhas.</p>
            <p><strong>5. Como Validar:</strong> O laudo compara o diagnóstico pós-preparação contra as regras de negócio.</p>
            <p><strong>6. Próximo Passo Sugerido:</strong> Validar as etapas e concluir a receita de preparação.</p>
          </div>
        </div>
      </div>
    );
  }

  // Cenário 5: Receita Concluída, mas Dataset ainda não Homologado / Autorizado
  if (!datasetAutorizado || datasetAutorizado.status !== StatusAutorizacaoDataset.VIGENTE) {
    return (
      <div
        className="rounded-xl border border-emerald-800/80 bg-emerald-950/40 p-5 text-emerald-200 space-y-3 shadow-sm"
        data-testid="prep-banner-ready-to-authorize"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                Próxima Ação: Homologar e Autorizar Dataset para Análise
              </h2>
              <span className="text-[11px] text-emerald-300/80">Receita Concluída com Sucesso!</span>
            </div>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={onOpenAuthorizeDataset}
              data-testid="btn-banner-authorize-dataset"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors shrink-0"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Autorizar Dataset</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-emerald-900/60 text-xs text-emerald-300/90 leading-relaxed">
          <div>
            <p><strong>1. Estado Atual:</strong> Todas as etapas foram validadas e a receita está concluída.</p>
            <p><strong>2. Bloqueios Detectados:</strong> A modelagem não pode ser iniciada sem homologação formal do dataset.</p>
            <p><strong>3. Ação Recomendada:</strong> Homologar o dataset definitivo fornecendo justificativa formal (&ge; 15 chars).</p>
          </div>
          <div>
            <p><strong>4. Racional:</strong> Congela o snapshot de hash SHA-256 e as restrições aceitas para blindagem do Power BI/DAX.</p>
            <p><strong>5. Como Validar:</strong> Gera o registro imutável do Dataset Autorizado na trilha de auditoria.</p>
            <p><strong>6. Próximo Passo Sugerido:</strong> Avançar a Demanda para a Fase de Modelagem e Análise.</p>
          </div>
        </div>
      </div>
    );
  }

  // Cenário 6: Dataset Homologado e Prontidão Aprovada 100% Verde!
  if (prontidao?.pronto) {
    return (
      <div
        className="rounded-xl border border-teal-700 bg-teal-950/50 p-5 text-teal-200 space-y-3 shadow-sm"
        data-testid="prep-banner-ready-for-modeling"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                Prontidão Homologada: Liberado para Modelagem &amp; Análise
              </h2>
              <span className="text-[11px] text-teal-300/80">Todos os 7 critérios de governança foram atendidos</span>
            </div>
          </div>
          {onAdvanceDemand && !isReadOnly && (
            <button
              type="button"
              onClick={onAdvanceDemand}
              data-testid="btn-banner-advance-demand-prep"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-500 transition-colors shrink-0"
            >
              <span>Avançar para Modelagem &amp; Análise</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-teal-900/60 text-xs text-teal-300/90 leading-relaxed">
          <div>
            <p><strong>1. Estado Atual:</strong> Dataset &quot;{datasetAutorizado.versao_rotulo}&quot; autorizado e em vigência.</p>
            <p><strong>2. Bloqueios Detectados:</strong> Nenhum bloqueio ativo. Esteira 100% em conformidade.</p>
            <p><strong>3. Ação Recomendada:</strong> Avançar formalmente o workflow da demanda para a etapa seguinte.</p>
          </div>
          <div>
            <p><strong>4. Racional:</strong> Os dados foram limpos, a linhagem rastreada e o atesto técnico emitido.</p>
            <p><strong>5. Como Validar:</strong> A demanda transicionará para <em>Em Modelagem e Análise</em> com carimbo de tempo.</p>
            <p><strong>6. Próximo Passo Sugerido:</strong> Abrir a Aba 6 e 7 para desenho das dimensões, fatos e medidas DAX.</p>
          </div>
        </div>
      </div>
    );
  }

  // Cenário 7: Dataset Homologado, mas com Bloqueios de Prontidão Detectados (ex: drift de hash ou problemas reabertos)
  return (
    <div
      className="rounded-xl border border-rose-900 bg-rose-950/40 p-5 text-rose-200 space-y-3 shadow-sm"
      data-testid="prep-banner-readiness-blocked"
    >
      <div className="flex items-center gap-2.5">
        <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
        <div>
          <h2 className="text-sm font-semibold text-rose-300">
            Atenção: Prontidão para Modelagem Bloqueada por Governança
          </h2>
          <span className="text-[11px] text-rose-400/80">
            {prontidao?.motivosBloqueio.length || 0} pendência(s) detectada(s)
          </span>
        </div>
      </div>
      <div className="pt-2 border-t border-rose-900/60 text-xs text-rose-300/90 space-y-1">
        <p><strong>Motivos de Bloqueio Factuais:</strong></p>
        <ul className="list-disc list-inside space-y-0.5 text-rose-300">
          {prontidao?.motivosBloqueio.map((m, idx) => (
            <li key={idx}>{m}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
