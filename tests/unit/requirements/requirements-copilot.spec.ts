import { describe, it, expect } from 'vitest';
import { RequirementsCopilotEngine } from '@/core/domain/requirements-copilot/requirements-copilot-engine';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { Demanda } from '@/core/domain/entities/demanda';
import { CategoriaRequisito } from '@/core/domain/enums/categoria-requisito';
import { StatusRequisito } from '@/core/domain/enums/status-requisito';
import { StatusPerguntaClarificacao } from '@/core/domain/enums/status-pergunta-clarificacao';
import { RequisitoDemanda } from '@/core/domain/entities/requisito-demanda';
import { PerguntaClarificacao } from '@/core/domain/entities/pergunta-clarificacao';

describe('Unit Tests: Copiloto Consultivo de Requisitos (Bloco 3.8)', () => {
  const baseDemanda: Demanda = {
    id: 'dem_copilot_1',
    projeto_id: 'prj_1',
    titulo: 'Análise de Churn e Vendas',
    solicitacao_bruta: 'Precisamos de um dashboard para acompanhar churn e vendas mensais.',
    contexto: null,
    objetivo_inicial: null,
    prazo_esperado: null,
    restricoes_declaradas: null,
    estado: EstadoDemanda.EM_CLARIFICACAO,
    estado_anterior: EstadoDemanda.NOVA,
    criado_em: '2026-10-01T10:00:00Z',
    atualizado_em: '2026-10-01T10:00:00Z',
    data_conclusao: null,
    periodo_analise: null,
    granularidade: null,
    formato_entrega: null,
    requisitos_homologados_em: null,
    requisitos_homologados_por: null,
    requisitos_justificativa_homologacao: null,
    requisitos_ressalvas: null,
  };

  it('deve diagnosticar briefing INCOMPLETO quando faltam objetivo, período e granularidade', () => {
    const diag = RequirementsCopilotEngine.avaliar(baseDemanda, [], []);

    expect(diag.resumoOperacional.statusBriefing).toBe('INCOMPLETO');
    expect(diag.metricasBriefing.temObjetivo).toBe(false);
    expect(diag.metricasBriefing.temPeriodo).toBe(false);
    expect(diag.metricasBriefing.temGranularidade).toBe(false);
    expect(diag.sugestoesPedagogicas.length).toBeGreaterThan(0);

    // Sugere perguntas de período e granularidade
    const categoriasSugeridas = diag.sugestoesPedagogicas.map((s) => s.categoria);
    expect(categoriasSugeridas).toContain('TEMPORALIDADE');
    expect(categoriasSugeridas).toContain('GRANULARIDADE');
  });

  it('deve diagnosticar MADURO_PARA_DADOS quando todos os elementos mínimos estão delimitados', () => {
    const demandaMadura: Demanda = {
      ...baseDemanda,
      contexto: 'Operação de varejo com 50 filiais',
      objetivo_inicial: 'Identificar taxa de cancelamento e faturamento mensal',
      periodo_analise: 'Últimos 24 meses',
      granularidade: 'Mensal por Filial e Categoria de Produto',
      formato_entrega: 'Relatório Power BI (.pbix) e documentação DAX',
    };

    const requisitos: RequisitoDemanda[] = [
      {
        id: 'req_1',
        demanda_id: demandaMadura.id,
        titulo: 'Faturamento Líquido',
        descricao: 'Valor faturado deduzido de descontos',
        categoria: CategoriaRequisito.METRICA_KPI,
        prioridade: 'OBRIGATORIO',
        status: StatusRequisito.IDENTIFICADO,
        origem: 'MANUAL',
        criado_em: '2026-10-01T10:00:00Z',
        atualizado_em: '2026-10-01T10:00:00Z',
      },
    ];

    const diag = RequirementsCopilotEngine.avaliar(demandaMadura, requisitos, []);

    expect(diag.resumoOperacional.statusBriefing).toBe('MADURO_PARA_DADOS');
    expect(diag.metricasBriefing.temObjetivo).toBe(true);
    expect(diag.metricasBriefing.temPeriodo).toBe(true);
    expect(diag.metricasBriefing.temGranularidade).toBe(true);
    expect(diag.metricasBriefing.temFormatoEntrega).toBe(true);
  });

  it('deve disponibilizar dicionário de conceitos metodológicos com dicas práticas', () => {
    const diag = RequirementsCopilotEngine.avaliar(baseDemanda, [], []);

    expect(diag.dicionarioConceitos.length).toBeGreaterThanOrEqual(4);
    const termos = diag.dicionarioConceitos.map((c) => c.termo);
    expect(termos).toContain('Granularidade Analítica');
    expect(termos).toContain('Fato vs Dimensão');
    expect(termos).toContain('Métrica Aditiva vs Derivada');
    expect(termos).toContain('Tolerância Zero em Reconciliação');

    // Cada conceito deve conter definição e dica prática não vazias
    for (const c of diag.dicionarioConceitos) {
      expect(c.definicao.length).toBeGreaterThan(10);
      expect(c.porQueImporta.length).toBeGreaterThan(10);
      expect(c.dicaPratica.length).toBeGreaterThan(10);
    }
  });

  it('deve alertar sobre perguntas bloqueantes abertas', () => {
    const perguntas: PerguntaClarificacao[] = [
      {
        id: 'perg_1',
        demanda_id: baseDemanda.id,
        requisito_id: null,
        pergunta: 'Qual a fonte oficial de dados?',
        motivacao: 'Evitar extração duplicada',
        bloqueante: true,
        status: StatusPerguntaClarificacao.ENVIADA,
        enviada_em: '2026-10-01T11:00:00Z',
        resposta: null,
        respondido_por: null,
        respondida_em: null,
        impacto_decisao: null,
        criado_em: '2026-10-01T10:00:00Z',
        atualizado_em: '2026-10-01T10:00:00Z',
      },
    ];

    const diag = RequirementsCopilotEngine.avaliar(baseDemanda, [], perguntas);
    expect(diag.metricasBriefing.perguntasBloqueantes).toBe(1);
    expect(diag.resumoOperacional.oQueDevoFazerAgora).toContain('bloqueante');
  });
});
