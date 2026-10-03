'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  HelpCircle,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Quote,
  Cpu,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ItemRequisitoAnalisado, TipoClassificacaoRequisito, TipoConceitoAnalitico } from '@/core/domain/intake/intake-types';

interface IntakeRequirementsClassificationSectionProps {
  requisitos: ItemRequisitoAnalisado[];
}

export function IntakeRequirementsClassificationSection({
  requisitos,
}: IntakeRequirementsClassificationSectionProps) {
  const [filtroCategoria, setFiltroCategoria] = useState<TipoClassificacaoRequisito | 'TODOS'>('TODOS');

  const essenciais = requisitos.filter((r) => r.classificacao === 'REQUISITO_ESSENCIAL');
  const pendentes = requisitos.filter((r) => r.classificacao === 'REQUISITO_PENDENTE_ESCLARECIMENTO');
  const sugestoes = requisitos.filter((r) => r.classificacao === 'SUGESTAO_ANALITICA_ADICIONAL');
  const indefinidos = requisitos.filter((r) => r.classificacao === 'NAO_DEFINIDO_INVESTIGAR');
  const solucoesTecnicas = requisitos.filter((r) => r.classificacao === 'SOLUCAO_TECNICA_PROPOSTA');

  const grupos = [
    {
      tipo: 'REQUISITO_ESSENCIAL' as const,
      filtroNome: 'Essenciais',
      titulo: 'Precisamos disso para atender ao pedido (Requisitos Essenciais)',
      descricao: 'Indispensáveis para atender ao que foi pedido ou viabilizar a entrega técnica.',
      badgeLabel: 'Essencial para o pedido',
      badgeVariant: 'success' as const,
      borderColor: 'border-emerald-800/50',
      bgColor: 'bg-emerald-950/20',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
      itens: essenciais,
    },
    {
      tipo: 'REQUISITO_PENDENTE_ESCLARECIMENTO' as const,
      filtroNome: 'Precisamos esclarecer',
      titulo: 'Precisamos esclarecer isso (Definições Pendentes)',
      descricao: 'O pedido cita essa necessidade, mas precisamos de alinhamento para ter certeza de como fazer.',
      badgeLabel: 'Precisamos esclarecer',
      badgeVariant: 'warning' as const,
      borderColor: 'border-amber-800/50',
      bgColor: 'bg-amber-950/20',
      icon: <HelpCircle className="h-4 w-4 text-amber-400" />,
      itens: pendentes,
    },
    {
      tipo: 'SUGESTAO_ANALITICA_ADICIONAL' as const,
      filtroNome: 'Sugestões analíticas',
      titulo: 'Possibilidades para agregar valor (Sugestões Analíticas)',
      descricao: 'Ideias recomendadas pelo Copiloto para aprofundar as descobertas, sem virar obrigação.',
      badgeLabel: 'Sugestão do Copiloto',
      badgeVariant: 'info' as const,
      borderColor: 'border-blue-800/50',
      bgColor: 'bg-blue-950/20',
      icon: <Sparkles className="h-4 w-4 text-blue-400" />,
      itens: sugestoes,
    },
    {
      tipo: 'NAO_DEFINIDO_INVESTIGAR' as const,
      filtroNome: 'Descobrir nos dados',
      titulo: 'Vamos descobrir isso nos dados (A Investigar)',
      descricao: 'Não foi informado no pedido original; vamos verificar diretamente nas planilhas e arquivos.',
      badgeLabel: 'Descobrir nos dados',
      badgeVariant: 'neutral' as const,
      borderColor: 'border-purple-800/50',
      bgColor: 'bg-purple-950/20',
      icon: <Search className="h-4 w-4 text-purple-400" />,
      itens: indefinidos,
    },
    {
      tipo: 'SOLUCAO_TECNICA_PROPOSTA' as const,
      filtroNome: 'Ferramentas sugeridas',
      titulo: 'Ferramentas ou formas de construir (Soluções Técnicas)',
      descricao: 'Ferramentas e tecnologias sugeridas pelo Workspace para implementar a solução.',
      badgeLabel: 'Ferramenta / Solução técnica',
      badgeVariant: 'default' as const,
      borderColor: 'border-indigo-800/50',
      bgColor: 'bg-indigo-950/20',
      icon: <Cpu className="h-4 w-4 text-indigo-400" />,
      itens: solucoesTecnicas,
    },
  ];

  const gruposExibidos = filtroCategoria === 'TODOS'
    ? grupos
    : grupos.filter((g) => g.tipo === filtroCategoria);

  const getRotuloConceito = (conceito?: TipoConceitoAnalitico) => {
    switch (conceito) {
      case 'REQUISITO_NEGOCIO':
        return { label: 'Necessidade de negócio', variant: 'success' as const };
      case 'DEFINICAO_PENDENTE':
        return { label: 'Pendente de alinhamento', variant: 'warning' as const };
      case 'SUGESTAO_ANALITICA':
        return { label: 'Sugestão analítica', variant: 'info' as const };
      case 'SOLUCAO_TECNICA':
        return { label: 'Ferramenta / Solução técnica', variant: 'default' as const };
      default:
        return null;
    }
  };

  return (
    <Card
      className="p-5 border-slate-700/60 bg-slate-900/90 shadow-md space-y-4"
      data-testid="section-requisitos-classificados"
    >
      {/* Header com Linguagem Clara e Governança Epistêmica */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Badge variant="default" data-testid="badge-requisitos-classificados">
              O QUE PRECISAMOS PARA CONSTRUIR A SOLUÇÃO (Classificação de Requisitos)
            </Badge>
            <span className="text-xs text-slate-400">
              {requisitos.length} item(ns)
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Separamos o que é indispensável, o que ainda precisamos perguntar e o que são apenas sugestões.
            <span className="text-slate-500 ml-1">📘 Nome profissional: classificação de requisitos e rastreabilidade.</span>
          </p>
        </div>
        <span className="text-[11px] text-blue-300 flex items-center gap-1 self-start sm:self-auto">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
          Sugestões analíticas e ferramentas nunca viram obrigações sem sua aprovação.
        </span>
      </div>

      {/* Barra de Filtros Rápidos */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1" data-testid="filtros-classificacao-requisitos">
        <button
          type="button"
          onClick={() => setFiltroCategoria('TODOS')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            filtroCategoria === 'TODOS'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Todos ({requisitos.length})
        </button>
        {grupos.map((g) => (
          <button
            key={g.tipo}
            type="button"
            onClick={() => setFiltroCategoria(g.tipo)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filtroCategoria === g.tipo
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {g.icon}
            <span>{g.filtroNome}</span>
            <span className="text-[10px] opacity-80">({g.itens.length})</span>
          </button>
        ))}
      </div>

      {/* Exibição dos Grupos de Requisitos */}
      <div className="space-y-4">
        {gruposExibidos.map((grupo) => {
          if (grupo.itens.length === 0) return null;

          return (
            <div
              key={grupo.tipo}
              className={`rounded-lg border ${grupo.borderColor} ${grupo.bgColor} p-4 space-y-3`}
              data-testid={`grupo-requisitos-${grupo.tipo.toLowerCase()}`}
            >
              {/* Título do Grupo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  {grupo.icon}
                  <h4 className="text-xs font-bold text-slate-200 tracking-wide uppercase">
                    {grupo.titulo}
                  </h4>
                  <Badge variant={grupo.badgeVariant}>{grupo.itens.length}</Badge>
                </div>
                <p className="text-[11px] text-slate-400">{grupo.descricao}</p>
              </div>

              {/* Cards de Itens de Requisitos */}
              <div className="grid grid-cols-1 gap-3">
                {grupo.itens.map((item) => {
                  const conceitoInfo = getRotuloConceito(item.conceito);

                  return (
                    <div
                      key={item.id}
                      data-testid={`card-requisito-${item.id}`}
                      className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-3.5 space-y-2.5 transition-all hover:border-slate-700"
                    >
                      {/* Nível 1: O que preciso entender/decidir agora? */}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                            <span>{item.titulo}</span>
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {item.descricao}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {conceitoInfo && (
                            <Badge
                              variant={conceitoInfo.variant}
                              data-testid={`badge-conceito-${item.id}`}
                            >
                              {conceitoInfo.label}
                            </Badge>
                          )}
                          <Badge
                            variant={grupo.badgeVariant}
                            data-testid={`badge-classificacao-${item.id}`}
                          >
                            {grupo.badgeLabel}
                          </Badge>
                        </div>
                      </div>

                      {/* Salvaguarda Determinística de Citação */}
                      {item.origemPedidoOriginal ? (
                        <div className="flex items-start gap-2 bg-slate-900/60 rounded px-2.5 py-1.5 border border-slate-800/60 text-[11px]">
                          <Quote className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-400">
                            <strong className="text-slate-300 font-medium">No Pedido Original:</strong>{' '}
                            <span className="italic text-slate-200">«{item.origemPedidoOriginal}»</span>
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center gap-2 bg-slate-900/40 rounded px-2.5 py-1 border border-slate-800/40 text-slate-400">
                            <AlertCircle className="h-3 w-3 text-slate-500 flex-shrink-0" />
                            <span>
                              <strong className="text-slate-300 font-medium">Origem:</strong> Não informado no Pedido Original.
                            </span>
                          </div>
                          {item.lacunaIdentificadaCopiloto && (
                            <div className="flex items-start gap-1.5 bg-amber-950/20 rounded px-2.5 py-1 border border-amber-800/30 text-amber-300 text-[11px]">
                              <HelpCircle className="h-3 w-3 text-amber-400 mt-0.5 flex-shrink-0" />
                              <span>{item.lacunaIdentificadaCopiloto}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Nível 2 e 3: Progressive Disclosure — Por que isso importa e detalhes técnicos */}
                      <details className="group border border-slate-800/80 rounded bg-slate-900/50 p-2.5 space-y-2">
                        <summary className="cursor-pointer text-xs font-medium text-amber-300 hover:text-amber-200 flex items-center justify-between select-none">
                          <span className="flex items-center gap-1.5">
                            <Lightbulb className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                            <span>Por que o Copiloto avaliou assim?</span>
                          </span>
                          <span className="text-[11px] text-slate-400 group-open:hidden">Entender melhor</span>
                          <span className="text-[11px] text-slate-400 hidden group-open:inline">Recolher</span>
                        </summary>

                        <div className="pt-2 border-t border-slate-800 space-y-2.5">
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {item.justificativaClassificacao}
                          </p>

                          {/* Nível 3: Detalhes Técnicos de Rastreabilidade */}
                          <div className="bg-slate-950/60 rounded p-2 border border-slate-800/60 space-y-1.5">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Detalhes de Rastreabilidade
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              <div className="space-y-0.5">
                                <span className="text-slate-500 font-medium flex items-center gap-1">
                                  <ArrowRight className="h-3 w-3 text-slate-400" />
                                  <span>O que precisamos:</span>
                                </span>
                                <p className="text-slate-300 leading-snug">
                                  {item.rastreabilidade.necessidadeIdentificada}
                                </p>
                              </div>

                              <div className="space-y-0.5">
                                <span className="text-slate-500 font-medium flex items-center gap-1">
                                  <ArrowRight className="h-3 w-3 text-slate-400" />
                                  <span>Como isso influencia o trabalho:</span>
                                </span>
                                <p className="text-slate-300 leading-snug">
                                  {item.rastreabilidade.impactoAnalise}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

