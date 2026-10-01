import { describe, it, expect } from 'vitest';
import { ContractorDocumentationGenerator } from '@/core/domain/delivery/contractor-documentation-generator';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { EntregavelDemanda } from '@/core/domain/entities/entregavel-demanda';
import { ValidacaoConciliacao } from '@/core/domain/entities/validacao-conciliacao';
import { TipoEntregavel } from '@/core/domain/enums/tipo-entregavel';
import { StatusEntregavel } from '@/core/domain/enums/status-entregavel';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';
import { CamadaValidacao } from '@/core/domain/enums/camada-validacao';
import { ResultadoValidacao } from '@/core/domain/enums/resultado-validacao';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';

describe('ContractorDocumentationGenerator (Subgate 3.7C)', () => {
  const demandaMock: DemandaComProjeto = {
    id: 'dem_test_123',
    titulo: 'Modernização de Painel Comercial',
    solicitacao_bruta: 'Estruturação do relatório e painel de faturamento para a diretoria.',
    contexto: 'Reunião estratégica de vendas',
    objetivo_inicial: 'Consolidar KPIs comerciais com conciliação contábil',
    prazo_esperado: null,
    restricoes_declaradas: null,
    data_conclusao: null,
    projeto_id: 'proj_sales_01',
    projetoNome: 'Operações Comerciais',
    estado: EstadoDemanda.PRONTA_PARA_ENTREGA,
    criado_em: '2026-03-01T10:00:00.000Z',
    atualizado_em: '2026-03-05T12:00:00.000Z',
  };

  const entregaveisMock: EntregavelDemanda[] = [
    {
      id: 'ent_01',
      demanda_id: 'dem_test_123',
      titulo: 'Dashboard Executivo Power BI',
      tipo: TipoEntregavel.DASHBOARD_POWERBI,
      versao: '1.0',
      caminho_arquivo_ou_link: 'https://app.powerbi.com/groups/commercial/reports/sales-exec',
      descricao_sumario: 'Painel com visão consolidada de receita, ticket médio e margem.',
      obrigatorio: true,
      status: StatusEntregavel.HOMOLOGADO,
      aceite_status: StatusAceiteEntrega.ACEITO,
      aceite_por: 'Mariana Silva (Head de Planejamento)',
      aceite_em: '2026-03-10T14:30:00.000Z',
      aceite_justificativa: 'Valores conferidos com o ERP e aprovados.',
      criado_em: '2026-03-02T10:00:00.000Z',
      atualizado_em: '2026-03-10T14:30:00.000Z',
    },
    {
      id: 'ent_02',
      demanda_id: 'dem_test_123',
      titulo: 'Documentação Técnica de Medidas DAX',
      tipo: TipoEntregavel.DOCUMENTO_TECNICO,
      versao: '1.0',
      caminho_arquivo_ou_link: 'docs/dicionario-metricas.md',
      descricao_sumario: 'Memorial de cálculo das 12 métricas homologadas.',
      obrigatorio: true,
      status: StatusEntregavel.HOMOLOGADO,
      aceite_status: StatusAceiteEntrega.ACEITO,
      aceite_por: 'Mariana Silva (Head de Planejamento)',
      aceite_em: '2026-03-10T14:30:00.000Z',
      aceite_justificativa: 'Memorial claro e alinhado.',
      criado_em: '2026-03-03T10:00:00.000Z',
      atualizado_em: '2026-03-10T14:30:00.000Z',
    },
  ];

  const validacoesMock: ValidacaoConciliacao[] = [
    {
      id: 'val_01',
      demanda_id: 'dem_test_123',
      titulo: 'Conciliação de Faturamento Total',
      camada: CamadaValidacao.CONCILIACAO_CRUZADA_KPI,
      metodo_verificacao: 'Cruzamento com relatório contábil do ERP',
      tolerancia_permitida: 0,
      resultado: ResultadoValidacao.APROVADO,
      valor_esperado: 1500000.0,
      valor_obtido: 1500000.0,
      divergencia_absoluta: 0,
      divergencia_percentual: 0,
      obrigatoria: true,
      executado_por: 'HUMANO',
      executado_em: '2026-03-04T10:00:00.000Z',
      criado_em: '2026-03-04T10:00:00.000Z',
      atualizado_em: '2026-03-04T10:00:00.000Z',
    },
  ];

  it('deve gerar documentação executiva completa para o contratante', () => {
    const doc = ContractorDocumentationGenerator.gerar({
      demanda: demandaMock,
      entregaveis: entregaveisMock,
      validacoes: validacoesMock,
      metricasHomologadasNomes: ['Receita Total', 'Ticket Médio', 'Margem Bruta'],
      dataReferencia: '2026-03-15T00:00:00.000Z',
      autorDocumento: 'Analista de BI Sênior',
    });

    expect(doc).toBeDefined();
    expect(doc).toContain('# Relatório de Entrega Técnica e Operacional');
    expect(doc).toContain('**Demanda:** Modernização de Painel Comercial');
    expect(doc).toContain('**Projeto:** Operações Comerciais');
    expect(doc).toContain('**Responsável Técnico:** Analista de BI Sênior');

    // Seção de Entregáveis
    expect(doc).toContain('## 4. Pacote de Entregáveis');
    expect(doc).toContain('Dashboard Executivo Power BI');
    expect(doc).toContain('Documentação Técnica de Medidas DAX');
    expect(doc).toContain('https://app.powerbi.com/groups/commercial/reports/sales-exec');
    expect(doc).toContain('Homologado');

    // Seção de Validação
    expect(doc).toContain('## 5. Garantia de Qualidade e Validação');
    expect(doc).toContain('Conciliação Cruzada de KPIs');
    expect(doc).toContain('Aprovado');

    // Seção de Aceite Formal
    expect(doc).toContain('## 7. Registro de Aceite e Homologação');
    expect(doc).toContain('Mariana Silva (Head de Planejamento)');
    expect(doc).toContain('Valores conferidos com o ERP e aprovados.');
  });

  it('deve respeitar rigorosamente a política de apresentação profissional: ZERO termos internos', () => {
    const doc = ContractorDocumentationGenerator.gerar({
      demanda: demandaMock,
      entregaveis: entregaveisMock,
      validacoes: validacoesMock,
    });

    // Proibições inegociáveis
    expect(doc.toLowerCase()).not.toContain('analyst personal workspace');
    expect(doc.toLowerCase()).not.toContain('evidence event engine');
    expect(doc.toLowerCase()).not.toContain('evidence_core');
    expect(doc.toLowerCase()).not.toContain('humano vs ia');
    expect(doc.toLowerCase()).not.toContain('portfólio');
    expect(doc.toLowerCase()).not.toContain('portfolio');
    expect(doc.toLowerCase()).not.toContain('linkedin');
  });

  it('deve tratar omissão de forma sóbria quando validações não forem informadas', () => {
    const doc = ContractorDocumentationGenerator.gerar({
      demanda: demandaMock,
      entregaveis: entregaveisMock,
      validacoes: [],
    });

    expect(doc).toContain('Validações numéricas formais não registradas na esteira analítica.');
  });

  it('deve registrar ressalva sóbria quando não houver aceites registrados', () => {
    const semAceite: EntregavelDemanda[] = [
      {
        ...entregaveisMock[0],
        aceite_status: StatusAceiteEntrega.PENDENTE,
        aceite_por: null,
        aceite_justificativa: null,
      },
    ];

    const doc = ContractorDocumentationGenerator.gerar({
      demanda: demandaMock,
      entregaveis: semAceite,
      validacoes: [],
    });

    expect(doc).toContain('Em processo de homologação formal junto aos responsáveis de negócio.');
  });

  describe('Consistência Temporal e Derivação Factual', () => {
    it('deve priorizar a data de conclusão definitiva da demanda quando dataReferencia não for fornecida', () => {
      const demandaConcluida: DemandaComProjeto = {
        ...demandaMock,
        estado: EstadoDemanda.CONCLUIDA,
        data_conclusao: '2026-03-12T18:00:00.000Z',
      };

      const doc = ContractorDocumentationGenerator.gerar({
        demanda: demandaConcluida,
        entregaveis: entregaveisMock,
      });

      // Data de formalização derivada deterministicamente de data_conclusao (12/03/2026)
      expect(doc).toContain('**Data de Formalização:** 12/03/2026');
    });

    it('deve derivar da data do aceite mais recente quando demanda não concluída e dataReferencia não fornecida', () => {
      const demandaAberta: DemandaComProjeto = {
        ...demandaMock,
        data_conclusao: null,
      };

      const doc = ContractorDocumentationGenerator.gerar({
        demanda: demandaAberta,
        entregaveis: entregaveisMock, // possui aceite em 2026-03-10
      });

      // Data de formalização derivada deterministicamente do aceite mais recente (10/03/2026)
      expect(doc).toContain('**Data de Formalização:** 10/03/2026');
    });
  });
});
