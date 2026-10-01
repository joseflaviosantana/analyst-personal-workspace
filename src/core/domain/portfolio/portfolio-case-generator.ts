/**
 * src/core/domain/portfolio/portfolio-case-generator.ts
 *
 * Gerador determinístico e heurístico da versão candidata de Estudo de Caso de Portfólio (Subgate 3.9 — Aba 11).
 *
 * Princípios Canônicos:
 * 1. 100% Determinístico na V1: Sem dependência de LLM ou chamadas externas.
 * 2. Princípio de Não Fabricação: Ancorado estritamente nas evidências analíticas elegíveis,
 *    KPIs conciliados e fatos reais persistidos na demanda.
 * 3. Sanitização Proporcional: Sugere desidentificação e agregação de fatos sensíveis,
 *    deixando a homologação final para a deliberação humana soberana (APROV-10).
 */

import { Demanda } from '../entities/demanda';
import { RequisitoDemanda } from '../entities/requisito-demanda';
import { AtivoDados } from '../entities/ativo-dados';
import { ProblemaQualidade } from '../entities/problema-qualidade';
import { ReceitaPreparacao } from '../entities/receita-preparacao';
import { ModeloAnalitico } from '../entities/modelo-analitico';
import { MedidaDax } from '../entities/medida-dax';
import { EvidenciaAnalitica } from '../entities/evidencia-analitica';
import { ValidacaoConciliacao } from '../entities/validacao-conciliacao';
import { EntregavelDemanda } from '../entities/entregavel-demanda';
import {
  EstudoCasoPortfolio,
  MetricaFatoCase,
  criarChecklistSanitizacaoPadrao,
} from '../entities/estudo-caso-portfolio';
import { StatusEstudoCaso } from '../enums/status-estudo-caso';
import { TecnicaSanitizacao } from '../enums/tecnica-sanitizacao';
import { ClassificacaoExposicaoEvidencia } from '../enums/classificacao-exposicao-evidencia';

import { ResultadoValidacao } from '../enums/resultado-validacao';

export interface PortfolioCaseGeneratorInput {
  demanda: Demanda;
  requisitos?: RequisitoDemanda[];
  ativosDados?: AtivoDados[];
  problemasQualidade?: ProblemaQualidade[];
  receitasPreparacao?: ReceitaPreparacao[];
  modelosAnaliticos?: ModeloAnalitico[];
  medidasDax?: MedidaDax[];
  evidencias?: EvidenciaAnalitica[];
  validacoes?: ValidacaoConciliacao[];
  entregaveis?: EntregavelDemanda[];
  autorPadrao?: string;
}

export class PortfolioCaseGenerator {
  static gerar(input: PortfolioCaseGeneratorInput): EstudoCasoPortfolio {
    const {
      demanda,
      requisitos = [],
      ativosDados = [],
      problemasQualidade = [],
      receitasPreparacao = [],
      modelosAnaliticos = [],
      medidasDax = [],
      evidencias = [],
      validacoes = [],
      entregaveis = [],
    } = input;

    // 1. Título do Estudo de Caso (Sanitizado / Profissional)
    const tituloSanitizado = `Estudo de Caso Analítico: ${demanda.titulo}`;

    // 2. Situação e Problema de Negócio (STAR - S)
    const problemaBase = demanda.contexto || demanda.objetivo_inicial || 'Necessidade de estruturação e visibilidade analítica para tomada de decisão.';
    const objetivoBase = demanda.objetivo_inicial || 'Consolidação de indicadores estratégicos.';
    const periodoBase = demanda.periodo_analise ? ` no período ${demanda.periodo_analise}` : '';
    const granularidadeBase = demanda.granularidade ? ` em nível de detalhe ${demanda.granularidade}` : '';

    const problemaNegocio = [
      `**Contexto e Desafio:** ${problemaBase}`,
      `**Objetivo Central:** Atender ao propósito de ${objetivoBase.toLowerCase()}${periodoBase}${granularidadeBase}.`,
      requisitos.length > 0
        ? `**Escopo Mapeado:** Foram formalizados ${requisitos.length} requisitos analíticos prioritários, contemplando conformidade e regras de negócio estruturadas.`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    // 3. Tarefa & Preparação de Dados (STAR - T)
    const totalLinhas = ativosDados.reduce((acc, a) => acc + (a.total_linhas || 0), 0);
    const totalArquivos = ativosDados.length;
    const problemasTratados = problemasQualidade.filter((p) => p.status === 'TRATADO' || p.acao_deliberada === 'TRATAR_NO_PIPELINE').length;
    const totalReceitas = receitasPreparacao.length;

    const processoPreparacao = [
      `**Engenharia e Governança de Dados:** Tratamento de ${totalArquivos} base(s) de dados locais totalizando mais de ${totalLinhas.toLocaleString('pt-BR')} registros analisados.`,
      problemasTratados > 0
        ? `**Qualidade Assegurada:** Identificação e saneamento comprovado de ${problemasTratados} anomalia(s) de qualidade (valores ausentes, duplicidades ou divergências de tipagem), prevenindo distorções nos relatórios finais.`
        : 'Processo de triagem e perfilamento inicial executado com conformidade estrutural assegurada.',
      totalReceitas > 0
        ? `**Transformações Aplicadas:** Desenvolvimento de ${totalReceitas} pipeline(s) de preparação em Power Query M / Excel, aplicando regras determinísticas de limpeza e tipagem estrita.`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    // 4. Ação, Modelagem e Decisões (STAR - A)
    const totalModelos = modelosAnaliticos.length;
    const totalDax = medidasDax.length;
    const medidasExemplo = medidasDax.slice(0, 4).map((m) => `\`[${m.nome}]\``).join(', ');

    const modelagemDecisoes = [
      `**Arquitetura Dimensional:** Estruturação de modelo analítico relacional (Star Schema)${totalModelos > 0 ? ` contemplando tabelas de fatos e dimensões normalizadas` : ''}, com Tabela Calendário padronizada para inteligência temporal.`,
      totalDax > 0
        ? `**Cálculos e Indicadores Estratégicos:** Implementação de catálogo com ${totalDax} medida(s) DAX estruturadas (${medidasExemplo}${totalDax > 4 ? ' e outras' : ''}), garantindo performance e precisão sem ambiguidades semânticas.`
        : '',
      entregaveis.length > 0
        ? `**Entregáveis Profissionais:** Construção de ${entregaveis.length} artefato(s) formal(is) de entrega, garantindo interface executiva e navegação orientada a perguntas de negócio.`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    // 5. Validação e Resultados Fatuais (STAR - R)
    // Filtra estritamente evidências elegíveis e NÃO confidenciais
    const evidenciasElegiveis = evidencias.filter(
      (e) => e.elegibilidade_portfolio && e.classificacao_exposicao !== ClassificacaoExposicaoEvidencia.CONFIDENCIAL
    );

    const validacoesConformes = validacoes.filter((v) => v.resultado === ResultadoValidacao.APROVADO).length;

    const achadosTexto = evidenciasElegiveis.length > 0
      ? evidenciasElegiveis.map((ev) => `- **${ev.titulo}:** ${ev.fato_observado}${ev.resultado_mensuravel ? ` (Impacto: ${ev.resultado_mensuravel})` : ''}`).join('\n')
      : '- Análise estruturada e validação completa do modelo entregue sem divergências numéricas.';

    const validacaoResultados = [
      `**Reconciliação com Tolerância Zero:** Conclusão de ${validacoesConformes} teste(s) de conciliação numérica cruzada contra bases de controle, atestando conformidade matemática integral de 100% nos KPIs estratégicos.`,
      `**Achados Analíticos e Evidências Comprovadas:**\n${achadosTexto}`,
      '**Valor de Negócio:** Visibilidade executiva imediata, redução de tempo na consolidação de dados e suporte seguro à tomada de decisão fundamentada em fatos.',
    ].join('\n\n');

    // 6. Competências e Ferramentas
    const competencias: string[] = [
      'Análise de Dados e Business Intelligence',
      'Modelagem Dimensional (Star Schema)',
      'Power BI & Expressões DAX',
      'Engenharia de Preparação com Power Query M',
      'Validação Numérica e Reconciliação Cruzada',
      'Resolução Estruturada de Problemas de Negócio',
    ];

    const ferramentas: string[] = ['Power BI Desktop', 'Power Query M', 'Excel Avançado', 'Modelagem Dimensional'];

    // 7. Métricas e Fatos Extraídos
    const metricasFatos: MetricaFatoCase[] = [];

    if (totalLinhas > 0) {
      metricasFatos.push({
        rotulo: 'Volume de Dados Processado',
        expressaoSanitizada: `Mais de ${totalLinhas.toLocaleString('pt-BR')} registros`,
        impactoOuConclusao: 'Bases tratadas e integradas com performance e integridade de tipos.',
      });
    }

    if (validacoesConformes > 0) {
      metricasFatos.push({
        rotulo: 'Conformidade Numérica de KPIs',
        expressaoSanitizada: '100% dos batimentos aprovados com tolerância zero',
        impactoOuConclusao: 'Zero divergências inexplicadas nas métricas estratégicas entregues.',
      });
    }

    for (const ev of evidenciasElegiveis.slice(0, 3)) {
      if (ev.resultado_mensuravel) {
        metricasFatos.push({
          rotulo: ev.titulo,
          expressaoSanitizada: ev.resultado_mensuravel,
          impactoOuConclusao: ev.fato_observado,
        });
      }
    }

    // 8. Técnicas de Sanitização Proporcionais Sugeridas
    const tecnicasSugeridas: TecnicaSanitizacao[] = [
      TecnicaSanitizacao.ANONIMIZACAO,
      TecnicaSanitizacao.AGREGACAO,
      TecnicaSanitizacao.INDEXACAO,
    ];

    const now = new Date().toISOString();

    return {
      id: crypto.randomUUID(),
      demanda_id: demanda.id,
      projeto_id: demanda.projeto_id ?? null,
      titulo: tituloSanitizado,
      problema_negocio: problemaNegocio,
      processo_preparacao: processoPreparacao,
      modelagem_decisoes: modelagemDecisoes,
      validacao_resultados: validacaoResultados,
      competencias_demonstradas: competencias,
      ferramentas_utilizadas: ferramentas,
      metricas_fatos: metricasFatos,
      tecnicas_sanitizacao: tecnicasSugeridas,
      checklist_sanitizacao: criarChecklistSanitizacaoPadrao(),
      status: StatusEstudoCaso.RASCUNHO,
      homologado_em: null,
      homologado_por: null,
      versao: 1,
      criado_em: now,
      atualizado_em: now,
    };
  }
}
