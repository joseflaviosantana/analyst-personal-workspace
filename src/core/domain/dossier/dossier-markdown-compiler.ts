/**
 * src/core/domain/dossier/dossier-markdown-compiler.ts
 *
 * Compilador determinístico e puro do Dossiê Técnico Concorrente da Demanda (Subgate 3.9 — Aba 11).
 *
 * Consolida a memória técnica das 10 etapas da demanda em formato Markdown auditável.
 * O Dossiê é concorrente e consultável/exportável em qualquer estado do workflow.
 */

import { Demanda } from '../entities/demanda';
import { RequisitoDemanda } from '../entities/requisito-demanda';
import { PerguntaClarificacao } from '../entities/pergunta-clarificacao';
import { AtivoDados } from '../entities/ativo-dados';
import { ProblemaQualidade } from '../entities/problema-qualidade';
import { ReceitaPreparacao } from '../entities/receita-preparacao';
import { ModeloAnalitico } from '../entities/modelo-analitico';
import { MedidaDax } from '../entities/medida-dax';
import { EvidenciaAnalitica } from '../entities/evidencia-analitica';
import { ValidacaoConciliacao } from '../entities/validacao-conciliacao';
import { EntregavelDemanda } from '../entities/entregavel-demanda';
import { TrilhaAuditoria } from '../entities/trilha-auditoria';

export interface DossierCompilationData {
  demanda: Demanda & { projeto_nome?: string };
  requisitos?: RequisitoDemanda[];
  perguntas?: PerguntaClarificacao[];
  ativosDados?: AtivoDados[];
  problemasQualidade?: ProblemaQualidade[];
  receitasPreparacao?: ReceitaPreparacao[];
  modelosAnaliticos?: ModeloAnalitico[];
  medidasDax?: MedidaDax[];
  evidencias?: EvidenciaAnalitica[];
  validacoes?: ValidacaoConciliacao[];
  entregaveis?: EntregavelDemanda[];
  auditorias?: TrilhaAuditoria[];
}

export class DossierMarkdownCompiler {
  static compilar(data: DossierCompilationData): string {
    const {
      demanda,
      requisitos = [],
      perguntas = [],
      ativosDados = [],
      problemasQualidade = [],
      receitasPreparacao = [],
      modelosAnaliticos = [],
      medidasDax = [],
      evidencias = [],
      validacoes = [],
      entregaveis = [],
      auditorias = [],
    } = data;

    const lines: string[] = [];

    // 1. Cabeçalho & Metadados do Projeto
    lines.push(`# DOSSIÊ TÉCNICO CONCORRENTE — ${demanda.titulo}`);
    lines.push(`**ID da Demanda:** \`${demanda.id}\` | **Projeto:** ${demanda.projeto_nome || demanda.projeto_id || 'Não vinculado'}`);
    lines.push(`**Estado Operacional no Workflow:** \`${demanda.estado}\` | **Gerado em:** ${new Date().toISOString()}`);
    lines.push('');
    lines.push('> *Nota de Governança:* Este documento consolida a memória técnica e factual da demanda, gerada de forma concorrente ao longo do workflow analítico (Fases 1 a 11).');
    lines.push('');
    lines.push('---');
    lines.push('');

    // 2. Briefing Analítico & Requisitos (Abas 1 e 2)
    lines.push('## 1. Briefing Analítico & Requisitos de Negócio');
    lines.push(`- **Contexto de Negócio:** ${demanda.contexto || 'Não informado formalmente.'}`);
    lines.push(`- **Objetivo da Análise:** ${demanda.objetivo_inicial || 'Não informado formalmente.'}`);
    lines.push(`- **Período de Análise:** ${demanda.periodo_analise || 'Conforme bases de dados fornecidas'}`);
    lines.push(`- **Granularidade Operacional:** ${demanda.granularidade || 'Transacional / Diária'}`);
    lines.push(`- **Formato de Entrega Acordado:** ${demanda.formato_entrega || 'Power BI (.pbix) + Relatório Executivo'}`);
    lines.push(`- **Restrições Declaradas:** ${demanda.restricoes_declaradas || 'Nenhuma restrição declarada.'}`);

    if (demanda.requisitos_homologados_em) {
      lines.push('');
      lines.push(`> **Marco de Homologação de Requisitos:** Homologado por \`${demanda.requisitos_homologados_por || 'Analista'}\` em ${demanda.requisitos_homologados_em}.`);
      if (demanda.requisitos_justificativa_homologacao) {
        lines.push(`> **Justificativa:** ${demanda.requisitos_justificativa_homologacao}`);
      }
    }

    lines.push('');
    lines.push('### Requisitos Atômicos Catalogados');
    if (requisitos.length === 0) {
      lines.push('_Nenhum requisito atômico cadastrado até o momento._');
    } else {
      lines.push('| ID | Título | Categoria | Prioridade | Status |');
      lines.push('| :--- | :--- | :--- | :--- | :--- |');
      for (const r of requisitos) {
        lines.push(`| \`${r.id.slice(0, 8)}\` | ${r.titulo} | \`${r.categoria}\` | \`${r.prioridade}\` | \`${r.status}\` |`);
      }
    }

    if (perguntas.length > 0) {
      lines.push('');
      lines.push('### Perguntas de Clarificação ao Contratante');
      lines.push('| Pergunta | Status | Respondido Por | Resposta |');
      lines.push('| :--- | :--- | :--- | :--- |');
      for (const p of perguntas) {
        lines.push(`| ${p.pergunta} | \`${p.status}\` | ${p.respondido_por || '-'} | ${p.resposta || '_Pendente_'} |`);
      }
    }

    lines.push('');
    lines.push('---');
    lines.push('');

    // 3. Inventário de Ativos de Dados (Aba 3)
    lines.push('## 2. Inventário de Ativos de Dados Recebidos');
    if (ativosDados.length === 0) {
      lines.push('_Nenhum ativo de dados inventariado nesta demanda._');
    } else {
      lines.push('| Nome do Arquivo | Formato | Linhas | Colunas | Hash SHA-256 |');
      lines.push('| :--- | :--- | :--- | :--- | :--- |');
      for (const a of ativosDados) {
        const hashDisplay = a.hash_sha256 ? `\`${a.hash_sha256.slice(0, 12)}...\`` : '-';
        lines.push(`| ${a.nome_arquivo} | \`${a.formato}\` | ${a.total_linhas?.toLocaleString('pt-BR') || 0} | ${a.total_colunas || 0} | ${hashDisplay} |`);
      }
    }

    lines.push('');
    lines.push('---');
    lines.push('');

    // 4. Governança de Qualidade & Anomalias (Aba 4)
    lines.push('## 3. Qualidade de Dados & Anomalias Tratadas');
    if (problemasQualidade.length === 0) {
      lines.push('_Nenhuma anomalia de qualidade registrada na demanda._');
    } else {
      lines.push('| Título do Problema | Severidade | Ação Deliberada | Status |');
      lines.push('| :--- | :--- | :--- | :--- |');
      for (const pq of problemasQualidade) {
        lines.push(`| ${pq.titulo} | \`${pq.severidade}\` | \`${pq.acao_deliberada || 'EM_INVESTIGACAO'}\` | \`${pq.status}\` |`);
      }
    }

    lines.push('');
    lines.push('---');
    lines.push('');

    // 5. Preparação & Transformação de Dados (Aba 5)
    lines.push('## 4. Preparação & Transformação (Power Query M)');
    if (receitasPreparacao.length === 0) {
      lines.push('_Nenhuma receita de preparação cadastrada._');
    } else {
      for (const r of receitasPreparacao) {
        lines.push(`### Receita: ${r.titulo}`);
        lines.push(`- **Descrição:** ${r.descricao || 'Transformações aplicadas'}`);
        lines.push(`- **Status:** \`${r.status}\``);
        lines.push('');
      }
    }

    lines.push('---');
    lines.push('');

    // 6. Modelagem Analítica & KPIs (Aba 6)
    lines.push('## 5. Modelagem Analítica Dimensional');
    if (modelosAnaliticos.length === 0) {
      lines.push('_Nenhum modelo analítico formalizado nesta etapa._');
    } else {
      for (const m of modelosAnaliticos) {
        lines.push(`- **Modelo:** ${m.nome} (Status: \`${m.status}\`)`);
        lines.push(`  - **Descrição:** ${m.descricao || 'Estrutura dimensional'}`);
      }
    }

    lines.push('');
    lines.push('---');
    lines.push('');

    // 7. Catálogo Power BI & Medidas DAX (Aba 7)
    lines.push('## 6. Catálogo de Medidas DAX & Relatório');
    if (medidasDax.length === 0) {
      lines.push('_Nenhuma medida DAX registrada até o momento._');
    } else {
      lines.push('| Medida DAX | Tabela Hospedeira | Categoria | Formato |');
      lines.push('| :--- | :--- | :--- | :--- |');
      for (const d of medidasDax) {
        lines.push(`| \`[${d.nome}]\` | \`${d.tabela_hospedeira}\` | \`${d.categoria_dax}\` | \`${d.formato_string || 'Padrão'}\` |`);
      }
    }

    lines.push('');
    lines.push('---');
    lines.push('');

    // 8. Evidências Analíticas & Achados (Aba 8)
    lines.push('## 7. Evidências Analíticas & Raciocínio Factual');
    if (evidencias.length === 0) {
      lines.push('_Nenhuma evidência analítica registrada nesta demanda._');
    } else {
      lines.push('| Título da Evidência | Etapa | Fato Observado | Portfólio Elegível |');
      lines.push('| :--- | :--- | :--- | :--- |');
      for (const ev of evidencias) {
        const elegivel = ev.elegibilidade_portfolio ? '✅ Sim' : '❌ Não';
        lines.push(`| ${ev.titulo} | \`${ev.etapa_origem}\` | ${ev.fato_observado} | ${elegivel} |`);
      }
    }

    lines.push('');
    lines.push('---');
    lines.push('');

    // 9. Validação Multicamadas & Conciliação (Aba 9)
    lines.push('## 8. Validação Multicamadas & Reconciliação Numérica');
    if (validacoes.length === 0) {
      lines.push('_Nenhuma validação de conciliação registrada._');
    } else {
      lines.push('| Validação / KPI | Esperado | Obtido | Divergência | Status |');
      lines.push('| :--- | :--- | :--- | :--- | :--- |');
      for (const v of validacoes) {
        const esperado = v.valor_esperado !== null && v.valor_esperado !== undefined ? v.valor_esperado : '-';
        const obtido = v.valor_obtido !== null && v.valor_obtido !== undefined ? v.valor_obtido : '-';
        const divergencia = v.divergencia_absoluta !== null && v.divergencia_absoluta !== undefined ? v.divergencia_absoluta : 0;
        lines.push(`| ${v.titulo} | ${esperado} | ${obtido} | \`${divergencia}\` | \`${v.resultado}\` |`);
      }
    }

    lines.push('');
    lines.push('---');
    lines.push('');

    // 10. Entregáveis & Encerramento (Aba 10)
    lines.push('## 9. Entregáveis Finais do Projeto');
    if (entregaveis.length === 0) {
      lines.push('_Nenhum entregável formalizado._');
    } else {
      lines.push('| Nome do Entregável | Tipo | Versão | Status Aceite |');
      lines.push('| :--- | :--- | :--- | :--- |');
      for (const ent of entregaveis) {
        lines.push(`| ${ent.titulo} | \`${ent.tipo}\` | \`${ent.versao}\` | \`${ent.aceite_status}\` |`);
      }
    }

    lines.push('');
    lines.push('---');
    lines.push('');

    // 11. Trilha de Auditoria & Decisões Humanas
    lines.push('## 10. Trilha de Auditoria e Decisões Soberanas');
    if (auditorias.length === 0) {
      lines.push('_Nenhum registro de auditoria registrado._');
    } else {
      lines.push('| Timestamp | Evento | Autor | Justificativa |');
      lines.push('| :--- | :--- | :--- | :--- |');
      for (const aud of auditorias) {
        lines.push(`| ${aud.timestamp} | \`${aud.tipo_evento}\` | \`${aud.autor_tipo}\` | ${aud.justificativa || '-'} |`);
      }
    }

    lines.push('');
    lines.push('---');
    lines.push('*Fim do Dossiê Técnico Concorrente — Analyst Personal Workspace*');

    return lines.join('\n');
  }
}
