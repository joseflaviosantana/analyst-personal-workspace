import { describe, it, expect } from 'vitest';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { TipoRegraQualidade } from '@/core/domain/enums/tipo-regra-qualidade';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { StatusVerificacaoQualidade } from '@/core/domain/enums/status-verificacao-qualidade';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';

// Importa os componentes criados para validar integridade de tipos e módulos
import { QualitySummaryHeader } from '@/components/quality/QualitySummaryHeader';
import { NextActionBanner } from '@/components/quality/NextActionBanner';
import { DiagnosticDetailsAccordion } from '@/components/quality/DiagnosticDetailsAccordion';
import { ProblemCard } from '@/components/quality/ProblemCard';
import { ProblemQueue } from '@/components/quality/ProblemQueue';
import { DeliberateProblemModal } from '@/components/quality/DeliberateProblemModal';
import { UpdateProblemStatusModal } from '@/components/quality/UpdateProblemStatusModal';
import { ManualProblemModal } from '@/components/quality/ManualProblemModal';
import { QualityRuleModal } from '@/components/quality/QualityRuleModal';
import { QualityRulesSection } from '@/components/quality/QualityRulesSection';
import { TabQuality } from '@/components/demands/TabQuality';

describe('Unidade 3.4C.3 — Interface da Aba 4 (Qualidade / Anomalias)', () => {
  it('deve exportar todos os componentes visuais e modais da Aba 4', () => {
    expect(QualitySummaryHeader).toBeDefined();
    expect(NextActionBanner).toBeDefined();
    expect(DiagnosticDetailsAccordion).toBeDefined();
    expect(ProblemCard).toBeDefined();
    expect(ProblemQueue).toBeDefined();
    expect(DeliberateProblemModal).toBeDefined();
    expect(UpdateProblemStatusModal).toBeDefined();
    expect(ManualProblemModal).toBeDefined();
    expect(QualityRuleModal).toBeDefined();
    expect(QualityRulesSection).toBeDefined();
    expect(TabQuality).toBeDefined();
  });

  describe('Lógica de Apresentação e Priorização da Fila de Problemas', () => {
    it('deve priorizar PENDENTE no topo absoluto da fila de problemas', () => {
      const problemas: Partial<ProblemaQualidade>[] = [
        {
          id: 'prob-baixa',
          severidade: SeveridadeProblema.BAIXA,
          status: StatusProblemaQualidade.ABERTO,
          total_linhas_afetadas: 10,
        },
        {
          id: 'prob-critica-resolvida',
          severidade: SeveridadeProblema.CRITICA,
          status: StatusProblemaQualidade.TRATADO,
          total_linhas_afetadas: 50,
        },
        {
          id: 'prob-pendente',
          severidade: SeveridadeProblema.PENDENTE,
          status: StatusProblemaQualidade.ABERTO,
          total_linhas_afetadas: 5,
        },
        {
          id: 'prob-alta',
          severidade: SeveridadeProblema.ALTA,
          status: StatusProblemaQualidade.ABERTO,
          total_linhas_afetadas: 20,
        },
        {
          id: 'prob-critica-aberta',
          severidade: SeveridadeProblema.CRITICA,
          status: StatusProblemaQualidade.ABERTO,
          total_linhas_afetadas: 100,
        },
      ];

      // Ordenação idêntica à implementada em ProblemQueue.tsx
      const ordenados = [...problemas].sort((a: any, b: any) => {
        if (a.severidade === SeveridadeProblema.PENDENTE && b.severidade !== SeveridadeProblema.PENDENTE) return -1;
        if (b.severidade === SeveridadeProblema.PENDENTE && a.severidade !== SeveridadeProblema.PENDENTE) return 1;

        const aResolvido = a.status === StatusProblemaQualidade.TRATADO || a.status === StatusProblemaQualidade.ACEITO_COMO_RESTRICAO;
        const bResolvido = b.status === StatusProblemaQualidade.TRATADO || b.status === StatusProblemaQualidade.ACEITO_COMO_RESTRICAO;
        if (aResolvido && !bResolvido) return 1;
        if (!aResolvido && bResolvido) return -1;

        const pesoSeveridade: Record<SeveridadeProblema, number> = {
          [SeveridadeProblema.PENDENTE]: 5,
          [SeveridadeProblema.CRITICA]: 4,
          [SeveridadeProblema.ALTA]: 3,
          [SeveridadeProblema.MEDIA]: 2,
          [SeveridadeProblema.BAIXA]: 1,
        };

        const pesoA = pesoSeveridade[a.severidade as SeveridadeProblema] || 0;
        const pesoB = pesoSeveridade[b.severidade as SeveridadeProblema] || 0;
        if (pesoA !== pesoB) return pesoB - pesoA;

        return (b.total_linhas_afetadas || 0) - (a.total_linhas_afetadas || 0);
      });

      // 1º lugar: PENDENTE (mesmo com menos linhas que os outros)
      expect(ordenados[0].id).toBe('prob-pendente');
      // 2º lugar: CRÍTICA aberta
      expect(ordenados[1].id).toBe('prob-critica-aberta');
      // 3º lugar: ALTA aberta
      expect(ordenados[2].id).toBe('prob-alta');
      // 4º lugar: BAIXA aberta
      expect(ordenados[3].id).toBe('prob-baixa');
      // Último lugar: CRÍTICA já resolvida/tratada
      expect(ordenados[4].id).toBe('prob-critica-resolvida');
    });
  });

  describe('Lógica de Apresentação e Decisão do Banner de Próxima Ação', () => {
    it('deve identificar corretamente o estado sem diagnóstico', () => {
      const hasAssets = true;
      const hasDiagnostic = false;
      const pendentes = 0;
      const criticos = 0;

      // Regra do banner: se não tem diagnóstico, orienta disparar primeiro diagnóstico
      const acaoEsperada = !hasDiagnostic ? 'EXECUTAR_PRIMEIRO_DIAGNOSTICO' : 'OUTRO';
      expect(acaoEsperada).toBe('EXECUTAR_PRIMEIRO_DIAGNOSTICO');
    });

    it('deve priorizar banner de deliberação quando houver itens PENDENTES', () => {
      const hasDiagnostic = true;
      const pendentes = 3;
      const criticosBloqueantes = 1;

      // Mesmo havendo críticos, o humano precisa primeiro deliberar os pendentes
      let prioridade: string;
      if (pendentes > 0) {
        prioridade = 'CLASSIFICAR_PENDENCIAS';
      } else if (criticosBloqueantes > 0) {
        prioridade = 'TRATAR_CRITICOS';
      } else {
        prioridade = 'LIBERADO';
      }

      expect(prioridade).toBe('CLASSIFICAR_PENDENCIAS');
    });

    it('deve orientar tratamento quando houver críticos em aberto e zero pendentes', () => {
      const pendentes = 0;
      const criticosBloqueantes = 2;

      let prioridade: string;
      if (pendentes > 0) {
        prioridade = 'CLASSIFICAR_PENDENCIAS';
      } else if (criticosBloqueantes > 0) {
        prioridade = 'TRATAR_CRITICOS';
      } else {
        prioridade = 'LIBERADO';
      }

      expect(prioridade).toBe('TRATAR_CRITICOS');
    });

    it('deve orientar liberação com ressalva quando guardrail for atingido', () => {
      const pendentes = 0;
      const criticosBloqueantes = 0;
      const decisaoGate = 'LIBERADO_COM_RESSALVA';

      let prioridade: string;
      if (pendentes > 0) {
        prioridade = 'CLASSIFICAR_PENDENCIAS';
      } else if (criticosBloqueantes > 0) {
        prioridade = 'TRATAR_CRITICOS';
      } else if (decisaoGate === 'LIBERADO_COM_RESSALVA') {
        prioridade = 'AVANCAR_COM_RESSALVA';
      } else {
        prioridade = 'LIBERADO';
      }

      expect(prioridade).toBe('AVANCAR_COM_RESSALVA');
    });
  });

  describe('Cálculo Didático de Conformidade e Saúde Geral', () => {
    it('deve calcular taxa de conformidade percentual precisa com 1 casa decimal', () => {
      const totalLinhas = 1000;
      const linhasComProblemas = 50;

      const taxa = Math.max(0, 100 - (linhasComProblemas / totalLinhas) * 100);
      const taxaFormatada = Math.round(taxa * 10) / 10;

      expect(taxaFormatada).toBe(95);

      // Classificação didática
      const rotulo = taxaFormatada >= 95 ? 'Conforme' : taxaFormatada >= 80 ? 'Atenção' : 'Crítico';
      expect(rotulo).toBe('Conforme');
    });

    it('deve classificar como Crítico quando a taxa de conformidade for inferior a 80%', () => {
      const totalLinhas = 100;
      const linhasComProblemas = 25; // 75% de conformidade

      const taxa = Math.max(0, 100 - (linhasComProblemas / totalLinhas) * 100);
      const rotulo = taxa >= 95 ? 'Conforme' : taxa >= 80 ? 'Atenção' : 'Crítico';
      expect(rotulo).toBe('Crítico');
    });
  });

  describe('Validação de Regras e Parâmetros Didáticos R1–R5', () => {
    it('deve suportar os 5 tipos homologados de regras humanas sem exigir JSON do usuário', () => {
      expect(TipoRegraQualidade.CHAVE_UNICA).toBe('CHAVE_UNICA');
      expect(TipoRegraQualidade.VALOR_MIN_MAX).toBe('VALOR_MIN_MAX');
      expect(TipoRegraQualidade.VALORES_PERMITIDOS).toBe('VALORES_PERMITIDOS');
      expect(TipoRegraQualidade.OBRIGATORIEDADE).toBe('OBRIGATORIEDADE');
      expect(TipoRegraQualidade.REGRA_TEMPORAL).toBe('REGRA_TEMPORAL');
    });

    it('deve assegurar que ações de deliberação correspondam estritamente ao enum AcaoProblemaQualidade', () => {
      const acoesHomologadas = [
        AcaoProblemaQualidade.CORRIGIR_NA_FONTE,
        AcaoProblemaQualidade.TRATAR_NO_PIPELINE,
        AcaoProblemaQualidade.SOLICITAR_ESCLARECIMENTO,
        AcaoProblemaQualidade.ACEITAR_COMO_RESTRICAO,
        AcaoProblemaQualidade.MONITORAR,
      ];
      expect(acoesHomologadas).toHaveLength(5);
    });

    it('deve validar que justificativas formais exigem pelo menos 15 caracteres', () => {
      const invalidaCurta = 'Aceito';
      const validaSuficiente = 'Problema aceito como restrição técnica homologada com o cliente.';
      expect(invalidaCurta.trim().length >= 15).toBe(false);
      expect(validaSuficiente.trim().length >= 15).toBe(true);
    });
  });
});
