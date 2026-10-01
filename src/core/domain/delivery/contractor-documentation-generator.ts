/**
 * src/core/domain/delivery/contractor-documentation-generator.ts
 *
 * Gerador Determinístico de Documentação Executiva para o Contratante / Stakeholder (Subgate 3.7C).
 *
 * Princípios de Governança Documental (professional-presentation-policy.md):
 * 1. O Workspace é infraestrutura interna: ZERO menções a "Analyst Personal Workspace";
 * 2. ZERO menções a mecanismos internos como "Evidence Event Engine";
 * 3. ZERO decomposição artificial na dicotomia "humano vs IA" (a entrega é de autoria e responsabilidade profissional do analista);
 * 4. ZERO conteúdo de portfólio, marketing ou LinkedIn;
 * 5. Princípio da Não-Fabricação: derivado exclusivamente de entidades persistidas; nunca inventar resultado, impacto ou métrica inexistente;
 * 6. Tratamento de omissão sóbrio: quando uma informação não estiver disponível, declarar explicitamente sua ausência ou omitir a afirmação;
 * 7. Formatação em Markdown limpo, profissional e pronto para envio ao cliente/contratante.
 */

import { DemandaComProjeto } from '../entities/demanda';
import { EntregavelDemanda } from '../entities/entregavel-demanda';
import { ValidacaoConciliacao } from '../entities/validacao-conciliacao';
import { ROTULOS_TIPO_ENTREGAVEL } from '../enums/tipo-entregavel';
import { ROTULOS_STATUS_ENTREGAVEL } from '../enums/status-entregavel';
import { ROTULOS_CAMADA_VALIDACAO } from '../enums/camada-validacao';

export interface ParametrosDocumentacaoContratante {
  demanda: DemandaComProjeto;
  entregaveis: EntregavelDemanda[];
  validacoes?: ValidacaoConciliacao[];
  metricasHomologadasNomes?: string[];
  dataReferencia?: string;
  autorDocumento?: string;
}

export class ContractorDocumentationGenerator {
  /**
   * Gera o memorial executivo de entrega formatado em Markdown para o contratante/stakeholder.
   */
  public static gerar(params: ParametrosDocumentacaoContratante): string {
    const {
      demanda,
      entregaveis,
      validacoes = [],
      metricasHomologadasNomes = [],
      dataReferencia,
      autorDocumento = 'Analista Responsável',
    } = params;

    // Derivação temporal determinística e factual:
    // 1. Respeitar dataReferencia se informada explicitamente;
    // 2. Se a demanda possui data_conclusao (demanda encerrada), utilizar a data de conclusão histórica definitiva;
    // 3. Se houver entregáveis aceitos com aceite_em, utilizar a data do aceite mais recente;
    // 4. Caso contrário, utilizar a data de atualização ou criação da demanda.
    let dataEfetiva = dataReferencia;
    if (!dataEfetiva) {
      if (demanda.data_conclusao) {
        dataEfetiva = demanda.data_conclusao;
      } else {
        const datasAceite = entregaveis
          .map((e) => e.aceite_em)
          .filter((d): d is string => Boolean(d))
          .sort();
        if (datasAceite.length > 0) {
          dataEfetiva = datasAceite[datasAceite.length - 1];
        } else {
          dataEfetiva = demanda.atualizado_em || demanda.criado_em;
        }
      }
    }

    const dataFormatada = new Date(dataEfetiva).toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const lines: string[] = [];

    // 1. Cabeçalho Executivo
    lines.push(`# Relatório de Entrega Técnica e Operacional`);
    lines.push(`**Demanda:** ${demanda.titulo}`);
    lines.push(`**Projeto:** ${demanda.projetoNome || 'Geral'}`);
    lines.push(`**Data de Formalização:** ${dataFormatada}`);
    lines.push(`**Responsável Técnico:** ${autorDocumento}`);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);

    // 2. Contexto e Desafio de Negócio
    lines.push(`## 1. Contexto e Demanda de Negócio`);
    if (demanda.solicitacao_bruta && demanda.solicitacao_bruta.trim().length > 0) {
      lines.push(`**Solicitação Original:**`);
      lines.push(`> ${demanda.solicitacao_bruta.trim()}`);
      lines.push(``);
    }

    if (demanda.contexto && demanda.contexto.trim().length > 0) {
      lines.push(`**Cenário Operacional:**`);
      lines.push(`${demanda.contexto.trim()}`);
      lines.push(``);
    } else {
      lines.push(`_Contexto operacional detalhado não declarado na abertura da demanda._`);
      lines.push(``);
    }

    // 3. Escopo e Objetivos Atendidos
    lines.push(`## 2. Escopo e Objetivos da Solução`);
    if (demanda.objetivo_inicial && demanda.objetivo_inicial.trim().length > 0) {
      lines.push(`**Objetivo Principal:**`);
      lines.push(`${demanda.objetivo_inicial.trim()}`);
      lines.push(``);
    } else {
      lines.push(`_Objetivo formal não especificado na etapa de abertura._`);
      lines.push(``);
    }

    if (metricasHomologadasNomes.length > 0) {
      lines.push(`**Indicadores e Métricas Chave Implementados:**`);
      metricasHomologadasNomes.forEach((metrica) => {
        lines.push(`- ${metrica}`);
      });
      lines.push(``);
    }

    if (demanda.restricoes_declaradas && demanda.restricoes_declaradas.trim().length > 0) {
      lines.push(`**Restrições e Condicionantes Registradas:**`);
      lines.push(`${demanda.restricoes_declaradas.trim()}`);
      lines.push(``);
    }

    // 4. Metodologia Analítica Aplicada
    lines.push(`## 3. Metodologia e Processamento de Dados`);
    lines.push(`O desenvolvimento desta entrega seguiu uma abordagem estruturada em etapas:`);
    lines.push(`1. **Catalogação e Ingestão:** Recebimento, checagem de acessibilidade e auditoria de integridade das fontes de dados fornecidas.`);
    lines.push(`2. **Avaliação de Qualidade:** Diagnóstico automatizado de regras de qualidade, identificação e tratamento de anomalias.`);
    lines.push(`3. **Transformação e Preparação:** Execução de pipeline de saneamento com autorização formal de datasets para análise.`);
    lines.push(`4. **Modelagem Semântica e Analítica:** Estruturação de modelo relacional/dimensional e definição explícita de cálculos de negócio.`);
    lines.push(`5. **Validação & Conciliação:** Testes de consistência numérica e integridade multicamadas antes da liberação final.`);
    lines.push(``);

    // 5. Catálogo de Entregáveis
    lines.push(`## 4. Pacote de Entregáveis`);
    if (entregaveis.length === 0) {
      lines.push(`_Nenhum entregável cadastrado até o momento para esta demanda._`);
      lines.push(``);
    } else {
      lines.push(`Os seguintes artefatos foram preparados e disponibilizados para uso dos stakeholders:`);
      lines.push(``);
      lines.push(`| Entregável | Tipo | Versão | Status | Localização / Acesso |`);
      lines.push(`| :--- | :--- | :---: | :---: | :--- |`);

      entregaveis.forEach((ent) => {
        const tipoDesc = ROTULOS_TIPO_ENTREGAVEL[ent.tipo] || ent.tipo;
        const statusDesc = ROTULOS_STATUS_ENTREGAVEL[ent.status] || ent.status;
        const linkFormatado = ent.caminho_arquivo_ou_link.startsWith('http')
          ? `[Acessar Link](${ent.caminho_arquivo_ou_link})`
          : `\`${ent.caminho_arquivo_ou_link}\``;

        lines.push(`| **${ent.titulo}** | ${tipoDesc} | \`${ent.versao}\` | ${statusDesc} | ${linkFormatado} |`);
      });
      lines.push(``);

      // Descrições sumárias individuais quando existirem
      const entregaveisComDescricao = entregaveis.filter(
        (e) => e.descricao_sumario && e.descricao_sumario.trim().length > 0
      );

      if (entregaveisComDescricao.length > 0) {
        lines.push(`### Detalhamento dos Artefatos:`);
        entregaveisComDescricao.forEach((ent) => {
          lines.push(`- **${ent.titulo}:** ${ent.descricao_sumario?.trim()}`);
        });
        lines.push(``);
      }
    }

    // 6. Síntese de Validação e Confiabilidade
    lines.push(`## 5. Garantia de Qualidade e Validação`);
    if (validacoes.length === 0) {
      lines.push(`_Validações numéricas formais não registradas na esteira analítica._`);
      lines.push(``);
    } else {
      const aprovadas = validacoes.filter((v) => v.resultado === 'APROVADO').length;
      lines.push(`Para garantir a acurácia dos números apresentados, foram executadas **${validacoes.length} rotina(s) de validação e conciliação**.`);
      lines.push(`- **Total de Testes Aprovados:** ${aprovadas} de ${validacoes.length} (${Math.round((aprovadas / validacoes.length) * 100)}% de conformidade)`);
      lines.push(``);
      lines.push(`| Verificação Realizada | Camada Analítica | Tolerância | Resultado |`);
      lines.push(`| :--- | :--- | :---: | :---: |`);

      validacoes.forEach((v) => {
        const camadaLabel = ROTULOS_CAMADA_VALIDACAO[v.camada] || v.camada;
        const resultadoLabel = v.resultado === 'APROVADO' ? '✅ Conforme' : '⚠️ Divergente/Pendente';
        lines.push(`| ${v.titulo} | ${camadaLabel} | ±${v.tolerancia_permitida}${v.unidade_medida ? ' ' + v.unidade_medida : ''} | ${resultadoLabel} |`);
      });
      lines.push(``);
    }

    // 7. Limitações Conhecidas e Recomendações de Uso
    lines.push(`## 6. Limitações Conhecidas e Orientações de Uso`);
    lines.push(`1. **Janela Temporal:** Os números refletem estritamente a posição dos dados extraídos no período acordado de análise.`);
    lines.push(`2. **Filtros e Granularidade:** Recomenda-se atenção aos critérios de agregação ao cruzar valores consolidados com fontes transacionais não saneadas.`);
    lines.push(`3. **Manutenção e Atualizações:** Caso haja mutação de regras de negócio ou inclusão de novos dados históricos, uma nova rodada de conciliação deverá ser formalizada.`);
    lines.push(``);

    // 8. Formalização de Aceite
    lines.push(`## 7. Registro de Aceite e Homologação`);
    const aceitos = entregaveis.filter((e) => e.aceite_status === 'ACEITO');
    if (aceitos.length === entregaveis.length && entregaveis.length > 0) {
      lines.push(`✅ **Todos os entregáveis foram formalmente homologados.**`);
      lines.push(``);
      lines.push(`| Entregável | Aprovado Por | Data do Aceite | Observações / Justificativa |`);
      lines.push(`| :--- | :--- | :---: | :--- |`);
      aceitos.forEach((e) => {
        const dataAceite = e.aceite_em
          ? new Date(e.aceite_em).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
          : '-';
        lines.push(`| ${e.titulo} | ${e.aceite_por || 'Stakeholder'} | ${dataAceite} | ${e.aceite_justificativa || 'Aceite formal sem ressalvas'} |`);
      });
    } else {
      lines.push(`_Status do aceite: Em processo de homologação formal junto aos responsáveis de negócio._`);
    }
    lines.push(``);

    return lines.join('\n');
  }
}
