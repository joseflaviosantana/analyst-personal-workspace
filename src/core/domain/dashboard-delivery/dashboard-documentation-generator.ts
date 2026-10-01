/**
 * src/core/domain/dashboard-delivery/dashboard-documentation-generator.ts
 *
 * Gerador Determinístico de Documentação Técnica e Memorial Descritivo em Markdown (Subgate 3.4E)
 *
 * Princípios de Engenharia e Epistêmicos:
 * 1. O usuário não escreve documentação repetitiva que o Workspace deriva dos dados reais;
 * 2. Diferenciação rigorosa: Fatos Observados, Inferências Lógicas, Recomendações e Decisões Humanas;
 * 3. Marcação explícita de lacunas conceituais e ausências semânticas (não inventa dados);
 * 4. Rastreabilidade total: Pergunta de Negócio -> Métrica -> Medida DAX -> Visual -> Página;
 * 5. Saída em Markdown puro, pronto para exportação, auditoria, repositório ou documentação de projeto.
 */

import { PacoteEntregaDashboard } from './dashboard-delivery-types';

export class DashboardDocumentationGenerator {
  public static gerarMarkdown(pacote: PacoteEntregaDashboard): string {
    const {
      versaoPacote,
      geradoEm,
      demanda,
      modeloPowerBi,
      modeloAnaliticoReferencia,
      catalogoMedidasDax,
      paginas,
      visuais,
      perfilVisualTemplate,
      prontidaoNormativa,
      orientacoesCopiloto,
      checklist,
      casePortfolio,
      decisoesHumanas,
      statusEntrega,
    } = pacote;

    const dataFormatada = new Date(geradoEm).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });

    const lines: string[] = [];

    // Header Principal
    lines.push(`# MEMORIAL DESCRITIVO E PACOTE DE ENTREGA TÉCNICA`);
    lines.push(`## Etapa 7: Power BI, DAX & Dashboard Automation — Analyst Personal Workspace`);
    lines.push(``);
    lines.push(`> **Documento gerado automaticamente pelo Workspace** em \`${dataFormatada}\`  `);
    lines.push(`> **Versão do Pacote:** \`${versaoPacote}\` | **Status Geral de Entrega:** \`${statusEntrega}\` | **Conclusão Checklist:** \`${checklist.percentualConclusao}%\``);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);

    // SEÇÃO A: Contexto e Identificação
    lines.push(`### A. Contexto e Identificação da Demanda`);
    lines.push(`- **Demanda ID:** \`${demanda.id}\``);
    lines.push(`- **Título da Demanda:** ${demanda.titulo}`);
    lines.push(`- **Projeto Associado:** ${demanda.projetoNome || 'Projeto Padrão'}`);
    lines.push(`- **Estado do Workflow:** \`${demanda.estado}\``);
    lines.push(`- **Contexto Operacional:** ${demanda.contexto ? demanda.contexto : '_[Fato: Não declarado na abertura da demanda]_'}`);
    lines.push(``);

    // SEÇÃO B: Objetivo Analítico do Dashboard
    lines.push(`### B. Objetivo Analítico do Dashboard`);
    lines.push(
      demanda.objetivo
        ? `${demanda.objetivo}`
        : `_[Lacuna: Objetivo inicial não formalizado na demanda. Recomenda-se registrar na Aba 1.]_`
    );
    lines.push(``);

    // SEÇÃO C: Perguntas de Negócio
    lines.push(`### C. Perguntas de Negócio Mapeadas`);
    const perguntas = visuais
      .map((v) => v.justificativaDataviz?.qualPerguntaResponde)
      .filter((p): p is string => Boolean(p && p.trim().length > 0 && p !== 'Não especificada'));

    const perguntasUnicas = Array.from(new Set(perguntas));
    if (perguntasUnicas.length > 0) {
      perguntasUnicas.forEach((pergunta, idx) => {
        lines.push(`${idx + 1}. **${pergunta}**`);
      });
    } else {
      lines.push(`_[Fato: Nenhuma pergunta analítica com rastreabilidade explícita foi vinculada aos visuais.]_`);
    }
    lines.push(``);

    // SEÇÃO D: Modelo Analítico Utilizado
    lines.push(`### D. Modelo Analítico e Arquitetura de Dados`);
    if (modeloAnaliticoReferencia) {
      lines.push(`- **Modelo Analítico de Origem:** ${modeloAnaliticoReferencia.nome} (\`${modeloAnaliticoReferencia.id}\`)`);
      lines.push(`- **Status de Homologação:** \`${modeloAnaliticoReferencia.status}\``);
      lines.push(`- **Total de Métricas Vinculadas:** ${modeloAnaliticoReferencia.totalMetricas}`);
    } else if (modeloPowerBi?.isIsento) {
      lines.push(`- **Regime Especial:** Isenção Excel-Only ativa (\`${modeloPowerBi.justificativaIsencao}\`). Dispensada vinculação a modelo dimensional formal.`);
    } else {
      lines.push(`- _[Alerta: Nenhum modelo analítico dimensional homologado associado a esta demanda.]_`);
    }
    lines.push(``);

    // SEÇÃO E: Modelo Power BI e Arquivo Físico
    lines.push(`### E. Artefatos de Power BI e Formato de Armazenamento`);
    if (modeloPowerBi) {
      lines.push(`- **Nome do Arquivo / Artefato:** \`${modeloPowerBi.nomeArquivo}\``);
      lines.push(`- **Formato:** \`${modeloPowerBi.tipoFormato}\``);
      lines.push(`- **Status do Modelo:** \`${modeloPowerBi.status}\``);
      if (modeloPowerBi.versaoPowerBi) {
        lines.push(`- **Versão do Power BI Desktop:** \`${modeloPowerBi.versaoPowerBi}\``);
      }
      if (modeloPowerBi.isIsento) {
        lines.push(`- **Declaração de Isenção:** ${modeloPowerBi.justificativaIsencao}`);
      }
    } else {
      lines.push(`- _[Bloqueio: Nenhum modelo Power BI ou declaração de isenção registrado.]_`);
    }
    lines.push(``);

    // SEÇÃO F: Catálogo de Medidas DAX
    lines.push(`### F. Catálogo de Medidas DAX (${catalogoMedidasDax.length} medida(s))`);
    if (catalogoMedidasDax.length > 0) {
      lines.push(`| Medida | Tabela Hospedeira | Categoria | Formato | Métrica de Origem |`);
      lines.push(`| :--- | :--- | :--- | :--- | :--- |`);
      catalogoMedidasDax.forEach((m) => {
        lines.push(
          `| \`${m.nome}\` | \`${m.tabelaHospedeira}\` | ${m.categoriaDax} | \`${m.formatoString || 'Geral'}\` | ${m.metricaOrigemNome || '_[Sem vínculo]_'} |`
        );
      });
      lines.push(``);
      lines.push(`#### Fórmulas DAX Documentadas:`);
      catalogoMedidasDax.forEach((m) => {
        lines.push(`**${m.nome}** (\`${m.tabelaHospedeira}\`):`);
        lines.push('```dax');
        lines.push(`${m.nome} = \n${m.expressaoDax}`);
        lines.push('```');
      });
    } else {
      lines.push(`_[Fato: Nenhuma medida DAX cadastrada no catálogo da demanda.]_`);
    }
    lines.push(``);

    // SEÇÃO G: Estrutura de Páginas do Dashboard
    lines.push(`### G. Estrutura de Páginas do Dashboard (${paginas.length} página(s))`);
    lines.push(`- **Perfil Visual / Template Estrutural:** \`${perfilVisualTemplate}\``);
    if (paginas.length > 0) {
      lines.push(`| Ordem | Página | Público-Alvo | Grid | Visuais | Objetivo Analítico |`);
      lines.push(`| :---: | :--- | :--- | :--- | :---: | :--- |`);
      paginas.forEach((p) => {
        lines.push(
          `| ${p.ordem} | **${p.nome}** | \`${p.publicoAlvo}\` | \`${p.layoutGrid}\` | ${p.totalVisuais} | ${p.objetivoAnalitico || '_[Geral]_'} |`
        );
      });
    } else {
      lines.push(`_[Fato: Nenhuma página estruturada.]_`);
    }
    lines.push(``);

    // SEÇÃO H: Catálogo de Visuais e Mapeamento de Layout
    lines.push(`### H. Especificação dos Visuais (${visuais.length} visual(is))`);
    if (visuais.length > 0) {
      lines.push(`| Página | Visual | Tipo | Posição no Grid | Medidas Utilizadas |`);
      lines.push(`| :--- | :--- | :--- | :--- | :--- |`);
      visuais.forEach((v) => {
        lines.push(
          `| ${v.paginaNome} | **${v.titulo}** | \`${v.tipoVisual}\` | \`${v.posicaoLayout}\` | ${v.medidasAssociadas.length > 0 ? v.medidasAssociadas.map((m) => `\`${m}\``).join(', ') : '_[Nenhuma]_'} |`
        );
      });
    } else {
      lines.push(`_[Fato: Nenhum visual analítico cadastrado.]_`);
    }
    lines.push(``);

    // SEÇÃO I: Justificativas DataViz ("Aprenda Enquanto Trabalha")
    lines.push(`### I. Justificativas DataViz e Pedagogia Analítica`);
    const visuaisComDataviz = visuais.filter((v) => v.justificativaDataviz);
    if (visuaisComDataviz.length > 0) {
      visuaisComDataviz.forEach((v) => {
        const j = v.justificativaDataviz!;
        lines.push(`#### Visual: ${v.titulo} (\`${v.tipoVisual}\` em \`${v.paginaNome}\`)`);
        lines.push(`- **O que é / Escolha:** ${j.oQueFoiEscolhido}`);
        lines.push(`- **Por que foi escolhido:** ${j.porQueFoiEscolhido}`);
        lines.push(`- **Pergunta que responde:** ${j.qualPerguntaResponde}`);
        lines.push(`- **Métrica / Medida:** ${j.qualMetricaUtiliza}`);
        lines.push(`- **Dimensão / Segmento:** ${j.qualDimensaoUtiliza}`);
        lines.push(`- **Dica Profissional:** ${j.dicaProfissional}`);
        lines.push(`- **Quando evitar:** ${j.quandoEvitar}`);
        lines.push(``);
      });
    } else {
      lines.push(`_[Fato: Nenhuma justificativa DataViz disponível.]_`);
      lines.push(``);
    }

    // SEÇÃO J: Avaliação de Conformidade e Regras Normativas (D-01 a D-08)
    lines.push(`### J. Conformidade Normativa e Prontidão (Regras D-01 a D-08)`);
    lines.push(`- **Status de Prontidão:** \`${prontidaoNormativa.statusGeral}\``);
    lines.push(`- **Apto para Validação Final:** ${prontidaoNormativa.aptoParaValidacao ? '✅ **SIM**' : '❌ **NÃO**'}`);
    lines.push(`- **Total de Bloqueios:** ${prontidaoNormativa.totalBloqueios}`);
    lines.push(`- **Total de Alertas Críticos:** ${prontidaoNormativa.totalAlertasCriticos}`);
    lines.push(`- **Total de Recomendações:** ${prontidaoNormativa.totalRecomendacoes}`);
    lines.push(``);
    if (prontidaoNormativa.diagnosticos.length > 0) {
      lines.push(`| Regra | Severidade | Diagnóstico | Recomendação |`);
      lines.push(`| :---: | :---: | :--- | :--- |`);
      prontidaoNormativa.diagnosticos.forEach((d) => {
        lines.push(`| \`${d.codigo_regra}\` | \`${d.severidade}\` | ${d.titulo}: ${d.deteccao} | ${d.recomendacao} |`);
      });
      lines.push(``);
    }

    // SEÇÃO K: Recomendações do Copiloto Proativo
    lines.push(`### K. Orientações Proativas do Copiloto (${orientacoesCopiloto.totalInsights} insight(s))`);
    lines.push(`> *Nota de Governança: As orientações do Copiloto são pedagógicas e consultivas; não possuem autoridade normativa e não bloqueiam a entrega.*`);
    lines.push(``);
    if (orientacoesCopiloto.insights.length > 0) {
      orientacoesCopiloto.insights.forEach((ins, idx) => {
        lines.push(
          `${idx + 1}. **[${ins.codigo ? ins.codigo + ' — ' : ''}${ins.categoria}] ${ins.titulo}**`
        );
        lines.push(`   - ${ins.recomendacao}`);
        if (ins.explicacao) {
          lines.push(`   - _Racional pedagógico:_ ${ins.explicacao}`);
        }
      });
    } else {
      lines.push(`_[Nenhuma oportunidade ou alerta de ergonomia detectado pelo Copiloto.]_`);
    }
    lines.push(``);

    // SEÇÃO L: Checklist de Entrega da Etapa
    lines.push(`### L. Checklist Determinístico de Entrega (${checklist.totalConcluidos}/${checklist.totalItens} concluídos — ${checklist.percentualConclusao}%)`);
    lines.push(`| Código | Item | Status | Evidência / Ação |`);
    lines.push(`| :---: | :--- | :---: | :--- |`);
    checklist.itens.forEach((it) => {
      const statusIcon =
        it.status === 'CONCLUIDO'
          ? '✅ CONCLUÍDO'
          : it.status === 'BLOQUEADO'
          ? '🚫 BLOQUEADO'
          : it.status === 'NAO_APLICAVEL'
          ? '⚪ ISENTO'
          : '⚠️ PENDENTE';
      lines.push(
        `| \`${it.codigo}\` | ${it.titulo} | ${statusIcon} | ${it.evidencia || it.acaoSugerida || '-'} |`
      );
    });
    lines.push(``);

    // SEÇÃO M: Decisões Humanas e Próximas Ações
    lines.push(`### M. Registro de Decisões Humanas e Próximas Ações`);
    if (decisoesHumanas.length > 0) {
      lines.push(`#### Decisões Humanas Formalizadas:`);
      decisoesHumanas.forEach((dh, idx) => {
        lines.push(
          `${idx + 1}. **[${dh.tipo}]** ${dh.descricao} _(Autor: ${dh.autor || 'Analista'}, em ${dh.dataHora})_`
        );
      });
      lines.push(``);
    } else {
      lines.push(`_[Decisões operacionais registradas via governança dos componentes da Aba 7.]_`);
      lines.push(``);
    }

    lines.push(`#### Próximas Ações Recomendadas:`);
    if (checklist.totalBloqueados > 0) {
      lines.push(`1. ⚠️ **Resolver os ${checklist.totalBloqueados} bloqueio(s) normativo(s)** apontados na Seção J antes de avançar.`);
    } else if (checklist.aptoParaSeguirWorkflow) {
      lines.push(`1. ✅ **Avançar para a Aba 8 (Validação de Negócio e Reconciliação)**.`);
      lines.push(`2. Exportar o pacote técnico nos formatos \`JSON\` e \`TMDL\` para versionamento.`);
      lines.push(`3. Realizar a revisão executiva com o stakeholder utilizando o checklist homologado.`);
    } else {
      lines.push(`1. Concluir as pendências sinalizadas no checklist antes de submeter à validação final.`);
    }
    lines.push(``);

    // SEÇÃO N: Preparação Estrutural de Portfólio (Sem Publicação Externa)
    lines.push(`---`);
    lines.push(`### N. Ficha Síntese para Portfólio Profissional (Estrutura Preparada)`);
    lines.push(`> *Nota de Confidencialidade: Resumo estrutural interno sanitizado. Nenhuma publicação externa é executada.*`);
    lines.push(``);
    lines.push(`- **Título do Case:** ${casePortfolio.tituloCase}`);
    lines.push(`- **Problema de Negócio:** ${casePortfolio.problemaNegocio}`);
    lines.push(`- **Contexto:** ${casePortfolio.contexto}`);
    lines.push(`- **Processo Aplicado:** ${casePortfolio.processoAplicado}`);
    lines.push(`- **Ferramentas:** ${casePortfolio.ferramentasUtilizadas.join(', ')}`);
    lines.push(`- **Métricas Chave:** ${casePortfolio.metricasChave.join(', ')}`);
    lines.push(`- **Decisões Metodológicas:** ${casePortfolio.decisoesMetodologicas.join('; ')}`);
    lines.push(`- **Resultados e Impacto:** ${casePortfolio.resultadosEsperados}`);
    lines.push(`- **Aprendizados Técnicos:** ${casePortfolio.aprendizadosTecnicos.join('; ')}`);
    lines.push(`- **Resumo Técnico Sanitizado:** ${casePortfolio.resumoTecnicoSanitizado}`);
    lines.push(``);
    lines.push(`---`);
    lines.push(`*Fim da Documentação Técnica do Pacote de Entrega — Analyst Personal Workspace V1.*`);

    return lines.join('\n');
  }
}
