'use client';

import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  HelpCircle,
  Search,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SinteseProximaAcaoIntake, EstadoProntidaoIntake } from '@/core/domain/intake/intake-types';

interface IntakeNextActionSectionProps {
  sintese: SinteseProximaAcaoIntake;
}

export function IntakeNextActionSection({ sintese }: IntakeNextActionSectionProps) {
  const [resumoCompleto, setResumoCompleto] = useState(false);

  const getBadgeProntidao = (estado: EstadoProntidaoIntake) => {
    switch (estado) {
      case 'AINDA_PRECISAMOS_ESCLARECER':
        return {
          variant: 'warning' as const,
          bgColor: 'bg-amber-950/40 border-amber-800/60 text-amber-300',
          icon: <Clock className="h-3.5 w-3.5 text-amber-400" />,
        };
      case 'PRONTO_INSPECIONAR_DADOS':
        return {
          variant: 'info' as const,
          bgColor: 'bg-blue-950/40 border-blue-800/60 text-blue-300',
          icon: <Search className="h-3.5 w-3.5 text-blue-400" />,
        };
      case 'PRONTO_CONSOLIDAR_REQUISITOS':
        return {
          variant: 'success' as const,
          bgColor: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
        };
      case 'PRONTO_AVANCAR':
      default:
        return {
          variant: 'default' as const,
          bgColor: 'bg-purple-950/40 border-purple-800/60 text-purple-300',
          icon: <Sparkles className="h-3.5 w-3.5 text-purple-400" />,
        };
    }
  };

  const badgeConfig = getBadgeProntidao(sintese.estadoProntidao.estado);

  const jaSabemosResumo =
    sintese.oQueJaSabemos.length > 0
      ? sintese.oQueJaSabemos[0]
      : 'Demandas e objetivos declarados no pedido original.';

  const faltaResolverResumo =
    sintese.oQueAindaPrecisamosEsclarecer.length > 0
      ? 'Responder algumas questões de negócio com o cliente e receber a planilha.'
      : 'Nenhuma pendência crítica identificada no momento.';

  const descobrirDadosResumo =
    'O Workspace verificará automaticamente a estrutura, colunas e qualidade da planilha.';

  return (
    <Card
      className="p-5 border-blue-900/60 bg-slate-900/95 shadow-lg space-y-4"
      data-testid="section-sintese-proxima-acao"
    >
      {/* Cabeçalho da Síntese */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-300 tracking-wider">
              6. 🎯 PRÓXIMO PASSO
            </span>
            <Badge variant="default" data-testid="badge-sintese-analitica">
              RESUMO EXECUTIVO
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400">
            Visão geral organizada para você saber exatamente o que fazer a seguir com tranquilidade.
          </p>
        </div>

        {/* Estado Qualitativo de Prontidão */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${badgeConfig.bgColor}`}
            data-testid="badge-estado-prontidao"
          >
            {badgeConfig.icon}
            <span>{sintese.estadoProntidao.label}</span>
          </div>
        </div>
      </div>

      {/* Camada Operacional: Resumo Executivo em 5 Blocos Concisos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* 1. SITUAÇÃO ATUAL */}
        <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Situação Atual
          </span>
          <p className="text-xs font-semibold text-slate-100">
            {sintese.estadoProntidao.label}
          </p>
        </div>

        {/* 2. JÁ SABEMOS */}
        <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Já Sabemos
          </span>
          <p className="text-xs text-slate-200 leading-relaxed">
            {jaSabemosResumo}
          </p>
        </div>

        {/* 3. FALTA RESOLVER */}
        <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Falta Resolver
          </span>
          <p className="text-xs text-slate-200 leading-relaxed">
            {faltaResolverResumo}
          </p>
        </div>

        {/* 4. VAMOS DESCOBRIR NOS DADOS */}
        <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            Vamos Descobrir nos Dados
          </span>
          <p className="text-xs text-slate-200 leading-relaxed">
            {descobrirDadosResumo}
          </p>
        </div>

        {/* 5. PRÓXIMA AÇÃO */}
        <div
          className="rounded-lg bg-gradient-to-r from-blue-950/70 to-indigo-950/70 border border-blue-800/80 p-3.5 space-y-1 md:col-span-2"
          data-testid="box-proxima-acao-recomendada"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-blue-400" />
            <span>Próxima Ação</span>
          </span>
          <p className="text-xs font-semibold text-white flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>{sintese.proximaAcaoRecomendada.acao}</span>
          </p>
        </div>
      </div>

      {/* Botão de Progressive Disclosure: Ver Resumo Completo */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={() => setResumoCompleto(!resumoCompleto)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-400 hover:text-blue-300 bg-slate-950/60 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors"
        >
          <span>{resumoCompleto ? 'Ocultar resumo completo' : 'Ver resumo completo'}</span>
          {resumoCompleto ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Conteúdo Detalhado Completo (Expansão sob demanda) */}
      {resumoCompleto && (
        <div className="space-y-4 pt-2 border-t border-slate-800 animate-in fade-in duration-200">
          {/* Motivo Explicável do Estado de Prontidão */}
          <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Por que estamos neste momento: </span>
              <span>{sintese.estadoProntidao.motivo}</span>
            </div>
          </div>

          {/* Grid com os 4 Pilares de Síntese Detalhados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* 1. O que já sabemos */}
            <div className="rounded-lg bg-slate-950/70 border border-emerald-900/40 p-3.5 space-y-2">
              <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>O que já sabemos</span>
              </span>
              <ul className="space-y-1 text-slate-300 list-disc list-inside">
                {sintese.oQueJaSabemos.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. O que ainda precisamos esclarecer */}
            <div className="rounded-lg bg-slate-950/70 border border-amber-900/40 p-3.5 space-y-2">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                <span>O que ainda precisamos esclarecer com o cliente</span>
              </span>
              <ul className="space-y-1 text-slate-300 list-disc list-inside">
                {sintese.oQueAindaPrecisamosEsclarecer.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. O que podemos investigar nos dados */}
            <div className="rounded-lg bg-slate-950/70 border border-blue-900/40 p-3.5 space-y-2">
              <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                <Search className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span>O que vamos descobrir na planilha (após receber o arquivo)</span>
              </span>
              <ul className="space-y-1 text-slate-300 list-disc list-inside">
                {sintese.oQuePodemosInvestigarNosDados.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. O que ainda não devemos definir */}
            <div className="rounded-lg bg-slate-950/70 border border-rose-900/40 p-3.5 space-y-2">
              <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                <AlertOctagon className="h-4 w-4 text-rose-400 flex-shrink-0" />
                <span>O que ainda não devemos definir (para evitar decisões precipitadas)</span>
              </span>
              <ul className="space-y-1 text-slate-300 list-disc list-inside">
                {sintese.oQueAindaNaoDevemosDefinir.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Por que esta ação */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <strong className="text-blue-300 font-medium">Por que este é o próximo passo: </strong>
            <span>{sintese.proximaAcaoRecomendada.porQueEstaAcao}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
