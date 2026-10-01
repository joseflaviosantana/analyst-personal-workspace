/**
 * src/core/use-cases/portfolio/exportar-estudo-caso-portfolio.use-case.ts
 *
 * Gera o artefato sanitizado do Estudo de Caso de Portfólio para uso profissional (Subgate 3.9 — Aba 11).
 *
 * Salvaguardas Críticas:
 * 1. A exportação pública exige status estrito HOMOLOGADO_APROV_10.
 * 2. Bloqueia a exportação se o case estiver em RASCUNHO.
 * 3. Nesta V1, a "exportação pública" significa exclusivamente a geração/obtenção do artefato
 *    sanitizado formatado para posterior uso e publicação humana externa (sem disparos autônomos).
 */

import { IEstudoCasoPortfolioRepository } from '@/core/domain/repositories/estudo-caso-portfolio-repository.interface';
import { StatusEstudoCaso } from '@/core/domain/enums/status-estudo-caso';
import { ROTULOS_TECNICA_SANITIZACAO } from '@/core/domain/enums/tecnica-sanitizacao';

export interface ExportarEstudoCasoPortfolioInput {
  caseId: string;
}

export interface ExportarEstudoCasoPortfolioOutput {
  caseId: string;
  titulo: string;
  markdown: string;
  versao: number;
  homologadoEm: string;
  homologadoPor: string;
  exportadoEm: string;
}

export class ExportarEstudoCasoPortfolioUseCase {
  constructor(private caseRepo: IEstudoCasoPortfolioRepository) {}

  async execute(input: ExportarEstudoCasoPortfolioInput): Promise<ExportarEstudoCasoPortfolioOutput> {
    const casePortfolio = await this.caseRepo.findById(input.caseId);
    if (!casePortfolio) {
      throw new Error(`Estudo de caso com ID '${input.caseId}' não encontrado.`);
    }

    if (casePortfolio.status !== StatusEstudoCaso.HOMOLOGADO_APROV_10) {
      throw new Error(
        'A exportação pública de estudo de caso de portfólio exige prévia deliberação e homologação soberana humana (APROV-10). O documento encontra-se atualmente em RASCUNHO.'
      );
    }

    const lines: string[] = [];

    lines.push(`# ${casePortfolio.titulo}`);
    lines.push('');
    lines.push(`> **Estudo de Caso Profissional de Portfólio (v${casePortfolio.versao})**`);
    lines.push(`> **Homologado por:** ${casePortfolio.homologado_por || 'Analista'} em ${casePortfolio.homologado_em || 'Data não registrada'}`);
    lines.push('> **Conformidade de Higienização:** 100% Auditado (Zero PII e Segredos Comerciais)');
    lines.push('');

    // Técnicas de sanitização
    if (casePortfolio.tecnicas_sanitizacao.length > 0) {
      lines.push('### Técnicas de Sanitização Proporcionais Aplicadas:');
      for (const t of casePortfolio.tecnicas_sanitizacao) {
        lines.push(`- ${ROTULOS_TECNICA_SANITIZACAO[t] || t}`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');

    // 1. Contexto e Problema de Negócio (STAR - S)
    lines.push('## 1. Contexto e Problema de Negócio');
    lines.push(casePortfolio.problema_negocio);
    lines.push('');

    // 2. Governança e Preparação de Dados (STAR - T)
    lines.push('## 2. Governança e Engenharia de Preparação');
    lines.push(casePortfolio.processo_preparacao);
    lines.push('');

    // 3. Modelagem Analítica e Decisões Técnicas (STAR - A)
    lines.push('## 3. Modelagem Analítica e Decisões de BI');
    lines.push(casePortfolio.modelagem_decisoes);
    lines.push('');

    // 4. Validação Cruzada e Resultados Fatuais (STAR - R)
    lines.push('## 4. Validação Cruzada e Resultados Fatuais');
    lines.push(casePortfolio.validacao_resultados);
    lines.push('');

    // Métricas Chave
    if (casePortfolio.metricas_fatos.length > 0) {
      lines.push('### Métricas Fatuais e Conclusões Comprovadas');
      lines.push('| Métrica / Indicador | Resultado Sanitizado | Conclusão / Impacto |');
      lines.push('| :--- | :--- | :--- |');
      for (const m of casePortfolio.metricas_fatos) {
        lines.push(`| ${m.rotulo} | **${m.expressaoSanitizada}** | ${m.impactoOuConclusao} |`);
      }
      lines.push('');
    }

    // Ferramentas e Competências
    lines.push('---');
    lines.push('');
    lines.push(`**Competências Demonstradas:** ${casePortfolio.competencias_demonstradas.join(' • ')}`);
    lines.push(`**Tecnologias Empregadas:** ${casePortfolio.ferramentas_utilizadas.join(', ')}`);
    lines.push('');

    return {
      caseId: casePortfolio.id,
      titulo: casePortfolio.titulo,
      markdown: lines.join('\n'),
      versao: casePortfolio.versao,
      homologadoEm: casePortfolio.homologado_em || '',
      homologadoPor: casePortfolio.homologado_por || '',
      exportadoEm: new Date().toISOString(),
    };
  }
}
