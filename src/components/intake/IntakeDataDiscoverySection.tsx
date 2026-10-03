'use client';

import React, { useState } from 'react';
import {
  Search,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  FileSearch,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ResultadoAnaliseIntake } from '@/core/domain/intake/intake-types';

interface IntakeDataDiscoverySectionProps {
  analise: ResultadoAnaliseIntake;
}

interface ItemDescobertaDados {
  id: string;
  oQueSeraVerificado: string;
  oQueWorkspaceFara: string;
  situacaoBadge: string;
  situacaoTipo: 'PRE_REQUISITO' | 'DESCOBERTA';
  porQueNosDados: string;
  termoProfissional: string;
  detalheTecnico: string;
}

export function IntakeDataDiscoverySection({ analise }: IntakeDataDiscoverySectionProps) {
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});

  const toggleExpandir = (id: string) => {
    setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const itensDescoberta: ItemDescobertaDados[] = [
    {
      id: 'disco_arquivo',
      oQueSeraVerificado: 'Carga do arquivo',
      oQueWorkspaceFara: 'O Workspace fará a leitura e verificação inicial assim que a planilha for disponibilizada.',
      situacaoBadge: 'Pré-requisito: receber arquivo',
      situacaoTipo: 'PRE_REQUISITO',
      porQueNosDados:
        'Não podemos examinar colunas nem calcular métricas sem ter o arquivo em mãos. Obter o arquivo é a primeira ação necessária.',
      termoProfissional: 'ingestão de arquivos tabulares e conectividade de fonte',
      detalheTecnico:
        'Conexão no Power Query via conector Excel.Workbook ou Csv.Document, preservando o arquivo original e garantindo ambiente de staging.',
    },
    {
      id: 'disco_colunas',
      oQueSeraVerificado: 'Estrutura da planilha',
      oQueWorkspaceFara: 'O Workspace verificará quais colunas e informações estão disponíveis.',
      situacaoBadge: 'Vamos descobrir nos dados',
      situacaoTipo: 'DESCOBERTA',
      porQueNosDados:
        'Não precisamos perguntar ao cliente o nome técnico das colunas. Assim que o arquivo for aberto, verificamos diretamente quais campos existem para Data, Filial, Produto, Quantidade e Valor.',
      termoProfissional: 'validação de schema, tipos de dados e dicionário de dados',
      detalheTecnico:
        'Mapeamento de tipos primitivos (datetime, string, decimal, int64), estrutura de cabeçalhos e detecção de nomes alternativos (ex.: "DataVenda", "Cod_Filial", "DescricaoItem").',
    },
    {
      id: 'disco_granularidade',
      oQueSeraVerificado: 'Nível de detalhe dos registros',
      oQueWorkspaceFara: 'O Workspace verificará se cada linha representa um item vendido ou um resumo.',
      situacaoBadge: 'Vamos descobrir nos dados',
      situacaoTipo: 'DESCOBERTA',
      porQueNosDados:
        'A própria planilha revela o grau de detalhe dos registros, orientando como faremos as somas, contagens e relacionamentos.',
      termoProfissional: 'granularidade da tabela fato e modelo dimensional',
      detalheTecnico:
        'Definição da granularidade mais baixa (nível item de linha do pedido) para viabilizar medidas flexíveis em DAX sem distorção de contexto.',
    },
    {
      id: 'disco_datas',
      oQueSeraVerificado: 'Período das vendas',
      oQueWorkspaceFara: 'O Workspace verificará a data inicial e final registradas na planilha.',
      situacaoBadge: 'Vamos descobrir nos dados',
      situacaoTipo: 'DESCOBERTA',
      porQueNosDados:
        'A planilha nos mostrará quais meses e anos estão registrados, confirmando se há dados suficientes para fazer comparações temporais.',
      termoProfissional: 'amplitude temporal e cobertura da Dimensão Calendário (MinDate / MaxDate)',
      detalheTecnico:
        'Geração da tabela de dimensão calendário cobrindo o intervalo exato entre MinDate (MIN(Vendas[Data])) e MaxDate (MAX(Vendas[Data])), permitindo funções de Time Intelligence.',
    },
    {
      id: 'disco_excecoes',
      oQueSeraVerificado: 'Cancelamentos e anomalias',
      oQueWorkspaceFara: 'O Workspace verificará se existem devoluções, valores zerados ou cancelamentos.',
      situacaoBadge: 'Vamos descobrir nos dados',
      situacaoTipo: 'DESCOBERTA',
      porQueNosDados:
        'Separamos a detecção na planilha (encontrar as linhas canceladas) da decisão do cliente (saber se a empresa costuma somar ou expurgar esses registros).',
      termoProfissional: 'data profiling, detecção de anomalias e conciliação de expurgo',
      detalheTecnico:
        'A presença física de registros com status cancelado é um fato da base; a exclusão ou inclusão na medida [Total Faturamento] é governada por regra de negócio.',
    },
  ];

  return (
    <Card
      className="p-5 border-cyan-900/50 bg-slate-900/90 shadow-md space-y-4"
      data-testid="section-vamos-descobrir-dados"
    >
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-300 tracking-wider">
              4. 🔵 VAMOS DESCOBRIR NOS DADOS
            </span>
            <Badge variant="info" data-testid="badge-descobrir-dados">
              INSPEÇÃO NA PLANILHA
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400">
            Não precisamos perguntar isso ao cliente. O Workspace verificará na própria planilha.
          </p>
        </div>

        <span className="text-[11px] text-cyan-400 flex items-center gap-1.5 self-start sm:self-auto">
          <Search className="h-3.5 w-3.5" />
          <span>Verificação direta na fonte</span>
        </span>
      </div>

      {/* Lista de Itens (Visualização Principal Concisa) */}
      <div className="space-y-2.5" data-testid="list-itens-descoberta-dados">
        {itensDescoberta.map((item) => {
          const isExpandido = expandidos[item.id] ?? false;

          return (
            <div
              key={item.id}
              className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 sm:p-3.5 space-y-2 hover:border-cyan-900/60 transition-all"
            >
              {/* Linha Principal Concisa */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-100">
                      {item.oQueSeraVerificado}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                    {item.oQueWorkspaceFara}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto pl-6 sm:pl-0 flex-shrink-0">
                  <span
                    className={`rounded px-2.5 py-1 text-[11px] font-semibold ${
                      item.situacaoTipo === 'PRE_REQUISITO'
                        ? 'bg-rose-950/80 border border-rose-800/60 text-rose-300'
                        : 'bg-cyan-950/80 border border-cyan-800/60 text-cyan-300'
                    }`}
                  >
                    {item.situacaoBadge}
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleExpandir(item.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-cyan-300 hover:text-cyan-200 bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-800/40 rounded-md transition-colors"
                    title={isExpandido ? 'Recolher detalhes' : 'Entender melhor'}
                  >
                    <span>{isExpandido ? 'Recolher' : 'Entender melhor'}</span>
                    {isExpandido ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Nível de Aprofundamento Sob Demanda: Entender Melhor */}
              {isExpandido && (
                <div className="mt-2 pt-2.5 border-t border-slate-800/80 space-y-2 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-md animate-in fade-in duration-200">
                  <p className="leading-relaxed">
                    <strong className="text-cyan-300">Por que nos dados:</strong> {item.porQueNosDados}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 pt-1 border-t border-slate-800">
                    <GraduationCap className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>📘 Nome profissional: {item.termoProfissional}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 pt-0.5 leading-relaxed">
                    <strong className="text-slate-300 font-medium">Detalhe técnico de engenharia:</strong> {item.detalheTecnico}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

